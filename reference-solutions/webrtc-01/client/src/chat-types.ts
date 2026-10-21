import type {User} from './types';
export type ChatMessage={id:string;seq:string;clientMessageId:string;roomId:string;text:string;user:User;sentAt:string};
export type HistoryPage={items:ChatMessage[];until:string;next:string;done:boolean};
export type ChatStatus='idle'|'connecting'|'recovering'|'ready'|'disconnected'|'error';
export type Delivery='idle'|'sending'|'retrying'|'unknown'|'confirmed';
export type ChatHandle={status:ChatStatus;messages:ChatMessage[];error:string|null;sending:boolean;delivery:Delivery;pendingText:string|null;send:(text:string)=>Promise<boolean>;reconnect:()=>void;retryPending:()=>Promise<boolean>;cancelPending:()=>void};
