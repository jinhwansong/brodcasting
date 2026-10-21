export function validateCount(count) {
  if (!Number.isInteger(count) || count < 1_000 || count > 5_000_000) throw new RangeError('count must be an integer from 1000 to 5000000');
  return count;
}

export function checksum(count) {
  validateCount(count);
  let sum = 0;
  for (let i = 0; i < count; i++) sum += i % 97;
  return sum;
}

export async function cooperative(count) {
  validateCount(count);
  let sum = 0;
  for (let start = 0; start < count; start += 10_000) {
    for (let i = start; i < Math.min(start + 10_000, count); i++) sum += i % 97;
    if (start + 10_000 < count) await setImmediate();
  }
  return sum;
}
import { setImmediate } from 'node:timers/promises';
