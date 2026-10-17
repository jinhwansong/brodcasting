import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const target=process.env.LAB_TARGET??'exercise';
if(!['exercise','reference'].includes(target))throw new Error('Invalid LAB_TARGET');
export default defineConfig({root,plugins:[react()],resolve:{alias:{'@submission':path.join(root,target==='reference'?'reference-solutions/part-03/client/src':'labs/part-03/client/src')},dedupe:['react','react-dom']},test:{environment:'jsdom',include:['checks/part-03/client-api.test.ts','checks/part-03/ui.test.tsx'],setupFiles:['checks/part-03/setup.ts'],restoreMocks:true}});
