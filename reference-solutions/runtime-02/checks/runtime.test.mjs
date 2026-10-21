import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {once} from 'node:events';

const source=new URL(process.env.RUNTIME02_SOURCE??new URL('../',import.meta.url));
async function start(mode,extra={}) {
  const child=fork(new URL(`dist/${mode}.js`,source),[],{execArgv:[],env:{...process.env,PORT:'0',...extra},stdio:['ignore','ignore','pipe','ipc'],windowsHide:true});
  let stderr='';child.stderr.on('data',chunk=>{stderr+=String(chunk)});
  const messages=[];child.on('message',message=>messages.push(message));
  const closed=once(child,'exit');
  async function wait(type) {
    const until=Date.now()+15000;
    while(Date.now()<until){const index=messages.findIndex(message=>message.type===type);if(index>=0)return messages.splice(index,1)[0];if(child.exitCode!==null)throw new Error('child exited '+stderr);await new Promise(resolve=>setTimeout(resolve,10));}
    throw new Error('child ready timeout '+stderr);
  }
  async function close(){if(child.exitCode===null){if(child.connected)child.send({type:'stop'});const timer=setTimeout(()=>child.kill(),1000);try{await closed;}finally{clearTimeout(timer)}}}
  return{child,closed,wait,close};
}

test('API uses a real HTTP app and stable injected service across requests',{timeout:30000},async()=>{
  const api=await start('api');try{const ready=await api.wait('ready');const one=await(await fetch(ready.url+'/health')).json();const two=await(await fetch(ready.url+'/health')).json();assert.equal(one.pid,api.child.pid);assert.equal(one.bootId,two.bootId);assert.equal(two.count,one.count+1);assert.equal(one.role,'api');}finally{await api.close()}
});

test('Worker has a separate PID, application context and no HTTP adapter',{timeout:30000},async()=>{
  const api=await start('api'),worker=await start('worker');try{const a=await api.wait('ready'),w=await worker.wait('ready');assert.notEqual(w.pid,a.pid);assert.notEqual(w.bootId,a.bootId);assert.equal(w.hasHttp,false);worker.child.send({type:'snapshot'});const snap=await worker.wait('snapshot');assert.equal(snap.role,'worker');assert.equal(snap.pid,worker.child.pid);}finally{await api.close();await worker.close()}
});

test('Worker crash leaves API responsive and restart gets a fresh context',{timeout:45000},async()=>{
  const api=await start('api'),worker=await start('worker');let restarted;try{const a=await api.wait('ready'),w=await worker.wait('ready');worker.child.send({type:'crash'});assert.equal((await worker.closed)[0],7);assert.equal((await fetch(a.url+'/health')).status,200);restarted=await start('worker');const next=await restarted.wait('ready');assert.notEqual(next.bootId,w.bootId);}finally{await api.close();await worker.close();await restarted?.close()}
});

test('API shutdown leaves Worker able to receive another command',{timeout:30000},async()=>{
  const api=await start('api'),worker=await start('worker');try{await api.wait('ready');await worker.wait('ready');await api.close();worker.child.send({type:'snapshot'});assert.equal((await worker.wait('snapshot')).role,'worker');}finally{await api.close();await worker.close()}
});

test('graceful Worker shutdown closes its context and exits zero',{timeout:30000},async()=>{
  const worker=await start('worker');try{await worker.wait('ready');worker.child.send({type:'stop'});assert.equal((await worker.wait('closed')).type,'closed');assert.equal((await worker.closed)[0],0);}finally{await worker.close()}
});

test('invalid API port fails before any readiness or listener',{timeout:30000},async()=>{
  const api=await start('api',{PORT:'0x123'});try{assert.equal((await api.closed)[0],1);await assert.rejects(api.wait('ready'),/exited/);}finally{await api.close()}
});
