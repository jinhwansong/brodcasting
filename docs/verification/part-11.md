# 11단계 검증 — 설명·변경 과제·지원 자료

2026-10-21 · 제작자 검증 · 학습자는0단계·미시작

## 실행한 확인

6개 공개 검사. 실제 React 화면에서100/500/1000 선택·멈춘 상태 즉시 축소·버린 이력 미복원·방별 선택·입력/읽기 보존·선택 변경이60초 예약을 연장하지 않음을 확인. 저장소 밖 독립 설치와 실제 Vite HTTP2경로. 영향 분석·3개 사례·AI/본인 기여·빈 제출·별도 독립 변경을 제공.

루트 labs 타입 검사·빌드, 시작 코드의 의도된 행동 실패 분류를 확인했다. 실행 기록은 [요약](../experiments/part-11/verification-summary.json)과 [강의](../tasks/part-11/README.md)를 따른다. 9단계 원시 자료는 [load](../experiments/part-09/reference-load.json),10단계 실제 복구는 [Compose](../experiments/part-10/reference-compose.json)에 있다. CI와 원격 반영은 후속 게시 절에 별도로 기록한다.

## 학습 설명과 리뷰

중학생도 읽을 수 있는 [쉬운 설명](../tasks/part-11/lesson.md), 파일 지도·작은 실습 순서·실행 명령·설명3개·첫 시도 뒤 해설·빈 제출을 제공했다. 완성본은 별도 경로다. 독립 변경의 답을 제공하거나 학습 통과로 처리하지 않았다.

[순차 자체 검토](parts-07-11-review.md)를 수행했다. Code review: skipped (ce-code-review unavailable) — 사용자의 순차 메인 실행 규칙으로 필수 독립 leaf 파이프라인을 실행할 수 없어 독립 리뷰 완료를 주장하지 않는다.

## 미확인 범위

학습자의 설명·사례·독립 변경은 미작성이다. 제작자의 예시를 학습자의 성과로 기록하지 않는다. 브라우저 실측도 미실행이다.

## Linux CI 게시 근거

[실행 39539737766](https://github.com/jinhwansong/brodcasting/actions/runs/39539737766)의 ui/load/recovery 세 작업이 모두 성공했다. 검증한 코드 커밋은 88492e1949bef3135a9f257416c16ff6660fbbb8, tree는 5050be328859775633df23ae583a6bf3c23a7883다. Node24.19.0에서 공개 검사64개·실제 복구24항목·저장소 밖 독립 설치4개·시작 코드 분류를 확인했다. 결과 ZIP3개의 GitHub SHA256과 내부 보고서14개 SHA256을 내려받아 확인했다. [CI 증거](../experiments/parts-07-11/ci-verification.json)에 해시·검증 범위가 있다. 브라우저·독립 리뷰는 여전히 미실행이다.
