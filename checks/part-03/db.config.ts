import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['checks/part-03/db.test.ts', 'checks/part-03/http.test.ts'], fileParallelism: false, testTimeout: 15000, hookTimeout: 30000 } });
