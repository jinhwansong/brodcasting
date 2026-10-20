# 6단계 — 저장·재연결·복구 (3주)

로그인한 채팅에 DB 이력과 발송 상태를 붙입니다. 목표는 ‘연결이 끊겨도 대충 다시 보인다’가 아니라, 무엇을 저장했고 어디까지 확인했는지 설명하는 것입니다. 학습 상태는 아직0단계·미시작입니다. 현재 단계 학습 지시 없이 이 교재나 참고 완성본을 자동으로 읽지 않습니다.

## 시작 전 예측

코드 작성 전에 아래 상황의 예상 결과를5~10줄로 적으세요.

1. 서버가 저장한 직후 연결이 끊겨 ack가 오지 않았습니다. 화면의 ‘실패’는 DB에 없다는 뜻일까요?
2. 같은 text를 다른 ID로 두 번 보내기와 같은 ID로 두 번 보내기는 어떻게 달라야 할까요?
3. 트랜잭션A가 seq1을 받고 멈춘 동안 B의 seq2가 먼저 보이면, cursor2부터 복구할 때 무엇이 빠질까요?
4. 이력1~50을 조회하는 중 live51이 오면 화면과 cursor를 어느 순서로 바꿀까요?
5. 계정A의 늦은 ack가 계정B의 전송 중 상태를 끝내지 않으려면 무엇을 비교해야 할까요?

## 제공한 선수 코드와 내 작업

5단계 로그인·CSRF·세션 폐기·Origin·방 회원권·방 입장/실시간 전달·공지·즐겨찾기는 제공합니다. 방의 채팅 회원권과 공지 관리자 권한은 별개입니다. 새로 가입해도 회원권은 생기지 않습니다.

| 주 | 직접 작성할 곳 | 결과 |
| --- | --- | --- |
| A | server/src/chat.repository.ts의 save/history | 방별 commit 순서·ID 중복 방지·고정 경계 SQL |
| B | server/src/chat.gateway.ts의 history | 현재 SID·입장 방·payload·회원권을 통과한 이력 ack |
| C | client/src/useChat.ts | 이력 cursor·메모리 발송 대기·제한 재시도·cleanup |

경로는 모두 labs/part-06/ 아래입니다. Message와Ack 형식, 입력 parser와 client 응답 검증, 실행 설정·UI·회원권 operator는 제공했습니다. fail-closed TODO 때문에 처음 공개 검사가 실패하는 것이 정상입니다. reference-solutions/part-06/는 비교용 정답이며 첫 구현 전에 읽거나 복사하지 않습니다. [해설](explanation.md)은 첫 시도 뒤에만 펼칩니다.

## 실행 준비

지원 Node 버전과 npm ci는 루트 README를 따릅니다. 기존5단계 DB를 덮지 말고 전용6단계 빈 DB를 준비하세요. 아래 `$...`는 shell의 실제 환경변수를 뜻하며 비밀번호를 명령 기록에 직접 쓰지 않습니다.

1. labs/part-06/.env.example을 참고해 로컬 루트 .env에 전용 값을 설정합니다. lab/test DB, 관리자/제한 역할을 구분합니다. Docker 사용 시 `docker compose --env-file .env -f labs/part-06/compose.part-06.yml up -d`를 실행할 수 있지만 제작 검증에서 이 Compose 파일 직접 기동은 확인하지 않았습니다.
2. PART06_ADMIN_URL은 brodcasting_part06_lab의 loopback 관리자 URL, PART06_APP_PASSWORD는 생성한 로컬 값, SESSION_SECRET은64자리 hex입니다. 비밀값은 커밋하지 않습니다.
3. `npm run db:part-06 -- migrate`, `npm run db:part-06 -- seed`, `npm run db:part-06 -- provision-app`을 실행합니다. PART06_DATABASE_URL은 part06_app의 lab URL입니다. 기존 역할의 비밀번호를 덮지 않도록 provision 재실행은 거부됩니다.
4. `npm run dev:part-06:api`, 다른 터미널에서 `npm run dev:part-06`을 실행합니다. http://127.0.0.1:5186에서 가입·로그인합니다. API3006·DB5546이며 localhost와127.0.0.1을 섞지 않습니다.
5. operator로 `npm run db:part-06 -- grant-member --username 내아이디 --room r1`을 실행합니다. 두 계정 송수신에는 각각 회원권이 필요합니다. 공지 수정 실험은 별도 grant-admin입니다.

