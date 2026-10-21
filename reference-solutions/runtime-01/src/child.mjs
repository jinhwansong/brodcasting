import { isMainThread, parentPort, threadId, workerData } from 'node:worker_threads';
import { checksum } from './work.mjs';

function execute(input) {
  if (input.action === 'exit') process.exit(7);
  const message = { pid: process.pid, threadId };
  if (input.action === 'work') message.result = checksum(input.count);
  else if (input.action === 'memory') {
    input.object.count += 1;
    if (input.shared) Atomics.add(new Int32Array(input.shared), 0, 1);
    message.object = input.object;
  } else throw new Error('invalid action');
  if (parentPort) { parentPort.postMessage(message); parentPort.close(); }
  else process.send(message, error => {
    if (error) process.exitCode = 1;
    if (process.connected) process.disconnect();
  });
}

if (isMainThread) process.once('message', execute);
else execute(workerData);
