# 10단계 — 안전한 입구를 만들고 고장 뒤 되돌리기 (2주)

이번 실습은 **내 컴퓨터의 일회용 데이터**로 설치·고장·복구를 연습합니다. 인터넷에 공개하는 배포는 아닙니다. [쉬운 설명](lesson.md)을 먼저 읽으세요. 실제 사용자의 데이터나 계정을 넣지 않습니다.

## 시작 전 예상

1. 서버가 살아 있는데 DB가 꺼졌다면 ‘사용 준비 완료’라고 해도 될까요?
2. 백업 파일이 만들어졌으면 복원도 성공했다고 말할 수 있을까요?
3. 이전 코드로 돌아가면 DB의 변경도 자동으로 되돌아갈까요?

## 내가 채울 부분과 제공한 부분

| 위치 | 역할 |
| --- | --- |
| labs/part-10/server/src/ops.ts | **과제 A** 설정 검증, **B** 실제 DB 준비 검사, **C** 정제 로그 |
| server/src/main.ts, create-app.ts | 제공: 실패 전 설정 확인·신뢰할 프록시·Secure 쿠키·상태 경로·종료 |
| server/의 나머지 코드 | 제공: 기존 인증·회원권·저장·복구, 제한된 동시 전달 |
| client/ | 제공: 계정·방 공지·채팅과 8단계 영상 플레이어 |
| compose.yml, Dockerfile, nginx.conf | 제공: 로컬 HTTPS 입구·내부 API/DB·고정 이미지 버전 |
| setup.mjs, restore-grants.mjs | 제공: 빈 DB 준비·제한 역할·복원 뒤 권한 복구 |
| failure.Dockerfile | 제공: 종료 코드 42로 실패하는 **고장 실험 전용 이미지** |

시작 코드는 설정을 거부하고 준비 상태를 false로 두므로 처음에는 기동되지 않습니다. 공개 검사에서 A/B/C를 먼저 완성하세요. 완성본을 미리 복사하지 않습니다.

```sh
npm run check:part-10
npm run typecheck:part-10
npm run build:part-10
```

루트 Node 준비와 `npm ci`가 먼저 필요합니다. Docker Desktop의 Linux 엔진과 OpenSSL도 필요합니다. Windows에서는 Git에 포함된 OpenSSL을 사용할 수 있습니다.

## 1주 — 설치하고 입구 확인하기

전체 자동 재현은 루트에서 `npm run verify:part-10`입니다. 내가 작성한 시작 코드로 이미지 빌드부터 실제 HTTPS/WSS·재시작·DB 고장·복원·실패 이미지 롤백까지 확인합니다. 몇 분 걸릴 수 있습니다. http가 아닌 **https://127.0.0.1:8443**을 사용합니다. 이 검사는 스스로 만든 임시 프로젝트·볼륨만 정리하며 인증서와 비밀번호를 남기지 않습니다. 실제 브라우저 조작은 별도입니다.

아래는 직접 켜 보는 PowerShell 순서입니다. 과제 코드를 완성한 뒤 실행하세요. 실습을 다시 할 때 기존 볼륨에 새 비밀번호를 억지로 덮지 않습니다. 이 값은 현재 터미널에만 있습니다.

```powershell
$env:PART10_IMAGE_PREFIX = 'brodcasting-part10-local'
$env:PART10_DB_PASSWORD = node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))"
$env:PART10_APP_PASSWORD = node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))"
$env:SESSION_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
$env:PART10_TLS_DIR = Join-Path (Get-Location) 'test-results/part10-local-tls'
New-Item -ItemType Directory -Force $env:PART10_TLS_DIR | Out-Null
& 'C:/Program Files/Git/usr/bin/openssl.exe' req -x509 -newkey rsa:2048 -nodes -keyout "$env:PART10_TLS_DIR/key.pem" -out "$env:PART10_TLS_DIR/cert.pem" -days 1 -subj '/CN=localhost' -addext 'subjectAltName=IP:127.0.0.1,DNS:localhost'
docker compose -p part10-local -f labs/part-10/compose.yml build api web
docker compose -p part10-local -f labs/part-10/compose.yml up -d --wait db
docker compose -p part10-local -f labs/part-10/compose.yml run --rm setup
docker compose -p part10-local -f labs/part-10/compose.yml up -d api web
```

로컬 자체 서명 인증서라 브라우저가 신뢰 경고를 보여 줄 수 있습니다. 자동 검사는 이 인증서를 명시해 검증하며 TLS 검증을 끄지 않습니다. 공개 사이트용 인증서를 발급하거나 컴퓨터 전체의 신뢰 설정을 바꾸는 실습은 아닙니다.

브라우저에서 계정 두 개를 직접 만든 뒤 각 계정의 회원권을 따로 줍니다. 예를 들어 계정명이 learner_a라면 다음을 실행합니다. 회원권은 가입만으로 생기지 않습니다. 공지 관리자는 별도 grant-admin입니다.

```sh
docker compose -p part10-local -f labs/part-10/compose.yml run --rm setup node server/dist/db-cli.js grant-member --username learner_a --room r1
```

API와 DB에는 호스트 공개 포트가 없습니다. web만 loopback 8443을 엽니다. web은 입구 네트워크와 내부 네트워크에 연결되고, API/DB는 내부에만 있습니다. API는 정확한 프록시 IP 172.30.10.3에서 온 전달 정보만 신뢰합니다. IP·서브넷을 바꾸려면 Compose와 서버 검증을 함께 바꾸고 위조 헤더 검사를 다시 해야 합니다.

