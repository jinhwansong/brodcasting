import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
if(process.argv.length!==2)throw new Error('No extra check arguments');
const root=new URL('./',import.meta.url);
const build=spawnSync(process.execPath,[fileURLToPath(new URL('./node_modules/typescript/bin/tsc',import.meta.url)),'-p',fileURLToPath(new URL('tsconfig.json',root))],{stdio:'inherit',timeout:30000});
if(build.status!==0)process.exit(build.status??1);
const container='course-r03-'+randomBytes(8).toString('hex');
function docker(args){const run=spawnSync('docker',args,{encoding:'utf8',timeout:120000});assert.equal(run.status,0,'Owned Redis operation failed: '+run.stderr);return run.stdout.trim();}
let created=false;
try{
 docker(['run','-d','--name',container,'--label','codex.owner=runtime03-check','-p','127.0.0.1::6379','redis:8.6.7-alpine','redis-server','--save','','--appendonly','no','--maxmemory','64mb','--maxmemory-policy','noeviction']);created=true;
 let ready=false;for(let i=0;i<80;i++){if(spawnSync('docker',['exec',container,'redis-cli','ping'],{encoding:'utf8'}).stdout?.trim()==='PONG'){ready=true;break;}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,'Owned Redis did not become ready');
 const port=docker(['inspect','--format','{{(index (index .NetworkSettings.Ports "6379/tcp") 0).HostPort}}',container]);
 console.log('Owned Redis version:',docker(['exec',container,'redis-server','--version']));
 const run=spawnSync(process.execPath,['--test',fileURLToPath(new URL('./checks/queue.test.mjs',import.meta.url)),fileURLToPath(new URL('./checks/bootstrap.test.mjs',import.meta.url))],{stdio:'inherit',timeout:90000,env:{...process.env,RUNTIME03_SOURCE:root.href,RUNTIME03_REDIS_URL:'redis://127.0.0.1:'+port+'/0'}});
 process.exitCode=run.status??1;
}finally{if(created){assert.match(container,/^course-r03-[a-f0-9]{16}$/);docker(['rm','-f','-v',container]);}}
