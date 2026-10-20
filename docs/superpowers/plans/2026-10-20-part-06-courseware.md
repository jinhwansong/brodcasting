# 6단계 메시지 저장·재연결·복구 Implementation Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. 사용자 승인된 순차 제작·자체 검토·검증·커밋·푸시 방식을 유지한다. 실행 증거는 검증 문서에 별도로 기록한다.

**Goal:** 저장 뒤 ack 유실·중복 발송·복구 중 실시간 중첩을 재현하는3주 교재.

**Architecture:** 독립 part-06에5단계 선수 코드를 보존. repository의 방별 commit 순서/중복 방지, Gateway history, hook의 이력 cursor·제한 재시도를 과제로 분리한다.

**Spec:** [설계](../specs/2026-10-20-part-06-design.md). 기존 Nest12.1.3/Socket.IO4.8.4/React/pg/Vitest exact 버전 사용, 새 의존성 없음.

## Global Constraints

- 원본0~5·기존 lock 버전·루트 기본8명령·학습0미시작 유지. API3006/client5186/DB5546·part06 전용 역할/환경변수, 소유 DB만 사용.
- payload·ack·DB 제약·cursor bigint 문자열·재시도/페이지/보관 상한은 spec 그대로. 세션·회원권·Origin·정제 오류·선수 인증을 약화하지 않음.
- 공개 배포·외부 부하·브라우저 설치/완료 주장·다중 서버·영구 outbox·독립 변경 정답은 범위 밖.

## Review Focus

- commit 이전 seq가 나중 commit보다 빠진 채 cursor를 넘는가: 실제 두 transaction의 counter lock/commit 지연 검증.
- 같은 client ID가 동시 재전송/다른 내용/계정/방에서 혼동되는가: 실제 제한 역할+unique/409 검증.
- history/live/ack가 뒤섞여 낮은 seq가 빠지는가: UI deferred page·역순 live 신호·고정 until/next 검증.
- cleanup 뒤 retry timer/late ack가 다른 계정/방을 바꾸는가: fake timer와 epoch 지연 검증.
- 복구/재시도 상한이 조용한 누락·새 ID 재발송·무제한 queue가 되는가: 상한 뒤 수동 재개와 동일 ID 검증.

### Task 1: 독립 실행·저장 repository

**Files:** labs/reference-solutions part-06, server/src/{chat.repository.ts,chat.types.ts,chat.service.ts,db-config.ts}, migrations/001-schema.sql, checks/part-06/{storage.test.ts,chat-unit.test.ts,db.config.ts}, rootpackage/lock·enginepolicy.

**Interfaces:** ChatRepository(pool).save(User,SendInput):Promise<{message:Message;inserted:boolean}>;history(User,HistoryInput):Promise<HistoryPage>. SendInput={roomId,text,clientMessageId};Message의 seq/clientMessageId 추가. HistoryInput={roomId,after,until?}, HistoryPage={items,until,next,done}. ChatService.parseHistory(unknown),save(User,SendInput),history(User,HistoryInput)는 repository 연결. 기존 message()는 저장 생성기로 재사용하지 않고 삭제한다.

- [ ] 컴파일 가능한 fail-closed repository와 새 payload 골격에 먼저 실제 DB 동시 ID/충돌·rollback·commit순서·50/51경계·고정 watermark·삭제 구멍·bigint·최소 권한 RED 검사.
- [ ] 방 counter lock→회원권 재확인→중복 확인→increment/insert/commit 구현. 정확 ID·내용·순서·rollback·정제 경계 확인.
- [ ] root/독립 설치 lock 기존 버전 비교와 reference 서버/유닛·타입 통과. starter A repository 거부 유지.

### Task 2: Gateway 이력·재전송 wire

**Files:** server/src/chat.gateway.ts·chat.service.ts, checks/part-06/{socket.test.ts,recovery.test.ts,standalone-smoke.mjs}.

**Interfaces:** chat:send 저장 commit 후 message+ack, 중복 save는 같은 message ack와 추가 broadcast 없음. chat:history는 run의 현재 SID/방/회원권 검사 후 HistoryPage 반환. 기존 room:join ack 유지. 다른 DB 오류503·ID충돌409. 전달의 현재 수신 권한/roomVersion 보호 유지.

- [ ] 기존 실제 소켓 검사를 명시 clientMessageId 선수 fixture로 유지. 저장 뒤 client disconnect로 ack 유실·같은 ID 재연결 재전송1행·프로세스 재생성/재시작 이력·권한 제거/만료·DB장애 RED 검사.
- [ ] 저장·history 연결, starter B history 거부. 기존149개 서버 검사를 새 계약에 맞춰 보존하고 추가 후 실제 결과만 기록.
- [ ] 전체 서버·기존 part05 회귀 통과 후 커밋.

### Task 3: UI 복구와 제한 재시도

**Files:** client/src/{useChat.ts,chat-types.ts,ChatPanel.tsx}, checks/part-06/{recovery-ui.test.tsx,chat-ui-fixture.ts,client.config.ts}.

**Interfaces:** useChat(auth,roomId) 기존 status/messages/error/sending/send/reconnect에 delivery 상태와 retryPending()/cancelPending()를 추가. cursor·rows·미확인1개는 계정/방별 메모리. Message/HistoryPage 런타임 검사. pump 최대10페이지/500행·페이지간200ms·보관100개. Socket.IO 자체 retry는 비활성, 연결/발송 추가시도 최대3회500/1000/2000ms,ack3000ms.

- [ ] 이력/live중첩·낮은seq지연·fixeduntil·page상한수동재개·잘못된응답cursor불변·sameIDretry·불명취소·401동일/다른계정·방전환·lateack/finally·StrictMode/timercleanup RED 검사.
- [ ] reference hook/UI 구현, starter C 미연결 유지. 입력·초안·미확인 발송의 소유 경계를 유지하고 저장확인/결과미확인/복구중을 구분.
- [ ] client 전체·양쪽 타입/빌드·실제 소켓 회귀 통과 후 커밋.

### Task 4: 교재·독립 설치·검증·게시

**Files:** docs/tasks/part-06/{README,explanation,submission,browser-checklist}.md, docs/verification/part-06{,-review}.md, docs/experiments/part-06, standalone/starter검사, workflow06, root상태문서.

- [ ] A저장/B이력/C복구3주·사전예측·공식자료·설명3개·독립 ‘이력으로 미확인 전송 확인’·빈제출·브라우저후속 작성.
- [ ] 빈 소유 DB에서 source-only npmci·type/build·operator·HTTP/Vite실제socket·API재시작/DB이력·ack유실중복방지·종료/로그 검사. starter 환경오류를 의도된 실패로 인정하지 않음.
- [ ] 0~5회귀·Node정책·순차 simplify/code-review·필요한 RED→GREEN 수정·증거/한계 작성.
- [ ] 작업브랜치 Linux CI 성공·artifactZIP/내부SHA 후 force없이 main 게시, 원격SHA/CI 확인. 다음7단계로 이어감.

자체 검토: A/B/C 책임과 public payload가 일치한다. 상한 후 미확인 상태/복구 cursor를 버리지 않으며, DB commit과 UI 확인은 별도다. 독립과제의 이력기반 자동 확인은 본 과제에서 구현하지 않는다.
