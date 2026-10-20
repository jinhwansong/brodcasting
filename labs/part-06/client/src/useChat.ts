import type{SessionHandle}from'./useSession';
import type{ChatHandle}from'./chat-types';
export function useChat(auth:SessionHandle,_roomId:string):ChatHandle{
 // TODO C: 연결·이력 cursor·제한 재시도·현재 계정/방의 cleanup을 구현한다.
 return{status:auth.view?.user?'disconnected':'idle',messages:[],error:null,sending:false,delivery:'idle',pendingText:null,send:async()=>false,retryPending:async()=>false,cancelPending:()=>{},reconnect:()=>{}};
}
