# 2단계 제작 검증

교재 제작자의 실행 결과입니다. 학습자의 설명·독립 변경·학습 통과 기록이 아닙니다. 메모리 NestJS API, 실제 HTTP 연결, React 요청 수명과 응답 순서 실습이 범위입니다. 브라우저·DB·인증·영상·공개 배포는 실행하지 않았습니다.

## 환경과 버전

Node.js 24.19.0, npm 11.9.0. React/ReactDOM 19.3.1, TypeScript 7.0.2, Vite 8.3.4, React plugin 6.1.2, Vitest 5.0.5, jsdom 30.1.3, Testing Library React 16.3.3/user-event 14.6.8을 유지했습니다. 추가 서버 의존성은 npm 메타데이터로 확인해 NestJS common/core/platform-express 12.1.3, class-validator 0.15.1, class-transformer 0.5.1, reflect-metadata 0.2.2, rxjs 7.8.2, Node types 24.19.2로 고정했습니다. 전역 CLI·관측 서비스·실제 계정·API 키는 없습니다.

서버는 NestJS 12 패키지의 실제 ESM type/exports를 확인하고 NodeNext·.js 상대 import·tsc decorator metadata를 사용했습니다. 참고 완성본은 별도 root lockfile과 client/server workspace로 설치합니다. 기존 root workspace에는 labs만 포함합니다.

## 실행 결과

| 실행 | 실제 결과 |
| --- | --- |
| root `npm ci` | exit 0 |
| `npm run typecheck:part-02` | server/client 모두 exit 0 |
| `npm run build:part-02` | tsc server / Vite client 모두 exit 0 |
| `npm --prefix reference-solutions/part-02 ci` | exit 0 |
| 완성본 `run typecheck`, `run build` | 두 workspace 모두 exit 0 |
| `npm run check:reference:part-02` | 리뷰 수정 후 서버·실제 loader 연결 46/46, client 26/26, 합계 **72/72 통과** |
| `npm run check:reference` | 기존 0단계 24/24 통과 |
| `npm run check:reference:part-01` | 기존 1단계 22/22 통과 |
| `npm run check:toolchain` | root와 참고 0/1/2 패키지의 Node 범위 4/4 통과 |
| 2단계 서버 시작 코드 | 46개 중 의도한 행동 실패 42 / 통과 4, exit 1 |
| 2단계 client 시작 코드 | 26개 중 assertion/DOM 실패 25 / 통과 1, exit 1 |

시작 코드의 **72개 중 67개 실패 / 5개 통과**는 A~D 미구현의 증거입니다. 구문·모듈·timeout 실패를 정상으로 포함하지 않았습니다. JSON reporter와 실패 원인을 확인했습니다. 호스트의 기존 npm `Unknown env config "http-proxy"` 경고는 출력되며 위 exit 결과와 구분합니다.

## RED → GREEN과 검사 경계

1. Task 1: 정상 기동되는 서버 골격에 실제 loopback HTTP 검증 24개를 먼저 적용했습니다. 비어 있는 Service·DTO/Pipe 시작 코드에서 20개 assertion 실패와 4개 통과를 확인했습니다. 첫 CJS 설정은 설치된 NestJS 12의 ESM과 충돌해 TS1479가 발생했으며, 이를 의도된 RED로 세지 않았습니다. ESM 설정 후 타입 검사·빌드와 실제 서버 기동이 성공했습니다.
2. Task 2: fetch·Hook·App 검증 26개를 먼저 작성하고 미완성 client에서 25개 실패/1개 idle 통과를 확인했습니다. 제어 Promise의 reject는 loader 시작 assertion 이후에만 주입해 미구현 코드의 unhandled rejection을 정상 실패로 숨기지 않았습니다.
3. Task 3: 같은 미완성 코드를 별도 완성본에 복사해 동일한 서버24/client26 RED를 다시 확인한 뒤 구현했습니다. 같은 50개가 통과했습니다. 이후 실제 Nest API를 client loader로 읽는 연결·서버 중단 3개와 id 길이/개행·선택적 enum null/배열 경계 4개를 추가해 57개를 확인했습니다.
4. 최종 리뷰의 입력 키 누락을 실제 HTTP 테스트 15개로 재현했습니다. JSON·목록 query·상세 query 각각에 constructor/toString/prototype/hasOwnProperty/__proto__를 보내면 수정 전 모두 200이어서 15개 모두 실패했습니다(기대 400). DTO 변환 전에 own key 허용 목록을 검사하는 RawInputKeysPipe를 추가해 같은 15개가 통과했습니다. DTO 값 검증은 다음 ValidationPipe에서 유지합니다. 최종 전체 72개와 기존 0/1단계·engine 회귀를 다시 실행해 통과했습니다.

서버 테스트는 TypeScript 소스를 Vite로 변환해 metadata를 추정하지 않고 tsc가 만든 ESM을 실행합니다. 실제 HTTP로 200/400/404/413/503, 잘못된 JSON 이후 정상 응답, no-store, 짧은 검색의 늦은 완료를 검사합니다. client의 단위 검증은 인코딩·signal·상태 코드·JSON shape를 검사하고, Hook은 abort를 무시한 이전 성공/실패·최신 실패·닫기·언마운트·재시도·동기 throw·StrictMode를 다룹니다. UI 대표 흐름은 fetch 대체 응답으로 검사합니다. 실제 API와 loader 연결은 별도의 Node HTTP 검사입니다.

## 독립 설치와 개발 프록시

