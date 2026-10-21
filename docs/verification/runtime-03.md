# 알림3주 제작 검증

2026-10-21 Windows Node24.15.0에서 BullMQ6.3.19·ioredis6.0.0·Redis8.6.7-alpine을 사용했습니다. Nest12.1.3·TypeScript7.0.2 등 기존 잠금 버전은 유지했습니다. 새 큐 의존성은 각 독립 패키지에도 정확한 버전으로 고정했습니다.

- 입력/옵션 검사에서2통과·6실패를 관찰한 뒤8검사를 통과했습니다. 실제 HTTP 검사를 추가했을 때 기존 엔드포인트404로3실패한 뒤 연결하여11개를 통과했습니다.
- 완성본11개: 입력과 Redis 주소 제한, Worker 없는 waiting, 두 번 실패 뒤 세 번째 성공, 보관 중 ID 중복·삭제 후 재실행, 최종 failed, 진행 중 close 대기, 실제 Nest API와 별도 Worker PID, Worker 재시작 뒤 대기 작업 처리, HTTP 잘못된 입력400입니다.
- 시작 코드3통과·8의도된 실패를 별도로 실행했습니다. parser/옵션 TODO가 남아 있으며 타입 검사·빌드는 가능합니다.
- 저장소 밖 소스만 복사본에서 새 npm ci·타입 검사·실제 Redis/HTTP/프로세스11검사를 실행했습니다. 바깥 file 의존성을 사용하지 않습니다.

[완성본 TAP](../experiments/runtime-03/reference.tap), [시작 코드 TAP](../experiments/runtime-03/exercise.tap), [독립 설치 로그](../experiments/runtime-03/standalone.log), [요약](../experiments/runtime-03/verification.json), [SHA256](../experiments/runtime-03/SHA256SUMS)을 함께 보존합니다. TAP 끝 공백만 정규화하며 결과·횟수·시간을 바꾸지 않습니다.

Redis는 고유 이름·소유 label·loopback 임의 포트로 생성하고 finally에서 해당 컨테이너만 정리합니다. 영속 저장을 끈 일회용 환경입니다. Worker 재시작 성공을 Redis 삭제 후 복구 증거로 부르지 않습니다. 완료/실패 보관100개는 waiting 큐의 상한이 아닙니다. jobId는 기록이 남아 있는 동안만 중복 등록을 막습니다. 영구 멱등 처리·인증된 알림함은 후속4·5주입니다.

이 주의 HTTP는 로그인 없는 로컬 가짜 작업 실험입니다. 공개 배포·실제 외부 발송·운영 수용량은 검증하지 않았습니다. 진행 중 close는 실제 BullMQ Worker의 제어된 작업으로 검사했으며 POSIX 프로세스 SIGTERM 증거와 구분합니다.

입력 경계·큐 생성/종료·실패/중복 경계·독립 패키지를 순차 자체 검토했습니다. **Code review: skipped (ce-code-review unavailable)** — 사용자 순차 실행 규칙에 따라 독립 서브에이전트 리뷰를 수행하지 않았습니다. 학습자는0·미시작, 설명과 독립 변경 대기입니다.
