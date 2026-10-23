import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],resolve:{dedupe:['react','react-dom']},test:{environment:'jsdom',include:['checks/client.test.tsx','checks/api.test.ts','checks/guard.test.tsx'],restoreMocks:true}});
