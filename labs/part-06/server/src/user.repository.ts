import type {Pool} from 'pg';
import type {Account,User} from './types.js';
export class UserRepository {
 constructor(private readonly pool:Pool){}
 async create(username:string,hash:string):Promise<User>{
  return(await this.pool.query<User>('INSERT INTO users(username,password_hash) VALUES($1,$2) RETURNING id,username',[username,hash])).rows[0];
 }
 async findByUsername(username:string):Promise<Account|null>{
  return(await this.pool.query<Account>('SELECT id,username,password_hash AS "passwordHash" FROM users WHERE username=$1',[username])).rows[0]??null;
 }
 async get(id:string):Promise<User|null>{
  return(await this.pool.query<User>('SELECT id,username FROM users WHERE id=$1',[id])).rows[0]??null;
 }
}
