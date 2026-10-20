import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
const labTarget=process.env.LAB_TARGET??'exercise';
if(!['exercise','reference'].includes(labTarget))throw new Error('Invalid LAB_TARGET');
const target=labTarget==='reference'?'reference-solutions/part-05':'labs/part-05';
export default defineConfig({resolve:{alias:{'@client-api':fileURLToPath(new URL('../../'+target+'/client/src/api.ts',import.meta.url))}},test:{environment:'node',include:['checks/part-05/unit.test.ts','checks/part-05/main.test.ts','checks/part-05/chat-unit.test.ts','checks/part-05/chat-db.test.ts','checks/part-05/socket.test.ts','checks/part-05/db.test.ts','checks/part-05/http.test.ts','checks/part-05/wire.test.ts'],fileParallelism:false,testTimeout:15000,hookTimeout:30000,reporters:['default','json'],outputFile:{json:'test-results/part-05/'+labTarget+'-db.json'}}});
