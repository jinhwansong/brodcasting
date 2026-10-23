import {AuthPanel} from './AuthPanel';
import {Inbox} from './Inbox';
import {useSession} from './useSession';
export default function App(){const auth=useSession();return <main><header><p>알림·프로세스·큐5주</p><h1>내 알림은 어디에 남을까?</h1><p>실제 외부 메일 대신 내 실습 계정의 알림함을 사용합니다.</p></header><AuthPanel auth={auth}/><Inbox auth={auth}/></main>;}
