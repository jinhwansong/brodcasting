# 4단계 — 로그인과 권한

3주, 주당 6~8시간. 가입·로그인·로그아웃, 개인 즐겨찾기, 방 관리자 공지를 실제 PostgreSQL과 HTTP로 연결합니다. 화면·SQL·세션 저장소 연결은 제공합니다. 직접 채울 부분은 **A 해싱, B 인증·세션 주체, C 자원 권한**입니다. 기본 실행과 학습 기록은 여전히 0단계입니다.

## 코드보다 먼저

[제출 양식](submission.md)에 다음 예상과 이유를 적으세요. 참고 완성본은 첫 구현 전에 열지 않습니다.

1. 같은 비밀번호를 두 번 해싱한 결과가 달라야 하는 이유와 로그인 때 비교할 대상을 예상하세요.
2. 로그인 전 쿠키와 로그인 후 쿠키가 같으면 어떤 문제가 생길까요? DB에 저장한 세션은 API 재시작·로그아웃 후 각각 어떻게 돼야 할까요?
3. A 계정의 쿠키로 B의 UUID를 URL에 넣거나 R1 관리자가 R2 공지를 수정하면 어디에서 거부해야 할까요?
4. 공지 저장 직후 연결이 끊겼다면 저장 실패라고 단정할 수 있나요? 작성 중 세션 만료 뒤 같은 계정·다른 계정 로그인은 어떻게 구분할까요?

## 3주 진행

| 주 | 직접 구현 | 실행하고 설명할 증거 |
| --- | --- | --- |
| A · 1주 | `server/src/passwords.ts`의 hash/verify | 다른 salt, 정확한 원문 검증, 잘못된 비밀번호와 손상된 해시 구분 |
| B · 2주 | `auth.service.ts` 가입·로그인, `auth.guard.ts` 현재 주체 | 중복 가입, 같은 401, SID/CSRF 교체, 만료·폐기·재시작 |
| C · 3주 | `access-policy.ts` 소유자·방 관리자 검사 | 타인 UUID·다른 방·위조 role 거부와 DB 불변, 초안·늦은 응답 |

`labs/part-04/server/src/` 아래 파일을 수정합니다. 미완성 코드는 빈 해시·항상 거부로 시작하므로 구현 전에는 로그인되지 않습니다. Guard를 무조건 true로 바꾸거나 테스트를 제거해 통과시키지 않습니다.

제공 코드에는 `session.ts`, Controller/Service/DTO/Pipe, 바인딩 SQL, migration·seed·operator CLI, client 전체가 있습니다. 선수 코드도 읽고 흐름을 추적하되 인증·서명·토큰 비교 알고리즘을 새로 만들지 않습니다. `users` 행은 서비스 계정이고 `part04_app`은 DB 접속 역할입니다.

## 설치와 전용 로컬 DB

Node 지원 범위는 루트 `package.json`의 engines, 정확한 패키지는 lock 파일을 따릅니다. 이번 제작 환경은 Node 24.15.0·PostgreSQL 18.6입니다. Docker Compose 또는 별도 로컬 PostgreSQL을 사용합니다. 3단계 DB와 섞지 않습니다.

저장소 루트에서:

```sh
npm ci
```

`labs/part-04/.env.example`을 **루트 `.env`에 반영**하세요. 기존 다른 단계 설정은 보존합니다. PowerShell에서 새 파일로 시작할 때는 `Copy-Item labs/part-04/.env.example .env`를 사용할 수 있지만, 이미 있는 `.env`를 덮지 않습니다.

`PART04_ADMIN_PASSWORD`, `PART04_APP_PASSWORD`와 각 URL 비밀번호를 로컬에서 정한 값으로 맞추고 URL 특수문자는 인코딩합니다. SESSION_SECRET은 다음 명령 결과인 **64자리 hex**를 로컬 `.env`에만 넣습니다. 서버 재시작에서도 같은 값을 유지해야 기존 쿠키를 검증할 수 있습니다. 비밀번호·secret·쿠키·토큰·해시를 제출하지 않습니다.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
docker compose --env-file .env -p brodcasting-part04-learner -f labs/part-04/compose.part-04.yml up -d --wait
npm run db:part-04 -- migrate
npm run db:part-04 -- seed
npm run db:part-04 -- provision-app
npm run db:part-04 -- test-db
```

DB는 loopback 5544, `brodcasting_part04_lab`/`brodcasting_part04_test`만 허용합니다. operator URL은 설정 작업, 제한 `part04_app` URL은 API에 사용합니다. migration 재실행은 0개, seed는 기존 행을 보존합니다. `provision-app`은 처음 한 번 실행하며 기존 역할의 비밀번호를 덮지 않습니다. 오류가 나면 원인을 확인하고 다른 DB·역할을 지우지 않습니다. API 재시작에 볼륨 삭제는 필요 없습니다.

별도 터미널 두 개에서:

```sh
npm run dev:part-04:api
```

```sh
npm run dev:part-04
```

API는 `127.0.0.1:3004`, 화면은 `http://127.0.0.1:5184`입니다. Vite가 `/api`를 프록시합니다. localhost와 127.0.0.1을 혼용하지 말고 `PART04_BROWSER_ORIGIN`을 화면 origin과 맞춥니다. 소스를 수정하면 API를 다시 실행하세요. `NODE_ENV=production`은 기동 전에 거부합니다.

