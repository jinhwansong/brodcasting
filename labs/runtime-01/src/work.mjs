export function validateCount(count) {
  if (!Number.isInteger(count) || count < 1_000 || count > 5_000_000) throw new RangeError('count must be an integer from 1000 to 5000000');
  return count;
}

export function checksum(count) {
  validateCount(count);
  // TODO A: 0부터 count-1까지 각 i % 97을 더해 반환하세요.
  return 0;
}

export async function cooperative(count) {
  validateCount(count);
  // TODO B: 같은 합을 10,000개씩 계산하고 묶음 사이에 setImmediate로 양보하세요.
  return 0;
}
