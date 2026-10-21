import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const vitest=fileURLToPath(new URL('../node_modules/vitest/vitest.mjs',import.meta.url));let failed=false;
for(const config of ['server','client']){const result=spawnSync(process.execPath,[vitest,'run','--config','checks/'+config+'.config.ts'],{stdio:'inherit',timeout:30000});if(result.status!==0)failed=true;}
process.exitCode=failed?1:0;
