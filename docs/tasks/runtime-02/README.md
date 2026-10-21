# 알림 과정 2주 — 같은 설계도로 접수처와 작업실 열기

1주에서 프로세스를 나눴다면 이번에는 **Nest 프로그램의 시작점을 두 개** 만듭니다. [쉬운 설명](lesson.md)을 읽고 예상부터 [제출](submission.md)에 적으세요. Redis·DB는 다음 주 이후에 연결합니다.

## 코드 전에 예상

API와 Worker가 같은 클래스 파일을 import하면 그 클래스의 객체도 같은 것일까요? Worker에도 HTTP 포트가 필요할까요? Worker가 종료되면 API도 멈출까요?

## 작업 지도와 실행

| 위치 | 역할 |
| --- | --- |
| `labs/runtime-02/src/context.ts` | 내 과제 A/B: NestFactory의 HTTP 앱/application context 생성 |
| `src/activity.ts` | 제공된 공용 서비스와 Module. PID·시작 ID·프로세스 안의 횟수 기록 |
| `src/api.ts` | 제공된 HTTP 시작점. loopback에서 /health를 받고 종료 시 app.close |
| `src/worker.ts` | 제공된 작업 시작점. HTTP 없이 살아 있고 타이머·Nest context 정리 |
| `checks/runtime-02/runtime.test.mjs` | 실제 두 프로세스·HTTP·장애/정상 종료 공개 검사 |

Node 준비와 루트 npm ci 뒤:

```sh
npm run typecheck:runtime-02
npm run check:runtime-02
npm run build:runtime-02
```

검사는 원래 A/B가 비어서 6개 중1통과/5실패입니다. 연결 거부는 이 TODO의 시작 실패일 수 있지만, 모듈 누락·컴파일 오류·준비 시간 초과는 준비 문제입니다. 같은 원인으로 무조건 묶지 마세요.

1. createApi는 ApiModule로 **HTTP 앱**을 만듭니다. 제공된 main이 listen을 수행하므로 여기서 또 listen하지 않습니다.
2. createWorker는 WorkerModule로 **application context**만 만듭니다. HTTP listener를 열지 않습니다.
3. 두 터미널에서 아래 명령을 각각 실행합니다. PID·bootId가 다른지 봅니다.

```sh
node labs/runtime-02/dist/api.js
node labs/runtime-02/dist/worker.js
```

API 기본 주소는 http://127.0.0.1:3012/health 입니다. 같은 주소를 다시 열면 count가 늘고 bootId는 같습니다. Worker의 시작 로그에는 별도 PID와 hasHttp:false가 나옵니다. Ctrl+C로 각 프로세스를 닫습니다. Windows의 강제 종료를 Unix의 graceful SIGTERM 증거로 적지 않습니다.

공개 검사는 API 포트를0으로 열어 운영체제가 빈 포트를 고르게 합니다. 실제 Worker를 종료 코드7로 중단해도 API가200인지, 반대 순서로 닫아도 Worker가 명령에 답하는지 검사합니다. 종료 명령 뒤 타이머·context가 정리되어 프로세스가 끝나는지도 확인합니다.

## 설명 세 가지

1. 같은 ActivityService 소스를 쓰는데 bootId와 횟수가 프로세스마다 다른 이유는 무엇인가요?
2. Nest의 Module·의존성 주입과 운영체제 프로세스는 서로 무엇을 나누나요?
3. Worker에 HTTP 앱 대신 application context를 쓰면 어떤 자원을 만들지 않게 되나요? 두 프로세스가 같은 PC를 쓰는 한계도 적으세요.

## 독립 변경 — 정답 없이

**Worker의 정상 종료 요청을 받은 뒤 새 작업을 받지 않고, 이미 시작한 가짜 작업 하나만 마친 뒤 종료**하게 바꾸세요. 대기·진행·종료 요청의 순서를 먼저 적고, 종료 중 추가 요청을 보내 직접 검사합니다. 다음 주 큐와 달리 이 주의 타이머·횟수는 메모리뿐이며 재시작하면 사라집니다.

[해설](explanation.md)은 첫 시도 뒤에 봅니다. 제작 검사가 학습자의 설명·독립 변경을 대신하지 않습니다.
