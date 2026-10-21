import type {User} from './types.js';
export type JoinInput={roomId:string};
export type SendInput=JoinInput&{text:string;clientMessageId:string};
export type Message=SendInput&{id:string;seq:string;user:User;sentAt:string};
export type HistoryInput=JoinInput&{after:string;until?:string};
export type HistoryPage={items:Message[];until:string;next:string;done:boolean};
export type ChatCode=400|401|403|409|429|503;
export type Ack<T>={ok:true;data:T}|{ok:false;code:ChatCode;message:string};
