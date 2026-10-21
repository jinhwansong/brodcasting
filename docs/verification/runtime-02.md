# 알림2주 제작 검증

2026-10-21 Windows Node24.15.0, Nest12.1.3·TypeScript7.0.2·기존 Node types24.19.2를 사용했습니다. 새 런타임 의존성 버전을 바꾸지 않았으며 별도 package/lock을 제공합니다.

- TODO 생성 함수에서 실제 프로세스 시작 실패를 먼저 관찰했습니다. 초기 준비 검사 하나는5초 제한을 넘었으므로 그 항목은 기능 RED로 세지 않습니다. 최초 모듈 로딩에 맞춰 준비 대기를15초로 바꾸고 이후 정상 실행을 확인했습니다.
- 완성본 공개6/6: 실제 HTTP·주입 서비스의 동일 bootId/증가 count, 두 PID와 HTTP 없는 Worker, Worker crash7 뒤 API200와 새 Worker 시작, API 종료 뒤 Worker 응답, Worker 정상 close0, 잘못된 port 거부.
- 시작 코드1통과/5의도된 시작 실패를 별도로 확인했습니다. context.ts의 A/B TODO가 앱 생성을 명시적으로 거부합니다. 타입 검사와 build는 가능합니다.
- 저장소 밖 임시 **소스만 복사본**의 새 npm ci·타입 검사·빌드·실제6개 검사를 통과했습니다. 임시 폴더는 realpath·소유 prefix를 확인하고 제거했습니다.
- 설치 잠금파일을 처음 루트에서 `--prefix`로 만들 때 외부 file 연결이 추가된 것을 정책 검사가 잡았습니다. 두 manifest에서 제거하고 저장소 밖 깨끗한 폴더에서 잠금파일을 재생성했습니다. 최종 외부 링크0·도구 정책16통과, 독립 설치·6검사 재통과를 확인했습니다.

[실제 reference TAP](../experiments/runtime-02/reference.tap), [시작 코드 TAP](../experiments/runtime-02/exercise.tap), [검증 요약](../experiments/runtime-02/verification.json), [SHA256](../experiments/runtime-02/SHA256SUMS)을 보존했습니다.

`app.close`는 실제 IPC 정상 종료 경로에서 확인했습니다. Windows의 강제 종료를 POSIX SIGTERM 정리 증거로 부르지 않습니다. API/Worker가 같은 기기의 CPU·RAM을 공유하는 자원 경쟁, Redis 큐·저장·실서비스 장애 격리는 이 단위가 검증하지 않습니다.

생성·사용·종료 경로와 독립 패키지 경계를 순차 자체 검토했습니다. **Code review: skipped (ce-code-review unavailable)** — 사용자 순차 실행 규칙에 따라 독립 서브에이전트 리뷰를 수행하지 않았습니다. 학습0·미시작, 설명·독립 변경 대기를 유지합니다.
