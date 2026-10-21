import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const [target,...extra]=process.argv.slice(2);
if(!['exercise','reference'].includes(target)||extra.length)throw new Error('Use exercise|reference');
const root=new URL(`../../${target==='reference'?'reference-solutions':'labs'}/runtime-04/`,import.meta.url);
const build=spawnSync(process.execPath,[fileURLToPath(new URL('../../node_modules/typescript/bin/tsc',import.meta.url)),'-p',fileURLToPath(new URL('tsconfig.json',root))],{stdio:'inherit',timeout:30000});
if(build.status!==0)process.exit(build.status??1);
const {Pool}=createRequire(new URL('package.json',root))('pg');
const suffix=randomBytes(8).toString('hex'),containers=[],adminPassword=randomBytes(24).toString('hex'),appPassword=randomBytes(24).toString('hex');
function docker(args){const run=spawnSync('docker',args,{encoding:'utf8',timeout:120000,env:{...process.env,POSTGRES_PASSWORD:adminPassword}});assert.equal(run.status,0,'Owned container operation failed ('+args[0]+')');return run.stdout.trim();}
function port(name,service){return docker(['inspect','--format',`{{(index (index .NetworkSettings.Ports "${service}/tcp") 0).HostPort}}`,name]);}
async function ready(name,args){for(let i=0;i<100;i++){if(spawnSync('docker',['exec',name,...args],{stdio:'ignore'}).status===0)return;await new Promise(r=>setTimeout(r,100));}throw new Error('Owned service readiness timeout');}
let operator;
try{
 const redis='course-r04-redis-'+suffix,db='course-r04-db-'+suffix;
 docker(['run','-d','--name',redis,'--label','codex.owner=runtime04-check','-p','127.0.0.1::6379','redis:8.6.7-alpine','redis-server','--save','','--appendonly','no','--maxmemory','64mb','--maxmemory-policy','noeviction']);containers.push(redis);
 docker(['run','-d','--name',db,'--label','codex.owner=runtime04-check','-p','127.0.0.1::5432','-e','POSTGRES_PASSWORD','-e','POSTGRES_USER=course_operator','-e','POSTGRES_DB=brodcasting_runtime04_lab','postgres:18.6']);containers.push(db);
 await ready(redis,['redis-cli','ping']);await ready(db,['pg_isready','-h','127.0.0.1','-U','course_operator']);
 const dbPort=port(db,5432);operator=new Pool({connectionString:`postgresql://course_operator:${adminPassword}@127.0.0.1:${dbPort}/brodcasting_runtime04_lab`,connectionTimeoutMillis:2000,query_timeout:5000});
 await operator.query(await readFile(new URL('schema.sql',root),'utf8'));
 // The test-only constraint makes the second transaction statement fail deterministically.
 await operator.query("ALTER TABLE fake_deliveries ADD CONSTRAINT test_effect_failure CHECK(id <> 'n-ffffffffffffffff')");
 const sql=(await operator.query("SELECT format('CREATE ROLE runtime04_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',$1::text) AS sql",[appPassword])).rows[0].sql;await operator.query(sql);
 await operator.query('GRANT CONNECT ON DATABASE brodcasting_runtime04_lab TO runtime04_app; GRANT USAGE ON SCHEMA public TO runtime04_app; GRANT SELECT,INSERT ON delivery_receipts,fake_deliveries TO runtime04_app');
 console.log('Owned services: Redis 8.6.7; PostgreSQL 18.6; restricted runtime04_app');
 const run=spawnSync(process.execPath,['--test',fileURLToPath(new URL('./delivery.test.mjs',import.meta.url)),fileURLToPath(new URL('./bootstrap.test.mjs',import.meta.url))],{stdio:'inherit',timeout:120000,env:{...process.env,RUNTIME04_SOURCE:root.href,RUNTIME04_REDIS_URL:'redis://127.0.0.1:'+port(redis,6379)+'/0',RUNTIME04_DATABASE_URL:`postgresql://runtime04_app:${appPassword}@127.0.0.1:${dbPort}/brodcasting_runtime04_lab`}});
 process.exitCode=run.status??1;
}finally{await operator?.end();for(const container of containers.reverse()){assert.match(container,/^course-r04-(redis|db)-[a-f0-9]{16}$/);assert.equal(docker(['inspect','--format','{{index .Config.Labels "codex.owner"}}',container]),'runtime04-check');docker(['rm','-f','-v',container]);}}
