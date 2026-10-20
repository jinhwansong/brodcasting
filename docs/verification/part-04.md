# 4단계 제작 검증 — 중지·중간 저장

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
