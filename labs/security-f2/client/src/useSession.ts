import {mayApplyResponse} from './response-guard';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ApiError,getSession,login,logout,register} from './api';
import type {Credentials,SessionView} from './types';
export type SessionHandle={
 view:SessionView|null;status:'loading'|'ready'|'error';busy:boolean;error:string|null;info:string|null;epoch:number;
 reason:'initial'|'login'|'logout'|'expired'|'refresh';isCurrent:(epoch:number)=>boolean;
 signIn:(credentials:Credentials)=>Promise<boolean>;signUp:(credentials:Credentials)=>Promise<boolean>;
 signOut:()=>Promise<void>;refresh:()=>Promise<void>;expire:()=>Promise<void>;
};
function message(error:unknown):string{
 if(error instanceof ApiError){
  if(error.status===401)return '아이디와 비밀번호를 확인해 주세요.';
  if(error.status===409)return '이미 사용 중인 아이디입니다.';
  if(error.status===429)return '시도가 많아요. 잠시 뒤 다시 시도해 주세요.';
  if(error.status===403)return '요청 정보가 바뀌었어요. 계정을 다시 확인한 뒤 시도해 주세요.';
  if(error.status===400)return '아이디와 비밀번호의 형식과 길이를 확인해 주세요.';
 }
 return '계정 요청을 완료하지 못했어요. 연결을 확인하고 다시 시도해 주세요.';
}
export function useSession():SessionHandle{
 const [view,setView]=useState<SessionView|null>(null),[status,setStatus]=useState<SessionHandle['status']>('loading');
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[info,setInfo]=useState<string|null>(null);
 const [epoch,setEpoch]=useState(0),[reason,setReason]=useState<SessionHandle['reason']>('initial');
 const alive=useRef(true),busyRef=useRef(false),epochRef=useRef(0),viewRef=useRef<SessionView|null>(null);
 const bump=useCallback(()=>{setEpoch(++epochRef.current);},[]);
 const isCurrent=useCallback((value:number)=>mayApplyResponse(value,epochRef.current,alive.current),[]);
 const apply=useCallback((value:SessionView)=>{viewRef.current=value;setView(value);setStatus('ready');},[]);
 const start=useCallback(()=>{busyRef.current=true;setBusy(true);setError(null);setInfo(null);bump();},[bump]);
 const finish=useCallback(()=>{busyRef.current=false;if(alive.current){bump();setBusy(false);}},[bump]);
 useEffect(()=>{
  let active=true;alive.current=true;
  void getSession().then(value=>{if(active){apply(value);bump();}}).catch(()=>{
   if(active){setStatus('error');setError('계정 정보를 확인하지 못했어요. 다시 확인해 주세요.');}
  });
  return()=>{active=false;alive.current=false;epochRef.current++;};
 },[apply,bump]);
 const perform=useCallback(async(kind:'login'|'register',credentials:Credentials):Promise<boolean>=>{
  const current=viewRef.current;if(busyRef.current||!current)return false;
  start();
  try{
   if(kind==='register'){
    await register(credentials,current.csrfToken);
    if(!alive.current)return false;setInfo('가입을 완료했어요. 로그인해 주세요.');
   }else{
    const next=await login(credentials,current.csrfToken);
    if(!alive.current)return false;apply(next);setReason('login');setInfo('로그인했어요.');
   }
   return true;
  }catch(problem){
   if(alive.current){
    setError(message(problem));
    if(problem instanceof ApiError&&problem.status===403){viewRef.current=null;setView(null);setStatus('error');}
   }
   return false;
  }finally{finish();}
 },[apply,finish,start]);
 const load=useCallback(async(kind:'refresh'|'expired'):Promise<void>=>{
  if(busyRef.current)return;
  start();setReason(kind);
  if(kind==='expired'){viewRef.current=null;setView(null);setStatus('loading');}
  try{
   const next=await getSession();if(!alive.current)return;apply(next);
   if(kind==='expired')setInfo(next.user?'계정 상태가 바뀌었어요. 현재 계정으로 다시 확인해 주세요.':'세션이 끝났어요. 다시 로그인해 주세요.');
  }catch{
   if(alive.current){viewRef.current=null;setView(null);setStatus('error');setError('계정 정보를 확인하지 못했어요. 다시 확인해 주세요.');}
  }finally{finish();}
 },[apply,finish,start]);
 const signOut=useCallback(async():Promise<void>=>{
  const current=viewRef.current;if(busyRef.current||!current?.user)return;
  start();
  try{
   await logout(current.csrfToken);if(!alive.current)return;
   viewRef.current=null;setView(null);setStatus('loading');setReason('logout');
   const next=await getSession();if(!alive.current)return;apply(next);
   setInfo(next.user?'계정 상태가 바뀌었어요. 현재 계정을 확인해 주세요.':'로그아웃했어요.');
  }catch{
   if(alive.current){viewRef.current=null;setView(null);setStatus('error');setError('로그아웃 결과를 확인하지 못했어요. 계정을 다시 확인해 주세요.');}
  }finally{finish();}
 },[apply,finish,start]);
 const signIn=useCallback((credentials:Credentials)=>perform('login',credentials),[perform]);
 const signUp=useCallback((credentials:Credentials)=>perform('register',credentials),[perform]);
 const refresh=useCallback(()=>load('refresh'),[load]),expire=useCallback(()=>load('expired'),[load]);
 return{view,status,busy,error,info,epoch,reason,isCurrent,signIn,signUp,signOut,refresh,expire};
}
