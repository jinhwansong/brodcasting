# 1단계 시청 화면·상호작용 교재 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the preserved native execution method. Track steps with checkboxes. 사용자는 이 계획을 검토·승인했고 이후 교재의 계획 검토·실행도 중간 승인 없이 위임했다.

**Goal:** 1단계의 2주 분량을 목록·상세·상태 공유·반응형·키보드·메뉴·자원 정리를 직접 설명하고 변경할 수 있는 교재로 제작한다.

**Architecture:** 0단계와 같은 시작 코드 / 공개 행동 검증 / 해설 / 별도 참고 완성본 구조를 유지한다. 1단계는 독립 실습 폴더에서 0단계 기능을 전제로 확장하고, 학습자의 현재 단계와 기존 0단계 기본 실행 명령은 바꾸지 않는다. 상세 선택은 id로, 필터 결과는 원본 상태에서 파생하며 메뉴와 타이머의 수명을 각각 분리한다.

**Tech Stack:** 0단계에서 고정한 React·TypeScript·Vite·Vitest·Testing Library·Playwright와 npm. 새 라우터·상태 관리·UI 라이브러리는 도입하지 않는다. Node 지원 범위는 기존 `^22.22.2 || ^24.15.0 || >=26.0.0`, 실제 제작 검증 런타임은 24.19.0을 유지한다.

**Spec:** [CURRICULUM.md](../../../CURRICULUM.md)의 1단계와 공통 학습·통과 기준. 사용자의 브라우저 검증 추후 수행 및 강의별 자동 커밋·푸시 지시를 적용한다.

## Global Constraints

- 자동 테스트 통과만으로 학습 완료 처리하지 않는다.
- 참고 완성본은 별도 디렉터리에 보관하고 학습 과제의 기본 읽기 범위에서 제외한다.
- 실행하지 않은 검증은 미실행으로 적는다.
- 비밀값과 실제 개인정보는 제외한다.
- 실제 영상 재생은 8단계다. 이번 상세에는 미디어 자리 표시자만 제공하고 영상 기능을 주장하지 않는다.
- 브라우저 검증은 사용자 요청으로 후속 작업이다. 설치 재시도·권한 우회·다른 실행 환경 자동 이전은 하지 않는다.
- 기존 0단계의 코드·검증·학습 상태를 보존한다. 새 교재를 만들었다고 학습자의 다음 단계 진입을 기록하지 않는다.
- 완성된 강의만 실행 근거와 리뷰를 기록한 후 푸시한다. 원격 일치 확인 뒤 제목으로 보고한다.

## Review Focus

- 필터가 선택한 방송을 숨김: 상세는 원본 목록의 선택 id에서 파생해 유지되고, 닫을 때 원래 버튼이 없으면 검색 입력으로 포커스를 돌린다. Task 1 UI 검증.
- 목록·상세 양쪽에서 즐겨찾기 변경: 같은 id의 표시가 즉시 일치하고 검색·정렬 조건을 잃지 않는다. Task 1 UI 검증.
- 메뉴를 반복 열고 닫거나 StrictMode로 재마운트: Escape·바깥 클릭 처리와 이벤트 정리가 중복·잔존하지 않는다. Task 2 행동 검증.
- 상세 전환·닫기·언마운트: 표시 시간이 초기화되며 남은 interval이 없다. Task 2 가짜 타이머 검증.
- 좁은 화면과 키보드 포커스: 의미 구조·라벨·제어 관계는 jsdom에서 검사하고 실제 390px/1280px 레이아웃·탭 이동은 브라우저 후속 목록에 미검증으로 둔다. Task 3.

---

### Task 1: 목록·상세와 공유 상태 실습

**Files:** Create `labs/part-01/`의 package.json·index.html·tsconfig.json·vite.config.ts·src/main.tsx·src/types.ts·src/fixtures.ts·src/domain.ts·src/App.tsx·src/BroadcastList.tsx·src/BroadcastDetail.tsx, `checks/part-01/run.mjs`, `checks/part-01/vitest.config.ts`, `checks/part-01/setup.ts`, `checks/part-01/selection.test.tsx`. Modify root `package.json`, `package-lock.json`, `AGENTS.md`.

**Interfaces:** 기존 Broadcast 필드에 `description: string`을 추가한다. Query와 검색·정렬·즐겨찾기 함수의 계약은 0단계를 유지한다. `getSelectedBroadcast(items: readonly Broadcast[], selectedId: string | null): Broadcast | undefined`. `BroadcastList`는 `items`, `favoriteIds`, `onSelect(id: string, trigger: HTMLButtonElement)`, `onToggleFavorite(id: string)`을 받는다. `BroadcastDetail`은 `broadcast`, `isFavorite`, `onClose()`, `onToggleFavorite(id: string)`을 받는다. App은 조회 원본·조건·즐겨찾기·선택 id를 소유한다.

