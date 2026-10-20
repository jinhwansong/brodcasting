# 6단계 참고 완성본 — 저장·재연결·복구

제작자 검증/첫 시도 뒤 비교용입니다. 학습 중 요청 없이 읽거나 labs로 복사하지 않습니다. [교재](../../docs/tasks/part-06/README.md), [검증](../../docs/verification/part-06.md)을 먼저 따릅니다. 기존0~5와 독립된 전용 DB/역할/포트를 사용합니다.

## 소스만 복사한 독립 실행

이 폴더를 별도 디렉터리에 복사해 실행할 수 있습니다. 지원 Node와 npm이 필요합니다.

```sh
npm ci
npm run typecheck
npm run build
```

.env.example을 복사해 로컬 .env를 작성합니다. PART06_ADMIN_URL은 빈 brodcasting_part06_lab의 loopback 관리자 URL입니다. PART06_APP_PASSWORD를 생성하고 SESSION_SECRET은 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` 같은 로컬 도구로 생성한64자리 hex를 사용합니다. 생성값을 문서·로그·커밋에 붙여넣지 않습니다. Compose를 쓸 경우 `docker compose --env-file .env -f compose.part-06.yml up -d`이며 DB는127.0.0.1:5546입니다. 이 파일의 직접 기동 검증은 보류했습니다.

```sh
npm run db -- migrate
npm run db -- seed
npm run db -- provision-app
```

PART06_DATABASE_URL에 제한 역할 part06_app의 같은 lab DB URL을 설정한 뒤 두 터미널을 사용합니다.

```sh
npm run dev:api
npm run dev
```

API127.0.0.1:3006·화면127.0.0.1:5186이며 Vite가 /api와 /socket.io를 프록시합니다. localhost와127.0.0.1을 혼용하지 않습니다. 가입·로그인한 계정에 operator가 회원권을 줍니다. seed에 고정 관리자나 평문 비밀번호가 없습니다.

```sh
npm run db -- grant-member --username learner_a --room r1
```

공지 편집 권한 grant-admin은 별개입니다. API 역할은 회원권을 만들지 못하고 메시지 SELECT/INSERT, counter SELECT/INSERT/UPDATE(value)만 갖습니다. 메시지 수정/삭제·DDL은 거부합니다. provision-app은 기존 역할을 덮거나 비밀번호를 교체하지 않습니다. production 기동은 거부하고 로컬 HTTP 쿠키는 Secure=false입니다.

## 구현과 한계

방 counter를 commit까지 잠그고 현재 회원권·같은 사용자/방/clientMessageId를 확인해 순서·저장을 원자적으로 처리합니다. 동일 내용 재시도는 기존 Message를 반환하고 다른 내용은409입니다. bigint seq를 문자열로 유지합니다. 고정 until 안의 이력50개를 조회하며 끝의 cursor를 until까지 전진시킵니다.

client는 live/ack를 이력 조회 신호로 사용하고 검증된 페이지의 next만 cursor에 적용합니다. 페이지/재연결/발송 재시도에 상한을 두며 계정/방별 메모리를 정리합니다. 방마다 미확인1개(총2개)이며 재접속만으로 자동 재발송하지 않습니다. 새로고침 시 메모리 outbox/cursor가 사라집니다. 독립 과제인 이력 기반 미확인 발송 자동 확인은 구현하지 않았습니다.

저장 commit 뒤 전달/ack 전에 서버가 멈추면 재연결/수동 이력으로 회수합니다. 온라인 상태에서 모든 commit을 즉시 알아내는 보장, 모든 수신자의 표시, 운영 exactly-once를 주장하지 않습니다. DB 복원·보관 정책·다중 서버·영구 outbox·공개 운영은 별도 과제입니다.

루트의 제작자 명령 check:reference:part-06, verify:part-06:starter, verify:part-06:standalone은 각각 별도 test DB/빈 lab DB와 소유 cluster를 요구합니다. 실제 브라우저 검증·Compose 직접 기동·공개 배포는 미실행입니다.
