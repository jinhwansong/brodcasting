# 0단계 교재 제작 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. 2026-10-17 사용자가 직접 제작 방식의 실행을 승인했다.

**Goal:** 제공된 커리큘럼의 0단계를 혼자 시작하고, 실행 결과를 확인하고, 설명과 변경 과제로 평가할 수 있는 교재 패키지로 제작한다.

**Architecture:** 저장소는 교재 제작물과 학습자의 제출·통과 상태를 구분한다. 0단계는 서버 없이 실행되는 독립 React 실습이며 시작 코드, 공개된 행동 검증, 요청할 때만 읽는 참고 완성본을 분리한다. 이후 파트의 서비스 구현을 미리 만들지 않는다.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, Playwright, npm. 의존성의 정확한 버전은 착수 시 공식 지원 요건과 현재 런타임을 확인한 뒤 lockfile로 고정한다.

**Spec:** [CURRICULUM.md](../../../CURRICULUM.md), 특히 ‘매 과제에서 반복할 학습 순서’, ‘공통 통과 기준’, ‘0단계’, ‘토큰이 생길 때 AI에 시킬 반복 작업’.

## Global Constraints

- 참고 완성본 제작과 학습자의 과제 통과는 별도 상태로 기록한다.
- 참고 완성본은 별도 디렉터리에 보관하고 학습 과제의 기본 읽기 범위에서 제외한다.
- 자동 테스트 통과만으로 학습 완료 처리하지 않는다.
- 실행하지 않은 검증은 미실행으로 적는다.
- 비밀값과 실제 개인정보는 제외한다.
- 원격 커밋·푸시는 사용자가 별도로 승인했다. 완성된 파트마다 검증 후 푸시하고 제목으로 보고한다.
- 실제 학습 진행, 외부 부하 발생, 유료 인프라 생성, 공개 서비스 배포는 이번 교재 제작 범위가 아니다.

## Review Focus

- 공백 검색어와 영문 대소문자: 전체 목록 또는 일치하는 제목·진행자만 표시한다. Task 2에서 검증한다.
- 동시 조건과 동률 정렬: 검색·정렬·즐겨찾기 전용 조건을 함께 적용하고, 동률은 id 오름차순으로 정렬한다. Task 2에서 검증한다.
- 입력 배열·Set 재사용: 조회와 즐겨찾기 변경이 원본 입력을 변형하지 않는다. Task 2에서 검증한다.
- 오류 후 재시도와 실제 빈 목록: 로딩·오류·데이터 없음·검색 결과 없음이 구분된다. Task 3에서 검증한다.
- 시작 코드와 참고 완성본 혼동: 기본 학습 명령은 완성본을 가져오지 않고, 시작 코드의 의도된 미완성을 완료로 표시하지 않는다. Task 1·4에서 검증한다.

## 산출물과 경계

| 위치 | 책임 |
| --- | --- |
| `README.md`, `AGENTS.md`, `progress.md` | 시작 방법, AI 읽기 범위, 학습 상태 |
| `docs/tasks/part-00/README.md` | 요구사항, 사전 예측, 시간 배분, 통과 기준 |
| `docs/tasks/part-00/explanation.md` | 단계적 힌트, 개념 설명, 공식 문서 링크 |
| `docs/tasks/part-00/submission.md` | 학습자 기록·설명·변경 과제 제출 양식 |
| `docs/verification/part-00.md` | 제작자가 실제 실행한 명령·결과·남은 한계 |
| `labs/part-00/` | 학습자가 수정할 실행 가능한 시작 프로젝트 |
| `checks/part-00/` | 시작 코드와 완성본에 동일하게 적용할 행동 검증 |
| `reference-solutions/part-00/` | 명시적으로 요청할 때만 읽는 완성 프로젝트 |

참고 완성본은 파일로 공개되어 있어 숨김·접근 통제 기능이 아니다. 기본 AI 읽기·검색·학습 실행 범위에서 제외하는 절차적 분리다.

### Task 1: 학습 경계와 재현 가능한 시작 환경

**Files:** Create `README.md`, `AGENTS.md`, `progress.md`, `.gitignore`, `labs/part-00/package.json`, `labs/part-00/package-lock.json`, `labs/part-00/index.html`, `labs/part-00/tsconfig.json`, `labs/part-00/vite.config.ts`, `labs/part-00/src/main.tsx`, `reference-solutions/AGENTS.md`.

**Interfaces:** 학습자의 기본 작업 위치는 `labs/part-00/`. 제작 명령과 학습 명령을 README에서 구분한다. `progress.md`의 초기 학습 상태는 ‘미시작’, 제작 상태는 ‘진행 중’이다.