- [x] 기존 도구 설정을 재사용하고 루트 workspace에 `labs/part-01`만 추가한다. 참고 완성본은 workspace에서 제외한다. `dev:part-01`, `typecheck:part-01`, `build:part-01`, `check:part-01`, `check:reference:part-01` 명령을 추가하되 기존 기본 명령은 0단계로 유지한다.
- [x] 공개 검증 resolver는 기본 exercise, 명시적 reference만 허용하고 다른 LAB_TARGET은 거부한다. `@submission`을 해당 1단계 src에 연결한다.
- [x] 검증을 먼저 작성한다: 초기 상세 없음, ‘새벽 React 작업실 상세 보기’ 후 같은 제목·설명 표시, 상세 제목에 포커스, 검색으로 해당 목록 항목을 숨겨도 상세 유지, 상세 닫기 후 검색 포커스, 목록에서 선택하고 바로 닫으면 원래 버튼 포커스, 양쪽 즐겨찾기 동기화.
- [x] getSelectedBroadcast의 null·없는 id·동일 id에 갱신된 제목을 가진 입력을 검증한다. 필터 결과가 아니라 전체 원본에서 선택을 찾는다는 계약을 명시한다.
- [x] 시작 코드에 0단계 선수 기능과 의미 구조를 제공하되 선택·상세 상태 연결을 과제 A로 남긴다. 같은 검증이 모듈 오류가 아닌 행동 assertion으로 실패하는지 실행한다.
- [x] 교재 제작 모드에만 이번 1단계를 추가한다. 학습 보조의 기본 읽기 범위는 progress.md의 현재 학습 단계이며 미래 교재·완성본을 자동으로 읽지 않는다.
- [x] `npm run typecheck:part-01`, `npm run build:part-01`을 실행한다. Expected: exit 0. 미완성 시작 코드의 행동 실패는 이름과 실제 개수를 기록한다.
- [x] 로컬 커밋: `feat: scaffold part 01 selection and shared state exercise`.

### Task 2: 펼침 메뉴·포커스·타이머 수명 실습

**Files:** Create `labs/part-01/src/FilterDisclosure.tsx`, `labs/part-01/src/useElapsedSeconds.ts`, `checks/part-01/disclosure.test.tsx`, `checks/part-01/timer.test.tsx`. Modify `labs/part-01/src/App.tsx`, `labs/part-01/src/BroadcastDetail.tsx`.

**Interfaces:** `FilterDisclosure({ query: Query, onChange: (query: Query) => void })`는 ‘목록 옵션’ 버튼과 실제 input/button을 포함한 펼침 영역이다. 복잡한 ARIA menu 역할이나 화살표 키 탐색을 임의로 도입하지 않는다. `useElapsedSeconds(broadcastId: string | null): number`는 1초 간격의 상세 화면 체류 시간을 반환하며 실제 영상 재생 시간이 아니다.

- [x] 공개 검증을 먼저 작성한다: 닫힌 메뉴의 aria-expanded=false, 클릭 후 true와 제어 영역 표시, 내부 즐겨찾기 조건 변경, Escape 닫힘·트리거 포커스 복귀, 바깥 클릭 닫힘, 반복 열기와 언마운트 후 바깥 요소의 포커스가 방해되지 않음.
- [x] 타이머 검증을 먼저 작성한다: null이면 0과 활성 interval 없음, id a로 3초 진행하면 3, id b로 바꾸면 0, 다시 1초 진행하면 1, null·언마운트 후 interval 0. StrictMode에서도 언마운트 후 timer가 남지 않아야 한다.
- [x] 시작 코드에는 닫힌 메뉴 골격과 항상 0을 반환하는 hook을 제공한다. 각각 과제 B·C로 표시하고, 테스트가 올바른 실패 이유를 보이는지 실행한다.
- [x] 과제 문구에 메뉴 상태는 메뉴에, 공유 필터·즐겨찾기는 App에 둔 이유를 묻는다. 이벤트 등록을 Effect에서 정리하지 않을 때의 재현 순서를 제시한다.
- [x] 타입 검사·빌드는 성공하고 행동 실패는 남아 있는 시작 코드의 상태를 명시해 커밋한다: `test: define part 01 disclosure and lifetime contracts`.

