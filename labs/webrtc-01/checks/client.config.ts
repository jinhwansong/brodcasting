import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',include:['checks/client.test.ts'],restoreMocks:true}});
