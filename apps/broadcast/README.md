# 온에어 라운지

SOOP·치지직처럼 방송을 탐색하고 시청하는 구조의 **학습용 사이트**입니다. 어두운 화면·상단 검색·채널 탐색·직접 그린 썸네일·팔로우·시청 페이지·실제 로그인/공지/DB 채팅을 연결했습니다. 휴대폰에서는 영상 아래에 채팅을 배치합니다. 기존 여섯 방송과 시청자 수는 샘플이고, 별도 WebRTC 실습실은 실제 브라우저 영상을 송출·시청합니다.

로그인한 본인의 알림함·읽음·안 읽은 수와 실제 큐/Worker 복구를 연결했습니다. [전체 진행](../../REMAINING_WORK.md)과 [화면 방향](../../docs/superpowers/specs/2026-10-21-broadcast-visual-refresh.md)을 확인하세요. 기본0단계의 학습 폴더와 별개이며 이 사이트 제작이 학습 통과를 뜻하지 않습니다.

화면은 [온에어 디자인 시스템](DESIGN_SYSTEM.md)을 기준으로 만듭니다. 실행 후 ‘디자인 가이드’에서 실제 공통 부품과 상태를 보고, [쉬운 수정 설명](client/src/ui/README.md)을 따라 색·간격·조작을 함께 바꿀 수 있습니다.

## 한 명령으로 일회용 실습 켜기

Docker Desktop을 실행하고 저장소 루트에서 npm ci를 마친 뒤 아래 명령을 실행하세요.

```sh
node apps/broadcast/dev-lab.mjs
```

http://127.0.0.1:5199 에서 새 실습 계정을 만들고 상단 종 모양의 ‘내 알림’을 누릅니다. 알림을 접수한 뒤 ‘최신 목록’을 눌러 확인하고 읽음으로 바꿔 보세요. 자동 푸시 방식은 아니므로 도착한 새 알림은 직접 조회합니다. 한 계정은 사건100개, 한 페이지20개까지입니다.

실행한 터미널에 worker-stop을 입력하고 알림을 접수하면 DB에는 남지만 알림함에는 아직 도착하지 않습니다. worker-start 후 최신 목록을 누르면 복구됩니다. api-stop/api-start로 API 재시작도 연습합니다. stop은 이 명령이 만든 일회용 프로세스와 컨테이너만 정리하며 이 실습 데이터도 사라집니다.

실제 빌드에 CSP를 적용한 화면은 node apps/broadcast/dev-lab.mjs --built로 켭니다. 주소는 http://127.0.0.1:5198 입니다. 개발 모드와 별도의 일회용 DB를 사용합니다.

[쉬운 알림 교재](../../docs/tasks/runtime-05/README.md) · [보안3강](../../docs/tasks/security-frontend/README.md) · [검증 결과](../../docs/verification/notifications-security-integrated.md).

## 설치와 화면 실행

루트에서 설치했다면 다음 명령을 씁니다.

```sh
npm ci
npm run typecheck:broadcast
npm run build:broadcast
npm run check:broadcast
npm run dev:broadcast
```

화면 주소는 http://127.0.0.1:5190 입니다. 검색·로그인·팔로우·채팅을 사용하려면 아래 API도 켜야 합니다. API 없이 가짜 성공 결과를 만들어 표시하지 않습니다.

이 폴더만 따로 복사해도 `npm ci`, `npm run typecheck`, `npm run build`가 가능합니다. 두 workspace의 의존성 링크는 이 폴더 안을 가리킵니다. 저장소 밖 새 설치와 빌드를 실제로 검증했습니다.

## API 준비 — 기존6단계 구조 재사용

서버는6단계의 세션·CSRF·제한 DB 역할·방 권한·저장/복구 채팅 구조를 재사용합니다. 환경변수 이름도 PART06 계열을 유지합니다. **기존 학습 DB 대신 별도 일회용 PostgreSQL 인스턴스**를 준비하세요. 필요한 DB 이름은 brodcasting_part06_lab, 앱 역할은 part06_app입니다. [6단계 환경 설명](../../docs/tasks/part-06/README.md)을 먼저 따라갑니다.

이 폴더의 `.env.example`을 참고해 자신의 로컬 환경을 설정합니다. 운영자 연결에는 PART06_ADMIN_URL, 앱에는 PART06_DATABASE_URL, 앱 역할 생성에는 PART06_APP_PASSWORD를 사용합니다. SESSION_SECRET은 임의의64자리16진수이고 재시작 후 같은 세션을 유지하려면 같은 값을 사용합니다. UI 주소를 **PART06_BROWSER_ORIGIN=http://127.0.0.1:5190**으로 지정합니다.

