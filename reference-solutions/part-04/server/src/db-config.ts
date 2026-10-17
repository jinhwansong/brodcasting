import type {Pool} from 'pg';
export function requireLocalDatabase(raw:string|undefined,_name:string):URL{return new URL(raw!);}
export async function grantAppAccess(_pool:Pick<Pool,'query'>,_role:string,_schema='public'):Promise<void>{}
export async function grantRoomAdmin(_pool:Pool,_username:string,_roomId:string):Promise<void>{}
