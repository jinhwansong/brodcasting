import type {Pool} from 'pg';
export function requireLocalDatabase(raw:string|undefined,name:string):URL {
  if(!raw) throw new Error('A dedicated local PostgreSQL URL is required');
  let url:URL;
  try {url=new URL(raw);} catch {throw new Error('Invalid local PostgreSQL URL');}
  if(!['postgres:','postgresql:'].includes(url.protocol)||!['127.0.0.1','[::1]'].includes(url.hostname)
    ||url.pathname!=='/'+name||url.search||url.hash) throw new Error('Use the dedicated loopback PostgreSQL database');
  return url;
}
export async function grantAppAccess(pool:Pool,role:string,schema='public'):Promise<void> {
  if(!/^part03_(app|check_[0-9a-f]+)$/.test(role)||!(/^(public|part03_check_[0-9a-f]+)$/.test(schema))) throw new Error('Invalid internal role/schema');
  // 식별자는 내부의 고정 이름/hex만 사용합니다. 외부 검색값을 전달하지 않습니다.
  await pool.query(`REVOKE CREATE ON SCHEMA ${schema} FROM PUBLIC, ${role};
    GRANT USAGE ON SCHEMA ${schema} TO ${role};
    REVOKE ALL ON demo_users,broadcasts,favorites FROM PUBLIC, ${role};
    GRANT SELECT ON broadcasts TO ${role};
    GRANT SELECT,INSERT,DELETE ON favorites TO ${role}`);
}
