import {ForbiddenException} from '@nestjs/common';
import {UserRepository} from './user.repository.js';
import {PasswordService} from './passwords.js';
import type {User} from './types.js';
export class AuthService{
 constructor(private readonly users:UserRepository,private readonly passwords:PasswordService,private readonly dummyHash:string){}
 async register(_username:string,_password:string):Promise<User>{
  // B: 해싱한 값만 저장하고 공개 User를 반환하세요.
  throw new ForbiddenException('Authentication exercise incomplete');
 }
 async login(_username:string,_password:string):Promise<User>{
  // B: 존재하지 않는 계정도 dummy 해시를 검증하고 동일401로 거부하세요.
  throw new ForbiddenException('Authentication exercise incomplete');
 }
}
