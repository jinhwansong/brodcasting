# 3단계 참고 완성본 — 직접 시도한 뒤 열기

독립 server/client workspace와 자체 lockfile입니다. root 학습 workspace에서 제외됩니다. 제약·바인딩 SQL·멱등 즐겨찾기·페이지 UI의 비교용이며 학습자의 설명·독립 cursor 변경 정답은 대신하지 않습니다.

Node24.x 24.15.0 이상(제작24.19.0), PostgreSQL18. 저장소 루트에서:

```sh
npm --prefix reference-solutions/part-03 ci
npm --prefix reference-solutions/part-03 run typecheck
npm --prefix reference-solutions/part-03 run build
cp reference-solutions/part-03/.env.example reference-solutions/part-03/.env
```

복사본의 .env 비밀번호/URL을 맞춥니다. 시작 코드 DB를 실행 중이면 중지하세요. 이 완성본은 별도 reference Compose 프로젝트와 볼륨으로 비교하며 같은5543 포트를 동시에 쓸 수 없습니다.

```sh
docker compose --env-file reference-solutions/part-03/.env \
  -p brodcasting-part03-reference -f reference-solutions/part-03/compose.part-03.yml up -d --wait
npm --prefix reference-solutions/part-03 run db -- migrate
npm --prefix reference-solutions/part-03 run db -- seed
npm --prefix reference-solutions/part-03 run db -- provision-app
npm --prefix reference-solutions/part-03 run db -- test-db
```

두 터미널에서 `npm --prefix reference-solutions/part-03 run dev:api`, `npm --prefix reference-solutions/part-03 run dev`를 실행합니다. API는 제한 DB 역할과 loopback3003, client는 /api 개발 프록시를 사용합니다. 서버 변경 뒤에는 재시작합니다. PORT 변경 시 프록시도 맞춥니다.

이 디렉터리만 다른 곳에 복사했다면 그 안에서 같은 `npm ci`, `npm run ...` 명령을 사용합니다. .env·Compose 경로는 복사한 현재 디렉터리 기준으로 바꿉니다. 전역 CLI나 부모 저장소 의존성이 필요하지 않습니다.

공개 검증은 저장소 root 도구를 사용하며 제작자가 명시적으로 실행합니다.

```sh
# root .env의 test/lab URL을 현재 실행 중인 전용 DB로 맞춘 뒤
npm ci
npm run check:reference:part-03
```

`npm --prefix reference-solutions/part-03 run experiment -- --output report.json`은 lab DB의 TEMP 테이블만 사용합니다. 현재는 demo-user 공동 연습이며 사용자별 인증/권한은4단계입니다. API 프로세스 재시작의 지속성은 DB 백업/복구 보장과 다릅니다. CLI는 기존 역할 비밀번호를 덮지 않으며 적용한 migration 변경을 거부합니다. 원래001/002 뒤에 새 migration을 추가하면 명시 목록과 새 계약 검증도 함께 관리합니다.

[제작 기록](../../docs/verification/part-03.md)은 실제 DB·HTTP·jsdom·독립 설치와 미실행 브라우저/로컬 Compose를 구분합니다.
