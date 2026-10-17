# 2단계 HTTP API와 느린 응답 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkboxes. 사용자는 이후 강의 계획·실행·커밋·푸시를 중간 승인 없이 위임했다.

**Goal:** 3주 분량의 실제 HTTP·NestJS 입력 검증·응답 역전·취소·오류 복구 교재를 완성한다.

**Architecture:** labs/part-02/client·server 시작 코드, checks/part-02 공개 검증, reference-solutions/part-02 독립 workspace 완성본. 기존 기본 명령과 학습 단계 0은 유지한다. HTTP 서버 검증은 tsc의 ESM metadata 빌드를 사용하고 클라이언트는 별도 jsdom 환경에서 검사한다.

**Tech Stack:** 기존 React 19.3.1·TS 7.0.2·Vite 8.3.4·Vitest 5.0.5, NestJS 12.1.3와 class-validator·class-transformer·reflect-metadata·rxjs. 정확한 의존성은 npm 메타데이터로 확인해 고정한다. 새 상태 관리·라우터·HTTP 클라이언트 라이브러리는 없다.

**Spec:** [설계](../specs/2026-10-17-part-02-design.md), [원본 2단계](../../../CURRICULUM.md), [보안 추가 과정](../../../SECURITY_CURRICULUM.md).

## Global Constraints

- Node 지원 범위 ^22.22.2 || ^24.15.0 || >=26.0.0을 잠긴 의존성들과 검증한다. 현재 실행은 Node 24.19.0.
- 서버 127.0.0.1:3002 기본, 개발 프록시 /api. DB·인증·영상·공개 배포는 추가하지 않는다.
- API의 search 최대 80, id 1~32, JSON limit 8kb. 타입·배열·null·알 수 없는 필드 거부를 실제 HTTP로 검증한다. 최종 리뷰에 따라 변환 전 own key 검사도 포함한다.
- scenario slow: trim search 길이 <=1은 450ms, 나머지 30ms. error 503. no-store.
- 브라우저 설치·실행은 재시도하지 않는다. 실행하지 않은 증거와 학습 통과를 만들지 않는다.
- root의 기본 실행·검증과 기존 0/1단계를 보존한다. 참고 완성본은 root workspace에서 제외한다.

## Review Focus

- 앞선 성공/실패가 최신 검색·상세 결과를 덮는 역전: abort 무시 Promise도 검사한다.
- DTO의 null·배열·중복 query·미정의 필드·유효하지 않은 id: 타입 선언 밖의 입력을 실제 HTTP로 보낸다.
- 잘못된 JSON과 큰 본문: 서비스 도달 전 파싱 오류·413을 구분하고 서버가 계속 응답하는지 확인한다.
- 서버 중단/503/404 후 재시도: 목록과 상세가 서로의 오류·선택을 덮지 않도록 UI와 loader를 검사한다.
- standalone에서 metadata·중첩 workspace·프록시가 누락됨: clean npm ci·양쪽 build·실제 HTTP 연결을 확인한다.

### Task 1: 서버 계약과 시작 코드

**Files:** Create labs/part-02/server/{package.json,tsconfig.json,src/{types.ts,fixtures.ts,broadcast.dto.ts,broadcast.service.ts,broadcast.controller.ts,app.module.ts,create-app.ts,main.ts}}, checks/part-02/{run.mjs,server.config.ts,api.test.ts}. Modify root package.json·lockfile.

**Interfaces:** createApp(): Promise<NestExpressApplication>. BroadcastsService.list(query: ListDto): Promise<{items:Broadcast[]}>; get(id: string, scenario?: Scenario): Promise<Broadcast>. DTO/Pipe contracts are in spec. Run modes exercise|reference and server|client|all only.

- [x] 정상 기동되는 Nest 골격과 A: 비어 있는 list/get, B: DTO 검증·Pipe 과제를 만든다. 루트 workspace에 client/server를 추가하되 기본 명령은 유지한다.
- [x] 서버 검증 먼저 작성: 목록 6개·검색/정렬·상세·404·400·413·503·no-store·응답 역전·파싱 오류 후 정상 응답. 학생 코드에서 assertion 실패를 확인한다.
- [x] 타입 검사·서버 빌드를 실행한다. Expected: exit 0. 로컬 커밋한다.

### Task 2: 클라이언트 요청·최신 응답 실습

