import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import type {Account,User} from './types.js';
export class UserRepository {
 constructor(private readonly pool:Pool){}
 async create(username:string,_hash:string):Promise<User>{return{id:randomUUID(),username};}
 async findByUsername(_username:string):Promise<Account|null>{return null;}
 async get(_id:string):Promise<User|null>{return null;}
}
