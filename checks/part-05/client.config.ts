import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),target=process.env.LAB_TARGET??'exercise';
if(!['exercise','reference'].includes(target))throw new Error('Invalid LAB_TARGET');
export default defineConfig({root,plugins:[react()],resolve:{alias:{'@submission':path.join(root,target==='reference'?'reference-solutions/part-05/client/src':'labs/part-05/client/src')},dedupe:['react','react-dom','socket.io-client']},
 test:{environment:'jsdom',include:['checks/part-05/client-api.test.ts','checks/part-05/ui.test.tsx','checks/part-05/chat-ui.test.tsx'],setupFiles:['checks/part-05/setup.ts'],restoreMocks:true,reporters:['default','json'],outputFile:{json:'test-results/part-05/'+target+'-client.json'}}});
