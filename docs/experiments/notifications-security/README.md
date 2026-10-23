# 통합 알림함 브라우저 관찰

2026-10-22~23, 로컬 일회용 PostgreSQL/Redis, 실제 API와 Worker, CUA 브라우저로 관찰했습니다. 비밀번호와 세션 값은 저장하지 않았습니다.

- [데스크톱 안 읽음](inbox-unread-desktop.jpg)
- [Worker 중단 중 접수](built-worker-stopped.jpg)
- [Worker 재개 후 한 번 도착](built-worker-recovered.jpg)
- [API 재시작 뒤 로그인·읽음 유지](built-api-restarted-read.jpg)
- [모바일345px](inbox-mobile.jpg)
- [의존성 조회](dependency-audit.json)

스크린샷은 해당 순간의 관찰이며 자동 회귀 검사나 운영 성능 측정을 대신하지 않습니다. [검증 범위](../../verification/notifications-security-integrated.md).
