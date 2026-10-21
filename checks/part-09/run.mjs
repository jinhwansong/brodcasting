import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const target=process.argv[2]??'exercise';if(!['exercise','reference'].includes(target))throw Error('Invalid target');
const result=spawnSync(process.execPath,['--test','--test-reporter=tap','checks/part-09/analyze.test.mjs'],{encoding:'utf8',env:{...process.env,LAB_TARGET:target}});
fs.mkdirSync('test-results/part-09',{recursive:true});fs.writeFileSync('test-results/part-09/'+target+'-analysis.tap',result.stdout+result.stderr);process.stdout.write(result.stdout);process.stderr.write(result.stderr);
if(result.status!==0)process.exit(result.status??1);
const next=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','--config','checks/part-09/config.ts'],{stdio:'inherit',env:{...process.env,LAB_TARGET:target}});process.exit(next.status??1);
