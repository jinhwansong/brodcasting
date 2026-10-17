import type {Pool} from 'pg';
export function requireLocalDatabase(raw:string|undefined,_name:string):URL {return new URL(raw??'postgres://127.0.0.1/brodcasting_part03_test');}
export async function grantAppAccess(_pool:Pool,_role:string,_schema='public'):Promise<void> {}
