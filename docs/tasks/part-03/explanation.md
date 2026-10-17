# 3단계 — 필요한 만큼 여는 해설

첫 예측과 직접 시도 뒤 해당 힌트만 여세요. repository의 완성 SQL은 별도 참고 폴더에 둡니다.

<details><summary>A — 제약·인덱스·버전</summary>

기본키/외래키/유일성/NOT NULL/CHECK를 각각 실패할 INSERT 한 개와 연결하세요. HTTP를 통하지 않은 DB 쓰기도 제약을 만족해야 합니다. 두 탭의 SELECT 결과가 모두 ‘없음’이어도 다음 INSERT는 경쟁할 수 있습니다. 사전 조회만으로 중복을 막을 수 있는지 실험하세요.

외래키를 만들었다고 참조하는 쪽의 모든 조회 인덱스가 자동으로 생기는지 확인하세요. 정렬 인덱스의 컬럼 순서·방향·collation을 실제 ORDER BY와 비교합니다. 인덱스는 쓰기·저장 공간 비용도 만듭니다.

migrate.ts는 같은 DB 연결에서 transaction과 advisory lock을 유지합니다. pool.query로 BEGIN만 보낸 뒤 다음 쿼리가 다른 연결에 가면 어떤 보장이 사라질까요? 버전 이름과 내용 해시는 재실행/적용 파일 변경을 다르게 처리합니다. 파일을 새로 작성할 때 명시 목록의 순서도 함께 관리합니다.

</details>

<details><summary>B — 바인딩과 페이지 경계</summary>

검색 문자열을 SQL 텍스트에 붙이는 위치와 query의 values 배열로 전달하는 위치를 비교하세요. 컬럼 이름/ASC/DESC는 값 파라미터로 바꿀 수 있는지 공식 자료를 확인합니다. 이번 정렬은 서버의 고정 구문 두 개를 선택합니다.

값 바인딩을 해도 LIKE의 %, _는 검색 의미를 가집니다. 이 과제는 문자 그대로 찾으므로 escape 문자까지 함께 생각해야 합니다. 한국어/ASCII 혼합 제목의 C 정렬과 이전 JS collation을 비교하고 차이를 기록하세요.

LIMIT개의 결과만 있으면 ‘정확히 마지막 페이지’와 ‘뒤에 더 있음’을 구분할 수 있을까요? 한 행을 더 읽고 어떤 필드로 잘라 반환할지 정하세요. 정렬의 마지막 기준이 유일해야 고정된 데이터의 동률 경계가 안정적입니다. 다른 요청 사이의 INSERT·DELETE·정렬값 변경까지 같은 snapshot으로 묶은 구현은 아닙니다.

</details>

<details><summary>C — 저장과 재시도</summary>

‘현재 상태를 뒤집기’와 ‘즐겨찾기를 true로 만들기’는 재시도 결과가 다릅니다. PUT/DELETE에 맞는 목표 상태와 복합키 충돌 정책을 선택하세요. 같은 추가가8번 동시에 도착한 뒤 DB 행 수를 직접 확인합니다.

저장 후 응답이 끊기면 클라이언트 오류만으로 rollback을 알 수 없습니다. UI는 기존 표시를 유지하면서 재조회/같은 작업 재시도를 안내합니다. 화면 state, API 프로세스 메모리, DB 저장, Docker 볼륨을 구분하세요. API 재시작 검증은 백업/장애 복구 검증과 다릅니다.

demo-user는 이번 연습의 서버 상수입니다. 요청의 owner를 믿고 변경 대상을 선택하지 않습니다. DB 접속 역할은 소수 작업만 허용하지만 개인별 인가를 자동으로 대신하지 않습니다.4단계에서는 서버 세션의 주체로 자원 접근을 검사합니다.

</details>

<details><summary>D — 측정 읽기와 독립 변경</summary>

EXPLAIN의 estimated cost를 밀리초로 읽지 마세요. ANALYZE는 실제로 쿼리를 실행하고 측정 비용을 더합니다. 노드의 Actual Rows/Loops·정렬·scan·buffer와 총 실행 시간을 함께 봅니다. 행이 적으면 순차 scan이 자연스러울 수 있습니다.

실험은 같은 세션의 TEMP 테이블에서 인덱스 전후를 순서대로 실행합니다. cache·통계·순서의 영향을 제거한 반복 실험은 아닙니다. JSON byte는 선택한 row projection의 직렬화 크기이며 HTTP 헤더·압축·화면 렌더링 시간을 측정하지 않습니다.

cursor 변경은 ‘마지막으로 본 정렬값/id 뒤’를 읽는 조건에서 시작합니다. 값 검증·동률·정렬 방향·최신 변경을 먼저 종이에 써보세요. 단순 인코딩은 위조 방지나 권한 검사가 아니며, 바뀌는 정렬값에 대한 snapshot 보장도 생기지 않습니다.

</details>

## 공식 자료와 코드 위치

- node-postgres [파라미터와 식별자](https://node-postgres.com/features/queries), [같은 연결의 transaction](https://node-postgres.com/features/transactions)
- PostgreSQL18 [제약](https://www.postgresql.org/docs/18/ddl-constraints.html), [GRANT](https://www.postgresql.org/docs/18/sql-grant.html)
- [LIMIT/OFFSET](https://www.postgresql.org/docs/18/queries-limit.html), [정렬 인덱스](https://www.postgresql.org/docs/18/indexes-ordering.html), [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html)
- Docker Compose [up과 wait](https://docs.docker.com/reference/cli/docker/compose/up/)

각 자료를 본인의 SQL·실패한 요청·실행 계획 한 곳과 연결하세요. 브라우저를 실행하기 전에는 Network/키보드/배치 결과를 적지 않습니다.
