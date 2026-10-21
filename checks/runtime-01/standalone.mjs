import { mkdtemp, cp, rm, realpath, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const temp = await mkdtemp(join(tmpdir(), 'brodcasting-runtime01-'));
const source = fileURLToPath(new URL('../../reference-solutions/runtime-01/', import.meta.url));
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: temp, encoding: 'utf8', timeout: 45_000 });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return result.stdout;
}
try {
  await cp(source, temp, { recursive: true, filter: path => !/(^|[\\/])(node_modules|test-results)([\\/]|$)/.test(path) });
  const npm = process.env.npm_execpath;
  if (!npm) throw new Error('Run via npm run verify:runtime-01:standalone so npm CLI location is explicit');
  run([npm, 'ci', '--ignore-scripts', '--no-audit', '--no-fund']);
  const checks = run(['check.mjs']);
  assert.match(checks, /pass 15/);
  const report = JSON.parse(run(['src/experiment.mjs', '100000']));
  assert.equal(report.runs.length, 3);
  for (const run of report.runs) for (const row of run.rows) assert.equal(row.result, 4_799_685);
  assert.equal(report.memory.sharedCount, 1);
  assert.deepEqual(report.exits, { thread: 7, process: 7 });
  for (const args of [['999'], ['5000001'], ['1000', 'extra']]) {
    const result = spawnSync(process.execPath, ['src/experiment.mjs', ...args], { cwd: temp, encoding: 'utf8', timeout: 2_000 });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
  }
  const manifest = JSON.parse(await readFile(join(temp, 'package.json')));
  assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0);
  console.log(JSON.stringify({ node: process.version, platform: process.platform, outsideRepository: true, sourceOnly: true, npmCi: true, publicChecks: 15, experimentModes: 5, repetitions: 3, invalidCliChecks: 3, dependencies: 0 }));
} finally {
  const root = await realpath(tmpdir());
  const target = await realpath(temp);
  assert.ok(target.startsWith(root + sep) && target.split(sep).at(-1).startsWith('brodcasting-runtime01-'));
  await rm(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
}
