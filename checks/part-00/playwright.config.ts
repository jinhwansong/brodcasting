import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = process.env.LAB_TARGET ?? 'exercise';
if (!['exercise', 'reference'].includes(target)) throw new Error('Invalid LAB_TARGET');
const dir = target === 'reference' ? 'reference-solutions/part-00' : 'labs/part-00';
export default defineConfig({
  testDir: '.', testMatch: 'browser.spec.ts', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5178', browserName: 'chromium', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview ' + dir + ' --host 127.0.0.1 --port 5178 --strictPort',
    cwd: root, url: 'http://127.0.0.1:5178', reuseExistingServer: false,
  },
});