- [x] 공식 React·Vite·Vitest·Playwright 문서로 Node 지원 요건과 설치 명령을 확인하고, 출처와 선택한 버전을 기록한다.
- [x] 실패 검증을 먼저 정의한다: 기본 시작 프로젝트가 없으면 설치·타입 검사·빌드가 실행되지 않는 상태를 확인한다.
- [x] 환경 파일과 최소 화면을 작성한다. 시작 프로젝트는 빌드되지만 학습 대상 핵심 로직은 미완성으로 명시한다.
- [x] `AGENTS.md`에 참고 완성본의 기본 읽기·검색 제외, 학습자 답변 대기, 실제 증거만 기록하는 규칙을 작성한다. 요청 없이 다음 학습 단계로 넘어가지 않는다.
- [x] `npm ci`, `npm run typecheck`, `npm run build`를 `labs/part-00/`에서 실행한다. 기본 명령에 `reference-solutions/` 의존성이 없는지 확인한다.
- [x] 변경 파일을 명시해 로컬 커밋한다: `chore: prepare isolated part 00 learning environment`.

### Task 2: 요구사항과 독립 행동 검증

**Files:** Create `labs/part-00/src/types.ts`, `labs/part-00/src/fixtures.ts`, `labs/part-00/src/domain.ts`, `checks/part-00/domain.test.ts`, `checks/part-00/vitest.config.ts`, `docs/tasks/part-00/README.md`.

**Interfaces:** `Broadcast = { id: string; title: string; hostName: string; viewerCount: number }`; `SortOrder = 'viewers-desc' | 'title-asc'`; `Query = { search: string; sort: SortOrder; favoritesOnly: boolean }`. `selectBroadcasts(items: readonly Broadcast[], query: Query, favorites: ReadonlySet<string>): Broadcast[]`; `toggleFavorite(favorites: ReadonlySet<string>, id: string): Set<string>`. 검색은 trim 후 제목 또는 진행자의 대소문자 무시 부분 일치다. 제목 정렬의 비교 기준은 한국어 로케일로 고정한다.

- [x] 고정 모의 방송 6개 이상을 작성한다. 제목과 진행자 검색, 동률 시청자 수, 빈 검색 결과, 영문 대소문자를 각각 구별할 수 있는 데이터를 사용한다.
- [x] `domain.test.ts`에 공백·대소문자 검색, 조건의 동시 적용, 두 정렬 방식과 동률 id 순서, 즐겨찾기 두 번 토글, 입력 배열·Set 불변성을 먼저 검증하는 테스트를 작성한다. 구현 세부나 파일 내용 문자열을 정답으로 검사하지 않는다.
- [x] `checks/part-00/vitest.config.ts`는 `@submission`을 기본 `labs/part-00/src/`로 연결하고, 명시적 `LAB_TARGET=reference`일 때만 완성본의 `src/`로 연결한다. 다른 값은 오류로 거부한다.
- [x] 시작 코드에 타입이 맞는 미완성 함수를 작성한다. `npm run check:exercise`가 학습 대상 로직 미구현 때문에 실패함을 확인하고, 도구 설정 오류와 구분해 기록한다.
- [x] 과제 본문에 입력 예시, 결과 예시, 조합 규칙, 실패 상황, 설명 질문 3개와 해설 없이 풀 변경 과제 1개를 작성한다. 테스트 통과와 학습 통과를 구분한다.
- [x] 로컬 커밋: `test: define part 00 behavioral contract and exercise`.

### Task 3: 목록 화면과 비동기 상태 실습

**Files:** Create `labs/part-00/src/App.tsx`, `labs/part-00/src/styles.css`, `labs/part-00/src/loadBroadcasts.ts`, `checks/part-00/ui.test.tsx`, `checks/part-00/browser.spec.ts`, `checks/part-00/playwright.config.ts`, `docs/tasks/part-00/explanation.md`.

**Interfaces:** `loadBroadcasts(mode: 'success' | 'empty' | 'error'): Promise<Broadcast[]>`. 모의 데이터 로딩만 수행하며 외부 서버를 사용하지 않는다. 화면은 검색·정렬·즐겨찾기 전용 조건, 목록, 상태 안내와 재시도 조작을 제공한다. 핵심 검색·정렬·즐겨찾기 로직은 Task 2 함수를 호출한다.

