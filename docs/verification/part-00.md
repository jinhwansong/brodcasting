# 0단계 제작 검증 기록

상태: **0단계 교재 제작 완료 / 실제 브라우저 검증 보류 / 학습 미시작**. 2026-10-17 사용자가 브라우저 검증은 추후 직접 하고 교재 완성과 푸시를 우선하라고 명시했습니다. 따라서 교재 제작 완료와 브라우저 검증 통과를 구분하며, 후자는 미완료로 유지합니다.

## 환경과 고정 버전

제작일: 2026-10-17 KST. Linux, Node.js 24.19.0, npm 11.9.0.

| 도구 | 고정 버전 |
| --- | --- |
| React / React DOM | 19.3.1 |
| TypeScript | 7.0.2 |
| Vite / React plugin | 8.3.4 / 6.1.2 |
| Vitest / jsdom | 5.0.5 / 30.1.3 |
| Testing Library React / user-event | 16.3.3 / 14.6.8 |
| Playwright Test | 1.58.2 |

루트 npm workspace는 학습용 labs/part-00만 포함합니다. 참고 완성본은 자동 설치 대상이 아니며 독립 package.json·lockfile을 사용합니다. 이는 계획의 lab 개별 lock 대신 외부 공개 테스트의 모듈 해석을 일관되게 하기 위한 최소 변경입니다.

## 확인한 결과

- 최초 환경 검사: package.json이 없어 typecheck가 ENOENT로 실패하는 것을 확인한 뒤 환경을 작성했습니다.
- 최초 도메인 시작 코드: 14개 중 12개 assertion 실패·2개 통과. 기능 미구현에 따른 의도된 실패입니다.
- 빈 App/로더: UI와 로더 검증이 먼저 실패하는 것을 확인했습니다. 비동기 assertion의 unhandled rejection은 테스트 코드에서 바로잡고, 로더만 다시 실행해 2개 assertion 실패·1개 통과를 확인한 후 로더를 구현했습니다.
- 시작 코드 전체: 24개 중 18개 assertion 실패·6개 통과. 검색·정렬·즐겨찾기·상태 연결이 남아 있기 때문입니다. 이 실패를 통과로 감추지 않습니다.
- 참고 완성본: 같은 공개 테스트 24개가 모두 통과했습니다. 구성은 도메인 14, 모의 로더 3, jsdom UI 7개입니다.
- 시작 코드 타입 검사와 Vite 배포 빌드: 통과했습니다.
- 루트 npm ci 재실행, 시작 코드 타입 검사·빌드: 모두 exit 0.
- 완성본 자체 npm ci, 타입 검사·빌드 후 같은 공개 테스트: 모두 exit 0, 24개 통과.
- node_modules·dist를 제외한 완성본만 새 임시 디렉터리로 복사해 npm ci·타입 검사·빌드 재실행: 모두 exit 0. 독립 Vite 서버가 index와 App 모듈을 HTTP 200으로 제공하는 것도 확인했습니다. 이는 실제 브라우저 실행 검증은 아닙니다.

## 브라우저 설치 차단

1. Playwright 1.64.1의 Chrome 156 다운로드가 0바이트 아카이브로 반환되어 unzip 실패했습니다.
2. 호환 도구 버전을 Playwright 1.58.2로 고정했지만 Chrome 145 다운로드도 같은 이유로 실패했습니다.
3. 시스템 Chromium 설치를 시도했으나 apt가 setgroups / seteuid 권한 오류로 중단됐습니다. 권한을 우회하거나 다른 실행 환경으로 자동 이전하지 않았습니다.

따라서 Chromium 실제 실행, 390px·1280px 레이아웃, 키보드 상호작용, 실제 브라우저의 오류 복구 검증은 **미실행**입니다. jsdom 검증은 이 항목들을 대신하지 않습니다. 다른 브라우저·Windows·macOS·보조공학 수동 검증도 미실행입니다.

`npm run test:e2e:reference`도 실제로 시도했습니다. Vite 미리보기 서버는 기동했지만 desktop/mobile 각 2개, 총 4개 시나리오가 Chromium 실행 파일 부재로 시작 단계에서 실패했습니다. 브라우저 assertion 통과 결과는 없습니다.

## 다시 실행할 명령

저장소 루트에서:

```sh
npm ci
npm run typecheck
npm run build
npm run check:exercise
```

마지막 명령은 초기 시작 코드에서 실패해야 합니다. 정상 기능을 학습자가 구현하면 성공하도록 설계되어 있습니다.

참고 완성본의 검증은 명시적으로 요청한 경우에만:

```sh
npm --prefix reference-solutions/part-00 ci
npm --prefix reference-solutions/part-00 run typecheck
npm --prefix reference-solutions/part-00 run build
npm run check:reference
npx playwright install chromium
npm run test:e2e:reference
```

현재 호스트는 npm의 기존 http-proxy 설정에 대한 deprecation warning을 출력합니다. 이 경고를 숨기거나 프로젝트 오류로 오인하지 않았습니다.

## 출처

착수 시 실제 페이지를 확인했습니다.

- [Vite 시작과 Node 요구사항](https://vite.dev/guide/)
- [Vitest 시작](https://vitest.dev/guide/)
- [Playwright 설치](https://playwright.dev/docs/intro)
- 학습 개념의 공식 문서는 [해설](../tasks/part-00/explanation.md)에 연결했습니다.

## 독립 리뷰와 수정

독립된 리뷰어가 전체 변경과 요구사항을 검토하고 참고 완성본의 24개 테스트를 다시 실행했습니다. Node 22.12 이상이라는 초기 안내가 jsdom 및 전이 의존성의 실제 요구조건보다 넓다는 중요한 문제를 확인했습니다. 이를 재현하는 제작자용 engine 회귀 검사 2개가 먼저 실패한 뒤, 양쪽 engines를 `^22.22.2 || ^24.15.0 || >=26.0.0`으로 맞추고 안내를 수정했습니다. 실제 런타임 실행 검증은 24.19.0에서만 했으며 다른 버전을 모두 실행했다고 주장하지 않습니다.

미보완 경미 항목:

- 즐겨찾기 조건에서 정렬을 생략하는 잘못된 구현을 잡는 다중 결과·동률 조합 검증이 부족합니다. 현재 완성본의 조합 정렬은 구현되어 있습니다.
- 즐겨찾기 삭제 경로가 원본 Set을 변경하는 잘못된 구현을 잡는 별도 불변성 검증이 부족합니다. 현재 완성본은 추가·삭제 모두 새 Set으로 처리합니다.

수정 후 제작자용 `npm run check:toolchain` 2개, 참고 완성본의 도메인·로더·jsdom UI 24개가 모두 통과했습니다. 양쪽 타입 검사와 배포 빌드도 다시 통과했습니다.

구성 판단: 외부 공개 테스트를 일관되게 실행하기 위해 루트 npm workspace와 공용 lockfile을 사용했습니다. 잘못된 선택이라면 설치 명령과 잠금파일 배치를 다시 구성하는 비용이 있습니다. 실제 브라우저 검증은 사용자 요청으로 후속 작업으로 남겼으며, 레이아웃·키보드 문제가 남아 있을 수 있습니다. 권한을 우회하거나 다른 실행 환경으로 자동 이전하지 않았습니다.

## 학습 판정

자동 테스트와 제작자 검증은 교재 품질의 일부만 확인합니다. 학습자의 예상·첫 구현·설명 3개·독립 변경 과제·도움 범위는 확인하지 않았으며 학습 상태는 미시작으로 유지합니다.
