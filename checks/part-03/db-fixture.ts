import { Pool } from 'pg';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
export const target = process.env.LAB_TARGET === 'reference' ? 'reference-solutions/part-03' : 'labs/part-03';
const root = fileURLToPath(new URL('../../', import.meta.url));
export const load = (name: string) => import(/* @vite-ignore */ pathToFileURL(path.join(root, target, 'server/dist', name + '.js')).href);
export async function fixture(bootstrap = true) {
  const { requireLocalDatabase } = await load('db-config');
  const url: URL = requireLocalDatabase(process.env.PART03_TEST_ADMIN_URL, 'brodcasting_part03_test');
  const admin = new Pool({ connectionString: url.href });
  const suffix = randomBytes(6).toString('hex');
  const schema = 'part03_check_' + suffix;
  const role = 'part03_check_' + suffix;
  const password = randomBytes(20).toString('hex');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString: url.href, options: '-c search_path=' + schema });
  let restricted: Pool | undefined;
  async function limitedPool() {
    if (restricted) return restricted;
    // role/schema/password는 테스트가 생성한 hex 값이며 외부 입력이 아닙니다.
    await admin.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`);
    await (await load('db-config')).grantAppAccess(pool, role, schema);
    const appUrl = new URL(url); appUrl.username = role; appUrl.password = password;
    restricted = new Pool({ connectionString: appUrl.href, options: '-c search_path=' + schema });
    return restricted;
  }
  try {
    if (bootstrap) for (const name of ['001-schema.sql', '002-index.sql']) await pool.query(await readFile(path.join(root, target, 'server/migrations', name), 'utf8'));
  } catch (error) { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); throw error; }
  return { pool, admin, schema, limitedPool, async close() {
    await restricted?.end(); await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    if (restricted) await admin.query(`DROP ROLE ${role}`);
    await admin.end();
  } };
}
export async function reset(pool: Pool) {
  await pool.query('TRUNCATE favorites, broadcasts, demo_users CASCADE');
  await pool.query('INSERT INTO demo_users(id) VALUES ($1)', ['demo-user']);
  const { FIXTURES } = await load('fixtures');
  for (const row of FIXTURES) await pool.query('INSERT INTO broadcasts(id,title,host_name,viewer_count,description) VALUES($1,$2,$3,$4,$5)', [row.id,row.title,row.hostName,row.viewerCount,row.description]);
}
