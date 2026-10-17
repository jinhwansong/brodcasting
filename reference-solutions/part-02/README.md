# 2단계 참고 완성본 — 학습 후 열기

학습자의 예측·첫 구현·실패 증거 이후 비교하는 완성본입니다. 기본 root workspace에서 제외되며 별도 package.json·lockfile 안의 server/client workspace로 설치합니다. 실제 학습 통과는 설명·독립 변경까지 확인합니다.

Node.js 24.x 24.15.0 이상을 권장합니다(제작 검증 24.19.0). 저장소 루트에서:

```sh
npm --prefix reference-solutions/part-02 ci
npm --prefix reference-solutions/part-02 run typecheck
npm --prefix reference-solutions/part-02 run build
```

두 터미널에서 실행합니다.

```sh
# API: 127.0.0.1:3002
npm --prefix reference-solutions/part-02 run dev:api
```

```sh
# Vite 화면: 출력된 로컬 주소
npm --prefix reference-solutions/part-02 run dev
```

서버 소스 변경 뒤에는 API 명령을 다시 실행합니다. 다른 API와 3002 포트를 동시에 사용하지 마세요. PORT를 바꾸면 client/vite.config.ts의 개발 프록시도 맞춰야 합니다. Vite의 개발 프록시는 운영 배포 구성이 아닙니다.

공개 행동 검증은 저장소 루트 도구를 사용합니다. 제작자만 명시적으로 실행하세요.

```sh
npm ci
npm run check:reference:part-02
```

메모리 가짜 데이터와 개발용 지연·실패 API만 있습니다. POST search-preview는 입력 검증을 위한 읽기 전용 실험이며 저장하지 않습니다. 로그인·DB·실제 영상은 이후 단계입니다. 클라이언트의 abort가 현재 서버의 타이머를 취소하도록 연결하지 않았습니다. HTTP 캐시와 별도 결과 캐시는 도입하지 않았고 no-store를 사용합니다. 기본 timeout 변경 과제의 정답은 포함하지 않습니다.

[제작 검증](../../docs/verification/part-02.md)에서 자동 검사·독립 설치·실제 HTTP와 미실행 브라우저 범위를 구분합니다.