새 임시 디렉터리에 참고 완성본만 복사하고 node_modules·dist는 제외했습니다. 그곳에서 `npm ci`, `npm run typecheck`, `npm run build`가 모두 exit 0입니다. 같은 검증 프로세스에서 실제 Nest API를 127.0.0.1:3002에, Vite를 127.0.0.1:4177에 시작했습니다. 복사한 vite.config.ts의 /api 개발 프록시를 사용해 다음을 확인하고 둘 다 종료했습니다.

| 요청 | 결과 |
| --- | --- |
| `/` | HTTP 200, HTML 본문 |
| `/src/App.tsx` | HTTP 200, 변환된 모듈 본문 |
| `/api/broadcasts?search=React` | HTTP 200, 프록시 뒤 실제 API의 d/a 목록 |
| `/api/broadcasts/a` | HTTP 200, 프록시 뒤 실제 API의 id a 상세 |

입력 키 리뷰 수정 뒤에는 같은 독립 복사본에 변경된 서버 소스 두 파일만 반영했습니다. 양쪽 typecheck/build를 다시 통과했고, 복사본 API를 새 loopback 포트에서 실행해 정상 React 검색 200과 위 15개 특수 키 거부 400을 확인한 뒤 종료했습니다. 의존성과 프록시 설정은 바뀌지 않았습니다.

이는 설치·빌드·HTTP 제공·프록시 연결 확인입니다. 브라우저 렌더링·Network 패널·실제 390px/1280px 배치·Tab·보조기술 검증은 **사용자 요청으로 미실행**입니다. 브라우저 설치도 재시도하지 않았습니다. [후속 목록](../tasks/part-02/browser-checklist.md)은 모두 미체크입니다.

## 설계 판단과 한계

- Ruling: raw Node나 모의 요청만 쓰는 대신 NestJS + Vite 개발 프록시를 선택했습니다. 원본의 NestJS·실제 HTTP 요구를 따릅니다. 잘못 판단했을 때 비용은 작은 독립 서버 설정의 추가입니다.
- Ruling: GET 목록·상세 외에 POST search-preview를 읽기 전용 JSON 검증 실험으로 추가했습니다. 숫자/null/배열·알 수 없는 필드·파싱 전 크기를 직접 요청하기 위한 것입니다. 잘못 판단했을 때 비용은 개발 전용 경로 하나를 더 설명하는 것입니다.
- Ruling: 사용자의 기존 위임에 따라 계획·실행의 중간 승인 없이 직접 제작합니다. main 게시도 기존 승인 범위에서 최신 SHA 조건으로 진행합니다. 잘못 판단했을 때 비용은 되돌릴 수 있는 교재 변경이 예상보다 먼저 반영되는 것입니다.
- Ruling: 초기 CJS 계획을 실제 패키지 ESM·NodeNext·.js import로 수정했습니다. 설치된 의존성과 컴파일 결과가 근거입니다. 잘못 판단했을 때 비용은 로컬 모듈 설정·import 이름 변경입니다.
- 목록과 상세는 독립 요청이며 선택 id·즐겨찾기 상태를 공유합니다. 검색으로 숨긴 상세는 유지합니다. HTTP 캐시·결과 캐시·DB 저장·인증을 같은 기능으로 취급하지 않습니다.
- 로컬 지연·실패는 고정된 학습용 비동기 실험입니다. 대규모 성능 수치가 아닙니다. client abort를 서버의 대기/향후 DB·큐 작업 취소와 연결한 구현은 없습니다.
- 원본 CURRICULUM.md와 학습 단계 0·미시작을 보존합니다. frontend 보안 F1~F3와 최종 BunkerWeb은 보조/마지막 과정이며 본 과정 3~11단계를 대체하지 않습니다.

## 독립 리뷰

새 컨텍스트의 독립 리뷰 1회(gpt-6-astra high, base 5406388..구현 441e023)를 완료했습니다. 앞선 시도는 사용량 제한으로 결과 없이 중단됐고, 같은 리뷰 작업을 재개했습니다. 리뷰어가 57/57·기존 0단계 24/24·1단계 22/22·engine 4/4를 직접 확인했습니다.

- Important 1건: ValidationPipe의 키 제거와 class-transformer 변환이 일부 미정의 필드를 검증 전에 숨겨 200으로 수락했습니다. 서버 입력 계약 위반으로 수용했고 위 RED→GREEN 수정, 시작 코드 과제·힌트 보강, 최종 72개 회귀를 완료했습니다. prototype pollution이나 권한 상승 발생을 입증한 결과는 아닙니다.
- Critical·Minor: 없음. 추가 리뷰를 반복하지 않았습니다.
- Ruling: 원래 입력의 own key를 DTO별 명시적 목록과 비교하는 작은 Pipe를 값 검증 앞에 둡니다. 설치된 Nest/class-transformer 코드와 실제 HTTP 재현이 근거이며, 잘못 판단했을 때 비용은 새 입력 필드를 추가할 때 허용 목록도 함께 갱신해야 한다는 것입니다.
- 판단 보류: 실제 브라우저 렌더링·Network/cache 표시·반응형·키보드·보조기술은 사용자 요청으로 미실행입니다. 리뷰어는 독립 설치·프록시 실행 기록을 읽었고 설치를 반복하지 않았습니다. 운영 배포·인증·DB·영상은 이 강의 범위 밖입니다.

검증 결과는 제작 증거이며 학습자의 설명·독립 변경 완료를 대신하지 않습니다. 게시 시 최신 main SHA 조건과 전체 tree 일치를 확인합니다.
