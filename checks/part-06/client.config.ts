import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),target=process.env.LAB_TARGET??'exercise';
if(!['exercise','reference'].includes(target))throw new Error('Invalid LAB_TARGET');
export default defineConfig({root,plugins:[react()],resolve:{alias:{'@submission':path.join(root,target==='reference'?'reference-solutions/part-06/client/src':'labs/part-06/client/src')},dedupe:['react','react-dom','socket.io-client']},
 test:{environment:'jsdom',include:['checks/part-06/chat-history.test.ts','checks/part-06/client-api.test.ts','checks/part-06/ui.test.tsx','checks/part-06/chat-ui.test.tsx'],setupFiles:['checks/part-06/setup.ts'],restoreMocks:true,reporters:['default','json'],outputFile:{json:'test-results/part-06/'+target+'-client.json'}}});
