# 3단계 — PostgreSQL과 페이지네이션

3주, 주당6~8시간. 방송과 즐겨찾기를 실제 DB에 저장하고 SQL·페이지 경계·제약조건·인덱스의 역할을 설명합니다. 2단계의 HTTP/React 요청 처리는 선수 코드로 제공합니다. 이번에 채울 핵심은 SQL과 제약이며 ORM은 사용하지 않습니다.

## 먼저 예상하기

참고 완성본을 열기 전에 [제출 기록](submission.md)에 적으세요.

1. 시청자 수가 같은 두 방송이 페이지 경계에 있으면 무엇을 추가 정렬해야 할까요? 그 기준만으로 동시 데이터 변경까지 해결될까요?
2. 두 탭이 동시에 같은 방송을 즐겨찾기하면 어디에서 중복을 막아야 할까요? API 응답이 유실되면 저장 여부를 어떻게 확인할까요?
3. 1천 건과10만 건, 첫 페이지와 깊은 페이지에서 같은 인덱스가 항상 같은 이득을 줄까요?

## 3주 과제

| 주차 | 직접 할 일 | 남길 증거 |
| --- | --- | --- |
| 1주 | A의 테이블 제약·인덱스 설계, migration·seed·두 DB 역할 추적 | 스키마와 실패한 INSERT, 버전 재실행, 권한 거부 |
| 2주 | B의 목록/상세·페이지 SQL, C의 멱등 즐겨찾기 | 동률·다음/빈 페이지·검색·동시 요청·새 API 프로세스에서도 유지 |
| 3주 | D의 실행 계획과 byte 비교, SQL/소유자 입력 실패 분석, 독립 cursor 변경 | 같은 조건의 원시 계획·해석·한계·직접 변경 회귀 |

## 채울 파일과 제공하는 코드

| 구분 | 위치 | 책임 |
| --- | --- | --- |
| A | `labs/part-03/server/migrations/001-schema.sql` | viewer_count CHECK, 즐겨찾기 NOT NULL·복합PK·FK·CASCADE |
| A | `migrations/002-index.sql` | 정렬/참조를 위한 보조 인덱스와 비용 설명 |
| B | `server/src/repository.ts`의 list/get | 값 바인딩·검색·안정 정렬·limit+1·응답 필드 |
| C | 같은 파일의 setFavorite | 같은 추가/삭제를 반복해도 결과가 같은 SQL |
| D | 제출 양식과 별도 변경 코드 | 관측 해석·cursor 방식으로 독립 변경 |
| 제공 | migrate·fixtures·db-config·db-cli | 버전/해시·transaction·동시 실행 잠금·초기 데이터·권한 도구 |
| 선수 기능 | Nest Controller/Service/DTO/Pipe·React client | HTTP 입력/오류·페이지 UI·최신 응답·서버 저장 연결 |

`demo_users`는 서비스 데이터 행이고 `part03_app`은 DB 접속 역할입니다. 두 이름의 ‘사용자’를 같은 개념으로 취급하지 마세요. 현재 API는 서버가 고정한 **demo-user 한 명의 공동 연습**입니다. 개인별 로그인·인가 완료는4단계입니다. 외부에서 owner/userId를 선택할 수 없습니다.

## 설치와 로컬 DB

Node24.x 24.15.0 이상을 권장합니다(제작24.19.0). PostgreSQL18과 Docker Compose v2를 선택 실행할 수 있습니다. 제작에서는 [실제 PostgreSQL18.6 Actions 검증](../../verification/part-03.md)을 사용했으며 본인 컴퓨터의 Compose/브라우저 실행은 별도입니다.

저장소 루트에서:

```sh
npm ci
cp .env.example .env
```

`.env`의 두 비밀번호와 각 URL의 비밀번호를 같은 값으로 맞추세요. URL의 특수문자는 URL 인코딩합니다. 이 값은 본인 로컬 실습용이며 VITE_ 변수로 옮기지 않습니다. 기본 실행/테스트는 계속0단계입니다.