공개 검사는 lab과 분리된 brodcasting_part06_test의 PART06_TEST_ADMIN_URL을 요구하며 각 실행이 임시 schema/역할을 만듭니다. 학습 DB·다른 서비스의 DB를 넣지 않습니다.

```sh
npm run typecheck:part-06
npm run build:part-06
npm run check:part-06
```

참고용 check:reference:part-06은 제작자가 완성본을 검증할 때만 사용합니다. 학습자의 설명·독립 변경을 대신하지 않습니다.

## A주 — 저장과 중복 방지

실행할 것: 같은 사용자·방·clientMessageId로 동시에4번 저장하고 행 수와 counter를 읽습니다. 같은 ID의 다른 text는409, 다른 사용자/방은 별도 범위입니다. INSERT 제약 실패 뒤 counter와 행이 함께 rollback되는지 확인합니다.

방 counter 행을 생성하고 잠근 뒤 현재 회원권·기존 발송을 확인합니다. 새 행일 때만 순서를 증가시키며 commit 후 Message를 반환합니다. 서버 id와 시각은 서버가 만들고 사용자 정보는 SID의 현재 사용자입니다. ID가 같다는 이유만으로 다른 내용까지 성공 처리하지 않습니다.

두 DB 연결로 앞 트랜잭션의 commit을 늦춰 보세요. 뒤 발송은 기다려야 하며 이력의 watermark는 미커밋 counter를 읽지 않아야 합니다. 일반 sequence의 숫자와 commit 순서는 같은 개념이 아닙니다. seq는 bigint 십진 문자열이며 Number로 변환하지 않습니다.

공개 저장 검사는 checks/part-06/storage.test.ts에 있습니다. 힌트1: unique만으로 ‘재시도 원본 반환’까지 해결되지는 않습니다. 힌트2: counter 증가와 INSERT의 트랜잭션 경계를 그려 보세요. 제한 역할로 SELECT/INSERT 외에 메시지 수정·삭제나 회원권 생성이 가능한지도 확인합니다.

## B주 — 이력 조회와 응답 유실

| 이벤트 | 요청 | 성공 data |
| --- | --- | --- |
| room:join | {roomId} | {roomId} |
| chat:send | {roomId,text,clientMessageId} | Message |
| chat:history | {roomId,after,until?} | {items,until,next,done} |

Message는 `{id,seq,clientMessageId,roomId,text,user:{id,username},sentAt}`입니다. text는 일반 Unicode1~500자, clientMessageId는 UUIDv4입니다. 미정의 키·다른 방·비정규 숫자를 거부합니다. ack는 `{ok:true,data}` 또는 `{ok:false,code,message}`입니다.400형식,401현재 인증,403회원권,409방/ID/복구 상태 충돌,429상한,503서비스 장애를 구분합니다.503은 commit 전/후 어디에서도 생길 수 있으므로 ‘저장되지 않았다’로 해석하지 않습니다.

until 생략 시 현재 커밋 counter를 고정합니다. after보다 크고 until 이하인 행을 seq 오름차순으로 최대50개 조회합니다. 다음 페이지도 같은 until을 씁니다. 더 있으면 next는 마지막 행, 끝이면 next는 until입니다. 사용자 삭제로 행에 구멍이 생겨도 counter가 줄지 않으므로 끝의 빈 페이지가 전진할 수 있습니다. 미래 cursor는409로 안내하고 조용히0으로 바꾸지 않습니다.

실험: 저장 직후 socket을 끊어 ack를 잃고 새 연결에서 같은 ID로 재전송합니다.1행과 같은 서버 Message를 확인합니다. 저장 뒤 정제503도 같은 방법으로 검증합니다. 익명/입장 전/다른 방/회원권 삭제/로그아웃 뒤 이력을 거부하는지 직접 요청하세요.

힌트: socket 연결 당시의 user만 재사용하지 않습니다. 제공된 run은 현재 SID를 확인하고 같은 socket의 이벤트를 직렬화합니다. HTTP Guard가 socket 이벤트를 자동 보호한다고 가정하지 않습니다.

