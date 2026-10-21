import type{ChatMessage,HistoryPage}from'./chat-types';
export const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?![\s\S])/i;
const sequence=(value:unknown):value is string=>typeof value==='string'&&/^(?:0|[1-9][0-9]{0,18})(?![\s\S])/.test(value)&&BigInt(value)<=9223372036854775807n;
export function message(value:unknown,roomId:string):value is ChatMessage{
 return record(value)&&Object.keys(value).length===7&&value.roomId===roomId&&typeof value.id==='string'&&uuid.test(value.id)
  &&sequence(value.seq)&&BigInt(value.seq)>0n&&typeof value.clientMessageId==='string'&&uuid.test(value.clientMessageId)
  &&typeof value.text==='string'&&!!value.text.trim()&&Array.from(value.text).length<=500
  &&typeof value.sentAt==='string'&&Number.isFinite(Date.parse(value.sentAt))&&new Date(value.sentAt).toISOString()===value.sentAt
  &&record(value.user)&&Object.keys(value.user).length===2&&typeof value.user.id==='string'&&uuid.test(value.user.id)
  &&typeof value.user.username==='string'&&/^[a-z][a-z0-9_]{2,23}(?![\s\S])/.test(value.user.username);
}
export function page(value:unknown,roomId:string,after:string,until?:string):HistoryPage|null{
 if(!record(value)||Object.keys(value).length!==4||!Array.isArray(value.items)||value.items.length>50||!sequence(value.until)||!sequence(value.next)||typeof value.done!=='boolean'||(until!==undefined&&value.until!==until)||BigInt(value.until)<BigInt(after))return null;
 let previous=BigInt(after);const ids=new Set<string>();
 for(const row of value.items){if(!message(row,roomId)||BigInt(row.seq)<=previous||BigInt(row.seq)>BigInt(value.until)||ids.has(row.id))return null;previous=BigInt(row.seq);ids.add(row.id);}
 if(value.done?value.next!==value.until:value.items.length!==50||BigInt(value.next)!==previous||BigInt(value.next)>=BigInt(value.until))return null;
 return value as HistoryPage;
}