**처음 migrate하기 전에 A를 수정하세요.** 이미 적용한 파일의 내용이 달라지면 실행기가 changed 오류로 멈춥니다.

```sh
docker compose -p brodcasting-part03-learner -f compose.part-03.yml up -d --wait
npm run db:part-03 -- migrate
npm run db:part-03 -- seed
npm run db:part-03 -- provision-app
npm run db:part-03 -- test-db
```

첫 migration은2개, 재실행은0개입니다. seed 재실행은 기존 행을 덮지 않습니다. provision-app은 새 제한 역할을 한 번 만들며 기존 역할의 비밀번호를 덮지 않습니다. test-db는 전용 검증 DB만 준비합니다. operator URL은 migration/seed/실험용이고 API URL은 제한 역할용입니다.

처음 A를 다시 풀기 위해 **이 실습 데이터를 버릴 때만** 같은 Compose 명령의 `down -v`로 learner 프로젝트의 볼륨을 초기화하고 위 순서를 다시 실행합니다. 단순 API 재시작에는 볼륨을 지우지 않습니다. 실제 변경 이력은 적용된 SQL을 고치기보다 새 버전 파일과 `migrate.ts`의 명시 목록을 추가해 관리합니다. 기본 공개 과제의 버전은001/002입니다.

두 터미널에서:

```sh
# 터미널1 — 제한 DB 역할을 쓰는 127.0.0.1:3003 API
npm run dev:part-03:api
```

```sh
# 터미널2 — Vite가 표시하는 로컬 주소
npm run dev:part-03
```

server 소스를 바꾸면 API를 중지하고 다시 실행합니다. Vite의 /api 개발 프록시는3003을 가리킵니다. PORT를 바꾸면 프록시도 맞춰야 합니다. 운영 배포 설정이 아닙니다.

```sh
npm run typecheck:part-03
npm run build:part-03
npm run check:part-03
```

시작 코드는 타입/빌드가 성공하고 SQL/제약 행동 검증은 의도적으로 실패합니다. HTTP/화면은 제공했으므로 client 검사만은 통과합니다. 실제 개수와 실패 원인은 [제작 기록](../../verification/part-03.md)에 구분합니다. DB 검사만은 `npm run check:part-03:db`, client만은 `node checks/part-03/run.mjs exercise client`입니다. 전용 test DB와 lab DB가 없으면 DB 검증은 실패하며 skip하거나 메모리 DB로 대체하지 않습니다.

## DB와 HTTP 계약

테이블: demo_users(id PK), broadcasts(id PK·제목·진행자·설명·0 이상 integer 시청자 수), favorites(user_id/broadcast_id NOT NULL·각 FK·복합PK). 방송 삭제는 해당 즐겨찾기를 CASCADE 삭제합니다. app 역할은 broadcasts SELECT와 favorites SELECT/INSERT/DELETE만 사용하고, 영구 테이블 생성·방송 쓰기는 거부돼야 합니다.

| 요청 | 성공 | 실패 |
| --- | --- | --- |
| GET /api/broadcasts |200 `{items,limit,offset,hasMore}` | 입력400, DB503 |
| GET /api/broadcasts/:id |200 Broadcast | 형식400, 없음404, DB503 |
| PUT /api/favorites/:id |200 `{id,favorite:true}` | 입력400, 없음404, DB503 |
| DELETE /api/favorites/:id |200 `{id,favorite:false}` | 입력400, 없음404, DB503 |

