# 4단계 제작 검증 — 재개·로컬 완료

## 2026-10-20 재개 후 현재 결과

사용자가 docs 계획을 읽고 나머지 작업을 계속하도록 명시적으로 요청했습니다. 아래 중지 기록은 당시의 역사이며 현재 상태는 이 절을 따릅니다. 학습 상태는 **0단계·미시작**, 실제 브라우저 확인은 계속 보류합니다.

- Windows Node24.15.0에서 루트 `npm ci`를 실행했습니다. 기존 lock/의존성 버전은 바꾸지 않았습니다. Docker PostgreSQL18.6, image digest `sha256:74935e72241653ca55e0414067e6d8763aceb8a810eb51b452253ec3dcfc4336`의 이번 작업 소유 loopback 컨테이너만 사용했습니다.
- Task3 RED를 다시 확인했습니다: API26 통과/UI14 실패, 제목만 있는 App에 필요한 요소가 없었습니다. 기존 AuthPanel/useSession과 목록·공지 화면을 연결한 뒤 client40/40이 통과했습니다. 공지 텍스트 검사는 textarea와 본문이 같은 값을 가지므로 selector를 p로 특정했으며 HTML 요소가 생기지 않는 검사는 유지했습니다.
- Task4의 컴파일 가능한 빈 main.ts에서 설정11개가 모두 exit0으로 실패하는 RED를 확인했습니다. 양쪽 main에 전용 lab DB·part04_app·64hex secret·origin·포트 검사, production 거부, pool 연결/쿼리 제한, loopback listen과 app/pool 정리를 구현했습니다. TCP 관찰자를 둔 검사로 잘못된 설정은 DB 연결도 시도하지 않는 것을 확인했습니다.
- 최종 실제 PostgreSQL 검증은 unit19 + 실행 설정11 + DB16 + HTTP54 + wire3 = **103/103**, API26 + UI14 = **40/40**, 합계 **143/143**입니다. 세션·CSRF·Origin·제한·타인 UUID·방 권한·실제 행 불변·정제503을 원래 검사로 재확인했습니다.
- 소스만 임시 폴더로 복사하고 새 npm ci·타입·빌드, migration 재실행·seed·제한 역할 생성, 기존 역할/낮은 권한 거부, 관리자 부여 정상/거부를 확인했습니다. Vite 프록시를 통한 실제 HTTP 로그인 후 **별도 API 프로세스를 두 번** 재시작해 세션·즐겨찾기 유지와 로그아웃 뒤 옛 쿠키401을 확인했습니다. API와 DB 오류 로그에 생성한 테스트 비밀번호/secret 표식이 없었습니다.
- 시작 코드 전체는 서버54통과/49의도된 실패, client40통과입니다. 모듈·연결·시간 초과·수집 실패는 정상 TODO로 인정하지 않습니다. 해싱·AuthService·Guard·접근 정책은 fail-closed 학습 과제로 유지하고 client 선수 코드는 제공합니다.
- 기존0/1/2/3단계24/22/72/97개와 Node 정책6개를 재실행해 통과했습니다. root 기본 학습0 검사는18실패/6통과 그대로입니다. 양쪽4단계 server/client 타입 검사·빌드도 통과했습니다. 처음3단계 TEMP 실험에 전용 lab URL을 빠뜨려1개가 실패했으나 환경을 준비한 뒤97개를 모두 확인했습니다. 인프라 실패를 과제 실패로 기록하지 않았습니다.
- A해싱/B세션/C권한3주·예상·공식 근거·단계별 힌트·설명3개·독립 모든 기기 로그아웃·빈 제출·브라우저 후속을 작성했습니다. 독립 변경 정답은 제공하지 않습니다. F2 독립 변경은 다른 탭 신호 후 서버 재확인으로 구분했습니다.

## 순차 리뷰와 수정

`ce-simplify-code`와 `ce-code-review` 기준을 사용자 AGENTS의 순차 실행 규칙에 맞춰 이 컨텍스트에서 적용했습니다. correctness·security·reliability·tests·project standards·plan completeness를 확인했습니다. 독립 리뷰어·교차 모델·새 컨텍스트 리뷰를 실행한 것으로 주장하지 않습니다.

계정B로 바뀐 첫 렌더에서 계정A의 공지 초안이 effect 정리 전에 잠깐 DOM에 남는 문제를 발견했습니다. 기존 ‘다른 계정으로 로그인하면’ 검사에 Profiler의 commit 관찰을 더해 RED를 확인하고, 렌더 시점에도 초안 소유자를 확인하도록 수정했습니다. 수정 뒤 전체143개가 통과했습니다. 보류한 필수 코드 수정은 없습니다. 일반 텍스트·메모리 토큰·인증 동작 직렬화·옛 응답/finally·DB 제한 역할·기존8명령·학습0을 유지했습니다.

