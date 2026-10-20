# 방송 실험실

실시간 서비스를 소재로 React·TypeScript 기본기와 서버 흐름을 배우는 교재 저장소입니다. [39주 커리큘럼](CURRICULUM.md)이 기준입니다. 실제 방송 서비스나 학습자의 완료된 포트폴리오가 아닙니다.

2026-10-20 사용자 요청으로 제작을 재개해 **0~6단계 교재·코드·로컬 검증**을 갖췄습니다. [기획서](PROJECT_PLAN.md)와 [남은 작업·인수인계](REMAINING_WORK.md)에 현재 범위와 다음 제작을 기록합니다. 학습자는 0단계·미시작이며 실제 브라우저 검증은 계속 보류합니다.

## 0단계 시작

0단계 교재 제작을 완료했습니다. 참고 완성본의 도메인·UI 24개 검증을 통과했습니다. 실제 브라우저 검증은 사용자가 추후 진행하기로 했으며 통과로 간주하지 않습니다. [검증 기록](docs/verification/part-00.md)을 확인하세요.

Node.js 24.x의 24.15.0 이상을 권장합니다(제작 검증: 24.19.0). npm과 Git도 필요합니다. 다른 버전의 지원 범위는 package.json의 engines를 확인하세요. 별도 서버·계정·API 키는 없습니다.

```sh
git clone https://github.com/jinhwansong/brodcasting.git
cd brodcasting
npm ci
npm run dev
```

브라우저에서 터미널에 표시된 로컬 주소를 엽니다. 먼저 [과제](docs/tasks/part-00/README.md)를 읽고 예상과 접근을 적으세요. 시작 코드는 의도적으로 미완성이며 완성본이 아닙니다.

- `npm run typecheck`: 시작 코드 타입 검사
- `npm run build`: 시작 코드 배포 빌드
- `npm test` 또는 `npm run check:exercise`: 시작 코드 행동 검증. 초기에는 의도적으로 실패합니다.
- `npm run test:e2e`: 시작 코드의 실제 Chromium 검증. 먼저 빌드와 `npx playwright install chromium`이 필요합니다.
- 작업 위치: `labs/part-00/src/`
- 학습 기록: [progress.md](progress.md)

참고 완성본은 별도 디렉터리에 있고 기본 실행·설치 대상이 아닙니다. 실제 학습 통과는 설명과 독립 변경까지 확인한 뒤 판단합니다. 이 저장소에는 실제 사용자 데이터·방송 영상·인증 비밀값이 없습니다.

## 1단계 선택 실행

[시청 화면과 사용자 상호작용 과제](docs/tasks/part-01/README.md)는 목록·상세·공유 상태·포커스·메뉴·타이머 정리·반응형을 다룹니다. 0단계 학습 이후 사용하는 독립 실습입니다. 현재 학습 상태는 자동으로 넘어가지 않습니다.

```sh
npm run dev:part-01
npm run typecheck:part-01
npm run build:part-01
npm run check:part-01
```

작업 위치는 `labs/part-01/src/`입니다. A~D가 미완성인 시작 코드여서 초기 행동 검증은 실패합니다. [제출 양식](docs/tasks/part-01/submission.md)과 [브라우저 후속 목록](docs/tasks/part-01/browser-checklist.md)을 사용하세요. 루트 기본 실행과 테스트는 계속 0단계입니다.

| 교재 | 과제 | 제작 검증 |
| --- | --- | --- |
| 0단계 | [현재 실력 확인](docs/tasks/part-00/README.md) | [기록](docs/verification/part-00.md) |
| 1단계 | [시청 화면과 사용자 상호작용](docs/tasks/part-01/README.md) | [기록](docs/verification/part-01.md) |
| 2단계 | [HTTP API와 느린 응답](docs/tasks/part-02/README.md) | [기록](docs/verification/part-02.md) |
| 3단계 | [PostgreSQL과 페이지네이션](docs/tasks/part-03/README.md) | [기록](docs/verification/part-03.md) |
| 4단계 | [로그인과 권한](docs/tasks/part-04/README.md) | [기록](docs/verification/part-04.md) |
| 5단계 | [WebSocket 채팅](docs/tasks/part-05/README.md) | [기록](docs/verification/part-05.md) |
| 6단계 | [저장·재연결·복구](docs/tasks/part-06/README.md) | [기록](docs/verification/part-06.md) |

## 2단계 선택 실행

[HTTP API와 느린 응답](docs/tasks/part-02/README.md)은 3주 분량의 NestJS·React 연결 실습입니다. 입력 검증, 응답 순서 역전, 요청 취소, 서버 중단과 오류 복구를 다룹니다. `npm ci` 후 두 터미널에서 `npm run dev:part-02:api`와 `npm run dev:part-02`를 실행합니다.

