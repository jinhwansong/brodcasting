import { test } from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.RUNTIME01_SOURCE ?? new URL('../src/', import.meta.url).href;
const { checksum, cooperative, validateCount } = await import(new URL('work.mjs', base));

test('fixed small and partial-cycle calculations have the expected result', () => {
  assert.equal(checksum(1_000), 46_995);
  assert.equal(checksum(10_001), 479_613);
  assert.equal(checksum(100_003), 4_799_958);
});

test('both supported count boundaries are accepted', () => {
  assert.equal(validateCount(1_000), 1_000);
  assert.equal(validateCount(5_000_000), 5_000_000);
});

test('non-integers, out-of-range values and coerced values are rejected', () => {
  for (const value of [0, 999, 5_000_001, 1_000.5, NaN, Infinity, '1000', null, {}, true]) {
    assert.throws(() => validateCount(value), /count/);
    assert.throws(() => checksum(value), /count/);
  }
});

test('cooperative rejects invalid counts without a pending task', async () => {
  for (const value of [999, NaN, '1000']) await assert.rejects(cooperative(value), /count/);
});

test('cooperative keeps the same sum across an incomplete final chunk', async () => {
  assert.equal(await cooperative(10_001), 479_613);
  assert.equal(await cooperative(100_003), 4_799_958);
});

test('wrapping CPU work in a Promise does not let an immediate callback run first', async () => {
  const order = [];
  const probe = new Promise(resolve => setImmediate(() => { order.push('probe'); resolve(); }));
  assert.equal(await Promise.resolve().then(() => checksum(10_001)), 479_613);
  order.push('result');
  await probe;
  assert.deepEqual(order, ['result', 'probe']);
});

test('cooperative gives a scheduled callback a turn before completing', async () => {
  const order = [];
  const probe = new Promise(resolve => setImmediate(() => { order.push('probe'); resolve(); }));
  assert.equal(await cooperative(100_003), 4_799_958);
  order.push('result');
  await probe;
  assert.deepEqual(order, ['probe', 'result']);
});