## 2주 — 고장 내고 확인한 뒤 복구하기

### 준비 상태와 로그

- /health/live: 프로세스가 응답하는지. DB 고장이어도 200일 수 있습니다.
- /health/ready: 실제 SELECT 1이 되는지. 실패하면 503입니다.
- 오류 로그: event·requestId·method·status만 남깁니다. 비밀번호·쿠키·요청 본문·쿼리 값은 남기지 않습니다.

`docker compose -p part10-local -f labs/part-10/compose.yml logs api`로 오류 번호와 화면 증상을 연결해 보세요. DB를 stop했다가 start하고, API를 restart한 뒤에도 같은 세션과 DB 이력이 남는지 봅니다. SESSION_SECRET을 바꾸면 같은 세션이라고 가정할 수 없습니다.

### 원본을 덮지 않는 백업·복원

PowerShell의 바이너리 `>`로 dump를 저장하면 버전에 따라 손상될 수 있습니다. 아래는 DB 컨테이너 안에서 파일을 만들고, **새 이름의 빈 DB**에 복원합니다. 백업에는 계정 해시와 세션도 있으므로 공유하지 않습니다.

```sh
docker compose -p part10-local -f labs/part-10/compose.yml exec -T db pg_dump -U postgres -Fc --no-owner --no-privileges -f /tmp/course.dump brodcasting_part10_lab
docker compose -p part10-local -f labs/part-10/compose.yml exec -T db createdb -U postgres brodcasting_part10_restore
docker compose -p part10-local -f labs/part-10/compose.yml exec -T db pg_restore -U postgres --exit-on-error --no-owner --no-privileges -d brodcasting_part10_restore /tmp/course.dump
docker compose -p part10-local -f labs/part-10/compose.yml run --rm setup node restore-grants.mjs
```

PowerShell에서 `$env:PART10_ACTIVE_DATABASE='brodcasting_part10_restore'`로 바꾸고 API만 `up -d --no-deps --force-recreate api`합니다. 같은 쿠키로 계정과 이력을 확인하세요. DB의 테이블 수만 보는 것보다 실제 API로 읽어 보는 것이 더 강한 확인입니다. 끝나면 컨테이너 안의 /tmp/course.dump를 지웁니다.

### 실패한 이미지에서 이전 정상 이미지로

`failure.Dockerfile`은 고장 실험용입니다. 정상 API 이미지를 바탕으로 시작하자마자 종료하는 새 이미지를 만듭니다. 데이터 형식은 바꾸지 않습니다.

```sh
docker build --build-arg BASE_IMAGE=brodcasting-part10-local-api -f labs/part-10/failure.Dockerfile -t brodcasting-part10-local-api-broken labs/part-10
```

PowerShell에서 `$env:PART10_API_IMAGE='brodcasting-part10-local-api-broken'`을 설정하고 API만 `up -d --no-deps --no-build --pull never --force-recreate api`합니다. 실패를 확인한 뒤 `$env:PART10_API_IMAGE='brodcasting-part10-local-api'`로 되돌려 같은 명령을 실행합니다. 정상 이미지 ID와 되돌린 뒤 상태·세션·이력을 확인하세요. 실제 DB 마이그레이션을 되돌리는 절차까지 자동 해결한 것은 아닙니다.

### 종료

`docker compose -p part10-local -f labs/part-10/compose.yml down`은 컨테이너를 멈추고 볼륨은 남깁니다. 볼륨을 지우면 이 실습 데이터가 없어지므로 보존 여부를 직접 결정합니다. 인증서 private key와 비밀 환경변수도 계속 쓸 이유가 없으면 정리합니다. 자동 재현 검사는 자신이 만든 일회용 볼륨만 정리합니다.

## 설명 3개와 독립 변경

1. 브라우저→프록시→API→DB에서 암호화·인증·권한을 각각 누가 맡나요?
2. 살아 있음과 사용 준비를 나눈 이유, 오류 requestId로 찾은 증거를 설명하세요.
3. 백업·새 DB 복원·권한 복구·이미지 롤백이 각각 무엇을 되돌리고 무엇을 남기나요?

독립 변경: **ready가 연속 두 번 성공해야 준비 완료, 한 번 실패하면 즉시 준비 안 됨**으로 바꾸세요. 여러 요청이 동시에 들어오거나 DB가 느릴 때 상태가 뒤집히지 않게 하고, 세션/채팅 검사를 우회하지 않게 하세요. 답은 제공하지 않습니다.

[제출 양식](submission.md)과 [브라우저 후속](browser-checklist.md)을 사용합니다. 실제 브라우저·공개 배포·외부 이용자 부하·운영 비용은 검증하지 않았습니다. 유료 자원을 만들지 않아 클라우드 청구를 측정한 값도 없습니다. 비용은 서버 시간·DB/백업 용량·영상 전송량·중계량·로그 보관 기간을 정한 뒤 계산해야 합니다.

공식 자료: [Nginx WebSocket 프록시](https://nginx.org/en/docs/http/websocket.html), [Express 프록시 신뢰](https://expressjs.com/en/guide/behind-proxies/), [PostgreSQL 복원](https://www.postgresql.org/docs/18/app-pgrestore.html).
