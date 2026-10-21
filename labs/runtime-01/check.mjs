import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const result=spawnSync(process.execPath,['--test',fileURLToPath(new URL('./checks/work.test.mjs',import.meta.url)),fileURLToPath(new URL('./checks/runtime.test.mjs',import.meta.url))],{stdio:'inherit',timeout:45000,env:{...process.env,RUNTIME01_SOURCE:new URL('./src/',import.meta.url).href}});
if(result.error)console.error(result.error.message);
process.exitCode=result.status??1;
