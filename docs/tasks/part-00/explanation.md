# 0단계 힌트와 해설

먼저 예측과 첫 시도를 남긴 뒤 필요한 부분만 여세요. 전체 완성 코드는 여기에 없습니다.

<details><summary>힌트 A — 검색·정렬</summary>

조건을 조합하는 순수 함수로 생각하세요. 검색어 정규화와 방송 속성 비교는 별개입니다. 배열의 `sort()`는 원본을 변경하므로 조회용 새 배열이 언제 생기는지 확인하세요. 동률의 두 번째 기준이 없으면 순서가 요구사항과 달라질 수 있습니다.
</details>

<details><summary>힌트 B — 즐겨찾기와 참조</summary>

Set 자체가 React 상태라면 이전 Set을 직접 바꾸는 것과 새로운 Set을 전달하는 것은 다릅니다. 토글 함수를 같은 입력으로 두 번 호출할 때 원본이 그대로인지 작은 검증으로 확인하세요. 전체 방송 객체를 즐겨찾기에도 중복 저장할 필요는 없습니다.
</details>

<details><summary>힌트 C — 비동기 상태</summary>

상태를 로딩·성공·실패 중 하나로 표현하면 동시에 성공이면서 실패인 모순을 줄일 수 있습니다. 새 요청 때 이전 오류가 남는지, 실제 데이터가 없는 경우와 필터 결과가 없는 경우를 구분하는지 확인하세요. 컴포넌트 수명 뒤에 결과를 무시하는 처리는 실제 서버 작업 취소와 같지 않습니다.
</details>

<details><summary>예측 문제 실행 후에만 열기 — 출력 순서</summary>

A, D, C, B 순서입니다. 먼저 현재 동기 코드가 끝나고, Promise의 후속 처리가 마이크로태스크로 실행된 뒤 타이머 콜백이 실행됩니다. 0ms는 현재 코드를 중단하고 즉시 실행하라는 뜻이 아닙니다. 이 작은 예의 순서를 네트워크 요청 완료 순서 보장으로 일반화하지 마세요.
</details>

## 읽어 확인한 공식 문서

2026-10-17 제작 시 실제 페이지를 확인했습니다. 아래 링크의 예제를 그대로 제출하지 말고 현재 코드의 데이터 흐름과 연결해 설명하세요.

- [React 상태 구조](https://react.dev/learn/choosing-the-state-structure): 원본 상태에서 구할 수 있는 목록을 중복 상태로 저장할 필요가 있는지 검토합니다.
- [React 배열 상태 갱신](https://react.dev/learn/updating-arrays-in-state): 배열을 변경하지 않는 갱신을 확인합니다.
- [React useEffect](https://react.dev/reference/react/useEffect): 외부 작업과 컴포넌트 수명, 정리를 구분합니다.
- [MDN Promise 사용](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises): 후속 처리와 오류 전파를 확인합니다.
- [TypeScript 좁히기](https://www.typescriptlang.org/docs/handbook/2/narrowing.html): 상태에 따라 사용할 수 있는 값을 구분합니다.

순수 함수 검증은 DOM 동작을 대신하지 않고, jsdom UI 검증은 실제 브라우저 전체의 접근성·레이아웃 검증을 대신하지 않습니다. 설명·직접 변경 능력은 자동 테스트로 확인되지 않습니다.
