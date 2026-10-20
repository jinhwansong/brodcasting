import type {Pool} from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export type Migration={version:string;sql:string};
export async function applyMigrations(pool:Pool,migrations?:readonly Migration[]):Promise<number> {
  const files=migrations??await Promise.all(['001-schema.sql'].map(async version=>({version,sql:await readFile(new URL('../migrations/'+version,import.meta.url),'utf8')})));
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(4504)');
    await client.query('CREATE TABLE IF NOT EXISTS course_migrations(version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    let applied=0;
    for(const migration of files) {
      const checksum=createHash('sha256').update(migration.sql).digest('hex');
      const previous=(await client.query('SELECT checksum FROM course_migrations WHERE version=$1',[migration.version])).rows[0];
      if(previous) {if(previous.checksum!==checksum)throw new Error('Migration changed: '+migration.version);continue;}
      await client.query(migration.sql);
      await client.query('INSERT INTO course_migrations(version,checksum) VALUES($1,$2)',[migration.version,checksum]);
      applied++;
    }
    await client.query('COMMIT');return applied;
  } catch(error) {await client.query('ROLLBACK');throw error;} finally {client.release();}
}
