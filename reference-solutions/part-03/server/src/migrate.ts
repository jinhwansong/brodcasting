import type {Pool} from 'pg';
export type Migration={version:string;sql:string};
export async function applyMigrations(_pool:Pool,_migrations?:readonly Migration[]):Promise<number> {return 0;}
