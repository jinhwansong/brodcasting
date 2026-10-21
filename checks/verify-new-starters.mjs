import fs from 'node:fs';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const rows=[];
for(const [part,total,failed]of [['07',8,7],['08',5,5],['10',6,4],['11',6,6]]){
 const r=spawnSync(process.execPath,['checks/part-'+part+'/run.mjs','exercise'],{encoding:'utf8',env:{...process.env,LAB_TARGET:'exercise'}});
 assert.equal(r.status,1,'starter '+part+' must fail behavior checks');
 const report=JSON.parse(fs.readFileSync('test-results/part-'+part+'/exercise.json','utf8'));
 assert.equal(report.numTotalTests,total);assert.equal(report.numFailedTests,failed);
 const messages=report.testResults.flatMap(file=>file.assertionResults??[]).flatMap(test=>test.failureMessages??[]).join('\n');
 assert.ok(!/Cannot find module|ERR_MODULE_NOT_FOUND|Failed to resolve import|ECONNREFUSED|SyntaxError|timed out|unhandled rejection/i.test(messages),'starter '+part+' has an environment failure');
 rows.push({part,passed:total-failed,failed,collected:total});
}
for(const [name,args,total,failed]of [['analysis',['checks/part-09/run.mjs','exercise'],5,3],['delivery',['node_modules/vitest/vitest.mjs','run','--config','checks/part-09/config.ts'],3,3]]){
 const r=spawnSync(process.execPath,args,{encoding:'utf8',env:{...process.env,LAB_TARGET:'exercise',PART09_DB:'0'}});assert.equal(r.status,1);
 if(name==='analysis'){assert.match(r.stdout,/# tests 5\b/);assert.match(r.stdout,/# fail 3\b/);}else{const report=JSON.parse(fs.readFileSync('test-results/part-09/exercise-delivery.json','utf8'));assert.equal(report.numTotalTests,total);assert.equal(report.numFailedTests,failed);}
 rows.push({part:'09-'+name,passed:total-failed,failed,collected:total});
}
fs.mkdirSync('test-results/parts-07-11',{recursive:true});fs.writeFileSync('test-results/parts-07-11/starter.json',JSON.stringify({at:new Date().toISOString(),rows},null,2)+'\n');console.log('Starter checks collected; only the expected unfinished behavior failed');
