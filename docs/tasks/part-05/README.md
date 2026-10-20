# 5단계 — WebSocket 채팅

3주, 주당 6~8시간. 인증한 사용자가 허용된 방에 입장해 메시지를 주고받습니다. Gateway의 연결·이벤트와 Service의 입력·회원권 규칙, React 구독 수명을 구분합니다. 4단계 로그인·SQL·화면은 선수 코드로 제공하므로 다시 구현하지 않습니다. 현재 학습 기록은 계속 **0단계·미시작**입니다.

## 먼저 예상하기

[제출 양식](submission.md)에 참고 완성본을 열기 전 예상과 이유를 적으세요.

1. HTTP 로그인에 성공한 것만으로 소켓 연결·방 입장·발송 권한까지 해결될까요? 연결 뒤 로그아웃한 사용자가 다른 사람의 새 메시지를 받지 않으려면 어디에서 재확인할까요?
2. R1 입장과 R2 입장이 연속 도착한 뒤 R1 발송이 오면 무엇을 거부해야 할까요? R1의 늦은 권한 거부가 새 R2 상태를 지울 수도 있을까요?
3. effect가 두 번 실행되거나 방을 바꾸면 기존 socket·handler·늦은 ack가 어떻게 정리돼야 할까요?
4. 전송 후 ack를 받지 못하면 서버가 처리하지 않았다고 단정할 수 있을까요? 자동 재전송은 어떤 중복을 만들까요?

## 3주 과제와 수정 위치

| 주 | 직접 채울 파일 | 남길 증거 |
| --- | --- | --- |
| A · 1주 | `labs/part-05/server/src/chat.service.ts`의 parseJoin/parseSend/authorize | 형식·허용 키·Unicode 길이·공백 입력, 실제 DB 회원권·행 불변 |
| B · 2주 | `server/src/chat.gateway.ts`의 join/send | 주체→방 이동→발송→각 수신자 재인가, 방 분리·로그아웃/만료·경합 |
| C · 3주 | `client/src/useChat.ts` | 연결·동일 handler 해제·unmount·계정/방 변경·늦은 event/ack/finally |

제공하는 코드:4단계 전체 인증·SQL·공지·목록, express-session/Socket.IO 연결, Origin gate, 현재 SID 재조회, 이벤트 직렬 실행·상한, 유휴 sweep, Message의 서버 ID/사용자/시각, ChatPanel과 타입·스타일입니다. A/B는 거부하고 C는 연결하지 않는 골격입니다. 무조건 허용하거나 검사 파일을 제거해 통과시키지 않습니다.

## 설치와 전용 DB

Node engines와 root lock을 따릅니다. 제작 환경은 Windows Node24.15.0·PostgreSQL18.6이며 Linux CI는 별도로 기록합니다. 5단계는 `brodcasting_part05_lab/test`, API 제한 역할 `part05_app`을 사용합니다. 4단계 DB·쿠키·포트와 섞지 않습니다.

루트에서 `npm ci` 후 `labs/part-05/.env.example` 내용을 루트 `.env`에 반영합니다. 기존 파일이 있으면 덮지 않고 해당 항목만 맞춥니다. operator/app 비밀번호는 본인 로컬 값으로 정하고 URL 특수문자는 인코딩합니다. SESSION_SECRET은 다음 명령의 64자리 hex 결과를 로컬 `.env`에만 둡니다. 재시작 때 같은 값을 유지하세요.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
docker compose --env-file .env -p brodcasting-part05-learner -f labs/part-05/compose.part-05.yml up -d --wait
npm run db:part-05 -- migrate
npm run db:part-05 -- seed
npm run db:part-05 -- provision-app
npm run db:part-05 -- test-db
```

DB는 loopback5545입니다. migration 재실행은0개, seed는 기존 데이터를 보존하고 `provision-app`은 처음 한 번만 실행합니다. 기존 역할을 덮지 않습니다. API 재시작에 볼륨 삭제는 필요 없습니다. 비밀번호·secret·쿠키·CSRF·해시를 제출하거나 VITE_ 변수로 옮기지 않습니다.

두 터미널에서 실행하세요.

```sh
npm run dev:part-05:api
```

```sh
npm run dev:part-05
```

API `127.0.0.1:3005`, 화면 `http://127.0.0.1:5185`입니다. Vite가 `/api`와 `/socket.io`를 프록시합니다. localhost를 혼용하지 말고 PART05_BROWSER_ORIGIN을 화면 origin과 일치시킵니다. API 소스 수정은 재시작하세요. production 기동은 거부합니다.

