import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
const labTarget=process.env.LAB_TARGET??'exercise';
if(!['exercise','reference'].includes(labTarget))throw new Error('Invalid LAB_TARGET');
const target=labTarget==='reference'?'reference-solutions/part-06':'labs/part-06';
export default defineConfig({resolve:{alias:{'@client-api':fileURLToPath(new URL('../../'+target+'/client/src/api.ts',import.meta.url))}},test:{environment:'node',include:['checks/part-06/recovery.test.ts','checks/part-06/storage.test.ts','checks/part-06/unit.test.ts','checks/part-06/main.test.ts','checks/part-06/chat-unit.test.ts','checks/part-06/chat-db.test.ts','checks/part-06/socket.test.ts','checks/part-06/db.test.ts','checks/part-06/http.test.ts','checks/part-06/wire.test.ts'],fileParallelism:false,testTimeout:15000,hookTimeout:30000,reporters:['default','json'],outputFile:{json:'test-results/part-06/'+labTarget+'-db.json'}}});
