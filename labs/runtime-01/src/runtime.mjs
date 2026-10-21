import { Worker, threadId } from 'node:worker_threads';
import { fork } from 'node:child_process';
import { checksum, cooperative, validateCount } from './work.mjs';

export async function isolated(kind, input) {
  if (!['thread', 'process'].includes(kind)) throw new Error('invalid mode');
  if (!input || !['work', 'memory', 'exit'].includes(input.action)) throw new Error('invalid action');
  const entry = new URL('./child.mjs', import.meta.url);
  const child = kind === 'thread'
    ? new Worker(entry, { workerData: input, execArgv: [] })
    : fork(entry, [], { execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true });
  return new Promise((resolve, reject) => {
    let message;
    let failure;
    const timer = setTimeout(() => {
      failure = new Error('child timed out');
      if (kind === 'thread') void child.terminate();
      else child.kill();
    }, 10_000);
    child.on('message', value => { message = value; });
    child.on('error', error => { failure = error; });
    child.once(kind === 'process' ? 'close' : 'exit', (exitCode, signal) => {
      clearTimeout(timer);
      if (failure) reject(failure);
      else if (input.action === 'exit' && exitCode === 7) resolve({ exitCode, message: null });
      else if (exitCode !== 0 || !message) reject(new Error(`child failed: ${exitCode ?? signal}`));
      else resolve({ exitCode, message });
    });
    if (kind === 'process') child.send(input, error => { if (error) { failure = error; child.kill(); } });
  });
}

export async function compare(count = 1_000_000) {
  validateCount(count);
  const rows = [];
  for (const mode of ['main', 'promise', 'cooperative', 'thread', 'process']) {
    const order = [];
    const start = performance.now();
    let probeDelayMs;
    const probe = new Promise(resolve => setImmediate(() => {
      probeDelayMs = performance.now() - start;
      order.push('probe');
      resolve();
    }));
    let result;
    let pid = process.pid;
    let id = threadId;
    let exitCode = 0;
    try {
      if (mode === 'main') result = checksum(count);
      else if (mode === 'promise') result = await Promise.resolve().then(() => checksum(count));
      else if (mode === 'cooperative') result = await cooperative(count);
      else {
        const child = await isolated(mode, { action: 'work', count });
        ({ result, pid, threadId: id } = child.message);
        exitCode = child.exitCode;
      }
      order.push('result');
      const elapsedMs = performance.now() - start;
      await probe;
      rows.push({ mode, count, result, pid, threadId: id, exitCode, elapsedMs, order, probeDelayMs });
    } finally { await probe; }
  }
  return rows;
}
