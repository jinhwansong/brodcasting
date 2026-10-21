# 9단계 검증 — 서버 부하·병목 분석

2026-10-21 · 제작자 검증 · 학습자는0단계·미시작

## 실행한 확인

분포/상한5 + 동시 전달3 + 실제 권한/소켓/복구31 =39개. 새 schema/제한 역할/계정과 별도 API 자식 프로세스에서 동일 입력의 기준→증가→유지→해제를 전달 동시성1/4로 각각3회 실행. 총288회 성공 ack·960회 수신, 오류/중복0, 모든 구간 연결 해제 후0개. 원시 시각·지연·CPU/RSS·DB probe·중단 판정을 보관. 저장소 밖 독립 설치/타입/빌드/Nest import도 확인.

루트 labs 타입 검사·빌드, 시작 코드의 의도된 행동 실패 분류를 확인했다. 실행 기록은 [요약](../experiments/part-09/verification-summary.json)과 [강의](../tasks/part-09/README.md)를 따른다. 9단계 원시 자료는 [load](../experiments/part-09/reference-load.json),10단계 실제 복구는 [Compose](../experiments/part-10/reference-compose.json)에 있다. CI와 원격 반영은 후속 게시 절에 별도로 기록한다.

## 학습 설명과 리뷰

중학생도 읽을 수 있는 [쉬운 설명](../tasks/part-09/lesson.md), 파일 지도·작은 실습 순서·실행 명령·설명3개·첫 시도 뒤 해설·빈 제출을 제공했다. 완성본은 별도 경로다. 독립 변경의 답을 제공하거나 학습 통과로 처리하지 않았다.

[순차 자체 검토](parts-07-11-review.md)를 수행했다. Code review: skipped (ce-code-review unavailable) — 사용자의 순차 메인 실행 규칙으로 필수 독립 leaf 파이프라인을 실행할 수 없어 독립 리뷰 완료를 주장하지 않는다.

## 미확인 범위

동일 기기의 작은 실험이다. 유지 구간 p95 중앙값은 23.81→22.51ms이지만 회차별 순위가 바뀌어 확실한 운영 성능 우위로 일반화하지 않는다. 실제 사용자 수용 인원·외부 부하·장시간·브라우저는 검증하지 않았다.

## Linux CI 게시 근거

[실행 39539737766](https://github.com/jinhwansong/brodcasting/actions/runs/39539737766)의 ui/load/recovery 세 작업이 모두 성공했다. 검증한 코드 커밋은 88492e1949bef3135a9f257416c16ff6660fbbb8, tree는 5050be328859775633df23ae583a6bf3c23a7883다. Node24.19.0에서 공개 검사64개·실제 복구24항목·저장소 밖 독립 설치4개·시작 코드 분류를 확인했다. 결과 ZIP3개의 GitHub SHA256과 내부 보고서14개 SHA256을 내려받아 확인했다. [CI 증거](../experiments/parts-07-11/ci-verification.json)에 해시·검증 범위가 있다. 브라우저·독립 리뷰는 여전히 미실행이다.
