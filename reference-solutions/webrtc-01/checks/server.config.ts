import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'node',include:['checks/rooms.test.ts'],restoreMocks:true}});
