import {AuthPanel} from './AuthPanel';
import {Inbox} from './Inbox';
import {useSession} from './useSession';
export default function App(){const auth=useSession();return <main><header><p>프론트 보안 F2</p><h1>계정이 바뀌면 응답도 구분해요</h1><p>버튼 표시와 서버 권한 검사는 별개입니다. 로그인·로그아웃과 다른 계정의 알림 분리를 확인하세요.</p></header><AuthPanel auth={auth}/><Inbox auth={auth}/></main>;}
