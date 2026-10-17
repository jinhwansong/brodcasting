# 3단계 실제 PostgreSQL 실험

[원시 계획](ci-postgres.json)은 [Actions 실행39002712747](https://github.com/jinhwansong/brodcasting/actions/runs/39002712747)의 산출물입니다. 소스 CI commit a6473500d9fd5bcf9faa0cec37e831c7d6ce22df, 로컬 대응922b70d, tree05f55e556979bcf32d3ebeffd02f9833a7ab89f1입니다. artifact12089882320의 ZIP SHA256은217b11346eeea96160a0750e5251edf6716ff3ff84dfc5d3d89387466451f469로 다운로드 뒤 일치 확인했습니다.

[독립 설치/기동 기록](standalone.json)과 [시작 코드 실패 요약](starter-summary.json)은 폼 본문 회귀3개를 추가한 [최종 실행39003772736](https://github.com/jinhwansong/brodcasting/actions/runs/39003772736)에서 갱신했습니다. CI0c455b0f84adeebd47126c0a11a3d0dc6a7b25dc/local8d20e79/treef12fd89318a95974a3fc968d57f316872c5a7012, artifact12089694767 ZIP SHA25626094836a3e3411ea586c9eae8609f47cfd36a0b069de3d680a234dff761b61e도 일치 확인했습니다. 참고97/97, 시작 코드97 중73통과·SQL TODO24실패입니다. 실험 코드는 바뀌지 않았으며 아래 수치와 원시 계획은 앞선 실행의 값을 보존합니다.

Linux x64, Node24.19.0, PostgreSQL18.6 Debian. CPU 모델 문자열은 AMD EPYC 9V45 96-Core Processor이며 할당 코어 수를 뜻하지 않습니다. work_mem4096kB, shared_buffers16384×8kB입니다. DB·Node가 같은 GitHub runner의 자원을 사용합니다.

아래 시간은 EXPLAIN ANALYZE의 Execution Time(ms)입니다. 첫 페이지 OFFSET0, 깊은 페이지 OFFSET(행수−25), LIMIT25, 정렬/projection은 같습니다.

| 행 수 | 인덱스 전 첫 | 인덱스 후 첫 | 인덱스 전 깊은 | 인덱스 후 깊은 | 전체 JSON byte | 페이지 JSON byte |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 |0.096|0.031|0.188|0.129|50,237|1,276|
| 10,000 |0.732|0.024|2.246|1.277|522,289|1,316|
| 100,000 |7.336|0.040|31.192|18.238|5,422,791|1,316|

이 실행에서는 인덱스 뒤 첫 페이지가 적은 행을 읽었습니다. 하지만 깊은 페이지의 Index Scan은 여전히1천/1만/10만 행을 통과했습니다.10만 행의 인덱스 전 깊은 조회는 external merge/Disk 정렬, temp read412/write414 blocks를 기록했습니다. 인덱스 뒤 해당 sort spill은 없었지만 OFFSET 비용은 남았습니다. 이는 이 조건의 관측이며 다른 조회·장비·동시 부하에 대한 처리량 보장이 아닙니다.

보조 인덱스 크기는40,960/245,760/2,260,992byte였고, 인덱스 생성+ANALYZE의 벽시계 시간은1.851417/13.751377/70.02035ms였습니다. 저장 공간과 생성/쓰기 비용도 함께 판단해야 합니다.

TEMP 테이블의 단일 순차 실행으로 cache/순서 효과를 분리하지 않았습니다. TEMP의 local buffer 통계를 영구 테이블의 shared buffer와 같은 측정으로 취급하지 않습니다. byte는 id/title/viewer_count 행의 UTF-8 JSON 직렬화 크기이며 실제 HTTP 헤더·압축·네트워크·화면 비용은 포함하지 않습니다. 독립 설치 기록의 browser:false도 그대로 유지합니다.

본인의 제출에는 같은 조건을 다시 실행하고 원시 값·다른 관측·한계를 직접 적으세요. 제작자의 기록은 학습자의 측정 결과가 아닙니다.
