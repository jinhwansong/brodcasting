# 5단계 WebSocket 채팅 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. 사용자 순차 실행·중간 승인 없는 제작/커밋/푸시 위임을 따른다. 계획 본문은 실행 중 상태 저장소로 바꾸지 않는다.

**Goal:** 실제 세션·방 회원권·이벤트·구독 정리를 검증하는3주 교재 완성.

**Architecture:** 독립 part-05에4단계 선수 코드를 복사하고 Gateway/Service/hook만 과제로 분리. 단일 Socket.IO 서버·PostgreSQL 세션/회원권, 메시지는 휘발성.

**Tech Stack:** 기존 React/Nest/TS/Vite/Vitest/pg, @nestjs/websockets/platform-socket.io12.1.3, socket.io/client4.8.4.

**Spec:** [설계](../specs/2026-10-20-part-05-design.md), CURRICULUM.md5단계·SECURITY_CURRICULUM.md 실시간 보안.

## Global Constraints

- 기존0~4단계 소스/기본8명령/학습0·미시작/기존 의존성 버전 유지. 새 의존성만 exact+lock.
- 전용 DB/역할 part05, API3005/client5185/DB5545, loopback·production거부. 실제 브라우저 보류.
- 입력·ack·상한·세션 폐기·수신자 회원권 계약은 spec그대로. 쿠키/토큰/해시/비밀번호를 증거에 저장하지 않음.
- 메시지 저장·재연결복구·자동재전송·Redis·공개배포·독립 변경 정답을 추가하지 않음.

## Review Focus

- 인증 middleware가 끝나기 전 이벤트와 폐기 후 수신자가 메시지를 받지 않는가: socket.test.ts실제 클라이언트로 고정.
- 입장/발송/방이동이 겹쳐 이전 방 구독이 남는가: 지연 검사와 직렬 queue·대기 상한 검증.
- 이전 계정/방 event·ack·finally가 새 화면을 바꾸는가: ui.test.tsx지연 fake로 고정.
- 세션store/회원권 장애가 정상익명·전송성공으로 감춰지는가: 실제DB503·불변·정제응답 검사.
- 독립 설치/종료가 현재개발서버나기존DB를 건드리는가: 빈 소유DB/역할·포트·실제프로세스와artifact검증.

### Task 1: 독립 선수 코드·회원권·Service 계약

**Files:** labs/part-05와reference-solutions/part-05의server/client/package/lock/Compose/.env.example, server/src/chat.service.ts·session.ts·db-config.ts·db-cli.ts·migrations, checks/part-05/{fixture.ts,unit.test.ts,db.test.ts,run.mjs,unit.config.ts,server.config.ts}, rootpackage/lock·enginepolicy.

**Interfaces:** ChatService(pool).parseJoin(unknown):{roomId};parseSend(unknown):{roomId,text};authorize(User,roomId):Promise<void>;message(User,{roomId,text}):Message. SessionRuntime.socketUser(SessionRequest):Promise<User|null>는 검증된SID로store를매번읽고절대만료/DB사용자존재확인. grantRoomMember(pool,username,roomId) operator. Message와Ack는spec형식.

- [ ] 컴파일 가능한Service거부stub에 payload/table/회원권/제한역할·세션폐기검사를 먼저작성·RED확인.
- [ ] reference Service와선수코드/wiring구현. 공식 sessionstore읽기를재사용하고DB오류를전파. starterA는fail-closed.
- [ ] 실제PG·unit과양쪽타입/빌드·기존의존성버전정책통과,단위커밋.

### Task 2: 실제 Gateway·세션/방 수명

**Files:** server/src/chat.gateway.ts·create-app.ts·chat.types.ts, checks/part-05/socket.test.ts·fixture.ts.

**Interfaces:** namespace root,path/socket.io,websocketonly. room:join/chat:send withAck,chat:message/chat:error. DynamicLocalIoAdapter는정확Origin upgrade만허용. Engine sessionmiddleware와namespace 인증gate. Gateway의run은같은socket직렬·10events/sec·대기4개. 연결20·buffer8192. 전달전recipientSID/DB회원권확인. idle sweep1000ms,모듈종료정리.

- [ ] 실제HTTP가입/로그인쿠키·실제Socket.IO로정상/익명/위조/다른Origin/누락Origin/명시role입력·방분리·입장전발송·잘못된형식·권한삭제·만료/로그아웃·사용자삭제·DB503·상한·동시방이동·종료RED확인.
- [ ] reference입장/발송구현,starterB는거부. 공통인증/정리wiring은starter에도제공.
- [ ] 전체server검증통과,학습과제assertion실패와환경오류구분,커밋.

### Task 3: 화면·구독 정리

**Files:** client/src/{ChatPanel.tsx,useChat.ts,chat-types.ts,App.tsx,styles.css},vite.config.ts,checks/part-05/{ui.test.tsx,ui-fixture.ts,client.config.ts,setup.ts}.

**Interfaces:** useChat(auth,roomId) returns status/messages/error/sending/send(text):Promise<boolean>/reconnect(). Browsertransport는 socket.io-client, credentials동일origin,acktimeout3000·reconnectionfalse. statusidle/connecting/ready/disconnected/error. Room/계정epoch effect정리,현재generation만event/ack/finally적용,수신100개.

- [ ] UI에서익명비활성·입장/발송/텍스트·거부/timeout초안·같은계정재인증/다른계정삭제·늦은event/ack·StrictMode/방이동/unmount정리·보관상한RED확인.
- [ ] referencehook/UI구현. starterC연결/구독TODO는미연결로유지하고UI선수제공. API토큰/비밀번호저장안함.
- [ ] referenceclient전체·양쪽타입/빌드와실제socket회귀통과,커밋.

### Task 4: 교재·독립 실행·최종 리뷰·게시

**Files:** docs/tasks/part-05/{README.md,explanation.md,submission.md,browser-checklist.md},docs/verification/part-05.md,docs/experiments/part-05/,referenceREADME,checks/part-05/{standalone-smoke.mjs,verify-starter.mjs},workflowpart-05,README/progress/AGENTS/PROJECT_PLAN/REMAINING_WORK/SECURITY_CURRICULUM.

- [ ] A입력/회원권·B입장/발송·C구독수명3주,사전예측·공식근거·힌트·설명3개·독립한연결방이동·빈제출·브라우저후속과역할/Compose절차작성.
- [ ] source-only새npmci·type/build·실제HTTP/Vite socket·operator grant/reject·종료정리·로그표식부재,starter의도된실패,0~4/Node회귀실행.
- [ ] 순차최종리뷰·필요한RED→GREEN수정·전체검증. 실제증거/한계·artifactSHA기록.
- [ ] 작업브랜치CI성공후force없이main게시,원격SHA/CI확인.학습0유지.다음6단계로이어감.

계획자체검토: 회원권/세션은Service와Gateway에서같은DB주체를사용한다.16kb나범위없는queue등임의대안은없다.수신재인가·idle정리·lateackguard가서로보완하며진행중요청보장경계를명시했다.초기연결정리는기본구현,한연결재사용변경은학습자의독립과제로남긴다.
