import type {SessionHandle} from './useSession';
import type {ChatHandle} from './chat-types';
export function useChat(_auth:SessionHandle,_roomId:string):ChatHandle{
 // C: 계정/방의 연결·동일 handler 구독/해제·늦은 event/ack 경계를 구현하세요.
 return{status:'idle',messages:[],error:null,sending:false,send:async()=>false,reconnect:()=>{}};
}