- [x] 공개 UI 검증을 먼저 작성한다: 검색·정렬 동시 반영, 즐겨찾기 표시와 전용 목록, 초기 로딩, 실제 빈 목록, 검색 결과 없음, 오류 후 재시도 성공을 검사한다.
- [x] 시작 프로젝트에는 UI 골격과 모의 로더를 제공하되 학습 대상 상태 연결을 미완성으로 표시한다. 재시도·로딩 흐름에서 학습자가 채울 위치를 정확히 문서화한다.
- [x] 비동기 출력 순서 예측 문제를 작성한다. 질문은 과제에, 실제 결과와 설명은 해설의 접힌 영역에 두고, 학습자의 예측을 대신 작성하지 않는다.
- [x] React 상태·파생 값·불변성과 Promise를 설명하는 짧은 해설과 실제 열어 확인한 공식 문서 링크를 추가한다. 완성 코드 전체는 해설 본문에 복사하지 않는다.
- [x] 접근 가능한 라벨·버튼·상태 영역을 제공한다. Playwright로 키보드 조작과 390px·1280px 너비에서 핵심 컨트롤을 확인할 검증을 작성한다.
- [x] 로컬 커밋: `feat: add part 00 learning screen and async state exercises`.

### Task 4: 참고 완성본·검증 기록·파트 푸시

**Files:** Create `reference-solutions/part-00/`의 독립 실행 프로젝트, `reference-solutions/part-00/README.md`, `docs/tasks/part-00/submission.md`, `docs/verification/part-00.md`. Modify `README.md`, `progress.md`.

**Interfaces:** 완성본은 Task 2의 타입·함수와 Task 3의 화면 계약을 동일하게 구현한다. `npm run check:reference`만 명시적으로 완성본을 대상으로 검증한다. 학습자의 기본 `npm run check:exercise`는 시작 코드만 검사한다.

- [ ] 동일한 행동 테스트를 미완성 코드로 실행해 실제 실패를 확인한다. 이후 완성본을 작성하고 같은 테스트가 통과하는지 확인한다. 테스트 기대값을 완성본에 맞춰 바꾸지 않는다.
- [ ] 완성본에서 검색·정렬·불변 즐겨찾기, 상태 구분과 오류 복구를 구현한다. 모의 로더는 외부 요청을 하지 않는다.
- [ ] 시작 코드와 완성본 각각 `npm ci`, 타입 검사, 배포 빌드를 실행한다. 완성본의 도메인·UI 테스트와 Chromium 브라우저 테스트를 실행한다.
- [ ] 완성본을 새 임시 디렉터리에 복사해 문서의 설치·실행 순서로 재현한다. 로컬 테스트·빌드 캐시가 있어야만 성공하는 구조가 아닌지 확인한다.
- [ ] `docs/verification/part-00.md`에 실제 명령, 환경·의존성 버전, 결과와 브라우저 범위, 시작 코드의 의도된 실패를 기록한다. 다른 브라우저와 학습자 설명 평가는 미실행으로 남긴다.
- [ ] 제출 양식에 예상·실제 차이, AI 도움 범위, 설명 답변, 독립 변경 과제와 남은 의문을 둔다. `progress.md`는 ‘교재 제작 완료 / 학습 미시작’으로만 갱신한다.
- [ ] 파일별 diff, 비밀값, 링크, 문서의 실제 명령 일치 여부를 자체 검토한다. 전체 파트 검증 후 `feat: complete part 00 learning package`로 커밋한다.
- [ ] 원격의 새로운 변경을 확인하고 충돌 없이 푸시한다. 원격 커밋과 파일을 다시 확인한 뒤 `0단계 — 실력 진단 교재 푸시 완료`라는 제목으로 보고한다.

## 이후 진행

0단계 패키지의 제작 검증을 마친 뒤 같은 산출물 계약으로 1단계를 계획한다. 39주 전체 서비스나 알림 시스템을 이번 파트에 선구현하지 않는다. 원문에 연결된 별도 `notification-runtime-curriculum.md`는 제공되지 않았으므로 읽었다고 가정하지 않으며, 알림 파트 착수 시 제공 여부나 보충 제작 범위를 확인한다.

## 계획 자체 검토

- 원문 0단계의 검색·정렬·즐겨찾기, 비동기 예측, 상태 구분, 제출·설명·변경 기준을 Task 1~4에 대응했다.
- 참고 완성본의 기본 읽기 제외를 접근 통제로 과장하지 않는다.
- 시작 코드의 실패와 제작 실패를 구분하며 실행하지 않은 수치를 적지 않는다.
- 2026-10-17 사용자 승인 후 Task 1~4의 교재를 제작하고 도메인·UI·도구 호환성·타입 검사·빌드를 검증했다. 실제 브라우저 검증은 설치 권한에 막혔고, 사용자가 추후 직접 수행하고 교재 완성·푸시를 우선하도록 명시했다. 따라서 브라우저 검증만 후속 작업으로 남긴다. 루트 workspace/lockfile 변경과 리뷰 결과는 제작 검증 기록에 남겼다.
