import type {Row} from './window';export type Limit=100|500|1000;
export function parseLimit(_raw:string):Limit|null{return null;/* TODO A: 세 선택지만 허용 */}
export function keep(_rows:Row[],_limit:Limit):Row[]{return [];/* TODO B: 새 상한 적용 */}
