# 방송 실험실

실시간 서비스를 소재로 React·TypeScript 기본기와 서버 흐름을 배우는 교재 저장소입니다. [39주 커리큘럼](CURRICULUM.md)이 기준입니다. 실제 방송 서비스나 학습자의 완료된 포트폴리오가 아닙니다.

## 0단계 시작

0단계 교재 제작을 완료했습니다. 참고 완성본의 도메인·UI 24개와 도구 호환성 2개 검증을 통과했습니다. 실제 브라우저 검증은 사용자가 추후 진행하기로 했으며 통과로 간주하지 않습니다. [검증 기록](docs/verification/part-00.md)을 확인하세요.

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

## 제작자만 명시적으로 실행

`npm run check:reference`는 참고 완성본에 같은 공개 테스트를 적용합니다. 일반 학습 중에는 요청 없이 실행하지 않습니다. 완성본 자체의 설치·실행 안내와 한계는 해당 폴더 README에 있습니다.

`npm run check:toolchain`은 제작자용으로 양쪽 패키지의 Node 지원 범위가 잠긴 의존성들과 호환되는지 검사합니다. 참고 완성본의 패키지 메타데이터를 읽으므로 기본 학습 테스트에는 포함하지 않습니다.
