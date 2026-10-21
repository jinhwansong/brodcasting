// Owned by the local harness. Credentials arrive only through the child environment.
import {Pool} from 'pg';import {pathToFileURL} from 'node:url';
let app,pool,closing=false;
async function close(){if(closing)return;closing=true;clearTimeout(deadline);try{await app?.close();}finally{await pool?.end();process.disconnect?.();}}
const deadline=setTimeout(()=>void close(),180000);
try{
 const {createApp}=await import(pathToFileURL(process.env.PART09_RUNTIME_DIR+'/create-app.js').href);
 pool=new Pool({connectionString:process.env.PART09_RUNTIME_URL,options:'-c search_path='+process.env.PART09_RUNTIME_SCHEMA,max:10,connectionTimeoutMillis:1000,statement_timeout:3000});pool.on('error',()=>{});
 app=await createApp(pool,{secret:process.env.PART09_RUNTIME_SECRET,schemaName:process.env.PART09_RUNTIME_SCHEMA,browserOrigin:'http://127.0.0.1:5189',authRateLimit:{windowMs:60000,limit:100},deliveryConcurrency:Number(process.env.PART09_WIDTH)});
 const {ChatGateway}=await import(pathToFileURL(process.env.PART09_RUNTIME_DIR+'/chat.gateway.js').href);
 await app.listen(0,'127.0.0.1');process.send({type:'ready',base:await app.getUrl()});
 process.on('message',message=>{
  if(message.type==='sample')process.send?.({type:'sample',id:message.id,cpu:process.cpuUsage(),rss:process.memoryUsage().rss,connections:app.get(ChatGateway).activeConnections(),tcpConnections:app.getHttpServer()._connections??null});
  if(message.type==='close')void close();
 });
 process.on('disconnect',()=>void close());
}catch{process.send?.({type:'failed'});await close();process.exitCode=1;}
