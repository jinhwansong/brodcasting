# 알림2주 참고 완성본

[교재](../../docs/tasks/runtime-02/README.md)의 첫 시도 뒤에 비교합니다. 소스만 따로 복사해 아래를 실행할 수 있습니다.

```sh
npm ci
npm run typecheck
npm run check
npm run build
```

두 터미널에서 npm run api, npm run worker를 각각 실행합니다. API는 loopback3012/health, Worker는 HTTP 포트가 없습니다. Node engines와 잠금파일의 버전을 따릅니다. 가짜 횟수는 메모리에만 있으며 큐·저장은 다음 주입니다. 독립 변경 답은 제공하지 않습니다.
