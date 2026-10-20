import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
const labTarget=process.env.LAB_TARGET??'exercise';
if(!['exercise','reference'].includes(labTarget))throw new Error('Invalid LAB_TARGET');
const target=labTarget==='reference'?'reference-solutions/part-04':'labs/part-04';
export default defineConfig({resolve:{alias:{'@client-api':fileURLToPath(new URL('../../'+target+'/client/src/api.ts',import.meta.url))}},test:{environment:'node',include:['checks/part-04/unit.test.ts','checks/part-04/db.test.ts','checks/part-04/http.test.ts','checks/part-04/wire.test.ts'],fileParallelism:false,testTimeout:15000,hookTimeout:30000,reporters:['default','json'],outputFile:{json:'test-results/part-04/'+labTarget+'-db.json'}}});
