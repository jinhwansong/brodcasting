import { defineConfig } from 'vitest/config';
import {fileURLToPath} from 'node:url';
const labTarget=process.env.LAB_TARGET??'exercise';
if(!['exercise','reference'].includes(labTarget))throw new Error('Invalid LAB_TARGET');
const target=labTarget==='reference'?'reference-solutions/part-03':'labs/part-03';
export default defineConfig({ resolve:{alias:{'@client-api':fileURLToPath(new URL('../../'+target+'/client/src/api.ts',import.meta.url))}}, test: { environment: 'node', include: ['checks/part-03/db.test.ts', 'checks/part-03/http.test.ts', 'checks/part-03/wire.test.ts', 'checks/part-03/experiment.test.ts'], fileParallelism: false, testTimeout: 15000, hookTimeout: 30000,reporters:['default','json'],outputFile:{json:'test-results/part-03/'+labTarget+'-db.json'} } });
