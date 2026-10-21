import type {Row} from './window';export type Limit=100|500|1000;
export function parseLimit(raw:string):Limit|null{return raw==='100'?100:raw==='500'?500:raw==='1000'?1000:null;}
export function keep(rows:Row[],limit:Limit):Row[]{return rows.slice(-limit);}
