import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const [target, kind] = process.argv.slice(2);
if (!['exercise', 'reference'].includes(target) || !['unit', 'browser'].includes(kind)) {
  console.error('Usage: node checks/part-00/run.mjs exercise|reference unit|browser');
  process.exit(2);
}
const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = kind === 'unit' ? 'vitest/vitest.mjs' : '@playwright/test/cli.js';
const args = kind === 'unit' ? ['run'] : ['test'];
const config = kind === 'unit' ? 'vitest.config.ts' : 'playwright.config.ts';
const result = spawnSync(process.execPath, [path.join(root, 'node_modules', cli), ...args, '--config', path.join(root, 'checks/part-00', config)], {
  cwd: root, stdio: 'inherit', env: { ...process.env, LAB_TARGET: target },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