UI에서 직접 계정을 가입·로그인한 뒤 operator 터미널에서 해당 사용자에게 회원권을 부여합니다.

```sh
npm run db:part-05 -- grant-member --username my_learner --room r1
```

공지 편집 권한이 필요할 때만 별도 `grant-admin --username my_learner --room r1`을 사용합니다. **방 관리자와 채팅 회원권은 별개**입니다. 신규 가입에 채팅 권한을 자동 부여하지 않으며 body의 role/userId로 권한을 얻지 못합니다. 회원권을 부여한 뒤 ‘채팅 다시 접속’을 누르세요. 고정 관리자·평문 비밀번호 seed는 없습니다.

## A — 입력과 회원권

join은 `{roomId}`만, send는 `{roomId,text}`만 받습니다. roomId는 r1/r2, text는 원문 Unicode 코드 포인트1~500자이며 공백뿐이면 거부합니다. 유효한 원문의 앞뒤 공백은 보존합니다. 배열·null·틀린 타입·알 수 없는 키는400입니다. 클라이언트의 userId·username·role·시각을 받지 않습니다.

회원권은 `room_members`의 현재 user_id/room_id를 바인딩해서 조회합니다. 제한 DB 역할은 SELECT만 할 수 있고 회원권 추가/삭제는 operator 작업입니다. 첫 힌트는 ‘주체·자원·행위’를 나누기, 두 번째는 회원권이 삭제된 뒤 같은 요청을 다시 보내기입니다. 공지 canEdit을 채팅 회원권으로 대신하지 않습니다.

## B — Gateway와 세션 수명

