import {mkdtemp,cp,rm,realpath} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const temp=await mkdtemp(join(tmpdir(),'brodcasting-runtime04-'));
try{
 await cp(fileURLToPath(new URL('../../reference-solutions/runtime-04/',import.meta.url)),temp,{recursive:true,filter:p=>!/(^|[\\/])(node_modules|dist)([\\/]|$)/.test(p)});
 if(!process.env.npm_execpath)throw new Error('Run through npm run verify:runtime-04:standalone');
 for(const args of [['ci','--ignore-scripts','--no-audit','--no-fund'],['run','typecheck'],['run','check']]){
  const run=spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd:temp,encoding:'utf8',timeout:120000,env:{...process.env,RUNTIME04_SOURCE:pathToFileURL(temp+sep).href}});
  assert.equal(run.status,0,run.stdout+run.stderr);
 }
 console.log(JSON.stringify({node:process.version,platform:process.platform,sourceOnly:true,outsideRepository:true,npmCi:true,typecheck:true,publicTests:15,realHttp:true,separateProcess:true}));
}finally{
 const root=await realpath(tmpdir()),target=await realpath(temp);assert.ok(target.startsWith(root+sep)&&target.split(sep).at(-1).startsWith('brodcasting-runtime04-'));
 await rm(target,{recursive:true,force:true,maxRetries:3,retryDelay:200});
}
