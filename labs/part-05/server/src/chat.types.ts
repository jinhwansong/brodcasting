import type {User} from './types.js';
export type JoinInput={roomId:string};
export type SendInput=JoinInput&{text:string};
export type Message=SendInput&{id:string;user:User;sentAt:string};
export type ChatCode=400|401|403|409|429|503;
export type Ack<T>={ok:true;data:T}|{ok:false;code:ChatCode;message:string};
