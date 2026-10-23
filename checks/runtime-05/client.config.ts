import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],resolve:{dedupe:['react','react-dom']},test:{environment:'jsdom',include:['checks/runtime-05/client.test.tsx','checks/runtime-05/api.test.ts'],restoreMocks:true}});