## 증거와 한계

[원격 GREEN 39412577725](https://github.com/jinhwansong/brodcasting/actions/runs/39412577725), commit `6166e964920d58578ea2c599520b3e6c35bac607`, tree `89ad0e409d1e501c7e3c0d03ed4fd4e04369a52f`: Linux Node24.19.0·PostgreSQL18.6에서143개, 독립 설치·실제2회 재시작·SIGTERM 종료·의도된 과제 실패·0~3회귀·starter 타입/빌드가 모두 성공했습니다. Artifact12260206842의 ZIP SHA256은 `012e11dcb0d79239036fbecf6ac6478d3b1aabc707b7cf306288305aaf97e8cf`이며 실제 다운로드 바이트와 일치했습니다. 내부 SHA256SUMS의 보고서6개도 모두 일치했습니다. 이후 변경은 이 CI 근거를 추가하는 문서뿐이며 코드/워크플로는 검증 커밋과 같습니다.

정제된 [실행 요약](../experiments/part-04/README.md)과 [JSON 요약](../experiments/part-04/verification-summary.json)에 결과 및 원시 JSON의 SHA256을 저장합니다. 원시 보고서는 test-results/part-04에 있으며 공유 문서에 비밀번호·쿠키·CSRF·해시를 복사하지 않습니다. 확장한 CI는143개·독립 설치·과제 실패·0~3회귀·양쪽 타입/빌드 및 artifact SHA256을 검사합니다. 실제 CI 결과는 별도 실행 후에만 기록합니다.

Windows의 자식 프로세스 종료는 POSIX SIGTERM graceful cleanup 확인으로 세지 않습니다. Linux CI, 실제 브라우저 Cookie/CORS·키보드/좁은 화면, learner/reference Compose 설정 파일 직접 기동, 공개 배포·운영 보안·소켓·BunkerWeb은 이 로컬 결과에 포함하지 않습니다. 이번 DB는 docker run으로 기동했으며 Compose 기동 증거로 바꾸지 않습니다.

---

## 중지 시점의 기록 (이하 원문 보존)

완성 교재는3단계까지입니다.2026-10-20 사용자 요청으로 제작을 중지하고4단계 미완성 코드를 main에 중간 저장합니다. 전체 강의 완료·학습자 통과를 뜻하지 않습니다. 학습 상태는0·미시작, 브라우저 검증은 사용자 요청으로 보류입니다. 기획과 재개 순서는 루트 PROJECT_PLAN.md·REMAINING_WORK.md에 기록했습니다.

## 현재 확인한 범위

- [실제 PostgreSQL RED39004890681](https://github.com/jinhwansong/brodcasting/actions/runs/39004890681), CI10fb04f5c10afd0b96ef75e2d65afa16daa2ead6/localc9925f0:28개 중24실패/4통과. 비어 있는 SQL·제약·해싱·소유자 검사 때문에 실패했습니다. 제한 역할 grant 골격은 schema 조회42P01을 보였으며 연결/모듈 기동 실패가 아닙니다.
- 로컬 해싱 설정의 TypeScript 타입이 number로 넓어져 컴파일에 실패했습니다. 설치한 argon2 선언의0/1/2 계약을 확인하고 satisfies HashOptions로 수정했습니다.
- PHC 파라미터 직렬화 순서가 예상 m,t,p와 실제 m,p,t로 달랐습니다. 순서 문자열 대신 알고리즘/버전과 파라미터 매핑을 검사하도록 테스트를 고쳤습니다. 해시/소금/비밀번호 원문은 진단 출력에 쓰지 않았습니다. 수정한 시작 코드 unit9실패/3통과와 완성본12/12 통과를 확인했습니다.
- [실제 PostgreSQL GREEN39179825098](https://github.com/jinhwansong/brodcasting/actions/runs/39179825098), CIcab52019f55f9f7cb09e6e671b7c8a7b4bec6f9d/local36f93ee/tree735027408b400206504f7e8403721cdb01a3a6e9:DB16+unit12=**28/28** 통과. 실제 salt 차이/검증, 사용자 데이터 분리, 멱등 즐겨찾기, 방별 조건부 공지 SQL, 제약·마이그레이션·제한 DB 역할을 검사했습니다.
- 양쪽 서버 typecheck/build exit0, Node 정책6/6. 기존 root lock 의존성 버전 변경 없음. 기본 npm test는 학습0 골격의 의도된18실패/6통과를 유지합니다.
- 시작 코드에 SQL·schema·migration·seed·DB guard/grant 선수 코드를 제공했습니다. 비밀번호/소유자 정책은 fail-closed 과제이며 현재 시작 코드 unit4실패/8통과입니다. 세션·Guard 과제는 후속 구현 중입니다.

## HTTP 세션·권한 검증

[초기 HTTP RED39180512466](https://github.com/jinhwansong/brodcasting/actions/runs/39180512466), CI611a947/local2a335d1은 새 HTTP51개 실패, 기존28개 통과였습니다. 보안 설정7개는 빈 app에서 거부하지 않아 로컬 RED를 확인한 뒤 기동 전 검사로19/19 unit 통과했습니다. [첫 통합39181101264](https://github.com/jinhwansong/brodcasting/actions/runs/39181101264), CId5ca169/local39ecf4c은 실제 PG에서 unit19+DB16+HTTP53=88/88 통과였습니다. 추가한2개 줄바꿈 정수 query는 기존 JavaScript 비멀티라인 정규식에서도 이미 거부됐습니다. 잘못 예상한 부분은 수정하고 기존 변환을 유지했으며, 이2개를 새 수정의 RED→GREEN으로 주장하지 않습니다.

코드 검토 중 상태 조회의 무조건적인 save/upsert가 폐기된 SID를 되살릴 수 있음을 발견했습니다. 소유 테스트 schema에만 생성한 PostgreSQL trigger/advisory lock으로 조회 저장을 지연하고 로그아웃204 뒤 해제했습니다. [재현39181580388](https://github.com/jinhwansong/brodcasting/actions/runs/39181580388), CIc862099/localb648619은 옛 쿠키 재요청 expected401/received200으로 새1개만 실패하고 기존88개는 통과했습니다. 새 토큰 발급 때만 명시적으로 저장하고 기존 세션 조회는 쓰지 않도록 수정했습니다. [전체 GREEN39181743044](https://github.com/jinhwansong/brodcasting/actions/runs/39181743044), CIdef5a6a19d047cdce1ccab9a02b07ec196fa173f/local1fc654d/treee5bd37b06b808a70d41ddb85614140f23c49bb0a은 **89/89** 통과입니다. 쿠키·Origin·CSRF·만료·폐기·직접 타인 요청·방별 공지·429/위조 전달 헤더·DB/store 정제503과 실제 불변을 확인했습니다. 브라우저 Cookie 동작을 실행한 것은 아닙니다.

## 아직 완료하지 않은 범위

화면과 늦은 응답 경계, source-only 독립 설치와 실제 API 프로세스 재기동, 유효 CLI setup/실패 로그 검사, 시작 코드 전체 실패 수집, 기존0~3단계 전체 회귀,3주 본문/설명/독립 과제, 최종 전체 리뷰와 main 게시가 남았습니다. 로컬 Compose·실제 브라우저·운영 배포·소켓 인증 완료를 주장하지 않습니다.

## 중지 시점 client 확인

API 구현 전 [RED39183170436](https://github.com/jinhwansong/brodcasting/actions/runs/39183170436), CI2e7e612423aafda8e87f68d9be040f710f77afb9/local19f43b3/treeb97cc14b14c0a966c1c1b09815efad7adf52eda6은 서버 기존89개 통과/wire3개 실패/client40개 실패였습니다. 이후 client API를 구현했고 로컬901dede에서 API26개 통과를 확인했습니다.

2026-10-20 중간 저장 직전 현재 파일에서 reference client `tsc --noEmit` exit0과 client 전체 **40개 중26통과/14실패(exit1)**를 다시 확인했습니다. API26개는 통과, UI14개는 App이 제목만 표시하는 골격이어서 필요한 요소를 찾지 못했습니다. 새 AuthPanel/useSession은 타입 검사만 포함되며 App에서 사용하지 않습니다. NoticePanel과 server main.ts는 없습니다. 실제 wire3개는 API 구현 후 아직 재실행하지 않았으므로 현재 전체132개 통과를 주장하지 않습니다. 검사를 성공으로 바꾸거나 CI를 비활성화하지 않습니다.

## 현재 판단

최신 사용자 요청은 현재 작업의 푸시·문서화만 허용하며 이전 연속 제작 위임을 중지합니다. 기능 구현이나 최종 리뷰를 추가하지 않고 미완성 상태를 보관합니다. 서버 세션은 기존 PostgreSQL에 저장하고 별도 JWT/Redis/인증 공급자는 추가하지 않았습니다. 로컬 HTTP 강의는 production 모드 실행을 거부할 예정이며 main 진입점은 미완료입니다. Secure=false를 배포용으로 오해하지 않게 구분하고 고정30분 절대 수명과 단일 프로세스 IP 제한의 한계도 남았습니다. SQL/화면 선수 코드와 새 인증 과제를 분리하고 학습자가 구현하기 전에는 거부하는 골격을 유지합니다.