- `npm run typecheck:part-02`, `npm run build:part-02`: 서버·client 검사와 빌드
- `npm run check:part-02`: 시작 코드의 실제 HTTP·client 공개 행동 검증. 초기에는 의도적으로 실패
- 작업 위치: `labs/part-02/server/src/`, `labs/part-02/client/src/`
- [제출 기록](docs/tasks/part-02/submission.md)과 [브라우저 후속 목록](docs/tasks/part-02/browser-checklist.md)

API는 로컬 메모리 데이터만 사용합니다. 0·1단계, 이후 3~11단계, 추가 보안·알림 과정과 마지막 BunkerWeb 과정으로 이어집니다. 현재 학습 단계와 기본 실행 명령은 계속 0단계입니다.

## 3단계 선택 실행

[PostgreSQL과 페이지네이션](docs/tasks/part-03/README.md)은3주 분량의 직접 SQL 실습입니다. 테이블 제약·마이그레이션·바인딩·안정 정렬·멱등 즐겨찾기·실행 계획을 다룹니다. A의 SQL 제약을 먼저 수정한 뒤 강의의 .env/전용 DB/제한 역할 준비 순서를 따르세요.

- `npm run dev:part-03:api`, `npm run dev:part-03`: 로컬 API와 화면
- `npm run typecheck:part-03`, `npm run build:part-03`, `npm run check:part-03`
- `npm run experiment:part-03 -- --output part-03-experiment.json`: 세 크기의 TEMP 테이블 실험
- 시작 코드에는 HTTP/화면을 제공하고 SQL·제약·인덱스를 과제로 남깁니다. 현재는 공동 demo-user이며 개인별 인가는4단계입니다.
- [제출 기록](docs/tasks/part-03/submission.md), [브라우저 후속 목록](docs/tasks/part-03/browser-checklist.md), [실제 측정](docs/experiments/part-03/README.md)

PostgreSQL18.6의 실제 DB·HTTP·client 공개 검증97개, 독립 설치/프록시/API 재시작 검증을 통과했습니다. 실제 브라우저와 본인 로컬 Compose 실행은 후속 확인입니다. 학습 상태와 기본 명령은 계속0단계입니다. 이후4~11단계·알림·추가 보안·맨 마지막 BunkerWeb으로 이어집니다.

## 4단계 선택 실행

[로그인과 권한](docs/tasks/part-04/README.md)은 A 해싱/B 세션/C 권한의 3주 실습입니다. SQL·React 화면·세션 저장소 wiring은 제공하고 비밀번호·AuthService·Guard·접근 정책은 거부하는 골격으로 남깁니다. 교재의 전용 DB·로컬 secret·제한 역할 준비를 먼저 따르세요.

- `npm run dev:part-04:api`, `npm run dev:part-04`: API 3004·화면 5184
- `npm run typecheck:part-04`, `npm run build:part-04`, `npm run check:part-04`
- [빈 제출](docs/tasks/part-04/submission.md), [브라우저 후속](docs/tasks/part-04/browser-checklist.md), [완성본 독립 실행](reference-solutions/part-04/README.md)

실제 PostgreSQL·HTTP·wire·client 143개와 소스만 복사한 새 설치·실제 API 두 번 재시작 검증을 통과했습니다. 시작 코드의 인증 실패는 과제이며 학습자의 통과가 아닙니다. 쿠키 Secure=false인 로컬 수업이고 production 기동은 거부합니다. 다음 기본 과정은 WebSocket 채팅입니다.

## 5단계 선택 실행

[WebSocket 채팅](docs/tasks/part-05/README.md)은 A 입력/회원권·B 입장/발송·C 연결/구독 수명의 3주 실습입니다. 4단계 인증·화면은 제공하며 새 핵심 과제는 거부/미연결 골격으로 남깁니다. 교재의 별도 DB·제한 역할·방 회원권 설정을 먼저 따르세요.

- `npm run dev:part-05:api`, `npm run dev:part-05`: API3005·화면5185, HTTP/소켓 프록시
- `npm run typecheck:part-05`, `npm run build:part-05`, `npm run check:part-05`
- [빈 제출](docs/tasks/part-05/submission.md), [브라우저 후속](docs/tasks/part-05/browser-checklist.md), [완성본 독립 실행](reference-solutions/part-05/README.md)

실제 PG/HTTP/socket149개와 client50개, 총199개 및 source-only 새 설치·실제 소켓 프록시·재시작 검증을 통과했습니다. 메시지는 휘발성이며 저장·재연결 복구는6단계입니다. 실제 두 브라우저 확인은 보류합니다.

## 6단계 선택 실행

