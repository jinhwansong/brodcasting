import {defineConfig} from 'vitest/config';
export default defineConfig({test:{environment:'node',include:['checks/part-06/unit.test.ts','checks/part-06/main.test.ts','checks/part-06/chat-unit.test.ts'],testTimeout:15000,reporters:['default','json'],outputFile:{json:'test-results/part-06/'+(process.env.LAB_TARGET??'exercise')+'-unit.json'}}});
