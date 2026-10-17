# 3단계 PostgreSQL과 페이지네이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkboxes. 기존 사용자의 중간 승인 없는 제작·커밋·푸시 위임과 native 실행 방법을 유지한다.

**Goal:** 실제 PostgreSQL의 제약·바인딩·멱등 변경·페이지네이션·실행 계획을 검증할 수 있는 3주 교재를 완성한다.

**Architecture:** 독립 server/client 시작 코드와 같은 공개 검증의 별도 완성본. Nest/React 요청 수명은 선수 코드로 제공하고 SQL과 제약을 학습 과제로 남긴다. 원본과 학습 상태0를 보존한다.

**Tech Stack:** 기존 React·Nest·TS·Vite·Vitest, PostgreSQL18, pg8.23.1/@types/pg8.23.1. ORM·새 상태 관리 없음.

**Spec:** [설계](../specs/2026-10-17-part-03-design.md), [원본](../../../CURRICULUM.md), [보안](../../../SECURITY_CURRICULUM.md).

## Global Constraints

- Node 범위 ^22.22.2 || ^24.15.0 || >=26.0.0. 기존 root 기본 명령과 이전 교재는 보존한다.
- search 최대80, limit 기본2·1..50, offset 기본0·0..100000, 소문자 영숫자/하이픈 id1..32. unknown/중복/null/배열·범위 오류400.
- 실제 DB 검증은 loopback brodcasting_part03_test, 임시 schema/role만 정리한다. 실험은 brodcasting_part03_lab의 TEMP TABLE, 행 수1천/1만/10만만 사용한다.
- app은 방송 SELECT와 즐겨찾기 SELECT/INSERT/DELETE만. operator만 migration/seed/실험. SQL 값 바인딩·ORDER BY 허용 목록.
- 사용자별 인가는4단계. demo-user는 서버 상수이며 외부 owner 선택을 받지 않는다. API127.0.0.1:3003, DB Compose127.0.0.1:5543.
- 브라우저/Docker/배포 실행을 주장하지 않는다. 원본 커리큘럼·학습0·BunkerWeb 마지막을 보존한다.

## Review Focus

- SQL 특수문자와 정렬 문자열: 검색 값이 SQL 구조나 LIKE 와일드카드가 되지 않고 정렬은 고정 목록만 사용해야 한다(Task1/2 실제 DB+HTTP).
- 동률·깊은/빈 페이지·조건 변경: 안정적인 id tie-break와 limit+1 경계, UI offset0을 확인한다(Task1/2).
- 동시 즐겨찾기와 재시작: 복합 키로 중복을 막고 재시도 멱등·DB 지속성을 증명한다(Task1/2).
- 잘못된 migration/역할·DB 장애: 부분 적용을 rollback하고 최소 권한을 실제 거부로 검증하며 API는 SQL 원문 없는503이어야 한다(Task1/2).
- 테스트/실험 대상 오지정: loopback·DB 이름 확인 전에 DDL을 보내지 않고 사용자의 기존 schema/table을 지우지 않는다(Task1/3).

### Task 1: 실제 DB 계약·마이그레이션·SQL 시작 코드와 완성본

**Files:** labs/part-03/server/{package.json,tsconfig.json,src/{types.ts,repository.ts,migrate.ts,db-cli.ts,fixtures.ts},migrations/{001-schema.sql,002-index.sql}}, checks/part-03/{db.test.ts,db.config.ts,db-fixture.ts,run.mjs}, reference-solutions/part-03/{package.json,package-lock.json,server/}, root package/lock, compose.part-03.yml.

**Interfaces:** Broadcast={id,title,hostName,viewerCount,description,favorite}; ListQuery={search:string,sort:'viewers-desc'|'title-asc',limit:number,offset:number,favoritesOnly:boolean}; Page={items:Broadcast[],limit,offset,hasMore}. BroadcastRepository(pool:Pool).list(query):Promise<Page>, get(id):Promise<Broadcast|null>, setFavorite(id,enabled):Promise<void>. DEMO_USER='demo-user'. applyMigrations(pool:Pool,migrations?:readonly Migration[]):Promise<number>, Migration={version:string,sql:string}. seed(pool):Promise<void>. Runtime app receives Pool via Nest DI.

