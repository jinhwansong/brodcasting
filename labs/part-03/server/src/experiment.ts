import {Pool} from 'pg';
import {cpus} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {requireLocalDatabase} from './db-config.js';
export type ExperimentReport={environment:{node:string;platform:string;arch:string;postgres:string;cpu:string;settings:Record<string,string>;note:string};samples:Array<{rows:number;preparationMs:number;indexBuildMs:number;tableBytes:number;indexBytes:number;payloadBytes:{all:number;page:number};before:{first:unknown;deep:unknown};after:{first:unknown;deep:unknown}}>};
export async function runExperiment(raw:string|undefined,sizes:readonly number[]=[1000,10000,100000]):Promise<ExperimentReport>{
  const url=requireLocalDatabase(raw,'brodcasting_part03_lab');
  if(!Array.isArray(sizes)||sizes.length===0||sizes.length>3||new Set(sizes).size!==sizes.length||sizes.some(size=>![1000,10000,100000].includes(size)))throw new Error('Invalid experiment sizes');
  const pool=new Pool({connectionString:url.href,max:1,connectionTimeoutMillis:1000,statement_timeout:10000});
  try{
    const client=await pool.connect();
    try{
    const postgres=(await client.query("SELECT current_setting('server_version') AS version")).rows[0].version as string;
    const settings=Object.fromEntries((await client.query("SELECT name,setting,unit FROM pg_settings WHERE name IN ('work_mem','shared_buffers','max_connections')")).rows.map(row=>[row.name,[row.setting,row.unit].filter(Boolean).join(' ')]));
    const report:ExperimentReport={environment:{node:process.version,platform:process.platform,arch:process.arch,postgres,cpu:cpus()[0]?.model??'unknown',settings,note:'Single ordered run on a session TEMP table. Before first/deep, then index creation+ANALYZE, then after first/deep. Cache/order/measurement overhead are not controlled. Payload bytes are raw JSON of id/title/viewer_count only; no HTTP headers/compression/rendering.'},samples:[]};
    await client.query('CREATE TEMP TABLE part03_bench(id integer PRIMARY KEY,title text NOT NULL,viewer_count integer NOT NULL)');
    const projection='SELECT id,title,viewer_count FROM pg_temp.part03_bench ORDER BY viewer_count DESC,id ASC';
    const explain=async(offset:number)=>(await client.query('EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON) '+projection+' LIMIT $1 OFFSET $2',[25,offset])).rows[0]['QUERY PLAN'];
    const elapsed=(start:bigint)=>Number(process.hrtime.bigint()-start)/1e6;
    for(const rows of sizes){
      await client.query('DROP INDEX IF EXISTS pg_temp.part03_bench_viewers_idx');
      const prepared=process.hrtime.bigint();
      await client.query('TRUNCATE pg_temp.part03_bench');
      await client.query("INSERT INTO pg_temp.part03_bench SELECT id,'방송 '||id::text,id%200 FROM generate_series(1,$1::integer) AS series(id)",[rows]);
      await client.query('ANALYZE pg_temp.part03_bench');
      const preparationMs=elapsed(prepared);
      const before={first:await explain(0),deep:await explain(rows-25)};
      const indexed=process.hrtime.bigint();
      await client.query('CREATE INDEX part03_bench_viewers_idx ON pg_temp.part03_bench(viewer_count DESC,id ASC)');
      await client.query('ANALYZE pg_temp.part03_bench');
      const indexBuildMs=elapsed(indexed);
      const after={first:await explain(0),deep:await explain(rows-25)};
      const all=(await client.query(projection)).rows;
      const page=(await client.query(projection+' LIMIT $1',[25])).rows;
      const storage=(await client.query("SELECT pg_relation_size('pg_temp.part03_bench'::regclass) AS table_bytes,pg_relation_size('pg_temp.part03_bench_viewers_idx'::regclass) AS index_bytes")).rows[0];
      report.samples.push({rows,preparationMs,indexBuildMs,tableBytes:Number(storage.table_bytes),indexBytes:Number(storage.index_bytes),payloadBytes:{all:Buffer.byteLength(JSON.stringify(all)),page:Buffer.byteLength(JSON.stringify(page))},before,after});
    }
    return report;
    }finally{client.release();}
  }finally{await pool.end();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const args=process.argv.slice(2);
    if(args.length!==0&&(args.length!==2||args[0]!=='--output'))throw new Error('Usage: experiment [--output file.json]');
    const text=JSON.stringify(await runExperiment(process.env.PART03_ADMIN_URL),null,2)+'\n';
    if(args[1]){await mkdir(path.dirname(args[1]),{recursive:true});await writeFile(args[1],text);console.log('Experiment report written');}
    else process.stdout.write(text);
  }catch{console.error('Local experiment failed. Check the dedicated lab database and output path.');process.exitCode=1;}
}