가입은 자동 로그인하지 않습니다. 계정을 만든 뒤 로그인하세요. 본인 실습 계정에 R1 관리자 권한을 줄 때만 operator 터미널에서 실행합니다.

```sh
npm run db:part-04 -- grant-admin --username my_learner --room r1
```

고정 관리자나 평문 비밀번호 seed는 없습니다. 화면에서 역할을 보내지 않습니다. 다른 방은 별도로 권한을 검사합니다.

## A — 해싱

[node-argon2 공식 사용법](https://github.com/ranisalt/node-argon2#usage)과 설치된 타입을 읽고 hash/verify를 구현하세요. Argon2id, memoryCost 19456KiB, timeCost 2, parallelism 1이 이 교재의 계약입니다. salt는 라이브러리에 맡깁니다. 비밀번호는 Unicode 코드 포인트 15~128자이며 trim·정규화하지 않습니다.

힌트 순서: 먼저 함수 입력·반환 타입을 적고, 동일 원문을 두 번 해싱한 결과를 비교한 뒤, 올바른/틀린 원문을 검증하세요. 손상된 DB 해시는 일반적인 잘못된 로그인과 다른 시스템 오류입니다. 디버깅할 때 원문이나 해시를 출력하지 않습니다.

```sh
node checks/part-04/run.mjs exercise unit
```

## B — 세션과 현재 주체

[express-session](https://expressjs.com/en/resources/middleware/session/), [PostgreSQL store](https://github.com/voxpelli/node-connect-pg-simple), [csrf-sync](https://github.com/Psifi-Solutions/csrf-sync)의 공식 문서를 읽으세요. `session.ts`에서 익명 CSRF 발급 → 로그인 regenerate/save → 현재 사용자 확인 → destroy/clear 순서를 추적합니다. 이 wiring은 제공 코드입니다.

가입은 해싱한 값만 저장하고 공개 User만 반환합니다. 중복 username은 409입니다. 로그인은 계정이 없어도 제공된 dummyHash를 검증하고, 없는 계정·틀린 비밀번호를 동일한 401로 거부합니다. 시간 차이를 완전히 제거한다고 주장하지 않습니다. Guard는 요청 때마다 세션의 현재 사용자를 확인하고 request.actor에 설정하며 없으면 401입니다.

힌트 순서: User와 passwordHash가 있는 내부 Account의 차이를 적고, UserRepository를 호출한 뒤, Guard의 ExecutionContext에서 HTTP request를 얻는 지점을 찾으세요. 본문·헤더의 userId를 actor로 쓰면 안 됩니다.

## C — 소유자와 방 권한

본인 UUID만 자신의 즐겨찾기에 접근할 수 있습니다. UUID 대소문자 표기 차이는 같은 ID로 취급합니다. 공지는 서버가 조회한 `canEdit`과 조건부 UPDATE가 함께 보호합니다. UI 버튼을 보이게 해도 서버 권한은 생기지 않습니다. 권한이 없으면 403이며 행이 바뀌지 않아야 합니다.

힌트 순서: actor/대상/행위를 나눠 쓰고, `BroadcastsService`에서 정책 함수를 부르는 위치와 SQL의 room_admins 조건을 추적하세요. 정책 함수에는 프론트가 보낸 role이 들어오지 않습니다.

## 요청 계약과 실패 확인

| 경로 | 계약 |
| --- | --- |
| GET `/api/auth/session` | User 또는 null과 메모리용 CSRF 토큰 |
| POST `/api/auth/register`, `/login` | username/password만, 가입 201 User·로그인 200 SessionView |
| POST `/api/auth/logout` | 인증·CSRF, 폐기 완료 후 204 |
| GET `/api/broadcasts`, `/:id` | 3단계 목록·상세, 익명 favorite=false |
| GET `/api/users/:userId/favorites` | 본인만 조회, 검색·정렬·페이지 지원 |
| PUT/DELETE `/api/users/:userId/favorites/:id` | 본인만 멱등 추가·해제, 본문 없음 또는 빈 JSON |
| GET `/api/rooms/:id` | 공개 Room, 서버 계산 canEdit |
| PUT `/api/rooms/:id/notice` | 해당 방 관리자, 일반 텍스트 notice 0~500자 |

username은 소문자로 시작하는 영문·숫자·밑줄 3~24자입니다. 목록 query는 3단계 범위를 유지합니다(search 최대80, sort 두 종류, limit 1~50 기본2, offset 0~100000 기본0, favoritesOnly true/false). favoritesOnly=true는 인증이 필요합니다. 미정의 키·중복 query·잘못된 형식 400, JSON 8kb 초과 413, 중복 가입 409, 제한 초과 429, DB/store 실패 503입니다. 없는 공개 방송/방은 404입니다.

모든 unsafe 요청은 CSRF를 검사하며 Origin이 있으면 설정값과 정확히 같아야 합니다. 따라서 Guard 전 403이 나올 수 있습니다. 가입·로그인은 IP별 60초 10회이며 단일 프로세스 제한입니다. 위조 X-Forwarded-For로 우회할 수 없어야 합니다.

화면은 저장 성공 후 서버를 다시 읽습니다. 401 뒤 같은 계정 재인증은 초안을 보존하고 자동 재전송하지 않습니다. 다른 계정 로그인 또는 명시적 로그아웃 성공은 초안을 지웁니다. 403과 결과 불명인 연결 실패도 초안을 보존하고 재조회를 안내합니다. 늦은 이전 계정/방 응답이 현재 표시·저장 상태를 덮으면 안 됩니다.

```sh
npm run typecheck:part-04
npm run build:part-04
npm run check:part-04
```

시작 코드 타입·빌드는 성공하지만 인증 과제 검사는 의도적으로 실패합니다. client만은 `node checks/part-04/run.mjs exercise client`, DB/HTTP는 `npm run check:part-04:db`입니다. 전용 DB 미설정·연결 실패·모듈 오류·시간 초과는 학습 TODO 실패가 아닙니다. 제작자의 실제 결과는 [검증 기록](../../verification/part-04.md)에 따로 있습니다.

## 설명 3개와 독립 변경

1. 입력 비밀번호에서 해시 저장·로그인 검증·공개 User 응답까지, 각 값이 머무는 위치를 코드로 설명하세요.
2. SID 교체·절대 만료·DB 폐기·CSRF가 각각 막는 문제와, 늦은 조회가 폐기된 세션을 되살리지 않아야 하는 이유를 설명하세요.
3. 버튼 표시·Guard·소유자 정책·방 조건부 SQL이 무엇을 판단하는지, 실패 뒤 실제 DB 불변과 함께 설명하세요.

독립 변경: **모든 기기 로그아웃**을 추가하세요. 같은 사용자의 서로 다른 두 세션을 준비해 두 쿠키가 모두 거부되고 다른 사용자 세션은 유지되는 검증을 직접 만듭니다. 권한·CSRF·동시 요청·진행 중 요청에 대한 보장 경계를 먼저 명세하세요. 정답 코드·SQL은 제공하지 않습니다.

[제출 기록](submission.md)의 예상·첫 구현·설명·독립 변경을 모두 확인해야 학습 통과입니다. 테스트만으로 학습 상태를 올리지 않습니다. [해설](explanation.md)은 첫 시도 뒤, [브라우저 후속 양식](browser-checklist.md)은 실제 실행할 때 사용합니다. 전용 F2는 다른 탭 신호와 브라우저 경계를 별도로 다루며 다음 기본 단계는 WebSocket 채팅입니다.

## 한계

쿠키는 HttpOnly·SameSite=Lax·path=/이며 로컬 HTTP이므로 Secure=false입니다. 쿠키에는 SID만 있고 세션은 기존 PostgreSQL에 저장합니다. 30분 절대 수명은 요청마다 연장하지 않습니다. 로컬 수업을 운영 배포로 사용하지 않습니다. 분산 로그인 제한·HTTPS·공개 서비스 악용 방지·소켓 폐기는 이후 과정입니다. 브라우저 Cookie/CORS 동작은 아직 실행하지 않았습니다.
