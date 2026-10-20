import {Pool} from 'pg';
import {applyMigrations} from './migrate.js';
import {seed} from './fixtures.js';
import {grantAppAccess,grantRoomAdmin,grantRoomMember,requireLocalDatabase} from './db-config.js';
const [command,...args]=process.argv.slice(2);
const isGrant=command==='grant-admin'||command==='grant-member';
const grantArgs=isGrant&&args.length===4&&args[0]==='--username'&&args[2]==='--room'&&/^[a-z][a-z0-9_]{2,23}(?![\s\S])/.test(args[1])&&/^r[12](?![\s\S])/.test(args[3]);
if(!['migrate','seed','provision-app','test-db','grant-admin','grant-member'].includes(command)|| (isGrant?!grantArgs:args.length!==0)) {
  console.error('Usage: db migrate|seed|provision-app|test-db|grant-admin|grant-member --username NAME --room r1|r2');process.exitCode=2;
} else {
  let pool:Pool|undefined;
  try {
    const url=requireLocalDatabase(process.env.PART05_ADMIN_URL,'brodcasting_part05_lab');
    pool=new Pool({connectionString:url.href,connectionTimeoutMillis:1000,statement_timeout:3000});
    if(command==='grant-admin'){await grantRoomAdmin(pool,args[1],args[3]);console.log('Granted local room administrator');}
    if(command==='grant-member'){await grantRoomMember(pool,args[1],args[3]);console.log('Granted local room member');}
    if(command==='migrate') console.log('Applied migrations:',await applyMigrations(pool));
    if(command==='seed') {await seed(pool);console.log('Demo seed ready; existing rows preserved');}
    if(command==='test-db') {
      const exists=(await pool.query('SELECT 1 FROM pg_database WHERE datname=$1',['brodcasting_part05_test'])).rowCount;
      if(!exists) await pool.query('CREATE DATABASE brodcasting_part05_test');
      console.log('Dedicated test database ready');
    }
    if(command==='provision-app') {
      const password=process.env.PART05_APP_PASSWORD;
      if(!password||password.length<12) throw new Error('Set a local app password of at least 12 characters');
      const client=await pool.connect();
      try {
        await client.query('BEGIN');
        const permission=(await client.query('SELECT rolcreaterole OR rolsuper AS allowed FROM pg_roles WHERE rolname=current_user')).rows[0];
        if(permission?.allowed!==true)throw new Error('Role creation requires the local operator');
        await client.query('SELECT pg_advisory_xact_lock(4505)');
        if((await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1',['part05_app'])).rowCount)throw new Error('App role already exists');
        // DDL의 PASSWORD 위치는 $1을 받지 않아 서버 format(%L)로 리터럴을 생성합니다.
        const {rows}=await client.query("SELECT format('CREATE ROLE part05_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD %L', $1::text) AS sql",[password]);
        await client.query(rows[0].sql);
        await grantAppAccess(client,'part05_app');
        await client.query('COMMIT');console.log('Created limited part05_app role');
      } catch(error) {await client.query('ROLLBACK');throw error;} finally {client.release();}
    }
  } catch {
    console.error('DB command failed. Check the dedicated local database, schema, and role configuration. Existing app roles are not overwritten.');process.exitCode=1;
  } finally {await pool?.end();}
}
