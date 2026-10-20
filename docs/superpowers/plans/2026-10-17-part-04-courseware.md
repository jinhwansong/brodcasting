# 4단계 로그인과 권한 Implementation Plan

> 2026-10-20 후속 지시: 사용자가 docs 계획을 읽고 나머지 작업을 계속하도록 명시적으로 제작을 재개했다. 중지 체크포인트에서 Task3/4를 이어서 완료했으며 현재 상태는 [인수인계](../../../REMAINING_WORK.md)·[검증 기록](../../verification/part-04.md)을 따른다. 아래 체크박스는 최초 계획의 원문이며 실행 결과는 검증 문서와 Git에 기록한다. 4단계143개·독립 설치/실제 재시작·기존 과정 회귀는 원격 CI39412577725에서도 성공했다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkboxes. 사용자의 기존 native 연속 제작·커밋·푸시 위임을 유지한다.

**Goal:** 실제 세션·비밀번호 해싱·개인/방별 인가를 검증하는3주 교재를 완성한다.

**Architecture:**3단계와 독립된 server/client 시작 코드와 참고 완성본. 기존 SQL 기반에 users/room_admins/공식 PostgreSQL session store를 연결한다. UI/DB 선수 코드는 제공하고 인증/접근 과제는 fail-closed 골격으로 남긴다.

**Tech Stack:** 기존 React/Nest/TS/Vite/Vitest/pg, PostgreSQL18.6. argon2 0.45.1, express-session1.19.0, connect-pg-simple10.0.0, csrf-sync4.2.1, express-rate-limit8.7.1.

**Spec:** [제작 설계](../specs/2026-10-17-part-04-design.md), [원본](../../../CURRICULUM.md), [보안](../../../SECURITY_CURRICULUM.md).

## Global Constraints

- Node `^22.22.2 || ^24.15.0 || >=26.0.0`, 정확한 의존성/lock. 기본8명령·원본·0~3단계 소스·학습0 보존.
- DB brodcasting_part04_test/lab와 내부 part04_app/check_hex 역할만. API127.0.0.1:3004, client127.0.0.1:5184, Compose127.0.0.1:5544. production 실행 거부.
- username ASCII3..24, password Unicode15..128/무변형, notice0..500 일반 텍스트. JSON8kb, query3단계 범위/기본값, UUID v4 userId와 소문자 id1..32. 미정의 키/중복/형식400.
- Argon2id memory19456KiB/time2/parallelism1. 세션 이름brodcasting.part04.sid/HttpOnly/Lax/path=/, 로컬 Secure=false, 절대30분. secret64hex 실행 생성, fallback 없음.
- resave=false/saveUninitialized=false/rolling=false/disableTouch=true/createTableIfMissing=false. 로그인 regenerate+save, 로그아웃 destroy+clear 완료 후 응답.
- CSRF는 라이브러리 세션 토큰 헤더, 모든 unsafe API 보호. Origin이 있으면 정확한 client origin. 기본 trust proxy=false/CORS없음. 로그인/가입 IP10회/60초, 단일 프로세스 제한.
- 실제 PG 검증은 Actions service, 브라우저·로컬 Compose 미실행. 비밀번호·해시·세션·토큰 원문·실제 사용자 데이터/비밀은 기록/저장소에 넣지 않음.

## Review Focus

- 옛 세션/토큰이 로그인·로그아웃·만료·재기동 뒤 재사용되는가: opaque cookie와 실제 DB의 폐기/절대 만료를 검증(Task2/4).
- 사용자 UUID/room id/body role을 바꾸는 직접 요청이 타인 데이터를 바꾸는가: 주체·방 권한 및 실패 뒤 실제 행을 검증(Task1/2).
- 폼 파서/DTO가 특수 키를 지워 권한 입력을 받아들이는가: 파싱 전 형식·변환 전 키와 본문/중복 query를 검증(Task2).
- 인증 변경과 늦은 GET/쓰기가 겹쳐 다른 계정 화면에 반영되는가: 계정 epoch·초안 보존·자동 재전송 금지 검증(Task3).
- DB/세션 저장·로그인 제한 실패가 성공으로 보이거나 비밀을 출력하는가:503 정제·429·실제 store 장애와 source-only 기동 검증(Task2/4).

### Task 1: 사용자 데이터·해싱·접근 정책 기반

**Files:** labs/part-04/server/{package.json,tsconfig.json,migrations/001-schema.sql,src/{types.ts,fixtures.ts,passwords.ts,user.repository.ts,repository.ts,access-policy.ts,db-config.ts,migrate.ts,db-cli.ts}}와 reference-solutions/part-04의 대응 파일; checks/part-04/{unit.test.ts,db.test.ts,db-fixture.ts,db.config.ts,run.mjs}, root package/lock, engine policy, Compose/.env.example, .github/workflows/part-04.yml.

