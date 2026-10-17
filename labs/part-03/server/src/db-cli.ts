import {Pool} from 'pg';
import {applyMigrations} from './migrate.js';
import {seed} from './fixtures.js';
import {grantAppAccess,requireLocalDatabase} from './db-config.js';
const command=process.argv[2];
if(!['migrate','seed','provision-app','test-db'].includes(command)) {
  console.error('Usage: db migrate|seed|provision-app|test-db');process.exitCode=2;
} else {
  let pool:Pool|undefined;
  try {
    const url=requireLocalDatabase(process.env.PART03_ADMIN_URL,'brodcasting_part03_lab');
    pool=new Pool({connectionString:url.href});
    if(command==='migrate') console.log('Applied migrations:',await applyMigrations(pool));
    if(command==='seed') {await seed(pool);console.log('Demo seed ready; existing rows preserved');}
    if(command==='test-db') {
      const exists=(await pool.query('SELECT 1 FROM pg_database WHERE datname=$1',['brodcasting_part03_test'])).rowCount;
      if(!exists) await pool.query('CREATE DATABASE brodcasting_part03_test');
      console.log('Dedicated test database ready');
    }
    if(command==='provision-app') {
      const password=process.env.PART03_APP_PASSWORD;
      if(!password||password.length<12) throw new Error('Set a local app password of at least 12 characters');
      const client=await pool.connect();
      try {
        await client.query('BEGIN');
        // DDL의 PASSWORD 위치는 $1을 받지 않아 서버 format(%L)로 리터럴을 생성합니다.
        const {rows}=await client.query("SELECT format('CREATE ROLE part03_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD %L', $1::text) AS sql",[password]);
        await client.query(rows[0].sql);
        await grantAppAccess(client,'part03_app');
        await client.query('COMMIT');console.log('Created limited part03_app role');
      } catch(error) {await client.query('ROLLBACK');throw error;} finally {client.release();}
    }
  } catch {
    console.error('DB command failed. Check the dedicated local database, schema, and role configuration. Existing app roles are not overwritten.');process.exitCode=1;
  } finally {await pool?.end();}
}
