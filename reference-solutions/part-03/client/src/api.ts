import type {ListQuery,Page} from './types';
export async function fetchPage(_query:ListQuery,_signal:AbortSignal):Promise<Page>{throw new Error('제작 중: HTTP 연결');}
export async function setFavorite(_id:string,_enabled:boolean):Promise<{id:string;favorite:boolean}>{throw new Error('제작 중: 저장 연결');}