- [x] 작성: 실제 DB 검증. seed6행, 동률 페이지 ids d/a→e/b→c/f→empty, limit+1 hasMore, LIKE 문자와 주입 문자열, 즐겨찾기 중복·동시 변경·지속성, CHECK/FK/PK/CASCADE, migration 2→0·checksum 수정 거부·실패 rollback, app DDL/방송 쓰기 거부, 잘못된 대상 URL 거부.
- [x] 기동 가능한 시작 schema·미구현 repository와 같은 reference stub에 적용해 행동 RED를 확인한다. 구문/모듈/연결 오류는 정상 실패로 세지 않는다.
- [x] reference 제약·보조 인덱스·바인딩 SQL·멱등 변경을 구현하고 같은 DB 검증 GREEN을 확인한다. 공개 runner는 대상 없을 때 명시적 실패다.
- [x] root/참고 패키지 정확한 의존성·Node 정책·Compose 선택 구성을 고정한다. typecheck/build exit0과 DB GREEN 후 커밋한다.

### Task 2: HTTP·페이지/저장 UI 연결

**Files:** server/src/{create-app.ts,main.ts,broadcast.controller.ts,broadcast.service.ts,broadcast.dto.ts,raw-input-keys.pipe.ts}; client/{package.json,tsconfig.json,index.html,vite.config.ts,src/{types.ts,api.ts,App.tsx,main.tsx,styles.css,useLatestRequest.ts}} in labs/part-03 and reference-solutions/part-03; checks/part-03/{http.test.ts,ui.test.tsx,client.config.ts,setup.ts}.

**Interfaces:** createApp(pool:Pool):Promise<NestExpressApplication>. HTTP contracts exactly as spec. fetchPage(query,signal):Promise<Page>, setFavorite(id,enabled):Promise<{id:string,favorite:boolean}>. Client uses provided completed useLatestRequest from part02. The UI changes query conditions at offset0; previous/next increments by limit.

- [x] 작성: actual HTTP 200/400/404, unknown/special keys·중복 query·limit/offset/owner 거부·직접 SQL 주입·DB503 정제·실패 후 불변·새 app 지속성. jsdom: 다음/이전·조건 리셋·서버 저장 반영/실패·늦은 결과 무시·재시도.
- [x] 같은 reference의 아직 없는 연결을 정상 기동되는 stub 상태로 실행해 RED를 확인한다. HTTP/Nest/React 선수 코드를 구현해 GREEN으로 만든다. 시작 코드에는 SQL/제약 과제만 남긴다.
- [x] 양쪽 typecheck/build와 Task1+2 전체 GREEN 후 커밋한다. 브라우저 성공으로 기록하지 않는다.

### Task 3: 실행 계획 실험·3주 교재·독립 설치·최종 리뷰·게시

**Files:** server/src/experiment.ts; docs/tasks/part-03/{README.md,explanation.md,submission.md,browser-checklist.md}; docs/experiments/part-03/ci-postgres.json; docs/verification/part-03.md; reference-solutions/part-03/README.md; README.md, progress.md, AGENTS.md, SECURITY_CURRICULUM.md, engine policy.

**Interfaces:** experiment CLI reads operator env, enforces local lab DB before connecting, TEMP-only 1000/10000/100000. JSON report has environment, version, row count, first/deep EXPLAIN before/after, all/page response bytes; no connection strings.

- [ ] 작성: 잘못된 대상 URL·허용 행 수 거부와 실험 report shape 검증을 먼저 RED→GREEN으로 구현한다. 실제 세 크기 실험을 실행하고 결과·한계만 기록한다.
- [ ] A제약/B조회/C즐겨찾기/D분석, 3주 배분·힌트·설명3개·독립 cursor 변경·제출 양식·미실행 브라우저 목록을 작성한다.
- [ ] 새 디렉터리에서 reference만 clean npm ci/typecheck/build·실제 DB API를 확인한다. root ci, 전체 DB/HTTP/UI, 기존0/1/2·engine 회귀와 링크/비밀 패턴/기본명령 보존 검사 Expected: 모두 통과.
- [ ] 새 컨텍스트 리뷰1회, Important/Critical을 한 번의 RED→GREEN 수정 및 전체 회귀로 처리한다. 판단/보류를 검증 기록에 남기고 authoring3 완료·learner0 유지 후 커밋한다.

**게시 절차:** 최신 main SHA를 확인하고 expected SHA·force false로 게시한다. 전체 원격 tree가 로컬 검증 tree와 같을 때 제목만 알린다. 이후 본 과정4단계로 이어간다.

자체 검토: Page/HTTP/client 이름 일치, no per-user auth claim, migration operator와 app 권한 분리, 실제 Actions18.6 service와 미실행 로컬 Compose 구분, 관측된 성능만 제출, 나머지 교재/학습0 보존. 이전 위임에 따라 승인 질문을 반복하지 않는다. native18.4 실행 가정은 UID mapping 제한 조사 후 Actions로 대체했다.