[Nest Gateway](https://docs.nestjs.com/websockets/gateways), [Socket.IO session 연결](https://socket.io/how-to/use-with-express-session), [middleware](https://socket.io/docs/v4/middlewares/), [Origin/allowRequest](https://socket.io/docs/v4/handling-cors/)를 읽고 제공 wiring을 추적하세요. async handleConnection만으로 인증이 끝나기 전 이벤트를 막을 수는 없습니다. namespace middleware에서 주체를 확인한 뒤 연결을 허용합니다.

socket.request는 최초 request이므로 그 안의 SessionData를 계속 믿지 않습니다. 공식 middleware가 검증한 SID로 store를 새로 읽어 절대 수명·사용자 존재를 확인합니다. 매 이벤트와 **각 수신자에게 전달하기 전** 세션·회원권을 확인합니다. 로그아웃 뒤 송신자만 막고 기존 room 전체로 broadcast하면 폐기된 수신자에게 메시지가 갈 수 있습니다.

힌트 순서: 제공 `run`의 현재 사용자와 직렬 실행을 추적하고, 이전 방을 떠난 뒤 새 회원권을 확인하세요. 입력 방과 현재 입장 방이 다르면409입니다. 수신자 재인가가 늦게 실패할 때에는 현재 방 revision을 확인해 새 방 상태를 지우지 않습니다. 유휴 연결은1초 주기의 sweep으로 확인합니다. 이미 인가가 끝난 진행 중 전달까지 취소한다고 보장하지 않습니다.

| 이벤트 | 입력·결과 |
| --- | --- |
| room:join | `{roomId}` → ack `{ok:true,data:{roomId}}` |
| chat:send | `{roomId,text}` → ack `{ok:true,data:Message}` |
| chat:message | 서버가 준 `{id,roomId,user:{id,username},text,sentAt}` |
| chat:error | `{code,message}`, 현재 세션/권한/장애 안내 |

실패 ack는 `{ok:false,code,message}`입니다.400형식,401세션,403회원권,409현재 방,429상한,503DB입니다. Origin이 다르거나 없으면 upgrade를 거부하므로 transport 오류로 보일 수 있습니다. DB/store 장애를 정상 익명이나 성공으로 감추지 않습니다.

로컬 보호 상한은 연결20개, 이벤트10회/1초/socket, 동시 대기4개/socket, 프레임8192bytes입니다. 단일 프로세스 실습이며 운영용 분산 제한이나 부하 측정의 완료가 아닙니다.

## C — 화면과 구독

[Socket.IO React 사용법](https://socket.io/how-to/use-with-react)을 읽고 effect의 생성·구독·해제·disconnect를 쌍으로 적으세요. 같은 handler를 off에 넘겨야 하며 다른 컴포넌트의 구독을 전부 지우면 안 됩니다. StrictMode·방 이동·계정 epoch 변경·unmount에서도 이전 event/ack/finally를 무시합니다.

기본 reference는 방 변경 때 이전 연결을 정리하고 새 연결로 입장합니다. 자동 재연결·자동 재전송·오프라인 발송 버퍼는 사용하지 않습니다. ack timeout은3초이며 결과가 불명이면 초안을 보존하고 직접 확인하도록 안내합니다. 같은 계정의 만료 재로그인은 초안을 보존하고 다른 계정이나 명시적 로그아웃은 이전 초안을 지웁니다. 다른 계정을 거쳐 돌아와도 옛 초안이 되살아나면 안 됩니다.

수신 형식과 현재 방을 확인하고 일반 텍스트로 표시합니다. 서버 수신과 ack는 다르며 ack 성공은 휘발성 처리 수락입니다. 모든 수신자 도착·저장 성공을 뜻하지 않습니다. UI는 최근100개만 보관합니다. 연결이 끊겼을 때 놓친 메시지는 복구하지 않습니다.

## 공개 검증

```sh
npm run typecheck:part-05
npm run build:part-05
npm run check:part-05
```

client만은 `node checks/part-05/run.mjs exercise client`, server/실제 DB/socket은 `npm run check:part-05:db`, unit만은 `node checks/part-05/run.mjs exercise unit`입니다. 타입·빌드는 성공하고 A/B/C 행동 검사는 의도적으로 실패합니다.4단계 선수 API·화면은 통과해야 합니다. 모듈·연결·수집·시간 초과 오류를 학습 TODO 실패로 분류하지 않습니다.

제작 결과는 [검증 기록](../../verification/part-05.md)에서 정상/거부·실제 DB/socket·jsdom·독립 설치를 구분합니다. 실제 두 브라우저 송수신·Cookie·Origin 전송은 [후속 양식](browser-checklist.md)에 미실행으로 남깁니다.

## 설명3개와 독립 변경

1. HTTP 로그인부터 cookie→Engine middleware→namespace 인증→입장→발송→각 수신자→종료 흐름을 코드 위치로 설명하세요.
2. Service의 입력/회원권, Gateway의 연결/현재 방, UI 버튼이 각각 무엇을 확인하는지 직접 거부 요청과 함께 설명하세요.
3. cleanup·계정 epoch·방 revision·ack timeout이 서로 어떤 문제를 해결하고 무엇을 보장하지 못하는지 설명하세요.

독립 변경: **연결 한 개를 재사용하면서 방을 이동**하도록 바꾸세요. R1→R2→R1의 빠른 이동, 거부된 입장, 지연 ack, 이전 방 메시지, unmount를 직접 검증하고 현재 방 표시의 기준을 명세합니다. 정답 구현은 제공하지 않습니다. 설명·직접 변경·실행 증거를 [빈 제출](submission.md)에 남겨야 학습 통과입니다.

다음6단계에서 메시지 DB 저장·서버 정렬·client 발송 ID·확인 응답 유실·중복 제거·복구 경계를 다룹니다. 이 단계의 UUID와 ack만으로 그 보장을 얻었다고 주장하지 않습니다. HTTPS·운영 배포·다중 서버·BunkerWeb은 후속입니다.
