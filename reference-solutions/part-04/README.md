# 4단계 참고 완성본

제작자와 첫 구현 후 비교할 학습자를 위한 별도 완성본입니다. 기본 학습 명령은 이 폴더를 읽지 않습니다. [3주 과제](../../docs/tasks/part-04/README.md)와 [검증 기록](../../docs/verification/part-04.md)을 함께 봅니다. 독립 ‘모든 기기 로그아웃’ 정답은 없습니다.

이 폴더를 소스만 별도 디렉터리로 복사해 설치할 수 있습니다. Node engines와 lock 파일을 따릅니다. 폴더 안에서:

```sh
npm ci
npm run typecheck
npm run build
```

`.env.example`을 `.env`로 복사해 로컬 operator/app 비밀번호와 URL을 맞추고, 다음 결과를 SESSION_SECRET에 넣습니다. 실제 값을 Git·보고서·VITE_ 변수에 넣지 않습니다.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
docker compose --env-file .env -p brodcasting-part04-reference -f compose.part-04.yml up -d --wait
npm run db -- migrate
npm run db -- seed
npm run db -- provision-app
npm run db -- test-db
```

처음에는 계정이 없으며 UI에서 가입한 뒤 별도로 로그인합니다. 예를 들어 직접 가입한 `my_learner` 계정에만 R1 관리자 권한을 부여하려면:

```sh
npm run db -- grant-admin --username my_learner --room r1
```

`provision-app`은 최초 한 번만 실행합니다. 기존 역할은 거부하며 바꾸지 않습니다. migration·seed 재실행은 기존 데이터를 보존합니다. learner와 reference를 같은 5544 포트에서 동시에 띄우지 마세요. 별도 Compose 프로젝트라도 PostgreSQL 역할 이름은 cluster 범위입니다.

터미널 두 개에서 `npm run dev:api`, `npm run dev`를 실행합니다. API는 127.0.0.1:3004, 화면은 http://127.0.0.1:5184이며 프록시를 사용합니다. API 소스 변경은 재시작합니다. DB와 SESSION_SECRET을 유지하면 API 재시작에도 로그인·즐겨찾기가 유지됩니다. 로그아웃 후 재시작해도 옛 쿠키는 사용할 수 없습니다.

원본 저장소의 공개 검사는 루트에서 `npm run check:reference:part-04`입니다. 전용 `PART04_TEST_ADMIN_URL`이 필요합니다. `npm run verify:part-04:starter`는 별도로 의도된 인증 TODO 실패를 수집합니다. 독립 설치 검증은 새 빈 `brodcasting_part04_lab`과 없는 part04_app 역할을 가진 **버려도 되는 별도 cluster**에서만 다음과 같이 실행합니다.

```sh
# PART04_TEST_LAB_URL, PART04_SERVICE_CONTAINER를 현재 셸에 설정한 뒤
npm run verify:part-04:standalone
```

실행기는 소스 복사·새 npm ci·타입·빌드·operator 정상/거부·Vite 프록시·실제 API 두 번 재시작·로그 비밀값 부재를 확인합니다. 기존 lab 테이블/역할이 있으면 변경 전에 중지합니다. 결과는 test-results에 남고 독립 복사본은 OS 임시 폴더에 남습니다. 테스트는 DB를 초기화하지 않으며 사용자가 보유한 역할·볼륨을 지우지 않습니다.

세션은 PostgreSQL, 해싱은 argon2, CSRF·로그인 제한은 설치된 라이브러리를 사용합니다. 절대 30분·Secure=false는 로컬 HTTP 전용이고 production 기동은 거부합니다. 단일 프로세스 IP 제한·인가가 끝난 진행 중 요청·소켓 인증·브라우저 Cookie/CORS 확인은 문서의 한계를 따릅니다. Windows 프로세스 종료로는 POSIX 신호의 graceful cleanup을 검증했다고 주장하지 않습니다.
