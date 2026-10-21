import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
const base=new URL(process.env.RUNTIME03_SOURCE??new URL('../../reference-solutions/runtime-03/',import.meta.url));
async function fixture(run){
 const children=[];
 const prefix='course_r03_'+randomBytes(8).toString('hex');
 async function start(mode){
  const child=fork(new URL(`dist/${mode}.js`,base),[],{execArgv:[],env:{...process.env,PORT:'0',RUNTIME03_QUEUE_PREFIX:prefix},stdio:['ignore','ignore','pipe','ipc'],windowsHide:true});
  const exit=once(child,'exit');let error='';child.stderr.on('data',data=>{error+=String(data)});
  const messages=[];child.on('message',message=>messages.push(message));
  const handle={child,exit,async close(){if(child.exitCode!==null)return;child.send({type:'stop'});const timer=setTimeout(()=>child.kill(),2000);try{await exit;}finally{clearTimeout(timer)}}};children.push(handle);
  const until=Date.now()+15000;while(Date.now()<until){const ready=messages.find(message=>message.type==='ready');if(ready)return{...handle,ready};if(child.exitCode!==null)throw new Error('Child startup failed '+error);await new Promise(r=>setTimeout(r,20));}throw new Error('Child ready timeout');
 }
 try{await run(start);}finally{for(const child of children.reverse())await child.close();}
}
async function jobState(url,id,expected){const until=Date.now()+10000;while(Date.now()<until){const response=await fetch(url+'/jobs/'+id);assert.equal(response.status,200);const job=await response.json();if(job.state===expected)return job;await new Promise(r=>setTimeout(r,30));}throw new Error('HTTP job state timeout');}
test('real Nest API enqueues and a separate application-context Worker processes it',{timeout:30000},async()=>fixture(async start=>{
 const api=await start('api');const id='n-'+randomBytes(8).toString('hex');
 const response=await fetch(api.ready.url+'/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,failures:2})});assert.equal(response.status,201);
 await jobState(api.ready.url,id,'waiting');const worker=await start('worker');assert.notEqual(api.child.pid,worker.child.pid);assert.equal(worker.ready.hasHttp,false);
 const done=await jobState(api.ready.url,id,'completed');assert.equal(done.attemptsMade,3);assert.equal(done.result,3);
}));
test('queued work survives Worker shutdown and a new Worker consumes it',{timeout:30000},async()=>fixture(async start=>{
 const api=await start('api'),first=await start('worker');await first.close();
 const id='n-'+randomBytes(8).toString('hex');assert.equal((await fetch(api.ready.url+'/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,failures:0})})).status,201);
 await jobState(api.ready.url,id,'waiting');await start('worker');await jobState(api.ready.url,id,'completed');
}));
test('HTTP rejects extra fields and malformed job IDs',{timeout:30000},async()=>fixture(async start=>{
 const api=await start('api');const response=await fetch(api.ready.url+'/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'n-0123456789abcdef',failures:0,extra:true})});assert.equal(response.status,400);
 assert.equal((await fetch(api.ready.url+'/jobs/invalid')).status,400);
}));