**Interfaces:** User={id:string,username:string}; Account=User&{passwordHash:string}. PasswordService.hash(value:string):Promise<string>, verify(encoded:string,value:string):Promise<boolean>. UserRepository(pool).create(username,hash):Promise<User>, findByUsername(username):Promise<Account|null>, get(id):Promise<User|null>. BroadcastRepository(pool).list(query,userId?:string):Promise<Page>, get(id,userId?:string):Promise<Broadcast|null>, setFavorite(userId,id,enabled):Promise<void>, getRoom(id,userId?:string):Promise<Room|null>, updateNotice(userId,id,notice):Promise<Room|null>. Room={id,title,notice,canEdit}. assertOwner(actor:User,targetId:string):void. requireLocalDatabase/grantAppAccess/applyMigrations는3단계와 같은 시그니처·part04 이름. grantRoomAdmin(pool,username,roomId):Promise<void> operator 함수.

- [x] **RED:** hash/verify 실제 라이브러리 동작(서로 다른 salt, argon2id 설정, 틀린 값), 소유자 허용/거부. DB는 사용자 unique/FK, 개인별 목록·중복 PUT·DELETE, 다른 방 공지 조건부 갱신·불변, 최소 역할 CRUD/DDL 거부, migration 재실행/rollback/checksum·seed/관리자 부여를 검사한다. 먼저 컴파일 가능한 stubs를 실행해 assertion 실패를 확인한다.
- [x] **GREEN:** reference의 검증된 해싱·바인딩 SQL·조건부 공지 수정·제약·operator만 권한 부여를 구현한다. DB/SQL/config 선수 코드는 starter에 제공하되 password/access는 fail-closed TODO로 둔다. 자체 runtime 의존성/타입/lock·전용 실제 PG CI를 고정한다.
- [x] **검증/커밋:** `npm run check:reference:part-04:db`는 실제 DB+unit 전부 통과. 양쪽 server typecheck/build와 `npm run check:toolchain` 통과. 주의: DB 미설정/연결/모듈 오류는 성공/정상 TODO 실패가 아니다.

### Task 2: 세션·인증 Guard·HTTP 인가와 CSRF

**Files:** 양쪽 server/src/{auth.dto.ts,auth.service.ts,auth.guard.ts,session.ts,auth-rate-limit.ts,app-config.ts,safe-exception.filter.ts,input.ts,auth.controller.ts,broadcast.dto.ts,broadcast.controller.ts,broadcast.service.ts,raw-input-keys.pipe.ts,create-app.ts}; checks/part-04/{http.test.ts,cookie-jar.ts,unit.test.ts}.

**Interfaces:** SessionView={user:User|null,csrfToken:string}. SessionRequest는 Express.Request에 actor?:User, express-session SessionData.userId/authenticatedAt/csrfToken을 사용. SessionRuntime(pool,{secret,schemaName?,sessionTtlMs?})는 middleware/csrfProtection:RequestHandler, currentUser(req):Promise<User|null>, view(req):Promise<SessionView>, establish(req,user):Promise<SessionView>, end(req,res):Promise<void>, onModuleDestroy():Promise<void>를 제공한다. 종료는 외부 pool을 닫지 않는다. AuthService.register(username,password):Promise<User>, login(username,password):Promise<User>. AuthGuard.canActivate(context):Promise<boolean>는 현재 사용자 확인/401/actor 설정. assertRoomAdmin(room:Room):void는 서버에서 계산한 canEdit을 검사하며 시작 코드에서는 항상 거부한다. createApp(pool,options:{secret:string,browserOrigin:string,schemaName?:string,sessionTtlMs?:number,authRateLimit?:{windowMs:number,limit:number}}):Promise<NestExpressApplication>. API 경로/응답은 spec 표 그대로.

- [x] **RED:** 실제 HTTP cookie jar로 가입/중복/동일401, SID/CSRF 교체·고정 거부·누락/위조/다른 세션 토큰, 로그아웃/DB expire/절대시간/삭제 사용자, owner UUID/방 관리/role 입력, query·폼·큰 JSON, 제한429/위조 XFF 우회 거부, DB/store503과 실패 뒤 실제 행을 검사한다. 컴파일/서버 기동은 성공한 상태에서 행동 실패를 확인한다.
- [x] **GREEN:** 공식 세션/store/CSRF/제한 middleware를 먼저 연결하고 Guard·Service·repository 주체를 일치시킨다. 모든 async 세션 전환은 완료를 기다린다. session 오류 handler·Nest 정제503, raw keys/JSON 형식/Origin/no-store를 제공한다. starter에는 라이브러리 wiring을 제공하고 AuthService/Guard/access/password 골격을 유지한다.
- [x] **검증/커밋:** 실제 PG의 전체 `npm run check:reference:part-04:db`와 양쪽 타입/빌드 통과. 요청 jar는 opaque Set-Cookie만 재전송하며 인증/서명 알고리즘을 대체하지 않는다.