[저장·재연결·복구](docs/tasks/part-06/README.md)는 A 저장 트랜잭션/중복 방지·B 이력·C 복구/재시도의3주 실습입니다.5단계 인증·회원권·입장/전달은 제공합니다. 새로운 핵심 로직은 거부/미연결 과제로 남깁니다.

- `npm run dev:part-06:api`, `npm run dev:part-06`: API3006·화면5186, 전용 DB/역할은 교재 순서대로 준비
- `npm run typecheck:part-06`, `npm run build:part-06`, `npm run check:part-06`
- [빈 제출](docs/tasks/part-06/submission.md), [브라우저 후속](docs/tasks/part-06/browser-checklist.md), [완성본 독립 실행](reference-solutions/part-06/README.md)

실제 PG/HTTP/socket194개와 client68개, 총262개 및 새 설치·소켓 프록시·API 재시작 뒤 이력/중복 방지를 확인했습니다. 방별 commit 순서와 복구 cursor를 구분하며, ack 유실은 같은 발송 ID로 제한 재시도합니다. 실제 브라우저·영구 outbox·운영 exactly-once는 확인하지 않았습니다.

## 보안·프론트·인프라 과정

[보안 추가 커리큘럼](SECURITY_CURRICULUM.md)을 기존 단계와 함께 사용합니다. API·DB·로그인·채팅·가용성에 보안 과제를 연결하고 다음 전용 강의를 추가했습니다.

- [프론트 보안 F1·F2·F3](docs/tasks/security-frontend/README.md): 출력과 링크, 인증 상태·CORS/CSRF, 번들·CSP·의존성
- [맨 마지막 BunkerWeb 강의](docs/tasks/security-bunkerweb/README.md): 기본 11단계·알림 과정·앞선 보안 과제 뒤에 진행하는 네트워크·프록시·TLS·WAF·오탐·복구 실습

프론트 보안 전용 강의와 BunkerWeb의 현재 제공 범위는 강의 본문·실습 명세·제출 양식입니다. 해당 전용 실습 코드·Compose 구현은 후속 제작입니다.2단계는 DTO/Pipe·본문 제한,3단계는 바인딩·유일성·제한 DB 역할·외부 owner 거부를 실제 요청으로 검사했습니다. 전용 프론트/BunkerWeb의 브라우저·Docker·TLS 실행은 후속입니다.3단계 Actions의 실제 DB container 검증과 구분합니다. [보안 작성 기록](docs/verification/security-courseware.md), [2단계](docs/verification/part-02.md), [3단계](docs/verification/part-03.md)에서 범위를 확인하세요. 현재 학습 단계는0·미시작입니다.

## 제작자만 명시적으로 실행

`npm run check:reference`는 참고 완성본에 같은 공개 테스트를 적용합니다. 일반 학습 중에는 요청 없이 실행하지 않습니다. 완성본 자체의 설치·실행 안내와 한계는 해당 폴더 README에 있습니다.

`npm run check:reference:part-01`은 1단계 참고 완성본의 동일 공개 검증입니다. 별도 설치·실행 안내는 [완성본 README](reference-solutions/part-01/README.md)에 있습니다.

`npm run check:reference:part-02`는 2단계 완성본을 빌드하고 같은 HTTP·client 검증을 실행합니다. 독립 client/server 설치·실행 안내는 [2단계 완성본 README](reference-solutions/part-02/README.md)에 있습니다.

`npm run check:reference:part-03`은 전용 PostgreSQL DB에서3단계 완성본의 DB/HTTP/실험/client를 검사합니다. [독립 설치 안내](reference-solutions/part-03/README.md)를 따르세요.

`npm run check:reference:part-04`는 전용 test DB에서 4단계 완성본을 검사합니다. `verify:part-04:standalone`은 비어 있는 별도 lab DB/cluster에서만, `verify:part-04:starter`는 의도된 과제 실패 수집에 사용합니다.

`npm run check:reference:part-05`는 전용 test DB에서 5단계의 실제 소켓·client까지 검사합니다. `verify:part-05:standalone`은 빈 소유 lab DB/cluster에서만, `verify:part-05:starter`는 A/B/C 실패와 선수 기능 통과 수집에 사용합니다.

`npm run check:reference:part-06`은 전용 DB에서 저장/이력/재시도까지 검사합니다. `verify:part-06:standalone`은 빈 소유 lab DB/cluster, `verify:part-06:starter`는 의도된 실패 검증에 사용합니다.

`npm run check:toolchain`은 제작자용으로 루트와 각 참고 패키지의 Node 지원 범위가 잠긴 의존성들과 호환되는지 검사합니다. 참고 완성본의 패키지 메타데이터를 읽으므로 기본 학습 테스트에는 포함하지 않습니다.
