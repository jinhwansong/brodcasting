import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
const base=new URL(process.env.RUNTIME04_SOURCE??new URL('../../reference-solutions/runtime-04/',import.meta.url));
async function fixture(run){
 const children=[],prefix='course_r04_'+randomBytes(8).toString('hex');
 async function start(mode){
  const child=fork(new URL(`dist/${mode}.js`,base),[],{execArgv:[],env:{...process.env,PORT:'0',RUNTIME04_QUEUE_PREFIX:prefix},stdio:['ignore','ignore','pipe','ipc'],windowsHide:true});
  const exit=once(child,'exit');let error='';child.stderr.on('data',data=>{error+=String(data)});const messages=[];child.on('message',message=>messages.push(message));
  const handle={child,exit,async close(signal){if(child.exitCode!==null)return;const timer=setTimeout(()=>child.kill(),5000);try{if(signal)child.kill(signal);else child.send({type:'stop'});return await exit;}finally{clearTimeout(timer)}}};children.push(handle);
  const until=Date.now()+15000;while(Date.now()<until){const ready=messages.find(message=>message.type==='ready');if(ready)return{...handle,ready};if(child.exitCode!==null)throw new Error('Child startup failed '+error);await new Promise(r=>setTimeout(r,20));}throw new Error('Child ready timeout');
 }
 try{await run(start);}finally{for(const child of children.reverse())await child.close();}
}
async function state(url,id,expected){const until=Date.now()+10000;while(Date.now()<until){const response=await fetch(url+'/jobs/'+id);assert.equal(response.status,200);const job=await response.json();if(job.state===expected)return job;if(job.state==='failed'&&expected!=='failed')throw new Error('HTTP job unexpectedly failed');await new Promise(r=>setTimeout(r,10));}throw new Error('HTTP job state timeout');}
async function add(url,mode){const id='n-'+randomBytes(8).toString('hex');const response=await fetch(url+'/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,mode})});assert.equal(response.status,201);return id;}
test('real API and separate Worker retry after commit without a second effect',{timeout:30000},()=>fixture(async start=>{const api=await start('api'),worker=await start('worker');assert.notEqual(api.child.pid,worker.child.pid);const id=await add(api.ready.url,'after-commit');const job=await state(api.ready.url,id,'completed');assert.equal(job.attemptsMade,2);assert.equal(job.result.duplicate,true);}));
test('actual Worker process drains an active delivery before clean exit',{timeout:30000},()=>fixture(async start=>{const api=await start('api'),worker=await start('worker');const id=await add(api.ready.url,'slow');await state(api.ready.url,id,'active');const [code,signal]=await worker.close(process.platform==='win32'?undefined:'SIGTERM');assert.equal(code,0);assert.equal(signal,null);await state(api.ready.url,id,'completed');assert.equal((await fetch(api.ready.url+'/health')).status,200);}));
test('HTTP validates the new exact delivery contract',{timeout:30000},()=>fixture(async start=>{const api=await start('api');for(const value of [{id:'n-0123456789abcdef',failures:0},{id:'n-0123456789abcdef',mode:'email'},{id:'n-0123456789abcdef',mode:'normal',extra:true}])assert.equal((await fetch(api.ready.url+'/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)})).status,400);}));
