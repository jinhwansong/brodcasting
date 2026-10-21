import {ConflictException,UnauthorizedException} from '@nestjs/common';
import {UserRepository} from './user.repository.js';
import {PasswordService} from './passwords.js';
import type {User} from './types.js';
export class AuthService{
 constructor(private readonly users:UserRepository,private readonly passwords:PasswordService,private readonly dummyHash:string){}
 async register(username:string,password:string):Promise<User>{
  const hash=await this.passwords.hash(password);
  try{return await this.users.create(username,hash);}
  catch(error){if(error&&typeof error==='object'&&'code' in error&&error.code==='23505')throw new ConflictException('Username already in use');throw error;}
 }
 async login(username:string,password:string):Promise<User>{
  const account=await this.users.findByUsername(username);
  const valid=await this.passwords.verify(account?.passwordHash??this.dummyHash,password);
  if(!account||!valid)throw new UnauthorizedException('Invalid credentials');
  return{id:account.id,username:account.username};
 }
}
