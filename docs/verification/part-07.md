# 7단계 검증 — 브라우저 성능·장시간 사용

2026-10-21 · 제작자 검증 · 학습자는0단계·미시작

## 실행한 확인

8개 공개 검사. 보관1,000개·표시 최대14행, 500건/초 재생·읽던 위치·입력 보존·방 전환/종료 정리·60초 중단. 저장소 밖 소스 복사본의 npm ci/type/build와 실제 Vite HTTP2경로.

루트 labs 타입 검사·빌드, 시작 코드의 의도된 행동 실패 분류를 확인했다. 실행 기록은 [요약](../experiments/part-07/verification-summary.json)과 [강의](../tasks/part-07/README.md)를 따른다. 9단계 원시 자료는 [load](../experiments/part-09/reference-load.json),10단계 실제 복구는 [Compose](../experiments/part-10/reference-compose.json)에 있다. CI와 원격 반영은 후속 게시 절에 별도로 기록한다.

## 학습 설명과 리뷰

중학생도 읽을 수 있는 [쉬운 설명](../tasks/part-07/lesson.md), 파일 지도·작은 실습 순서·실행 명령·설명3개·첫 시도 뒤 해설·빈 제출을 제공했다. 완성본은 별도 경로다. 독립 변경의 답을 제공하거나 학습 통과로 처리하지 않았다.

[순차 자체 검토](parts-07-11-review.md)를 수행했다. Code review: skipped (ce-code-review unavailable) — 사용자의 순차 메인 실행 규칙으로 필수 독립 leaf 파이프라인을 실행할 수 없어 독립 리뷰 완료를 주장하지 않는다.

## 미확인 범위

실제 기기의 렌더링/입력/메모리 수치는 미작성. 60초 자동 실험과 반복 측정 양식을 제공하며 장시간 실제 브라우저 검증을 대신하지 않는다.
