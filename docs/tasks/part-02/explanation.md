# 2단계 — 단계별 해설

첫 예측·직접 구현·실패 증거 이후 필요한 힌트만 여세요. 완성 코드는 이 문서에 싣지 않습니다.

## HTTP의 두 번 비동기

fetch가 Response를 주는 시점과 JSON body를 읽는 시점은 나뉩니다. HTTP 404·503도 응답이므로 response.ok/status를 확인해야 합니다. 서버가 중단된 연결 실패와는 증거가 다릅니다. HTTP가 성공해도 기대한 JSON 구조가 아닐 수 있습니다.

<details><summary>A 힌트 — 경로와 조회 규칙</summary>

Controller의 decorator가 정한 경로와 Service의 메서드를 한 줄로 연결해 보세요. 검색·정렬은 필터 결과에서 수행하고 원본을 보존합니다. ‘없음’이 목록에서는 빈 배열, 상세에서는 404인 이유를 설명하세요. 지연 실험은 CPU를 바쁘게 돌리는 반복문 대신 비동기 대기입니다.

</details>

<details><summary>B 힌트 — 클래스와 실행 중 입력</summary>

TypeScript 타입은 네트워크에서 들어온 값을 검사하는 함수가 아닙니다. DTO 클래스의 decorator와 전역 ValidationPipe가 각각 연결됐는지 확인하세요. 실제 클래스 대신 type-only import를 쓰면 decorator metadata에 어떤 정보가 남는지도 조사하세요. 이번 선택적 필드는 undefined만 빠진 값이며 null은 거부해야 합니다. IsOptional의 null 처리까지 공식 설명/실험으로 확인한 뒤 규칙을 선택하세요.

입력 객체가 변환된 뒤 남은 필드와 네트워크에서 받은 필드는 같지 않을 수 있습니다. 일반적인 `role`과 `constructor`를 각각 query·JSON으로 보내 비교하세요. RawInputKeysPipe에서는 metadata.metatype으로 목록·상세 query·id를 구분하고, 원래 객체의 own key를 각 허용 목록과 비교합니다. `key in dto`는 상속된 이름도 찾으므로 허용 목록 검사와 다릅니다. 전역 Pipe 순서가 바뀌면 어떤 증거가 사라지는지도 설명하세요. 이 검사는 필드 거부 계약을 지키기 위한 것이며, 테스트가 prototype pollution 발생을 입증하는 것은 아닙니다.

본문 전체를 읽기 전에 제한하는 파서 크기와 search 필드 길이는 서로 다릅니다. 9000자 JSON을 DTO에 도착한 뒤에만 검사하면 이미 파싱한 비용을 되돌릴 수 없습니다. 제공된 8kb 파서 설정의 실행 위치를 따라가세요.

</details>

<details><summary>C 힌트 — URL과 응답</summary>

URLSearchParams에 검색·정렬·실험 값을 넣고 서버가 실제 받은 값을 비교하세요. 상세 id는 단일 경로 세그먼트로 인코딩합니다. 응답 JSON을 unknown으로 읽은 뒤 필요한 필드를 좁히면 타입 단언만으로 ‘맞는 데이터’라 선언하는 것과 차이를 볼 수 있습니다. 오류 body 전체를 화면에 그대로 출력하지 않습니다.

</details>

<details><summary>D 힌트 — 자원 정리와 결과 반영</summary>

이 Effect가 시작한 요청과 현재 화면이 기다리는 요청이 같은지 판단할 기준이 필요합니다. cleanup 때 controller를 abort하는 것과 완료 callback이 상태를 바꿀 수 있는지 확인하는 것은 역할이 다릅니다. 성공·catch 양쪽에 같은 최신성 기준을 적용하세요. 정리된 요청의 오류로 최신 성공을 덮는 경우도 실험합니다.

Hook을 선택 여부에 따라 조건부 호출하지 않습니다. request가 null일 때 idle을 반환하고 이전 작업을 정리하도록 설계하세요. 동일 loader의 재시도는 refreshKey로 구분됩니다. 동기 throw와 Promise reject도 오류 흐름에서 다룹니다.

</details>

## 취소의 경계

현재 서버의 지연은 setTimeout 대기이고 요청 연결의 종료 신호와 연결하지 않았습니다. 클라이언트 abort는 해당 클라이언트의 fetch/본문 읽기와 관계된 취소이며, 이 서버의 대기를 취소하는 구현은 없습니다. 나중에 DB·큐 작업이 생겨도 별도 취소 설계 없이 같은 보장을 추정하지 마세요.

## 캐시의 위치

no-store, no-cache, 메모이제이션, 서버 데이터 저장을 각각 ‘무엇을 어디에 보관하고 언제 다시 확인하는가’로 설명하세요. 지금 메모리 배열을 쓰는 것과 HTTP 응답을 캐시하는 것은 같은 기능이 아닙니다. 이 단계에서 프레임워크 캐시 라이브러리를 추가할 필요는 없습니다.

## 확인한 공식 자료

- NestJS [Controller](https://docs.nestjs.com/controllers), [Provider·DI](https://docs.nestjs.com/providers), [Module](https://docs.nestjs.com/modules)
- NestJS [ValidationPipe](https://docs.nestjs.com/techniques/validation), [본문 파서 크기](https://docs.nestjs.com/faq/raw-body#body-parser-size-limit)
- MDN [Fetch 사용](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- React [Effect와 정리](https://react.dev/reference/react/useEffect)

각 자료를 자신의 코드 위치와 실패 증거에 연결하세요. Network 패널 관찰은 실행한 뒤에만 제출 기록으로 사용합니다.
