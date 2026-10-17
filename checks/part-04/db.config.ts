import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'node',include:['checks/part-04/unit.test.ts','checks/part-04/db.test.ts'],fileParallelism:false,testTimeout:15000,hookTimeout:30000,reporters:['default','json'],outputFile:{json:'test-results/part-04/'+(process.env.LAB_TARGET??'exercise')+'-db.json'}}});
