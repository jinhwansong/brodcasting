import { test } from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.RUNTIME01_SOURCE ?? new URL('../../reference-solutions/runtime-01/src/', import.meta.url).href;
const { compare, isolated } = await import(new URL('runtime.mjs', base));

test('five real execution modes produce the same fixed sum and finish', { timeout: 30_000 }, async () => {
  const rows = await compare(100_003);
  assert.deepEqual(rows.map(row => row.mode), ['main', 'promise', 'cooperative', 'thread', 'process']);
  for (const row of rows) {
    assert.equal(row.result, 4_799_958);
    assert.equal(row.count, 100_003);
    assert.ok(Number.isFinite(row.elapsedMs) && row.elapsedMs >= 0);
    assert.ok(Number.isFinite(row.probeDelayMs) && row.probeDelayMs >= 0);
    assert.equal(row.exitCode, 0);
    assert.equal(row.order.length, 2);
  }
  for (const row of rows.slice(0, 2)) assert.deepEqual(row.order, ['result', 'probe']);
  assert.deepEqual(rows[2].order, ['probe', 'result']);
  assert.equal(rows[3].pid, process.pid);
  assert.ok(rows[3].threadId > 0);
  assert.notEqual(rows[4].pid, process.pid);
  assert.equal(rows[4].threadId, 0);
});

test('thread receives an object copy and explicitly shares only the shared buffer', async () => {
  const object = { count: 0 };
  const shared = new SharedArrayBuffer(4);
  const result = await isolated('thread', { action: 'memory', object, shared });
  assert.equal(result.exitCode, 0);
  assert.equal(result.message.object.count, 1);
  assert.equal(object.count, 0);
  assert.equal(Atomics.load(new Int32Array(shared), 0), 1);
  assert.equal(result.message.pid, process.pid);
});

test('process receives an object copy and has a different PID', async () => {
  const object = { count: 0 };
  const result = await isolated('process', { action: 'memory', object });
  assert.equal(result.exitCode, 0);
  assert.equal(result.message.object.count, 1);
  assert.equal(object.count, 0);
  assert.notEqual(result.message.pid, process.pid);
});

test('thread exit 7 is observed and the parent can still run another worker', async () => {
  assert.equal((await isolated('thread', { action: 'exit' })).exitCode, 7);
  const next = await isolated('thread', { action: 'work', count: 1_000 });
  assert.equal(next.message.result, 46_995);
  assert.equal(next.exitCode, 0);
});

test('process exit 7 is observed and the parent can still fork another process', async () => {
  assert.equal((await isolated('process', { action: 'exit' })).exitCode, 7);
  const next = await isolated('process', { action: 'work', count: 1_000 });
  assert.equal(next.message.result, 46_995);
  assert.equal(next.exitCode, 0);
});

test('invalid child work fails instead of returning success', async () => {
  for (const kind of ['thread', 'process']) {
    await assert.rejects(isolated(kind, { action: 'work', count: 5_000_001 }), /child|count/);
  }
});

test('invalid mode and action are rejected', async () => {
  await assert.rejects(isolated('shell', { action: 'work', count: 1_000 }), /mode/);
  await assert.rejects(isolated('thread', { action: 'unknown' }), /action/);
});

test('comparison validates its bound before spawning work', async () => {
  await assert.rejects(compare(5_000_001), /count/);
});
