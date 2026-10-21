import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],resolve:{dedupe:['react','react-dom','socket.io-client']},test:{environment:'jsdom',include:['checks/broadcast/ui.test.tsx','checks/broadcast/player.test.tsx'],setupFiles:['checks/part-06/setup.ts'],restoreMocks:true}});
