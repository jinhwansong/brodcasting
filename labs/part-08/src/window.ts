export type Row={id:number;text:string};
export const LIMIT=1000,HEIGHT=48,VIEW=384;
export function retain(rows:Row[],batch:Row[]):Row[]{return [...rows,...batch].slice(-LIMIT);}
export function range(count:number,top:number){
 const first=Math.floor(Math.max(0,Math.min(top,Math.max(0,count*HEIGHT-VIEW)))/HEIGHT);
 return {start:Math.max(0,first-3),end:Math.min(count,first+VIEW/HEIGHT+3)};
}