이 폴더에서 운영자 설정을 준비한 후 다음 순서로 실행합니다. 기존 앱 역할은 덮어쓰지 않습니다.

```sh
npm run db -- migrate
npm run db -- seed
npm run db -- provision-app
npm run dev:api
```

다른 터미널에서 이 폴더의 `npm run dev`로 UI를 켭니다. API는 loopback3006입니다. 루트에서는 apps/broadcast/.env를 준비한 뒤 `npm run dev:broadcast:api`로도 켤 수 있습니다. 이 폴더 안에서 실행하는 명령은 현재 폴더의 .env를 읽습니다.

새로 가입한 계정에는 자동으로 관리자·채팅 참여 권한을 주지 않습니다. 버려도 되는 실습 DB에서 **본인이 선택한 계정과 방만** 운영자 CLI로 지정합니다. 아래 NAME은 직접 만든 아이디로 바꿉니다.

```sh
npm run db -- grant-member --username NAME --room r1
npm run db -- grant-admin --username NAME --room r1
```

참여 권한은 채팅, 관리 권한은 공지 편집입니다. 서로 다르므로 필요한 것만 부여합니다. 현재 여섯 샘플은 기존 공동 연습방 r1/r2에 연결됩니다. React·라디오·재즈는 r1, TypeScript·서버는 r2이며 화면에서도 공동 연습방임을 표시합니다. 방송마다 독립된 방을 제공한다고 주장하지 않습니다. 채팅 거부가 보이면 권한을 확인한 뒤 ‘채팅 다시 접속’을 누릅니다.

## 직접 확인할 흐름

1. 목록에서 주제 버튼·검색·정렬을 바꿉니다. 없는 검색어에서는 빈 결과와 복구 버튼이 보여야 합니다.
2. 썸네일을 눌러 시청 화면으로 갑니다. 영상은 재생 버튼을 눌러 시작합니다. 자막·일시 정지·시간 이동은 영상의 기본 조작을 사용합니다.
3. 로그인 없이 팔로우를 누르면 계정 창이 열립니다. Escape와 닫기 버튼으로 닫을 수 있어야 합니다.
4. 가입·로그인 후 팔로우를 저장합니다. 시청 중 팔로우를 바꿔도 영상과 채팅 초안을 다시 만들지 않아야 합니다.
5. 허용한 방에서 채팅을 보냅니다. 같은 계정의 다른 탭에서도 실제 메시지를 확인하고 새로고침 후 DB 이력을 확인합니다.
6. 휴대폰 크기에서는 가로 스크롤 없이 영상→방송 정보→채팅→공지 순서로 읽습니다.

## 실제 WebRTC 송출·시청

‘WebRTC 송출·시청 실습’ 버튼으로 이동합니다. 로그인 후 움직이는 테스트 화면·카메라·화면 공유 중 하나를 직접 선택합니다. 테스트 화면은 카메라 권한 없이 연습할 수 있습니다. 다른 탭에서 표시된 방을 선택해 실제 영상을 받습니다. 서버는 로그인·방·SDP 신호만 관리하고 영상은 브라우저 사이로 전달합니다. 기존 샘플의 공동 채팅방 r1/r2와 별개의 영상 실습방입니다.

방마다 시청자4명·전체5방·20소켓으로 제한하고 외부 STUN/TURN은 자동 사용하지 않습니다. 시청자 수는 방에 등록된 접속 수이고 재생 성공 인원 통계는 아닙니다. 기본은 loopback이고 다른 PC에서는 명시적 LAN HTTPS와 신뢰 인증서가 필요합니다. **[쉬운 실습 설명과 다른 PC 설정](../../docs/tasks/webrtc-01/lesson.md)**을 따릅니다. 카메라·마이크·인증서 신뢰는 사용자가 직접 선택합니다. 방화벽이나 공개 인터넷 노출을 자동으로 켜지 않습니다.

```sh
npm run check:broadcast:rtc
npm run check:reference:webrtc-01
npm run verify:webrtc-01:standalone
```

위 명령은 저장소 루트 기준이며 첫째·셋째는 일회용 Docker DB를 사용합니다. [실제 WebRTC 검증](../../docs/verification/webrtc-01.md). [학습 시작 코드](../../docs/tasks/webrtc-01/README.md)는 별도로 분리했습니다.

알림함·7주 Compose·보안 전용 실습을 제공했습니다. 공개 배포·운영 보안을 검증한 사이트로 사용하지 않습니다. [기존 화면 검증 기록](../../docs/verification/broadcast-visual.md).
