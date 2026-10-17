import {Pool} from 'pg';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
export const target=process.env.LAB_TARGET==='reference'?'reference-solutions/part-04':'labs/part-04';
const root=fileURLToPath(new URL('../../',import.meta.url));
export const load=(name:string)=>import(/* @vite-ignore */ pathToFileURL(path.join(root,target,'server/dist',name+'.js')).href);
export const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
export async function fixture(bootstrap=true){
 const {requireLocalDatabase}=await load('db-config');
 const url:URL=requireLocalDatabase(process.env.PART04_TEST_ADMIN_URL,'brodcasting_part04_test');
 const admin=new Pool({connectionString:url.href,connectionTimeoutMillis:1000});
 const suffix=randomBytes(6).toString('hex'),schema='part04_check_'+suffix,role='part04_check_'+suffix,password=randomBytes(20).toString('hex');
 await admin.query('CREATE SCHEMA '+schema);
 const pool=new Pool({connectionString:url.href,options:'-c search_path='+schema,connectionTimeoutMillis:1000});
 let restricted:Pool|undefined;
 async function limitedPool(){
  if(restricted)return restricted;
  await admin.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`);
  await (await load('db-config')).grantAppAccess(pool,role,schema);
  const appUrl=new URL(url);appUrl.username=role;appUrl.password=password;
  restricted=new Pool({connectionString:appUrl.href,options:'-c search_path='+schema,connectionTimeoutMillis:1000});
  return restricted;
 }
 try{if(bootstrap)await pool.query(await readFile(path.join(root,target,'server/migrations/001-schema.sql'),'utf8'));}
 catch(error){await pool.end();await admin.query('DROP SCHEMA '+schema+' CASCADE');await admin.end();throw error;}
 return{pool,admin,schema,limitedPool,async close(){await restricted?.end();await pool.end();await admin.query('DROP SCHEMA '+schema+' CASCADE');if(restricted)await admin.query('DROP ROLE '+role);await admin.end();}};
}
export async function reset(pool:Pool){
 await pool.query('TRUNCATE favorites,room_admins,sessions,rooms,broadcasts,users CASCADE');
 await pool.query('INSERT INTO users(id,username,password_hash) VALUES($1,$2,$3),($4,$5,$6)',[A,'learner_a','not-an-auth-fixture',B,'learner_b','not-an-auth-fixture']);
 const {FIXTURES}=await load('fixtures');
 for(const row of FIXTURES)await pool.query('INSERT INTO broadcasts(id,title,host_name,viewer_count,description) VALUES($1,$2,$3,$4,$5)',[row.id,row.title,row.hostName,row.viewerCount,row.description]);
 await pool.query("INSERT INTO rooms(id,title,notice) VALUES('r1','첫 번째 방','처음 공지'),('r2','두 번째 방','다른 공지')");
 await pool.query('INSERT INTO room_admins(user_id,room_id) VALUES($1,$2),($3,$4)',[A,'r1',B,'r2']);
}
