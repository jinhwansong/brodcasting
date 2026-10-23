import {useEffect,useState} from 'react';
import type {SessionHandle} from './useSession';
import {Button,TextField,InlineNotice} from './ui/components';
export function AuthPanel({auth}:{auth:SessionHandle}){
 const [mode,setMode]=useState<'login'|'register'>('login'),[username,setUsername]=useState(''),[password,setPassword]=useState('');
 const user=auth.view?.user,disabled=auth.busy||auth.status!=='ready';
 useEffect(()=>{if(auth.reason==='logout'){setUsername('');setPassword('');setMode('login');}},[auth.epoch,auth.reason]);
 async function submit(){
  if(disabled)return;
  try{
   const succeeded=await(mode==='login'?auth.signIn({username,password}):auth.signUp({username,password}));
   if(succeeded&&mode==='register')setMode('login');
  }finally{setPassword('');}
 }
 return <section className="account-panel" aria-labelledby="account-heading">
  <h2 id="account-heading">내 계정</h2>
  {(auth.status==='loading'||auth.busy)&&<p role="status">계정 정보를 확인하는 중입니다.</p>}
  {user?<div className="account-current"><p>현재 계정 <strong>{user.username}</strong></p><Button disabled={disabled} onClick={()=>void auth.signOut()}>로그아웃</Button></div>:
   <form onSubmit={event=>{event.preventDefault();void submit();}}>
    <fieldset disabled={disabled} className="auth-fields">
     <TextField label="아이디" id="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={24} pattern="[a-z][a-z0-9_]{2,23}" value={username} onChange={event=>setUsername(event.target.value)}/>
     <TextField label="비밀번호" id="password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} required minLength={15} maxLength={256} value={password} onChange={event=>setPassword(event.target.value)}/>
     <p className="form-hint">아이디는 소문자로 시작하는 영문·숫자·밑줄 3~24자, 비밀번호는 15~128자입니다.</p>
     <div className="form-actions"><Button type="submit" variant="primary" busy={auth.busy}>{mode==='login'?'로그인':'가입하기'}</Button><Button onClick={()=>setMode(value=>value==='login'?'register':'login')}>{mode==='login'?'회원가입으로 전환':'로그인으로 전환'}</Button></div>
    </fieldset>
   </form>}
  {auth.error&&<InlineNotice tone="error">{auth.error}</InlineNotice>}
  {auth.info&&<InlineNotice>{auth.info}</InlineNotice>}
  <Button variant="ghost" size="small" disabled={auth.busy} onClick={()=>void auth.refresh()}>계정 다시 확인</Button>
 </section>;
}
