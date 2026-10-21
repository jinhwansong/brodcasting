# 알림 과정3주 — 할 일을 접수함에 넣기

이번에는 API가 맡긴 일을 **Redis에 두고, 별도 BullMQ Worker가 처리**합니다. [쉬운 설명](lesson.md)을 먼저 읽고 [제출 양식](submission.md)에 예상부터 씁니다. 실제 이메일이나 외부 알림은 보내지 않습니다.

## 먼저 예상

Worker를 끈 상태에서 API에 일을 넣으면 없어질까요? 같은 ID로 두 번 넣으면 두 번 실행될까요? 세 번 실패한 일도 계속 다시 할까요? ‘완료한 큐 기록을 지웠다’는 조건을 추가하면 답이 달라질지도 적습니다.

## 파일과 내 과제

| 파일 | 역할 |
| --- | --- |
| `labs/runtime-03/src/jobs.ts` | A 입력 모양·범위 검사, B jobId·세 번 시도·대기·기록 상한 |
| `src/queue.ts` | 제공된 Queue·Worker 생성/종료, HTTP 접수·조회 |
| `src/context.ts`, `api.ts`, `worker.ts`, `activity.ts` | 2주의 Nest 시작 구조를 연결한 선수 코드 |
| `checks/runtime-03/` | 실제 Redis·별도 API/Worker 공개 검사. 소유한 일회용 컨테이너만 정리 |

A의 허용 입력은 정확히 `{id, failures}` 두 필드입니다. id는 `n-` 다음 소문자16진수16자리, failures는0~5 정수입니다. 새 객체를 반환합니다. 알 수 없는 키·배열·null·숫자 문자열은 거부합니다. B는 해당 jobId, attempts:3, fixed backoff100ms, 완료/실패 각각 최대100개·1시간 보관을 설정합니다. 이 보관 정책은 대기 작업 수의 제한과 다릅니다.

## 자동 실습부터

Docker Desktop의 Linux 엔진과 루트 Node/npm ci를 준비합니다. 루트에서:

```sh
npm run typecheck:runtime-03
npm run build:runtime-03
npm run check:runtime-03
```

검사기는 새 Redis8.6.7을 **127.0.0.1의 임의 빈 포트**에 띄우고 실제 작업을 넣은 뒤 정리합니다. 기존 Redis에 접속하거나 FLUSHALL하지 않습니다. 시작 코드는11개 중3통과/8의도된 실패입니다. Docker 연결·모듈·타입·준비 시간 초과를 이 숫자에 섞지 않습니다.

## 직접 API와 Worker를 따로 켜기

수동 실습용 Redis도 회사·개인 데이터와 분리한 버려도 되는 인스턴스로 준비하세요. 저장소가 제공하는 Docker 검사는 자동 정리하므로, 검사 종료 뒤 그 Redis를 수동 서버가 계속 사용할 수는 없습니다. 기본 수동 주소 예시는 loopback6383이고 실제 포트에 맞춥니다.

PowerShell 터미널 두 개에서 각각 환경을 설정한 뒤 실행합니다. prefix는 같은 실습끼리는 같게, 다른 실습과는 다르게 지정합니다. 아래 값은 비밀값이 아닌 실습 식별자입니다.

```powershell
$env:RUNTIME03_REDIS_URL = 'redis://127.0.0.1:6383/0'
$env:RUNTIME03_QUEUE_PREFIX = 'course_r03_0123456789abcdef'
# API 터미널
node labs/runtime-03/dist/api.js
# Worker 터미널에서도 위의 두 환경변수를 설정한 다음
node labs/runtime-03/dist/worker.js
```

API는 http://127.0.0.1:3013 입니다. Worker는 HTTP 포트를 열지 않습니다. 다음 접수는 Worker를 끈 상태에서 먼저 실행해 보세요.

```powershell
$body = @{id='n-0123456789abcdef'; failures=2} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3013/jobs' -ContentType 'application/json' -Body $body
Invoke-RestMethod -Uri 'http://127.0.0.1:3013/jobs/n-0123456789abcdef'
```

waiting을 확인한 뒤 Worker를 켜고 completed·attemptsMade3·result3을 확인합니다. failures5인 새 ID는 failed·attemptsMade3이어야 합니다. 같은 ID를 반복 접수하면 남아 있는 기존 기록을 사용하며 내용이 덮어써지지 않습니다. 완료한 큐 기록을 지우면 같은 ID도 새로 실행될 수 있으므로 영구 중복 방지라고 말하면 안 됩니다.

이 접수 API는 **로그인 없는 로컬 가짜 작업 실험**입니다. 공개 운영이나 실제 사용자 알림 API로 사용하지 않습니다. 기존 인증과 내 알림함은5주에서 연결합니다. 이번 자동 검사 Redis는 영속 저장을 끄므로 Redis 자체를 삭제하면 작업도 사라집니다. Worker만 다시 켠 실험과 Redis 장애 복구를 구분하세요.

## 설명 세 가지와 독립 변경

1. API 프로세스·Redis·Worker 프로세스가 각각 맡은 일을 입력 한 건으로 설명하세요.
2. jobId 중복 검사와 작업 결과 저장의 멱등성은 왜 다른가요?
3. 시도 횟수·다음 시도까지의 대기·완료 기록 보관이 각각 제한하는 것은 무엇인가요?

독립 변경: **일시 중지 후 다시 처리하기**를 추가하세요. 큐 일시 중지와 Worker 한 개의 일시 중지를 구분하고, 진행 중 작업·대기 작업·재개 뒤 실행 순서를 직접 검사합니다. 정답 코드는 제공하지 않습니다. [해설](explanation.md)은 첫 시도 뒤에 읽습니다.
