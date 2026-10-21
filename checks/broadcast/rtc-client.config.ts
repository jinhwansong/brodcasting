import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',include:['checks/broadcast/rtc-client.test.ts'],restoreMocks:true}});
