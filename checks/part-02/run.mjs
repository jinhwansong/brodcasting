import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const [target, kind] = process.argv.slice(2);
if (!['exercise', 'reference'].includes(target) || !['server', 'client', 'all'].includes(kind)) {
  console.error('Usage: node checks/part-02/run.mjs exercise|reference server|client|all');
  process.exit(2);
}
const root = fileURLToPath(new URL('../../', import.meta.url));
const project = target === 'reference' ? 'reference-solutions/part-02' : 'labs/part-02';
const run = args => {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: { ...process.env, LAB_TARGET: target } });
  if (result.error) console.error(result.error.message);
  return result.status ?? 1;
};
let failed = 0;
if (kind !== 'client') {
  const build = run([path.join(root, 'node_modules/typescript/bin/tsc'), '--project', path.join(root, project, 'server/tsconfig.json')]);
  if (build) process.exit(build);
  failed ||= run([path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--config', path.join(root, 'checks/part-02/server.config.ts')]);
}
if (kind !== 'server') {
  const result = run([path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--config', path.join(root, 'checks/part-02/client.config.ts')]);
  failed ||= result;
}
process.exit(failed);
