import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const [target,kind='all']=process.argv.slice(2);
if(!['exercise','reference'].includes(target)||!['unit','db','client','all'].includes(kind)){console.error('Usage: run.mjs exercise|reference unit|db|client|all');process.exit(2);}
const root=fileURLToPath(new URL('../../',import.meta.url)),project=target==='reference'?'reference-solutions/part-06':'labs/part-06';
const run=args=>spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,LAB_TARGET:target}}).status??1;
let failed=0;
if(kind!=='client'){
 const compile=run(['node_modules/typescript/bin/tsc','--project',path.join(project,'server/tsconfig.json')]);if(compile)process.exit(compile);
 failed=run(['node_modules/vitest/vitest.mjs','run','--config','checks/part-06/'+(kind==='unit'?'unit':'db')+'.config.ts']);
}
if(kind==='client'||kind==='all'){const result=run(['node_modules/vitest/vitest.mjs','run','--config','checks/part-06/client.config.ts']);failed ||=result;}
process.exit(failed);
