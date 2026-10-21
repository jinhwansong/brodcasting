# 알림3주 큐 참고 완성본

[쉬운 교재](../../docs/tasks/runtime-03/README.md)의 첫 시도 뒤에 비교합니다. 소스만 다른 폴더에 복사하고 Node engines·Docker Linux 엔진을 준비한 뒤:

```sh
npm ci
npm run typecheck
npm run check
```

check는 소유한 일회용 Redis8.6.7-alpine을 loopback 임의 포트로 띄우고11개 실제 Redis/HTTP/프로세스 검사를 실행한 뒤 정리합니다. 기존 Redis를 초기화하지 않습니다. 수동 API/Worker 실행은 교재의 두 환경변수와 별도 수동 Redis를 준비합니다. 기본 API3013, Worker는 HTTP 없음입니다. 이 주는 가짜 작업과 보관 중 ID 중복만 다루며 실제 발송·영구 멱등성·사용자 인증은 후속 단위입니다.
