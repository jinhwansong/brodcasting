# 1단계 참고 완성본 — 학습 후 열기

자신의 예상·첫 구현·실패 증거를 남긴 뒤 비교할 제작자용 완성본입니다. 기본 실행·설치 workspace에 포함되지 않습니다. 학습 폴더로 복사하면 설명·독립 변경을 대신할 수 없습니다.

이 폴더는 독립 package.json·package-lock.json을 갖습니다. Node.js 24.x 24.15.0 이상을 권장합니다(제작 검증 24.19.0). 저장소 루트에서:

```sh
npm --prefix reference-solutions/part-01 ci
npm --prefix reference-solutions/part-01 run typecheck
npm --prefix reference-solutions/part-01 run build
npm --prefix reference-solutions/part-01 run dev
```

공개 행동 검증은 저장소 루트 의존성을 사용합니다. 제작자만 명시적으로 실행하세요.

```sh
npm ci
npm run check:reference:part-01
```

목록 조건은 유지하고 선택 id에서 상세를 파생합니다. 상세의 화면 체류 시간은 id 전환마다 초기화됩니다. 실제 영상 시간·시청 통계가 아니며 백그라운드 타이머 지연은 보정하지 않습니다. 즐겨찾기는 메모리 상태이고 새로고침 뒤 저장되지 않습니다. 실제 서버·영상·계정·외부 API는 없습니다.

자동 검증과 독립 설치·HTTP 확인은 [제작 검증 기록](../../docs/verification/part-01.md)에 있습니다. 실제 브라우저·스크린리더 확인은 사용자 요청으로 미실행입니다.
