import type {Broadcast,ListQuery,Page} from './types';
export class ApiError extends Error {
  constructor(public readonly status:number,message:string){super(message);this.name='ApiError';}
}
async function readJson(url:string,options:RequestInit):Promise<unknown>{
  const response=await fetch(url,{...options,cache:'no-store'});
  if(!response.ok)throw new ApiError(response.status,'HTTP '+response.status);
  try{return await response.json();}catch(error){
    if(typeof error==='object'&&error!==null&&'name' in error&&error.name==='AbortError')throw error;
    throw new ApiError(response.status,'JSON 응답을 읽을 수 없습니다.');
  }
}
function isBroadcast(value:unknown):value is Broadcast{
  if(typeof value!=='object'||value===null||Array.isArray(value))return false;
  const row=value as Record<string,unknown>;
  return typeof row.id==='string'&&row.id.length>0&&typeof row.title==='string'&&typeof row.hostName==='string'
    &&typeof row.description==='string'&&typeof row.viewerCount==='number'&&Number.isSafeInteger(row.viewerCount)
    &&row.viewerCount>=0&&typeof row.favorite==='boolean';
}
export async function fetchPage(query:ListQuery,signal:AbortSignal):Promise<Page>{
  const params=new URLSearchParams({search:query.search,sort:query.sort,limit:String(query.limit),offset:String(query.offset),favoritesOnly:String(query.favoritesOnly)});
  const body=await readJson('/api/broadcasts?'+params,{signal});
  if(typeof body!=='object'||body===null||Array.isArray(body))throw new ApiError(200,'잘못된 페이지 응답');
  const page=body as Record<string,unknown>;
  if(!Array.isArray(page.items)||!page.items.every(isBroadcast)||page.limit!==query.limit||page.offset!==query.offset
    ||page.items.length>query.limit||typeof page.hasMore!=='boolean')throw new ApiError(200,'잘못된 페이지 응답');
  return {items:page.items,limit:query.limit,offset:query.offset,hasMore:page.hasMore};
}
export async function setFavorite(id:string,enabled:boolean):Promise<{id:string;favorite:boolean}>{
  const body=await readJson('/api/favorites/'+encodeURIComponent(id),{method:enabled?'PUT':'DELETE'});
  if(typeof body!=='object'||body===null||!('id'in body)||body.id!==id||!('favorite'in body)||body.favorite!==enabled)throw new ApiError(200,'잘못된 저장 응답');
  return {id,favorite:enabled};
}
