import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
const base=new URL(process.env.RUNTIME03_SOURCE??new URL('../../reference-solutions/runtime-03/',import.meta.url));
const require=createRequire(new URL('package.json',base));
const {Queue,Worker}=require('bullmq');
const {parseNotice,jobOptions,processNotice,readRedis}=await import(new URL('dist/jobs.js',base));
const connection=readRedis(process.env.RUNTIME03_REDIS_URL);
async function fixture(run){
 const prefix='course_r03_'+randomBytes(8).toString('hex');
 const q=new Queue('notifications',{connection:{...connection,maxRetriesPerRequest:1},prefix});
 let worker;
 const make=processor=>{worker=new Worker('notifications',processor,{connection:{...connection,maxRetriesPerRequest:null},prefix,concurrency:1});worker.on('error',()=>{});return worker;};
 try{await run(q,make);}finally{await worker?.close();await q.obliterate({force:true});await q.close();}
}
async function state(job,expected){const until=Date.now()+10000;while(Date.now()<until){const current=await job.getState();if(current===expected)return await job.queue.getJob(job.id);await new Promise(r=>setTimeout(r,20));}throw new Error('job did not become '+expected);}
const input={id:'n-0123456789abcdef',failures:0};
test('accepts exactly the allowed job shape',()=>assert.deepEqual(parseNotice(input),input));
test('rejects unknown fields, identifiers, non-integer and excessive failures',()=>{
 for(const value of [null,[],{}, {...input,extra:true},{...input,id:'../x'},{...input,failures:-1},{...input,failures:6},{...input,failures:'1'},{...input,failures:1.5}])assert.throws(()=>parseNotice(value));
});
test('accepts only a dedicated loopback Redis URL',()=>{
 for(const value of [undefined,'redis://evil.invalid:6379/0','http://127.0.0.1:6379/0','redis://127.0.0.1:6379/1','redis://127.0.0.1:6379/0?x=1'])assert.throws(()=>readRedis(value));
});
test('enqueue without a Worker remains waiting and stores only validated data',async()=>fixture(async q=>{
 const job=await q.add('notice',parseNotice(input),jobOptions(input.id));assert.equal(await job.getState(),'waiting');assert.deepEqual(job.data,input);
}));
test('real Worker retries two failures and completes its third attempt',async()=>fixture(async(q,make)=>{
 make(processNotice);const job=await q.add('notice',parseNotice({...input,failures:2}),jobOptions(input.id));const done=await state(job,'completed');assert.equal(done.attemptsMade,3);assert.equal(done.returnvalue,3);
}));
test('retained jobId deduplicates additions and removal permits a new job',async()=>fixture(async(q,make)=>{
 let calls=0;make(async job=>{calls++;return processNotice(job)});
 const first=await q.add('notice',parseNotice(input),jobOptions(input.id));await state(first,'completed');
 await q.add('notice',parseNotice({...input,failures:2}),jobOptions(input.id));assert.equal((await q.getJob(input.id)).data.failures,0);assert.equal(calls,1);
 await first.remove();const next=await q.add('notice',parseNotice(input),jobOptions(input.id));await state(next,'completed');assert.equal(calls,2);
}));
test('retry bound ends in failed after three attempts',async()=>fixture(async(q,make)=>{
 make(processNotice);const job=await q.add('notice',parseNotice({...input,failures:5}),jobOptions(input.id));const failed=await state(job,'failed');assert.equal(failed.attemptsMade,3);
}));
test('Worker close waits for in-flight processor completion',async()=>fixture(async(q,make)=>{
 let release;const gate=new Promise(resolve=>{release=resolve});let began;const started=new Promise(resolve=>{began=resolve});
 const worker=make(async()=>{began();await gate;return 1;});
 const job=await q.add('notice',parseNotice(input),jobOptions(input.id));await started;
 let closed=false;const closing=worker.close().then(()=>{closed=true});await new Promise(r=>setImmediate(r));assert.equal(closed,false);release();await closing;assert.equal(await job.getState(),'completed');
}));
