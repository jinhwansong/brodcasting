export type Row={id:number;text:string};
export const LIMIT=1000,HEIGHT=48,VIEW=384;
export function retain(_rows:Row[],_batch:Row[]):Row[]{return [];/* TODO A: 보관 상한 */}
export function range(_count:number,_top:number){return {start:0,end:0};/* TODO B: 표시 범위 */}
