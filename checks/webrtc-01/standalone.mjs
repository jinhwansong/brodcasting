import {mkdtemp,cp,rm,realpath} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const temp=await mkdtemp(join(tmpdir(),'brodcasting-webrtc01-'));
try{
 await cp(fileURLToPath(new URL('../../reference-solutions/webrtc-01/',import.meta.url)),temp,{recursive:true,filter:path=>!/(^|[\\/])(node_modules|dist)([\\/]|$)/.test(path)&&!/(^|[\\/])\.env(?:\..*)?$/.test(path)});
 if(!process.env.npm_execpath)throw new Error('Run through npm run verify:webrtc-01:standalone');
 for(const args of [['ci','--no-audit','--no-fund'],['run','typecheck'],['run','build'],['run','check'],['run','check:integration']]){
  const result=spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd:temp,encoding:'utf8',timeout:180000});assert.equal(result.status,0,result.stdout+result.stderr);
 }
 console.log(JSON.stringify({node:process.version,platform:process.platform,sourceOnly:true,outsideRepository:true,npmCi:true,typecheck:true,serverBuild:true,clientBuild:true,unitTests:19,realDbHttpSocketChecks:9,actualTls:false,browserMedia:false}));
}finally{const root=await realpath(tmpdir()),target=await realpath(temp);assert.ok(target.startsWith(root+sep)&&target.split(sep).at(-1).startsWith('brodcasting-webrtc01-'));await rm(target,{recursive:true,force:true,maxRetries:3,retryDelay:200});}
