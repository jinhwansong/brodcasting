import { compare, isolated } from './runtime.mjs';
import { validateCount } from './work.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && !/^[1-9][0-9]*$/.test(args[0]))) throw new Error('Use one integer count from 1000 to 5000000');
  const count = validateCount(args.length ? Number(args[0]) : 1_000_000);
  const runs = [];
  for (let repetition = 1; repetition <= 3; repetition++) runs.push({ repetition, rows: await compare(count) });
  const object = { count: 0 };
  const shared = new SharedArrayBuffer(4);
  const thread = await isolated('thread', { action: 'memory', object, shared });
  const child = await isolated('process', { action: 'memory', object });
  const exits = {};
  for (const mode of ['thread', 'process']) exits[mode] = (await isolated(mode, { action: 'exit' })).exitCode;
  console.log(JSON.stringify({
    schema: 1, node: process.version, platform: process.platform, parentPid: process.pid,
    count, runs, memory: { parentObject: object, thread: thread.message, process: child.message, sharedCount: Atomics.load(new Int32Array(shared), 0) },
    exits, limitations: ['same machine, fixed order, cold start included', 'probe is setImmediate, not an HTTP or browser latency', 'thread exit does not prove native crash or memory isolation', 'no GPU comparison or production capacity claim'],
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