## C주 — 화면의 확인 경계

live 수신과 발송 ack는 이력 조회를 시작하는 신호로 쓰세요. 이 둘의 seq만 보고 복구 cursor를 최댓값으로 올리면 늦게 도착할 낮은 seq를 건너뛸 수 있습니다. 단일 이력 pump에서 검증한 페이지의 next만 적용합니다. 복구 중 live가 오면 dirty를 표시하고 고정 snapshot을 끝낸 뒤 새 경계를 조회합니다.

한 pump는 최대10페이지·500행, 페이지 사이200ms, 화면은 최근100개입니다. 상한 뒤 마지막 확인 cursor를 보존하고 수동 ‘채팅 다시 접속’으로 계속 복구합니다. 무제한 수신 배열이나 재귀 조회를 만들지 않습니다. 서버 이벤트가 아예 유실되어 새 신호도 없다면 재접속/수동 조회 전까지 즉시 감지하는 보장은 없습니다.

발송은 방마다 미확인1개이며 허용 방2개를 합해 최대2개입니다. 최초 ID/text/방/계정을 메모리에 묶고, ack timeout3초·503 뒤 같은 ID로500/1000/2000ms의 최대3회 추가 시도를 합니다.401/403/400/409/429는 자동 재시도하지 않습니다. 연결이 끊기면 미확인 건을 보존하고 재연결만으로 재발송하지 않습니다. 수동 확인도 같은 ID를 씁니다. 대기 취소는 DB 삭제가 아니며, 취소 후 새 ID로 같은 text를 보내면 별개 행이 생길 수 있습니다.

연결도 최대3회 재연결 뒤 멈춥니다. 성공적으로 복구한 뒤 새 단절은 별도 장애 구간입니다. Socket.IO 자체 reconnection/retries를 함께 켜 이중 재시도를 만들지 않습니다. effect의 timer·동일 handler·socket을 정리하고 이전 epoch/방의 ack·이력·finally가 새 화면에 적용되지 않게 하세요. 같은 계정 재인증은 미확인 ID와 초안을 유지하고 다른 계정/명시 logout은 지웁니다. 새로고침하면 메모리 outbox와 cursor가 사라집니다.

## 설명3개와 독립 변경

1. 저장 트랜잭션, ack, 수신자 전달이 각각 보장하는 범위를 코드 위치와 실패 기록으로 설명하세요.
2. DB unique 범위와 방별 commit 순서가 왜 별개이며, UUID·timestamp·seq 중 어떤 값을 복구에 쓰는지 설명하세요.
3. 고정 until 조회 중 live가 겹칠 때 cursor가 전진하는 정확한 시점과500행 상한 뒤 남는 상태를 설명하세요.

독립 변경: 해설과 참고 완성본을 가리고 **이력에 현재 계정·방·clientMessageId·text가 일치하는 미확인 발송이 나오면 저장 확인으로 처리**하세요. 다른 사용자의 ID나 늦은 이전 방 이력으로 확인하지 말고, 늦은 ack/finally도 새 전송을 건드리지 않게 하세요. DB 중복 방지와 UI 중복 표시를 각각 검사합니다. 현재 완성본은 이 자동 확인의 답을 제공하지 않습니다.

[제출 양식](submission.md)에 예상/실제·AI 도움·실행 증거·설명·독립 변경을 기록합니다. 실제 브라우저2개·네트워크 끊기·키보드/좁은 화면은 [후속 양식](browser-checklist.md)에 미실행으로 남겨 두었습니다. 테스트 통과만으로 학습 통과를 기록하지 않습니다.

공식 자료: [Socket.IO 전달 보장](https://socket.io/docs/v4/delivery-guarantees), [ack·중복 방지 예제](https://socket.io/docs/v4/tutorial/step-8), [PostgreSQL 행 잠금](https://www.postgresql.org/docs/18/explicit-locking.html), [sequence와 rollback](https://www.postgresql.org/docs/18/functions-sequence.html). 문서의 예제를 그대로 복사하기 전에 이 교재의 DB·인증·상한과 다른 점을 적으세요.