### Task 3: 반응형 교재·완성본·검증·푸시

**Files:** Create `labs/part-01/src/styles.css`, `reference-solutions/part-01/`의 독립 프로젝트·README, `docs/tasks/part-01/README.md`, `docs/tasks/part-01/explanation.md`, `docs/tasks/part-01/submission.md`, `docs/tasks/part-01/browser-checklist.md`, `docs/verification/part-01.md`. Modify `README.md`, `progress.md`, `checks/part-00/engines.test.mjs`.

**Interfaces:** 1단계 완성본은 Task 1~2와 동일한 함수·컴포넌트 계약과 공개 테스트를 사용한다. 별도 package.json·lockfile로 단독 설치된다. 교재의 첫 주는 의미 구조·선택·파생 상태, 둘째 주는 메뉴·포커스·자원 정리·반응형·설명·변경으로 나눈다.

- [x] 시작 코드와 같은 미완성 상태에 공개 검증을 먼저 실행해 RED를 확인한다. 이후 완성본을 작성해 같은 검증을 GREEN으로 만든다. 테스트 기대값을 완성본 구현에 맞춰 바꾸지 않는다.
- [x] 목록·상세는 section과 순서 있는 제목, 실제 button·label을 사용한다. 좁은 화면에서는 한 열로 배치하고 버튼·입력의 포커스와 터치 영역을 제공한다. 시작 CSS의 반응형 완성은 과제 D로 남기고 완성본 CSS와 구분한다.
- [x] 목록 조건 변경은 선택 id를 유지한다. 데이터 재로딩 조작은 선택을 해제하고 새 로딩·성공·오류 흐름을 시작한다. 상세가 없을 때 timer는 비활성 상태다.
- [x] 해설은 상태·파생 값·ref 차이, 공유 상태 배치, disclosure 의미, Effect 정리, 타이머 한계를 설명한다. 실제 확인한 React·MDN·WAI 공식 문서를 연결한다. 완성 코드는 해설 본문에 복사하지 않는다.
- [x] 설명 질문 3개와 독립 변경 1개를 작성한다: 즐겨찾기만 보기에서 선택 방송을 해제했을 때 상세 유지/닫기 정책을 스스로 바꾸고 검증한다. 제출 양식의 예상·실제 증거·도움 범위·설명·변경 결과는 학습자 작성 대기다.
- [x] 브라우저 후속 목록에 390px/1280px 가로 넘침, Tab 순서·포커스 표시, 메뉴 Escape·바깥 클릭, 상세 닫기 복귀, 키보드와 스크린리더 검증을 둔다. 전부 미실행으로 시작한다. 브라우저 설치는 재시도하지 않는다.
- [x] 루트 npm ci, 양쪽 타입 검사·빌드, 1단계 완성본 공개 검증, 0단계 완성본 기존 24개, authoring-only engine 검증을 실행한다. Expected: 모두 exit 0. 0·1단계 시작 코드의 의도된 실패는 별도로 실제 개수를 확인한다.
- [x] 새 임시 디렉터리에 node_modules·dist 없이 1단계 완성본만 복사한다. npm ci·타입 검사·빌드와 로컬 HTTP 제공을 확인하고 브라우저 렌더링과 구분한다.
- [x] 독립 리뷰 1회를 받고 중요한 문제는 재현 테스트 RED→GREEN과 전체 회귀 검증으로 수정한다. 실제 버전·명령·결과·미검증·리뷰 판단을 docs/verification/part-01.md에 기록한다.
- [x] progress.md의 교재 제작 현황만 ‘0단계·1단계 제작 완료’로 갱신한다. 학습 상태와 현재 학습 단계 0은 유지한다. 문서 링크·비밀값·diff를 확인하고 `feat: complete part 01 interaction courseware`로 커밋한다.
**게시 절차:** 원격 최신 변경을 확인하고 사용자 변경을 보존해 main에 푸시한다. 원격 전체 tree와 로컬 검증본의 일치를 게시 직후 확인한 뒤 ‘1단계 — 시청 화면과 사용자 상호작용 교재 푸시 완료’ 제목만 보고한다.

## 계획 검토와 실행 방식

선택된 방식은 기존과 같은 직접 제작 + 마지막 독립 리뷰 1회다. 브라우저 검증 보류도 그대로 유지한다. 사용자는 2026-10-17 KST에 “ㅇㅇ”로 이 계획과 이후 강의의 중간 승인 없는 계획·제작·검증·커밋·푸시를 승인했다.
