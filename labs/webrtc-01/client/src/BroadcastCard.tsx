import type {Broadcast} from './types';
import {channelInfo} from './broadcast-meta';
import {Icon} from './Icon';
import {Badge,IconButton} from './ui/components';
export function Poster({row,large=false}:{row:Broadcast;large?:boolean}){return <div className={'poster'+(large?' poster-large':'')}><span className={"poster-art poster-art-"+row.id} aria-hidden="true"/><Badge className="sample-badge">샘플 방송</Badge><span className="viewer-badge">샘플 {row.viewerCount.toLocaleString('ko-KR')}명</span><div className="poster-caption"><span>{channelInfo(row.id).topic}</span><strong>{row.title}</strong></div><span className="poster-play"><Icon name="play"/></span></div>;}
export function BroadcastCard({row,onWatch,onFollow,followDisabled=false}:{row:Broadcast;onWatch:()=>void;onFollow:()=>void;followDisabled?:boolean}){
 return <li className="stream-card"><button className="thumbnail-button" aria-label={row.title+' 시청하기'} onClick={onWatch}><Poster row={row}/></button><div className="stream-details"><img className="avatar channel-avatar" src={'/avatars/'+row.id+'.svg'} alt={row.hostName+' 프로필'}/><div><button className="stream-title" onClick={onWatch}>{row.title}</button><p>{row.hostName}</p><span className="topic-label">{channelInfo(row.id).tag} <i>#{channelInfo(row.id).topic}</i></span></div><IconButton className={'follow-icon'+(row.favorite?' followed':'')} label={row.title+(row.favorite?' 팔로우 해제':' 팔로우')} aria-pressed={row.favorite} disabled={followDisabled} onClick={onFollow}><Icon name="heart"/></IconButton></div></li>;
}
