# 5단계 참고 완성본

3주 WebSocket 채팅의 제작자/첫 구현 후 비교용 완성본입니다. 기본 학습은 이 폴더를 자동으로 읽지 않습니다. [과제](../../docs/tasks/part-05/README.md)·[검증 기록](../../docs/verification/part-05.md)을 함께 봅니다. 독립 ‘한 연결로 방 이동’의 답은 제공하지 않습니다.

이 폴더를 소스만 별도 디렉터리로 복사해 설치할 수 있습니다. Node engines와 정확한 lock을 따르고 폴더 안에서 실행합니다.

```sh
npm ci
npm run typecheck
npm run build
```

`.env.example`을 로컬 `.env`로 복사해 operator/app 비밀번호와 URL을 맞춥니다. 실제 값을 커밋하지 않고 URL 특수문자는 인코딩합니다. 다음 결과를 SESSION_SECRET에만 넣고 재시작에서도 유지합니다.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
docker compose --env-file .env -p brodcasting-part05-reference -f compose.part-05.yml up -d --wait
npm run db -- migrate
npm run db -- seed
npm run db -- provision-app
npm run db -- test-db
```

기존 DB 역할을 덮지 않습니다. `provision-app`은 처음 한 번 실행하며 migration·seed 재실행은 데이터를 보존합니다. learner/reference를 같은5545포트에서 동시에 기동하지 않습니다. 앱 사용자와 DB 역할은 다르고 역할 이름은 PostgreSQL cluster 범위입니다.

두 터미널에서 `npm run dev:api`, `npm run dev`를 실행합니다. API3005·화면5185·DB5545를 loopback으로 제한합니다. localhost를 혼용하지 않습니다. `/api`와 `/socket.io`는 Vite 프록시를 사용합니다. UI에서 직접 가입·로그인한 계정에 operator로 회원권을 부여합니다.

```sh
npm run db -- grant-member --username my_learner --room r1
```

공지 관리자 역할이 필요하면 별도 `grant-admin --username my_learner --room r1`을 사용합니다. 채팅 회원권과 공지 권한은 별개입니다. 회원권 부여 후 수동으로 채팅에 다시 접속합니다.

원본 저장소 루트에서 `npm run check:reference:part-05`로 실제 PG/HTTP/socket/client를 검사합니다. `PART05_TEST_ADMIN_URL`은 전용 test DB여야 합니다. `verify:part-05:starter`는 A/B/C 의도된 실패와 선수 기능 통과를 수집합니다.

독립 설치 검사는 빈 `brodcasting_part05_lab`과 part05_app 역할이 없는 **버려도 되는 별도 cluster**에서만 실행합니다. `PART05_TEST_LAB_URL`, `PART05_SERVICE_CONTAINER`를 현재 셸에 설정한 뒤 루트에서 `npm run verify:part-05:standalone`을 실행합니다. 기존 lab 테이블/역할이나 사용 중 API/client 포트가 있으면 변경 전에 멈춥니다. 새 소스 복사·npm ci·타입/빌드·operator 정상/거부·실제 HTTP/WebSocket 프록시·두 클라이언트 송수신·API 두 번 재시작·세션/즐겨찾기 유지·폐기된 연결과 쿠키 차단·로그 표식 부재를 검사합니다.

메시지는 휘발성이며 DB 저장·이력·복구·자동 재시도를 제공하지 않습니다. 화면은 최근100개만 보관합니다. 서버 한 프로세스의 연결20·이벤트10/초·대기4·frame8192 상한은 운영 성능 보장이 아닙니다. 세션/회원권을 각 발송·각 수신자와 유휴 sweep에서 재확인하지만 이미 인가된 진행 중 전달까지 취소하지는 않습니다.

HttpOnly/Lax 쿠키의 Secure=false는 로컬 HTTP용이고 production 기동은 거부합니다. 실제 브라우저·Compose 파일 직접 기동·공개 배포·다중 서버·소켓 복구·BunkerWeb은 별도 후속입니다. Windows의 프로세스 종료를 POSIX graceful signal 검증으로 세지 않으며 Linux CI 결과를 따로 기록합니다.
