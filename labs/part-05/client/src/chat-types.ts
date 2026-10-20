import type {User} from './types';
export type ChatMessage={id:string;roomId:string;text:string;user:User;sentAt:string};
export type ChatStatus='idle'|'connecting'|'ready'|'disconnected'|'error';
export type ChatHandle={status:ChatStatus;messages:ChatMessage[];error:string|null;sending:boolean;send:(text:string)=>Promise<boolean>;reconnect:()=>void};
