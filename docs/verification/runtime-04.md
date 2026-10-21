# 알림4주 제작 검증

2026-10-21 Windows Node24.15.0, PostgreSQL18.6·Redis8.6.7·BullMQ6.3.19·pg8.23.1을 사용했습니다. 기존 버전은 유지하며 각 패키지에 독립 잠금파일을 제공합니다.

- 처음 새 동작의 TODO에서12개 중2통과·10실패를 관찰했습니다. DB가 초기화용 임시 서버만 준비된 상태를 잘못 준비 완료로 세던 검사기는 TCP pg_isready로 수정했으며, 그 환경 실패를 기능 RED에 세지 않았습니다.
- 입력/DB 경계·영수증·재시도 구현 뒤12개 통과, 실제 API 연결과 입력 문자열 경계 추가 때11통과·4실패를 관찰한 뒤15개를 통과했습니다. mode 객체의 문자열 변환을 허용하던 오류도 실제 실패 검사 후 typeof 검사로 고쳤습니다.
- 완성본15개: 정확한 입력, 로컬 DB 제한, 재호출·동시4회에 효과1행, 같은 ID/다른 mode 거부, 두 번째 INSERT 제약 오류23514와 전체 rollback, 일시 실패3시도, 영구 실패1시도, commit 뒤 확인 손실2시도, Redis 완료 작업 삭제 뒤 효과1행, 진행 중 Worker.close 대기, 실제 API와 별도 Worker, 실제 Worker 프로세스의 정상 종료, HTTP 새 계약 거부입니다.
- 시작 코드4통과·11의도된 실패를 별도로 확인했습니다. 입력/환경/HTTP 경계는 제공하고 deliver/processDelivery 과제를 남겼습니다. 모듈·DB 준비 실패를 학습 실패로 섞지 않습니다.
- 저장소 밖 소스만 복사본에서 새 npm ci·타입 검사·빌드·실제 DB/Redis/HTTP15검사를 통과했습니다.

[완성본 TAP](../experiments/runtime-04/reference.tap), [시작 코드 TAP](../experiments/runtime-04/exercise.tap), [독립 설치 요약](../experiments/runtime-04/standalone.json), [전체 요약](../experiments/runtime-04/verification.json), [SHA256](../experiments/runtime-04/SHA256SUMS)을 보존합니다. TAP의 끝 공백만 정규화했습니다.

가짜 발송 효과와 영수증은 같은 PostgreSQL 트랜잭션에 들어갑니다. 실제 이메일/외부 push에는 이 원자성이 적용되지 않습니다. Redis 기록과 분리된 영수증의 한 실행 내 재처리를 검증했으며 DB 컨테이너를 삭제하고도 영수증이 남는다고 주장하지 않습니다. 테스트용 제약은 일회용 테이블에만 추가하며 제공 schema.sql의 제품 동작이 아닙니다.

Windows에서는 실제 자식 Worker에 IPC stop을 보내 종료 코드0·signal null과 완료 상태를 확인했습니다. 같은 공개 검사는 Linux에서 SIGTERM을 보내도록 구성했지만 로컬 Windows 실행을 Linux SIGTERM 증거로 부르지 않습니다. 강제 종료·무한히 멈춘 작업·운영 시스템의 종료 제한 시간은 이 결과가 보장하지 않습니다.

입력/영구 오류·같은 client의 트랜잭션·동시 충돌·rollback 실패 연결 폐기·Worker→Queue→pool 종료 순서를 자체 검토했습니다. **Code review: skipped (ce-code-review unavailable)** — 사용자 순차 실행 규칙에 따라 독립 리뷰를 수행하지 않았습니다. 학습자는0·미시작, 설명과 독립 변경 대기입니다.