**Files:** Create labs/part-02/client/{package.json,index.html,tsconfig.json,vite.config.ts,src/{types.ts,api.ts,useLatestRequest.ts,App.tsx,main.tsx,BroadcastList.tsx,BroadcastDetail.tsx,FilterDisclosure.tsx,useElapsedSeconds.ts,domain.ts,styles.css}}, checks/part-02/{client.config.ts,setup.ts,client-api.test.ts,request.test.tsx,ui.test.tsx}.

**Interfaces:** fetchBroadcasts(query:{search:string;sort:SortOrder;scenario:Scenario}, signal:AbortSignal):Promise<Broadcast[]>; fetchBroadcast(id:string,scenario:Scenario,signal:AbortSignal):Promise<Broadcast>. ApiError has status:number. useLatestRequest<T>(request:((signal:AbortSignal)=>Promise<T>)|null, refreshKey?:number):RemoteState<T>, whose status is idle/loading/success/error. App supplies stable useCallback loaders for independent list/detail.

- [x] 1단계 완료 UI를 선수 기능으로 제공한다. C: fetch·상태 코드/JSON 검증, D: Hook의 로딩·정리·최신 응답만 과제로 남긴다.
- [x] fetch 인코딩·status·잘못된 JSON/shape·signal 전달 검증을 먼저 작성한다. Hook은 초기 null·성공·이전 성공/실패 무시·abort·언마운트·재시도를 검사한다.
- [x] UI에서 목록/상세 HTTP 연결·빠른 검색·404·503·재시도·즐겨찾기·숨긴 상세 유지의 대표 경로를 검사한다. 시작 코드의 실패는 구문 오류가 아닌 assertion임을 확인한다.
- [x] client 타입 검사·빌드 Expected: exit 0. 로컬 커밋한다.

### Task 3: 완성본·교재·회귀·검토·푸시

**Files:** Create reference-solutions/part-02/{package.json,package-lock.json,client/,server/,README.md}; docs/tasks/part-02/{README.md,explanation.md,submission.md,browser-checklist.md}; docs/verification/part-02.md. Modify README.md, progress.md, AGENTS.md, SECURITY_CURRICULUM.md, authoring engine policy.

**Interfaces:** 같은 공개 검증을 완성본에도 사용한다. 독립 완성본은 별도 client/server workspace와 lockfile을 갖고 root 밖에서도 npm ci·build·run이 가능하다.

- [x] 시작 코드와 같은 미완성 완성본에 RED를 확인한 뒤 A~D를 구현해 GREEN으로 만든다. 반환 shape·지연·DTO·정리 계약은 바꾸지 않는다.
- [x] 실제 API와 client loader의 연결을 확인하고 양쪽 타입 검사·빌드, 기존 0/1단계 완성본과 engine 정책 회귀를 실행한다. Expected: 모두 통과.
- [x] 완성본만 새 디렉터리에 복사해 clean npm ci·양쪽 typecheck/build·로컬 API·Vite 프록시 제공을 확인한다. 브라우저 렌더링과 구분한다.
- [x] 3주 과제·힌트·설명 3개·독립 timeout 변경 과제·Network 제출 양식·캐시 기본 개념·브라우저 미실행 목록을 작성한다. 학생 상태 0·미시작을 유지한다.
- [x] 마지막 독립 리뷰 1회와 중요한 문제의 RED→GREEN 수정·전체 회귀를 수행한다. 검증·판단·보류를 기록하고 커밋한다.

리뷰 보강 파일: server/src/raw-input-keys.pipe.ts를 시작 코드와 완성본에 추가했다. 입력 키 검사는 DTO 변환 전에, DTO 값 검증은 다음 Pipe에서 실행한다. 15개 재현 RED→GREEN과 최종 72개 통과는 [검증 기록](../../verification/part-02.md)에 남겼다.

**게시 절차:** 최신 main 변경을 보존하고 expected SHA로 게시한다. 원격 tree가 검증한 로컬 tree와 일치한 후 제목만 알린다.

자체 검토: 서버/client 경계의 Broadcast JSON과 query 이름 일치. metadata 빌드를 공개 runner가 수행. Body null은 IsOptional만으로 허용하지 않음. 브라우저 보류와 실제 HTTP 검증을 구분함. 사용자가 선택한 직접 실행 + 마지막 리뷰를 유지한다.
