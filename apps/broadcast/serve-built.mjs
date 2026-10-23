import {createServer,request as upstreamRequest} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname,sep} from 'node:path';import {fileURLToPath} from 'node:url';import {securityHeaders} from './security-headers.mjs';
const port=Number(process.env.BROADCAST_WEB_PORT??5198),apiPort=Number(process.env.BROADCAST_API_PORT??3026);for(const value of [port,apiPort])if(!Number.isInteger(value)||value<1024||value>65535)throw new Error('Invalid local port');
const origin='http://127.0.0.1:'+port,headers=securityHeaders(process.env.CSP_MODE??'enforce',origin),root=resolve(fileURLToPath(new URL('./client/dist/',import.meta.url))),apiPath=path=>path.startsWith('/api/')||path.startsWith('/socket.io/')||path.startsWith('/rtc.io/');
const server=createServer(async(req,res)=>{
 for(const [key,value]of Object.entries(headers))res.setHeader(key,value);res.setHeader('Cache-Control','no-store');let url;try{url=new URL(req.url??'/',origin);}catch{res.writeHead(400).end();return;}
 if(apiPath(url.pathname)){
  const proxy=upstreamRequest({hostname:'127.0.0.1',port:apiPort,path:url.pathname+url.search,method:req.method,headers:{...req.headers,host:'127.0.0.1:'+apiPort}},response=>{res.writeHead(response.statusCode??502,{...response.headers,...headers});response.pipe(res);});proxy.setTimeout(10000,()=>proxy.destroy());proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end();});req.on('aborted',()=>proxy.destroy());req.pipe(proxy);return;
 }
 if(!['GET','HEAD'].includes(req.method??'')){res.writeHead(405).end();return;}let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}const target=resolve(root,'.'+(name==='/'?'/index.html':name));if(!target.startsWith(root+sep)){res.writeHead(404).end();return;}
 try{const data=await readFile(target);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webm':'video/webm','.vtt':'text/vtt; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'})[extname(target)]??'application/octet-stream');res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404).end();}
});
const upgradedSockets=new Set();
server.on('upgrade',(req,socket,head)=>{
 let url;try{url=new URL(req.url??'/',origin);}catch{socket.destroy();return;}if(!apiPath(url.pathname)||req.headers.origin!==origin){socket.destroy();return;}
 const proxy=upstreamRequest({hostname:'127.0.0.1',port:apiPort,path:url.pathname+url.search,headers:{...req.headers,host:'127.0.0.1:'+apiPort}});proxy.on('upgrade',(response,remote,remoteHead)=>{upgradedSockets.add(socket);socket.once('close',()=>{upgradedSockets.delete(socket);remote.destroy();});socket.write('HTTP/1.1 101 Switching Protocols\r\n'+Object.entries(response.headers).map(([key,value])=>key+': '+value+'\r\n').join('')+'\r\n');if(head.length)remote.write(head);if(remoteHead.length)socket.write(remoteHead);remote.pipe(socket).pipe(remote);socket.on('error',()=>remote.destroy());remote.on('error',()=>socket.destroy());});proxy.on('response',()=>socket.destroy());proxy.on('error',()=>socket.destroy());proxy.end();
});
let closing=false;function close(){if(closing)return;closing=true;for(const socket of upgradedSockets)socket.destroy();server.close(()=>{if(process.connected)process.disconnect();});}
server.listen(port,'127.0.0.1',()=>console.log('READY '+origin+' built UI with CSP'));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,close);process.on('message',value=>{if(value?.type==='stop')close();});
