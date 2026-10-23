export function getApprovedNoticeLink(value:unknown):string|null{
 if(typeof value!=='string')return null;const text=value.trim();if(!text.length||text.length>2048)return null;
 try{const url=new URL(text);return url.protocol==='https:'&&url.origin==='https://docs.example.test'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
