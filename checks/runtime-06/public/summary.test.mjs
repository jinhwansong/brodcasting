import {test} from 'node:test';import assert from 'node:assert/strict';import {summarize} from '../../../reference-solutions/runtime-06/src/summary.mjs';
test('percentiles use numeric order without mutating raw evidence',()=>{const values=[100,2,10,1];assert.deepEqual(summarize(values),{count:4,p50:2,p95:100,max:100});assert.deepEqual(values,[100,2,10,1]);});
test('one sample and invalid measurements are explicit',()=>{assert.deepEqual(summarize([0]),{count:1,p50:0,p95:0,max:0});for(const value of [[],[-1],[NaN],[Infinity],['1']])assert.throws(()=>summarize(value));});
