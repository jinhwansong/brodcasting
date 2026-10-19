# 4단계 제작 검증 — 진행 중

main에는3단계까지 게시했습니다.4단계는 제작 브랜치에서 작업 중이며 전체 강의 완료·학습자 통과를 뜻하지 않습니다. 학습 상태는0·미시작, 브라우저 검증은 사용자 요청으로 보류입니다.

## 현재 확인한 범위

- [실제 PostgreSQL RED39004890681](https://github.com/jinhwansong/brodcasting/actions/runs/39004890681), CI10fb04f5c10afd0b96ef75e2d65afa16daa2ead6/localc9925f0:28개 중24실패/4통과. 비어 있는 SQL·제약·해싱·소유자 검사 때문에 실패했습니다. 제한 역할 grant 골격은 schema 조회42P01을 보였으며 연결/모듈 기동 실패가 아닙니다.
- 로컬 해싱 설정의 TypeScript 타입이 number로 넓어져 컴파일에 실패했습니다. 설치한 argon2 선언의0/1/2 계약을 확인하고 satisfies HashOptions로 수정했습니다.
- PHC 파라미터 직렬화 순서가 예상 m,t,p와 실제 m,p,t로 달랐습니다. 순서 문자열 대신 알고리즘/버전과 파라미터 매핑을 검사하도록 테스트를 고쳤습니다. 해시/소금/비밀번호 원문은 진단 출력에 쓰지 않았습니다. 수정한 시작 코드 unit9실패/3통과와 완성본12/12 통과를 확인했습니다.
- [실제 PostgreSQL GREEN39179825098](https://github.com/jinhwansong/brodcasting/actions/runs/39179825098), CIcab52019f55f9f7cb09e6e671b7c8a7b4bec6f9d/local36f93ee/tree735027408b400206504f7e8403721cdb01a3a6e9:DB16+unit12=**28/28** 통과. 실제 salt 차이/검증, 사용자 데이터 분리, 멱등 즐겨찾기, 방별 조건부 공지 SQL, 제약·마이그레이션·제한 DB 역할을 검사했습니다.
- 양쪽 서버 typecheck/build exit0, Node 정책6/6. 기존 root lock 의존성 버전 변경 없음. 기본 npm test는 학습0 골격의 의도된18실패/6통과를 유지합니다.
- 시작 코드에 SQL·schema·migration·seed·DB guard/grant 선수 코드를 제공했습니다. 비밀번호/소유자 정책은 fail-closed 과제이며 현재 시작 코드 unit4실패/8통과입니다. 세션·Guard 과제는 후속 구현 중입니다.

## 아직 완료하지 않은 범위

실제 HTTP 로그인·쿠키·CSRF·만료·폐기·Guard·응답 정제·제한429, 화면과 늦은 응답 경계, source-only 독립 설치와 실제 API 프로세스 재기동, 유효 CLI setup/실패 로그 검사, 시작 코드 전체 실패 수집, 기존0~3단계 전체 회귀,3주 본문/설명/독립 과제, 최종 전체 리뷰와 main 게시가 남았습니다. 로컬 Compose·실제 브라우저·운영 배포·소켓 인증 완료를 주장하지 않습니다.

## 현재 판단

기존 사용자 위임에 따라 중간 승인 없이 native 제작·커밋·푸시합니다. 서버 세션은 기존 PostgreSQL에 저장하고 별도 JWT/Redis/인증 공급자는 추가하지 않습니다. 로컬 HTTP 강의는 production 모드 실행을 거부할 예정이며 Secure=false를 배포용으로 오해하지 않게 구분합니다. 고정30분 절대 수명과 단일 프로세스 IP 제한의 한계는 강의에 명시합니다. SQL/화면 선수 코드와 새 인증 과제를 분리하고 학습자가 구현하기 전에는 모두 거부하는 골격을 유지합니다.
