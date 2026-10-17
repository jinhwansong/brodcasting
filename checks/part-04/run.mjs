import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const [target,kind='db']=process.argv.slice(2);
if(!['exercise','reference'].includes(target)||!['unit','db'].includes(kind)){console.error('Usage: run.mjs exercise|reference unit|db');process.exit(2);}
const root=fileURLToPath(new URL('../../',import.meta.url)),project=target==='reference'?'reference-solutions/part-04':'labs/part-04';
const run=args=>spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,LAB_TARGET:target}}).status??1;
const compile=run(['node_modules/typescript/bin/tsc','--project',path.join(project,'server/tsconfig.json')]);if(compile)process.exit(compile);
process.exit(run(['node_modules/vitest/vitest.mjs','run','--config','checks/part-04/'+kind+'.config.ts']));
