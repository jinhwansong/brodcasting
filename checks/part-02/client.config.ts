import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = process.env.LAB_TARGET ?? 'exercise';
if (!['exercise', 'reference'].includes(target)) throw new Error('Invalid LAB_TARGET');
const submission = target === 'reference' ? 'reference-solutions/part-02' : 'labs/part-02';
export default defineConfig({
  root, plugins: [react()],
  resolve: { alias: { '@submission': path.join(root, submission, 'client/src') }, dedupe: ['react', 'react-dom'] },
  test: { environment: 'jsdom', include: ['checks/part-02/client-api.test.ts', 'checks/part-02/request.test.tsx', 'checks/part-02/ui.test.tsx'], setupFiles: ['checks/part-02/setup.ts'], restoreMocks: true },
});
