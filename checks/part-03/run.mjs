import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const [target,kind='all']=process.argv.slice(2);
if(!['exercise','reference'].includes(target)||!['db','client','all'].includes(kind)) {console.error('Usage: run.mjs exercise|reference db|client|all');process.exit(2);}
const root=fileURLToPath(new URL('../../',import.meta.url));
const project=target==='reference'?'reference-solutions/part-03':'labs/part-03';
const run=args=>spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,LAB_TARGET:target}}).status??1;
let failed=0;
if(kind!=='client') {failed=run(['node_modules/typescript/bin/tsc','--project',path.join(project,'server/tsconfig.json')]);if(failed)process.exit(failed);failed=run(['node_modules/vitest/vitest.mjs','run','--config','checks/part-03/db.config.ts']);}
if(kind!=='db') {const result=run(['node_modules/vitest/vitest.mjs','run','--config','checks/part-03/client.config.ts']);failed ||=result;}
process.exit(failed);
