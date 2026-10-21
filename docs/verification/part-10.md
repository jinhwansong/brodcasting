# 10단계 검증 — 로컬 TLS 배포·관측·실패 복구

2026-10-21 · 제작자 검증 · 학습자는0단계·미시작

## 실행한 확인

설정·준비·정제 로그6개와 실제 Docker 복구24항목. 새 소스 이미지 빌드, 로컬 TLS 검증·HTTPS/WSS·Secure 쿠키·CSRF·정확한 프록시 신뢰, API 프로세스 재시작, DB 장애503/회복, 메모리 안의 custom dump→새 DB 복원→제한 권한 재부여→같은 계정/이력, 메시지 DELETE 거부, 실제 실패 이미지→이전 정상 이미지 ID 복귀, 비밀 로그 제외를 확인. 임시 프로젝트·볼륨·인증서 정리.

루트 labs 타입 검사·빌드, 시작 코드의 의도된 행동 실패 분류를 확인했다. 실행 기록은 [요약](../experiments/part-10/verification-summary.json)과 [강의](../tasks/part-10/README.md)를 따른다. 9단계 원시 자료는 [load](../experiments/part-09/reference-load.json),10단계 실제 복구는 [Compose](../experiments/part-10/reference-compose.json)에 있다. CI와 원격 반영은 후속 게시 절에 별도로 기록한다.

## 학습 설명과 리뷰

중학생도 읽을 수 있는 [쉬운 설명](../tasks/part-10/lesson.md), 파일 지도·작은 실습 순서·실행 명령·설명3개·첫 시도 뒤 해설·빈 제출을 제공했다. 완성본은 별도 경로다. 독립 변경의 답을 제공하거나 학습 통과로 처리하지 않았다.

[순차 자체 검토](parts-07-11-review.md)를 수행했다. Code review: skipped (ce-code-review unavailable) — 사용자의 순차 메인 실행 규칙으로 필수 독립 leaf 파이프라인을 실행할 수 없어 독립 리뷰 완료를 주장하지 않는다.

## 미확인 범위

공개 배포·유료 자원·실제 브라우저·영상 인코딩·DB 형식 변경의 자동 롤백은 포함하지 않는다. BunkerWeb 전용 과정은 여전히 전체 과정 마지막에 별도로 남아 있다.
