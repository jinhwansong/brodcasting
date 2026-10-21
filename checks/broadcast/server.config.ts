import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['checks/broadcast/rtc-rooms.test.ts'],environment:'node',restoreMocks:true}});
