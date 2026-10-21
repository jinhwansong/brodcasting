import {test} from 'node:test';import assert from 'node:assert/strict';
const {summarize,validate}=await import('../../'+(process.env.LAB_TARGET==='reference'?'reference-solutions':'labs')+'/part-09/analyze.mjs');
test('空 samples have no made-up percentiles',()=>{assert.deepEqual(summarize([]),{count:0,p50:null,p95:null,p99:null});});
test('nearest-rank percentiles preserve input and outliers',()=>{const rows=[100,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];assert.deepEqual(summarize(rows),{count:20,p50:10,p95:19,p99:100});assert.equal(rows[0],100);});
test('invalid measurements are rejected, never silently dropped',()=>{for(const rows of [[NaN],[Infinity],[-1],['2']])assert.throws(()=>summarize(rows));});
test('fixed scenario must remain inside local experiment bounds',()=>{const p={clients:4,rooms:2,senders:2,rate:2,seconds:3,bytes:128};assert.deepEqual(validate(p),p);});
test('invalid limits and extra target URLs are rejected',()=>{const p={clients:4,rooms:2,senders:2,rate:2,seconds:3,bytes:128};for(const bad of [{clients:21},{rooms:3},{senders:5},{rate:10},{seconds:61},{bytes:0},{clients:1.5},{target:'https://example.com'}])assert.throws(()=>validate({...p,...bad}));});
