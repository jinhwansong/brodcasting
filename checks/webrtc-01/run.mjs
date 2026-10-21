import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const mode=process.argv[2];if(!['exercise','reference'].includes(mode))throw new Error('Select exercise or reference');
const root=new URL(mode==='exercise'?'../../labs/webrtc-01/':'../../reference-solutions/webrtc-01/',import.meta.url),vitest=fileURLToPath(new URL('../../node_modules/vitest/vitest.mjs',import.meta.url));let failed=false;
for(const config of ['server','client']){const result=spawnSync(process.execPath,[vitest,'run','--config','checks/'+config+'.config.ts'],{cwd:fileURLToPath(root),stdio:'inherit',timeout:30000});if(result.status!==0)failed=true;}
process.exitCode=failed?1:0;
