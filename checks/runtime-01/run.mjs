import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [target, ...extra] = process.argv.slice(2);
if (!['exercise', 'reference'].includes(target) || extra.length) {
  console.error('Usage: node checks/runtime-01/run.mjs exercise|reference');
  process.exit(1);
}
const source = new URL(`../../${target === 'reference' ? 'reference-solutions' : 'labs'}/runtime-01/src/`, import.meta.url);
const result = spawnSync(process.execPath, ['--test', fileURLToPath(new URL('./work.test.mjs', import.meta.url)), fileURLToPath(new URL('./runtime.test.mjs', import.meta.url))], {
  env: { ...process.env, RUNTIME01_SOURCE: source.href }, stdio: 'inherit', timeout: 45_000,
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
