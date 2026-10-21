import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {spawn,spawnSync} from 'node:child_process';import {randomBytes,createHash} from 'node:crypto';import {once} from 'node:events';import net from 'node:net';
const part=process.argv[2];if(!['07','08','09','11'].includes(part)||process.argv.length!==3)throw Error('Use part 07, 08, 09 or 11');
const source=path.resolve('reference-solutions/part-'+part),copy=path.join(os.tmpdir(),'brodcasting-part-'+part+'-'+randomBytes(6).toString('hex'));
await fs.cp(source,copy,{recursive:true,filter:p=>!/(?:^|[\\/])(node_modules|dist)(?:[\\/]|$)/.test(p)});
const log=[];
function npm(command){const executable=process.platform==='win32'?(process.env.ComSpec??'cmd.exe'):'npm',args=process.platform==='win32'?['/d','/s','/c','npm '+command]:command.split(' ');const r=spawnSync(executable,args,{cwd:copy,encoding:'utf8',maxBuffer:4*1024*1024});log.push({command:'npm '+command,status:r.status});if(r.status!==0)throw Error('Standalone '+command+' failed: '+r.stdout+' '+r.stderr);}
let child;const checks=[];try{
npm('ci');npm('run typecheck');npm('run build');
if(part==='09'){
 const loaded=spawnSync(process.execPath,['--input-type=module','-e',"await import('./server/dist/create-app.js');console.log('runtime imported')"],{cwd:copy,encoding:'utf8'});if(loaded.status!==0)throw Error('Independent server imports failed: '+loaded.stderr);checks.push('Nest runtime imports with no ancestor repository dependencies');
}else{
const lease=net.createServer();await new Promise(resolve=>lease.listen(0,'127.0.0.1',resolve));const port=lease.address().port;await new Promise(resolve=>lease.close(resolve));
child=spawn(process.execPath,[path.join(copy,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:copy,stdio:'ignore'});
 let html;for(let i=0;i<40;i++){try{const response=await fetch('http://127.0.0.1:'+port,{signal:AbortSignal.timeout(1000)});if(response.ok){html=await response.text();break;}}catch{}await new Promise(r=>setTimeout(r,100));}if(!html?.includes('<div id="root">'))throw Error('Standalone preview missing HTML');checks.push('real Vite preview HTML');
 const script=html.match(/src="([^"]+\.js)"/)[1];if(!(await fetch('http://127.0.0.1:'+port+script)).ok)throw Error('Missing built JS');checks.push('real built JavaScript response');
 if(part==='08'){
  for(const name of ['pattern.webm','alternate.webm']){const response=await fetch('http://127.0.0.1:'+port+'/media/'+name);const bytes=Buffer.from(await response.arrayBuffer());const expected=await fs.readFile(copy+'/public/media/'+name);if(!response.ok||!response.headers.get('content-type')?.startsWith('video/webm')||createHash('sha256').update(bytes).digest('hex')!==createHash('sha256').update(expected).digest('hex'))throw Error('Media response mismatch');checks.push('real WebM HTTP response '+name);}
  if(!(await(await fetch('http://127.0.0.1:'+port+'/media/captions.ko.vtt')).text()).startsWith('WEBVTT'))throw Error('Missing captions');checks.push('real caption HTTP response');
 }
}
 await fs.mkdir('docs/experiments/part-'+part,{recursive:true});await fs.writeFile('docs/experiments/part-'+part+'/standalone.json',JSON.stringify({at:new Date().toISOString(),node:process.version,platform:process.platform,sourceOnly:true,outsideRepository:true,commands:log,checks,browserRun:false},null,2)+'\n');console.log('part'+part+' source-only npm ci/type/build and '+checks.length+' runtime checks passed');
}finally{
 if(child&&child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}
 const resolved=await fs.realpath(copy),temporary=await fs.realpath(os.tmpdir());if(!resolved.startsWith(temporary+path.sep)||!path.basename(resolved).startsWith('brodcasting-part-'+part+'-'))throw Error('Unsafe standalone cleanup path');await fs.rm(resolved,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
