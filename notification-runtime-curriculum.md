# 알림·프로세스·큐 7주 과정

이 문서는 [기본 커리큘럼](CURRICULUM.md)에 있던 추가 과정의 실제 제작·학습 진입점입니다. ‘주’는 주6~8시간 학습 분량이며 제작 시간 약속이 아닙니다. 학습자는 여전히0단계·미시작입니다.

| 주 | 코드 이름 | 만들고 설명할 것 | 제작 상태 |
| --- | --- | --- | --- |
| 1 | runtime-01 | 이벤트 루프·실행권 양보·스레드·프로세스·객체 전달·종료 | [시작 코드와 쉬운 설명](docs/tasks/runtime-01/README.md), [검증](docs/verification/runtime-01.md) |
| 2 | runtime-02 | 같은 Nest 모듈을 HTTP API와 독립 application context로 시작·종료 | [시작 코드와 쉬운 설명](docs/tasks/runtime-02/README.md), [검증](docs/verification/runtime-02.md) |
| 3 | runtime-03 | Redis·BullMQ Queue/Worker·작업 상태·재시도·중복 경계 | [시작 코드와 쉬운 설명](docs/tasks/runtime-03/README.md), [검증](docs/verification/runtime-03.md) |
| 4 | runtime-04 | 가짜 발송기·일시/영구 실패·멱등 처리·종료 중 작업 | [시작 코드와 쉬운 설명](docs/tasks/runtime-04/README.md), [검증](docs/verification/runtime-04.md) |
| 5 | runtime-05 | PostgreSQL 알림함·사용자별 목록·읽음·재접속 복구 | 제작 대기 |
| 6 | runtime-06 | API/Worker 자원 경쟁·작은 실제 부하·원시 비교·분리 판단 | 제작 대기 |
| 7 | runtime-07 | API/Worker/Redis/DB Compose·내부 네트워크·재시작·복구 | 제작 대기 |

각 주는 예상→공식 근거→첫 구현→정상/실패 실행→쉬운 해설→설명3개→정답 없는 독립 변경→빈 제출을 제공합니다. 별도 완성본은 제작자와 첫 시도 뒤 비교할 사람을 위한 자료입니다. 완성본의 통과는 학습자의 통과가 아닙니다.

실제 이메일·FCM은 필수가 아닙니다. 가짜 발송기로 먼저 실패를 재현합니다. ‘한 번만 전달’이라는 모호한 보장 대신 저장 경계·재실행·중복 방지와 남는 실패 구간을 적습니다. 외부 부하·유료 자원·공개 운영은 이번 제작에 포함하지 않습니다.

이후 [프론트 보안 F1/F2/F3](docs/tasks/security-frontend/README.md)와 통합 사이트 제작으로 이어집니다. BunkerWeb은 별도 후속이며 이번 제작 범위에 포함하지 않습니다. [최신 전체 계획](docs/superpowers/plans/2026-10-21-notification-security-integrated.md)을 따릅니다.
