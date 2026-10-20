# 5단계 해설

첫 예상과 구현을 남긴 뒤 비교하세요. 독립 ‘연결 한 개로 방 이동’의 정답은 없습니다.

<details>
<summary>A — 현재 DB의 회원권과 입력</summary>

방 ID·문자열 타입·허용 키·길이는 신뢰 경계에서 확인합니다. 글자 수는 코드 포인트이며 JS length와 다를 수 있습니다. 공백만 거부하되 유효한 원문은 변형하지 않습니다. 서버가 만든 User/UUID/시각만 Message에 넣습니다.

room_admins는 공지 편집, room_members는 채팅 참여입니다. 화면의 canEdit이나 payload role을 회원권으로 취급하지 않습니다. 값은 SQL 바인딩으로 조회하며 app DB 역할에는 회원권 SELECT만 줍니다. 실제 DB의 삭제와 거부 뒤 행 불변을 확인해야 합니다.
</details>

<details>
<summary>B — 연결 인증이 끝나도 재확인이 필요한 이유</summary>

연결 성공은 그 순간의 인증입니다. 최초 request의 session 객체는 뒤따르는 HTTP 로그아웃을 자동 반영하지 않으므로 SID의 store 내용을 새로 읽습니다. 매 이벤트·각 수신자 전달 전 재확인하고 유휴 연결도 sweep합니다. store 장애는503이고 만료/폐기는401입니다.

Socket.IO room은 전달 대상 묶음이며 권한 저장소가 아닙니다. 입장 뒤 회원권이 없어지거나 로그아웃한 사용자가 room에 잠시 남아 있어도 메시지를 받지 않아야 합니다. 단순 room broadcast 대신 현재 수신자의 세션과 회원권을 검사하는 이유입니다. 이미 인가된 진행 중 전달을 취소한다고 보장하지는 않습니다.

같은 socket의 join/send는 직렬 처리하지만 다른 socket의 전달·sweep은 동시에 움직일 수 있습니다. 이전 방 재인가가 늦게 실패했을 때 현재 roomVersion을 비교해야 새 방을 잘못 지우지 않습니다. rate·pending·frame·connection 상한은 서로 다른 자원을 제한합니다.
</details>

<details>
<summary>C — handler 정리와 늦은 완료</summary>

effect에서 만든 handler와 off에 넘긴 함수가 같아야 합니다. cleanup은 그 구독을 해제하고 socket을 닫습니다. off만으로 이미 진행 중인 Promise와 수동으로 늦게 호출되는 callback을 없앨 수는 없으므로 현재 계정 epoch와 연결 객체도 확인합니다. 이전 finally가 새 계정의 전송 중 상태를 해제해서는 안 됩니다.

초안은 계정과 방의 소유 데이터입니다.401은 같은 계정 재인증을 위해 보존하고 다른 계정 전환은 실제로 지웁니다. 화면에서 잠시 숨기는 것만으로는 다시 원래 계정으로 돌아왔을 때 옛 초안이 나타날 수 있습니다. ack를 못 받으면 처리 여부를 모르므로 자동 재전송하지 않습니다. 휘발성 메시지 수신과 영구 저장·복구는 다른 계약입니다.
</details>

## 자주 혼동하는 경계

- CORS 설정만으로 WebSocket Origin 검사가 끝난 것은 아닙니다.
- async handleConnection의 종료를 Nest가 모든 메시지보다 먼저 기다린다고 가정하지 않습니다.
- 앱 사용자·DB 역할·방 관리자·방 회원을 같은 개념으로 쓰지 않습니다.
- React StrictMode의 개발 이중 실행을 끄는 대신 생성/정리 쌍을 확인합니다.
- ack 성공과 모든 수신/저장, 연결 재생성과 놓친 메시지 복구를 구분합니다.

[검증 기록](../../verification/part-05.md)과 [제출 양식](submission.md)을 사용하세요.
