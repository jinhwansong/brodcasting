import {getApprovedNoticeLink} from './notice-link';
export function Notice({title,text,url}:{title:string;text:string;url:unknown}){const href=getApprovedNoticeLink(url);return <article><h2>{title}</h2><p>{text}</p>{href?<a href={href} target="_blank" rel="noopener noreferrer">안내 문서 열기</a>:<p role="status">이 주소는 허용되지 않아 링크를 만들지 않았어요.</p>}</article>;}
