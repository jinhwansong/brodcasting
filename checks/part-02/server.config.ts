import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = process.env.LAB_TARGET ?? 'exercise';
if (!['exercise', 'reference'].includes(target)) throw new Error('Invalid LAB_TARGET');
export default defineConfig({
  root,
  resolve: { alias: { '@submission': path.join(root, target === 'reference' ? 'reference-solutions/part-02' : 'labs/part-02', 'client/src') } },
  test: { environment: 'node', include: ['checks/part-02/api.test.ts', 'checks/part-02/integration.test.ts'], testTimeout: 10000 },
});
