import 'reflect-metadata';
import {expect,it} from 'vitest';
import {randomBytes} from 'node:crypto';
import * as argon2 from 'argon2';
import {Pool} from 'pg';
import {load} from './db-fixture';
const password=()=>randomBytes(24).toString('hex');
it('Argon2id 설정과 매번 다른 salt를 사용한다',async()=>{
  const {PasswordService}=await load('passwords');const service=new PasswordService();const value=password();
  const first=await service.hash(value),second=await service.hash(value);
  const [,algorithm,version,settings]=first.split('$');
  expect({algorithm,version}).toEqual({algorithm:'argon2id',version:'v=19'});
  expect(Object.fromEntries(settings.split(',').map(entry=>entry.split('=')))).toEqual({m:'19456',t:'2',p:'1'});
  expect(first===second).toBe(false);expect(await argon2.verify(first,value)).toBe(true);
});
it('정확한 원문만 검증하고 공백을 제거하지 않는다',async()=>{
  const {PasswordService}=await load('passwords');const service=new PasswordService();const value=' '+password()+' ';
  const hash=await argon2.hash(value,{type:argon2.argon2id,memoryCost:19456,timeCost:2,parallelism:1});
  expect(await service.verify(hash,value)).toBe(true);expect(await service.verify(hash,value.trim())).toBe(false);
  expect(await service.verify(hash,password())).toBe(false);
});
it('손상된 DB 해시를 정상 인증 실패로 감추지 않는다',async()=>{const {PasswordService}=await load('passwords');await expect(new PasswordService().verify('invalid-encoding',password())).rejects.toThrow();});
const actor={id:'a1111111-1111-4111-8111-111111111111',username:'learner_a'};
it('현재 주체의 UUID만 소유자로 허용한다',async()=>{const {assertOwner}=await load('access-policy');expect(()=>assertOwner(actor,actor.id.toUpperCase())).not.toThrow();});
it('다른 사용자의 UUID는 Forbidden이다',async()=>{const {assertOwner}=await load('access-policy');expect(()=>assertOwner(actor,'b2222222-2222-4222-8222-222222222222')).toThrow(expect.objectContaining({status:403}));});
it.each([
  {value:undefined},{value:'postgres://a:b@other.invalid/brodcasting_part05_test'},
  {value:'postgres://a:b@127.0.0.1/other'},{value:'postgres://a:b@127.0.0.1/brodcasting_part05_test?options=x'},
  {value:'postgres://a:b@localhost/brodcasting_part05_test'},{value:'https://127.0.0.1/brodcasting_part05_test'},
])('DB 대상 guard는 연결 전에 거부한다: $value',async({value})=>{const {requireLocalDatabase}=await load('db-config');expect(()=>requireLocalDatabase(value,'brodcasting_part05_test')).toThrow();});
it('명시적인 loopback 전용 DB만 허용한다',async()=>{const {requireLocalDatabase}=await load('db-config');expect(requireLocalDatabase('postgres://a:b@127.0.0.1/brodcasting_part05_test','brodcasting_part05_test').hostname).toBe('127.0.0.1');});
it.each([
  {secret:''},{secret:'z'.repeat(64)},{browserOrigin:'https://other.invalid'},
  {schemaName:'public"; DROP TABLE users;--'},{sessionTtlMs:0},
  {authRateLimit:{windowMs:60000,limit:0}},{authRateLimit:{windowMs:-1,limit:10}},
])('잘못된 보안 설정은 DB 연결/기동 전에 거부한다: %#',async invalid=>{
  const {createApp}=await load('create-app');const pool=new Pool({host:'127.0.0.1',port:1,connectionTimeoutMillis:100});let app:any;
  try{await expect(async()=>{app=await createApp(pool,{secret:randomBytes(32).toString('hex'),browserOrigin:'http://127.0.0.1:5185',...invalid});}).rejects.toThrow('Invalid local session configuration');}
  finally{await app?.close();await pool.end();}
});