- 목록: search 문자열 최대80(기본빈값), sort viewers-desc/title-asc, limit 기본2·1..50, offset 기본0·0..100000, favoritesOnly 기본false·true/false. 숫자는0 또는0으로 시작하지 않는 십진 정수 표기입니다. 중복 query·잘못된 값·미정의 키는400입니다.
- id는 소문자 영숫자/하이픈1~32자입니다. 상세 query는 없고 쓰기 query/비어 있지 않은 body도 허용하지 않습니다. 큰 JSON은8kb 파서에서413입니다.
- 검색은 trim 후 제목/진행자의 대소문자 무시 부분 일치입니다. %, _, 역슬래시를 검색 와일드카드로 취급하지 않습니다. SQL 값은 파라미터로 전달하고 정렬 구문은 고정된 두 허용 목록에서만 고릅니다.
- 시청자 내림차순 뒤 id 오름차순, 제목 COLLATE "C" 오름차순 뒤 id 오름차순입니다. C 정렬은 앞 단계의 한국어 Intl.Collator와 순서가 다를 수 있습니다. DB 쿼리와 인덱스가 같은 기준을 써야 합니다.
- limit+1개를 읽어 다음 유무를 계산하고 실제 반환은 limit 이하입니다. 마지막/빈 페이지는 hasMore false, 빈 결과도200입니다. 총 개수를 추정해 표시하지 않습니다.
- Broadcast는 id/title/hostName/viewerCount/description/favorite입니다. favoritesOnly는 **서버가 정한 demo-user**의 저장 상태로 필터링합니다. 다른 사용자 행이 DB에 있어도 내 결과에 합치지 않습니다.
- 같은 PUT·DELETE는 반복해도 같은 결과입니다. 중복 동시 PUT은 DB 복합키로 한 행만 남깁니다. HTTP 응답이 유실되면 DB가 그대로라고 단정하지 않고 재조회/멱등 재시도로 확인합니다.

본인 로컬에서 예상 후 확인하세요.

```sh
curl -i 'http://127.0.0.1:3003/api/broadcasts?limit=2&offset=2'
curl -i 'http://127.0.0.1:3003/api/broadcasts?search=%25'
curl -i -X PUT 'http://127.0.0.1:3003/api/favorites/a'
curl -i 'http://127.0.0.1:3003/api/broadcasts?favoritesOnly=true'
curl -i -X PUT 'http://127.0.0.1:3003/api/favorites/a' \
  -H 'Content-Type: application/json' --data '{"userId":"other"}'
```

마지막 요청은400이고 그 요청 때문에 행이 추가/변경되면 안 됩니다. SQL 바인딩·입력 검증·권한 검사는 각각 다른 책임입니다. 이 단계가 개인별 보안이나 공개 운영을 완성하지는 않습니다.

## 실행 계획 실험

```sh
npm run experiment:part-03 -- --output part-03-experiment.json
```

operator가 연결하는 lab DB의 세션 임시 테이블만 사용합니다.1천/1만/10만 행, 같은 projection·정렬·LIMIT25, 첫/깊은 페이지를 인덱스 전후 비교합니다. 데이터/인덱스 생성과 ANALYZE 비용, 실제 행 수·정렬/scan·buffer·전체/페이지 JSON byte를 함께 해석하세요. 원시 계획과 환경을 보존하고 ‘인덱스가 항상 빠르다’는 결론부터 정하지 않습니다. 제공된 결과는 한 환경의 단일 순차 실행이며 본인의 측정을 대신하지 않습니다.

## 설명3개와 독립 변경

1. 화면의 조건부터 DTO·Service·SQL·DB 제약·Page JSON까지 추적하세요. 제한 역할과 서비스 사용자는 어디서 달라지나요?
2. 안정 정렬·limit+1·OFFSET의 비용과 동시 변경 한계를 설명하세요. FK/유일성/인덱스는 각각 무엇을 보장하고 어떤 비용을 만드나요?
3. SQL 주입 값·중복 즐겨찾기·쓰기 응답 유실·DB 연결 실패 중 하나를 골라 원인/변경 여부/화면/복구 증거를 연결하세요.

정답을 복사하지 않고 시청자 정렬을 cursor 방식으로 바꾸세요. viewer_count/id 동률·마지막/빈 페이지·잘못된 cursor를 직접 검사하고, 정렬값이 바뀌는 동안의 누락/중복 한계를 적습니다. cursor 인코딩을 권한 보장으로 취급하지 않습니다. 기존 공개 검증은 원래 OFFSET 계약이며 새 계약 검증은 별도로 작성합니다.

설명·독립 변경·직접 증거 전에는 학습 완료가 아닙니다. [힌트](explanation.md), [제출 기록](submission.md), [브라우저 후속 목록](browser-checklist.md)을 사용하세요.
