import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {expect,it} from 'vitest';
import {target} from './db-fixture';

it.each([
 {PART05_DATABASE_URL:''},
 {PART05_DATABASE_URL:'operator'},
 {PART05_DATABASE_URL:'postgres://part05_app:marker@other.invalid/brodcasting_part05_lab'},
 {SESSION_SECRET:''},{SESSION_SECRET:'z'.repeat(64)},
 {NODE_ENV:'production'},{PORT:'0'},{PORT:'65536'},{PORT:'3005junk'},{PORT:'3e3'},
 {PART05_BROWSER_ORIGIN:'https://other.invalid'},
])('잘못된 실행 설정은 연결 전에 정제한 실패로 종료한다: %#',async invalid=>{
 const marker=randomBytes(20).toString('hex');
 let connections=0;
 const server=createServer(socket=>{connections++;socket.destroy();});server.listen(0,'127.0.0.1');await once(server,'listening');
 const address=server.address();if(!address||typeof address==='string')throw new Error('Expected TCP port');
 const env={...process.env,NODE_ENV:'test',PART05_DATABASE_URL:'postgres://part05_app:'+marker+'@127.0.0.1:'+address.port+'/brodcasting_part05_lab',
  SESSION_SECRET:randomBytes(32).toString('hex'),PART05_BROWSER_ORIGIN:'http://127.0.0.1:5185',PORT:'3005',...invalid};
 if(env.PART05_DATABASE_URL==='operator')env.PART05_DATABASE_URL='postgres://postgres:'+marker+'@127.0.0.1:'+address.port+'/brodcasting_part05_lab';
 let child:ReturnType<typeof spawn>|undefined,timer:ReturnType<typeof setTimeout>|undefined;
 try{
  child=spawn(process.execPath,[path.join(target,'server/dist/main.js')],{env,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';child.stdout!.on('data',value=>stdout+=String(value));child.stderr!.on('data',value=>stderr+=String(value));
  timer=setTimeout(()=>child?.kill('SIGKILL'),5000);
  const [code]=await once(child,'close');expect(code).toBe(1);expect(connections).toBe(0);
  expect(stdout).toBe('');expect(stderr.trim()).toBe('Part 05 API could not start. Check the local limited-role configuration.');
  expect(stderr.includes(marker)).toBe(false);if(env.SESSION_SECRET)expect(stderr.includes(env.SESSION_SECRET)).toBe(false);
 }finally{clearTimeout(timer);child?.kill();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
