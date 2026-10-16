# 1단계 — 단계별 해설

먼저 예상을 쓰고 첫 구현을 한 뒤 필요한 힌트만 여세요. 여기에는 완성 코드를 싣지 않습니다.

## 상태를 고르는 질문

사용자가 직접 바꾸는 최소 정보와 그 정보로 계산 가능한 값을 분리하세요. 원본 목록·검색 조건·즐겨찾기 집합·선택 id가 있으면 표시 목록과 선택 객체를 다시 계산할 수 있습니다. 객체를 따로 저장하면 같은 id의 새 원본을 받아도 오래된 제목을 표시할 수 있습니다. 단순히 `useMemo`를 붙이는 것으로 중복 상태가 해결되지는 않습니다.

<details><summary>A 힌트 1 — 전체 원본과 표시 목록</summary>

선택한 id는 유지한 채 검색어만 바꾸고 두 배열에 그 id가 있는지 비교하세요. 선택 조회 함수의 입력에 어떤 배열을 넘겨야 상세 유지 계약을 지킬 수 있나요? 업데이트된 같은 id 객체를 넣는 공개 테스트도 읽어보세요.

</details>

<details><summary>A 힌트 2 — 공유 상태와 DOM 참조</summary>

즐겨찾기 집합을 각각의 목록·상세에 복사하는 대신 가장 가까운 공통 부모에서 전달해 보세요. DOM 버튼은 화면 데이터가 아니라 포커스 복귀를 위한 참조입니다. ref 변경은 렌더링을 예약하지 않습니다. 닫기 전에 버튼의 `isConnected`를 확인하면 검색으로 사라진 경우를 구분할 수 있습니다. 상세 제목은 프로그램으로 포커스할 수 있어야 하지만 일반 Tab 순서에 넣을 필요는 없습니다.

</details>

## 이벤트 수명과 의미

목록 옵션은 일반 입력들을 접었다 펴는 disclosure입니다. 버튼·`aria-expanded`·영역 id의 관계를 먼저 구현하세요. ARIA 역할을 추가하는 것만으로 키보드 동작이 생기지 않습니다. 이 과제에는 복잡한 메뉴의 화살표 탐색 계약이 없습니다.

<details><summary>B 힌트 — 두 가지 닫기의 차이</summary>

Escape 후에는 트리거가 다음 조작의 기준점입니다. 바깥 클릭 후에는 클릭한 입력·버튼이 기준점이므로 트리거로 포커스를 강제로 돌리지 않습니다. 문서 이벤트를 언제 등록할지, 해당 등록에서 만든 정확히 같은 함수를 어디서 제거할지 종이에 짝지어 적으세요. 열기 → Escape → 열기 → 바깥 클릭 → 언마운트 후 Escape 순서로 실험하세요.

</details>

<details><summary>C 힌트 — Effect의 시작과 끝</summary>

타이머가 필요한 조건은 ‘선택한 id가 있음’입니다. id가 바뀌면 기존 Effect의 정리가 먼저 수행되고 다음 설정으로 넘어갑니다. 이전 숫자를 기반으로 증가할 때 오래된 렌더의 숫자를 붙잡지 않도록 상태 갱신 형식을 확인하세요. 개발 StrictMode의 추가 설정·정리에서도 활성 interval은 하나여야 합니다. Hook 단위 검증과 실제 App 연결 검증은 다른 결함을 잡습니다.

</details>

## 레이아웃의 원인 찾기

초기 CSS에는 두 열에 각각 360px 최소 너비가 있습니다. 390px 화면에서 패딩·간격까지 더하면 왜 넘치는지 계산하세요. 넘침을 가리는 대신 열의 최소 크기, 긴 제목의 줄바꿈, 컨트롤의 실제 너비를 다루세요. 포커스를 `outline: none`으로 지우지 않습니다. 체크리스트의 실제 브라우저 항목은 실행 전까지 미검증입니다.

## 확인한 공식 문서

- [React: 상태 구조 선택](https://react.dev/learn/choosing-the-state-structure) — 중복·파생 상태
- [React: 컴포넌트 사이 상태 공유](https://react.dev/learn/sharing-state-between-components) — 공통 부모와 단일 소유자
- [React: useEffect](https://react.dev/reference/react/useEffect) — 의존성, 설정과 정리, StrictMode
- [WAI-ARIA APG: Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) — 버튼과 펼침 상태
- [MDN: HTMLElement.focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) — 프로그램의 포커스 이동

문서를 읽은 뒤 코드 위치, 내 예측, 실험 결과를 연결해 설명하세요. 테스트의 개수를 외우는 것으로 대체하지 않습니다.
