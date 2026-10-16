import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = process.env.LAB_TARGET ?? 'exercise';
if (!['exercise', 'reference'].includes(target)) throw new Error('Invalid LAB_TARGET');
const submission = target === 'reference' ? 'reference-solutions/part-00' : 'labs/part-00';
export default defineConfig({
  root, plugins: [react()],
  resolve: {
    alias: { '@submission': path.join(root, submission, 'src') },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom', include: ['checks/part-00/*.test.{ts,tsx}'],
    setupFiles: ['checks/part-00/setup.ts'], restoreMocks: true,
  },
});
