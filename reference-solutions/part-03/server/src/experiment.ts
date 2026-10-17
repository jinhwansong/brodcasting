export type ExperimentReport={environment:{node:string;platform:string;arch:string;postgres:string;cpu:string;settings:Record<string,string>;note:string};samples:Array<{rows:number;payloadBytes:{all:number;page:number};before:{first:unknown;deep:unknown};after:{first:unknown;deep:unknown}}>};
export async function runExperiment(_raw:string|undefined,_sizes:readonly number[]=[1000,10000,100000]):Promise<ExperimentReport>{
  return {environment:{node:process.version,platform:process.platform,arch:process.arch,postgres:'',cpu:'',settings:{},note:'pending'},samples:[]};
}
