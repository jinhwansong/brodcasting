# 알림4주 실행 단위

승인된 전체 계획의 R4를 제작한다. runtime-03의 Nest API/Worker·검사 방식을 복사하여 독립 실행 패키지를 유지한다. 새 범위는 PostgreSQL의 가짜 발송 효과와 처리 영수증, 일시/영구 실패, 완료 기록 삭제 뒤 재처리, 진행 중 Worker 종료다. 실제 이메일은 보내지 않는다.

1. 공개 검사를 먼저 작성하고 parseNotice/deliver/processDelivery TODO의 실제 실패를 관찰한다.
2. 입력은 정확히 id와 mode(normal/transient/permanent/after-commit/slow)다. 로컬 전용 DB 주소를 제한하고 고정 SQL·동일 client 트랜잭션을 쓴다. 영수증 PK 충돌은 기존 mode와 비교한다.
3. 영수증과 가짜 효과를 한 트랜잭션에서 저장한다. commit 뒤 실패를 재현하고 재시도·동시 실행·큐 기록 삭제 뒤에도 효과 한 행을 검사한다. 실제 외부 발송의 exactly-once 보장으로 설명하지 않는다.
4. transient는 첫 두 시도에 실패, permanent는 UnrecoverableError로 즉시 최종 실패, slow는 짧은 고정 대기로 종료 중 작업을 관찰한다. close가 Worker를 기다린 뒤 DB pool을 닫도록 한다.
5. 고유 소유 PostgreSQL/Redis 컨테이너·제한 앱 역할·임의 loopback 포트를 사용한다. 기존 DB/큐를 정리하지 않는다. 실제 API와 별도 Worker IPC 종료, Linux SIGTERM은 실행한 범위만 기록한다.
6. 시작 코드는 parser와 제공된 인프라를 유지하고 deliver/processDelivery의 학습 TODO만 남긴다. 공개 검사·쉬운 설명·설명3개·정답 없는 독립 변경·빈 제출·source-only 설치·증거·정책/CI를 완성한다.

영수증 보관 정책·공개 인증 API·outbox 알림함은5주, Redis/DB 컨테이너 복구는7주다. 이 단위를 전체 사이트 완성으로 부르지 않는다. 학습0·미시작과 사용자 미추적 문서를 보존한다. 사용자 순차 실행 규칙에 따라 독립 리뷰 대신 자체 검토를 기록한다.