### Task 3: 로그인·개인 즐겨찾기·공지 화면

**Files:** 양쪽 client/{package.json,tsconfig.json,vite.config.ts,index.html,src/{App.tsx,AuthPanel.tsx,NoticePanel.tsx,useSession.ts,api.ts,types.ts,useLatestRequest.ts,main.tsx,styles.css}}, reference package/lock, checks/part-04/{api.test.ts,ui.test.tsx,wire.test.ts,client.config.ts,setup.ts}.

**Interfaces:** client getSession():Promise<SessionView>, register(credentials,csrf):Promise<User>, login(credentials,csrf):Promise<SessionView>, logout(csrf):Promise<void>, fetchPage(query,signal):Promise<Page>, setFavorite(userId,id,enabled,csrf):Promise<{id,favorite}>, getRoom(id,signal):Promise<Room>, updateNotice(id,notice,csrf):Promise<Room>. ApiError.status는401/403/네트워크 분리에 사용. User/Page/Room 이름·필드는 Task1/2 그대로.

- [ ] **RED:** APIcredentials/signal/헤더/응답 runtime shape와401/403, jsdom 가입→로그인/비밀번호 비움/로그아웃, 개인 favorite, room canEdit와403,401 재인증·초안 보존·다른 계정 자동재전송 없음, 인증 전환 뒤 늦은 GET/쓰기 무시, 공지/이름 텍스트 출력을 검사한다. 실제 API 연결 wire는 원본 응답을 대체하지 않는다.
- [ ] **GREEN:** 기존 목록/페이지 팔레트에 auth 영역과 방 공지 편집을 더한다. 저장은 성공 응답 뒤 재조회하고 애매한 연결 실패는 재조회 안내. 전용 front 보안 실습이나 브라우저 검증 완료로 주장하지 않는다. UI는 starter 선수 코드로 제공한다.
- [ ] **검증/커밋:** `npm run check:reference:part-04` 전체 DB/HTTP/wire/client 통과, 양쪽 전체 typecheck/build 통과. 이전 교재 소스/기본8명령 보존.

### Task 4: 3주 교재·독립 실행·리뷰·게시

**Files:** 양쪽 server/src/main.ts, docs/tasks/part-04/{README.md,explanation.md,submission.md,browser-checklist.md}, docs/verification/part-04.md, docs/experiments/part-04/실제 요약, reference-solutions/part-04/README.md, checks/part-04/{standalone-smoke.mjs,verify-starter.mjs}, README.md/progress.md/AGENTS.md/SECURITY_CURRICULUM.md.

- [ ] A해싱/B세션/C권한의 예측·공식 근거·단계별 힌트·설명3개·독립 모든 기기 로그아웃·blank 제출·브라우저 미실행 양식과 로컬 secret 생성/역할 설정/Compose 절차를 작성한다.
- [ ] source-only 복사본의 fresh npm ci/typecheck/build, API/Vite proxy, 로그인 뒤 실제 API 프로세스 재기동해 세션/즐겨찾기 유지, 로그아웃 뒤 재기동해 옛 쿠키 거부를 검사한다. 실제 PG 전체/시작 TODO 실패 수집/기존0~3단계/engine 회귀를 실행하고 기록한다. DB/세션/API 오류 출력에 테스트 secret/password marker가 없음을 확인한다.
- [ ] 전체 새 컨텍스트 최종 리뷰1회. Important/Critical을 한 번의 RED→GREEN 및 전체 회귀로 처리하고 판단/보류를 기록한다. 학습0/미시작 유지, 제작4 완료 뒤 커밋한다.
- [ ] main 최신 SHA·force false로 푸시하고 원격 tree=검증 tree를 확인한 뒤 제목 알림. 원본5단계로 이어간다.

자체 검토: Task1 User/Room/SQL이2의 actor와3의 UI에 동일하게 전달된다.30분 절대 만료/익명 CSRF/로그인 토큰 교체·로그아웃204가 모순되지 않는다. 테스트가 주입한 TTL/limit은 main 설정을 바꾸지 않는다. 한정된 로컬 HTTP 강의이며 production/소켓/전용 F2 완료 주장을 하지 않는다. 기존 사용자 승인에 따라 계획 재승인을 요청하지 않는다.
