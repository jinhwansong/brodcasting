# 3단계 제작 검증

3단계 교재 제작·검증·독립 리뷰를 완료했습니다. 학습 상태는 0단계·미시작입니다. 제작 완료는 학습자의 과제 통과를 뜻하지 않습니다.

## 실제 DB 환경과 초기 검증

로컬 환경 Node24.19.0/npm11.9.0. Docker·psql·postgres가 없었습니다. 임시 native PostgreSQL18.4 패키지는 설치했지만 UID/GID mapping이 root 하나뿐이어서 일반 사용자 소유권 지정이 EINVAL, 사용자 namespace 설정이 EPERM으로 실패했습니다. 로컬 DB를 시작하지 않았고 OS 사용자를 만들지 않았습니다. 별도 GitHub Actions 검증 브랜치의 postgres:18.6 service로 실제 DB를 실행했습니다. 운영 앱 배포가 아닙니다.

| 확인 | 실제 결과 |
| --- | --- |
| [DB 기동 검사](https://github.com/jinhwansong/brodcasting/actions/runs/39000464016) | PostgreSQL18.6 Debian, x86_64, 정상 연결 |
| [초기 SQL RED](https://github.com/jinhwansong/brodcasting/actions/runs/39000692424) | 27개 중26실패/1통과. 누락한 SQL·제약·migration·grant의 실패. 권한 골격 미구현은 제한 역할의 schema 조회42P01로 드러남. 모듈/연결 오류 없음 |
| [seed RED](https://github.com/jinhwansong/brodcasting/actions/runs/39000863332) | 29개 중28통과/1실패, 초기 데이터 expected6/received0 |
| [DB GREEN](https://github.com/jinhwansong/brodcasting/actions/runs/39001041882) | 동일 실제 PostgreSQL29/29 통과 |
| 시작 코드와 참고 서버 타입 검사·빌드 | exit0 |
| Node 범위 정책 | root/참고0·1·2·3의5/5 통과 |

DB GREEN은 시청자 동률 id 정렬, 첫/다음/마지막/빈 페이지, limit+1, 문자 %/_/역슬래시 검색, SQL 주입 문자열, 사용자 분리 조회, 동시 중복 즐겨찾기, 재조회 지속성, CHECK/NOT NULL/FK/복합PK/CASCADE, 보조 인덱스, migration 재실행·동시 실행·checksum·rollback, 제한 역할의 읽기/쓰기 허용과 방송 쓰기/schema DDL 거부를 포함합니다. 테스트 DB는 brodcasting_part03_test이고 고유 schema/role만 정리합니다.

## HTTP와 화면 연결

빈 Nest Module은 정상 기동한 뒤 [HTTP·화면 RED](https://github.com/jinhwansong/brodcasting/actions/runs/39001385925)에서 HTTP37개 중36실패/1통과, 기존 DB29통과, client18실패를 보였습니다. 이어 DTO 값/변환 전 키·빈 입력 검사, 제한 역할 repository DI, 정제한503과 화면 연결을 구현했습니다. [통합 GREEN](https://github.com/jinhwansong/brodcasting/actions/runs/39001665126)은 DB29+HTTP37+실제 client loader 연결3=69개와 jsdom/API18개, 합계87/87 통과입니다.

HTTP 검사는 직접 query·id·owner/body 입력, 중복 PUT/DELETE, 새 앱 인스턴스의 DB 지속성, 실제 닫힌 TCP 포트로의 DB 연결 실패503, no-store와8kb 제한을 포함합니다. client loader 연결 검사는 응답을 대체하지 않고 상대 URL만 실제 API로 해석했습니다. UI는 다음/이전·세 조건의 offset0 초기화·저장 성공/실패·늦은 성공 무시·재시도이며 실제 브라우저 검사가 아닙니다. client API의 HTTP 오류·Page shape·id/상태 검증도 포함합니다.

시작 코드에는 완료된 HTTP/화면을 선수 기능으로 제공하고 SQL·제약·인덱스만 과제로 남깁니다. 실패한 저장 요청의 화면은 기존 표시를 유지하며, 연결이 끊긴 쓰기의 DB 결과를 단정하지 않고 다시 조회하도록 안내합니다.

## 최종 실행과 독립 설치

[최종 전체 검증39003772736](https://github.com/jinhwansong/brodcasting/actions/runs/39003772736), CI commit0c455b0f84adeebd47126c0a11a3d0dc6a7b25dc/local8d20e79/treef12fd89318a95974a3fc968d57f316872c5a7012에서 다음을 확인했습니다. 이후 변경은 기록·제작 상태뿐입니다.

| 확인 | 실제 결과 |
| --- | --- |
| 참고 완성본 공개 검증 | DB/HTTP/wire/실험79 + client18 = **97/97** |
| 시작 코드 | 서버79 중55통과/24의도 실패, 제공 client18/18 통과. 합계97 중73통과/24실패 |
| 기존0·1·2단계 회귀 |24/24·22/22·72/72 |
| Node 정책 |5/5 |
| source만 임시 복사해 별도 npm ci/typecheck/build | 모두 exit0. node_modules/dist/실제.env 제외 |
| 복사본 실제 API·Vite 개발 프록시 | HTML/변환 App 모듈200, React d/a 조회200, PUT/DELETE200 |
| 복사본 API 프로세스 종료/재기동 | DB 즐겨찾기 a 유지 |
| 기존/권한 없는 역할 설정 거부 | exit1, 테스트 비밀번호가 PostgreSQL 오류 로그에 없음 |
| 1천·1만·10만 실험 | TEMP 테이블만 사용, 실제 EXPLAIN/JSON byte·인덱스 크기·준비 비용 기록 |

시작 코드 실패는 SQL/제약/인덱스 TODO로 생긴 assertion 또는 예상 HTTP 차이입니다. 모듈/연결/timeout 실패를 정상으로 포함하지 않았습니다. 공개 runner는 DB가 없으면 실패하며 모의 DB/skip을 성공으로 세지 않습니다. JSON 원본을 검사하는 verify-starter.mjs가 이 구분을 확인합니다. 로컬 npm의 기존 http-proxy 환경 경고는 exit 결과와 별개입니다.

실험·독립 기동·시작 코드 요약은 [원시 기록과 해석](../experiments/part-03/README.md)에 보존했습니다. 다운로드 ZIP SHA256도 Actions artifact digest와 일치했습니다. browser:false이며 실제 Network/반응형/키보드/보조기술 검증은 하지 않았습니다. 로컬 Compose도 실행하지 않았습니다. Actions의 실제 PostgreSQL container 검증과 구분합니다.

## 추가 RED → GREEN

- 실험 함수의 빈 골격에서7개 검증이 실패했습니다. 그중 행 수 table 입력이 Vitest에 배열 원소로 펼쳐지는 테스트 오류를 발견해 {sizes:[...]}로 고쳤습니다. 수정한3개는 size guard만 잠시 제거한 로컬 mutation에서 실제 loopback 연결 오류로 RED, guard 복원 후 GREEN을 확인했습니다. mutation은 게시하지 않았습니다. 실제 DB 계획 검증까지 최종7개 모두 통과했습니다.
- [독립 설치 RED39002080146](https://github.com/jinhwansong/brodcasting/actions/runs/39002080146)에서는 정상 설치/build 뒤 중복 역할 설정 실패가 throwaway 테스트 비밀번호를 DB 오류 로그에 남기는 것을 재현했습니다. 권한·기존 역할을 비밀번호 포함 DDL보다 먼저 확인하고 transaction advisory lock으로 같은 setup 실행을 직렬화했습니다. 동일 probe에서 중복/권한 없는 실행 모두 거부되고 두 테스트 marker가 DB 오류 로그에 없음을 확인했습니다. 실제 사용자 비밀번호/개인정보 사고를 재현한 것이 아닙니다.

- 최종 리뷰의 폼 입력 문제를 [RED39003672880](https://github.com/jinhwansong/brodcasting/actions/runs/39003672880), CIc5512131f837aa2580894a88927e417db5528a37/local434357a에서 실제 PostgreSQL로 재현했습니다. `application/x-www-form-urlencoded`의 `__proto__[userId]=other`를 PUT/DELETE로 보내면 파서가 필드를 지워200과 INSERT/DELETE가 발생했습니다. chunked PUT도 같은 문제였습니다. 새3개만 실패하고 기존 서버76·client18은 통과했습니다. 시작 코드·완성본 모두 파싱 전 비어 있지 않은 본문 형식을 검사하도록 수정했습니다. JSON은 기존 빈 객체 검사를 유지하고 나머지 형식은400으로 거부합니다. 최종97개 검증에서 응답400과 DB 행 불변을 함께 확인했습니다.

## 판단과 한계

- Ruling: 기존 사용자의 계획·실행·커밋·main 게시 위임을 유지합니다. 잘못 판단했을 때 비용은 되돌릴 수 있는 교재가 예상보다 먼저 반영되는 것입니다.
- Ruling: OFFSET을 기본으로 하고 cursor를 독립 변경으로 남깁니다. 페이지/인덱스/깊은 조회의 비용을 비교하기 쉽습니다. 잘못 판단했을 때 비용은 cursor 확장 시 계약과 검증을 추가하는 것입니다.
- Ruling: 처음 native18.4 DB를 검증에 쓰려 했으나 UID 제한으로 실행하지 못했습니다. 해당 선택이 틀렸을 때 비용은 로컬 준비 시간과 버전 차이였고, 실제 결과로 세지 않았습니다. 임시 helper는 프로젝트 의존성이 아닙니다.
- Ruling: 서버 고정 demo-user를 사용하고 외부 owner 선택을 거부합니다. 개인별 인가는4단계입니다. 잘못 판단했을 때 비용은 이 강의를 개인용 공개 즐겨찾기 서비스로 배포할 수 없다는 것입니다.
- Ruling: 실제 DB 검증을 별도 GitHub CI 브랜치의 PostgreSQL18.6 service로 옮겼습니다. root만 허용하는 환경에서 로컬 기동 시도를 멈추고 실제 엔진 검증을 유지하기 위한 선택입니다. 잘못 판단했을 때 비용은 Actions 권한/서비스 환경에 의존하는 것입니다. 운영 앱이나 유료 인프라를 배포하지 않았습니다.
- Ruling: 재현된 setup 실패 로그를 막기 위해 권한·기존 역할을 DDL 전에 확인합니다. 잘못 판단했을 때 비용은 setup의 두 가벼운 조회와 잠금이며 API 요청 경로 비용은 없습니다. 모든 DB logging 설정에 대한 비밀번호 보호 인증을 뜻하지 않습니다.

- Ruling: 리뷰어는 폼 파싱 문제를 Minor로 분류했지만 제작자는 Important로 재분류해 수정했습니다. 타인 소유자 선택은 불가능해도 거부해야 하는 입력이 실제 DB를 바꾸어 핵심400/불변 교육 계약을 위반합니다. 잘못 판단했을 때 비용은 파싱 전 본문 형식 검사와 회귀3개의 추가 유지이며, 허용된 빈 요청·빈 JSON 계약은 유지됩니다.
- Ruling: 최종 검증 후 로컬 exec-server transport가 끊겨 마지막 구조 검사를 실행하지 못했습니다. 검증된 원격 treef12fd89318a95974a3fc968d57f316872c5a7012를 기반으로 기록·제작 상태7개 파일만 GitHub API에서 갱신하고, 전체 tree의 나머지 blob이 그대로인지와 갱신 내용·상대 링크를 확인해 게시합니다. 로컬 final HEAD와 일치했다고 주장하지 않습니다. 잘못 판단했을 때 비용은 환경 복구 후 로컬의 미커밋 기록과 원격 최종 기록을 대조해야 하는 것입니다. 이전 구조 검사는93파일·52상대 링크·0문제, 기본 명령8개·원본·기존 교재 보존을 확인했습니다. 최종 코드 검증97개·독립 설치·기존 회귀는 연결 장애 전에 모두 완료했습니다.

공동 demo 사용자·OFFSET 동시 변경·TEMP/단일 실행·API 프로세스 재시작과 백업/복구의 차이를 강의에 명시했습니다. 원본 CURRICULUM.md·학습0·미시작을 보존합니다. 프론트 보안/알림/맨 마지막 BunkerWeb은 나머지 본 과정을 대체하지 않습니다.

## 독립 리뷰

새 컨텍스트 리뷰1회가 전체3330ecf..20d5e6f를 검토했습니다. 리뷰어 기준 Critical/Important 없음, Minor1건이었으며 위 Important 재분류·한 번의 RED→GREEN 수정과 전체 회귀로 처리했습니다. 재리뷰는 요청하지 않았습니다. 리뷰어는 보존한 artifact digest와94개 이전 결과를 확인하고 client18/18·Node 정책5/5를 독립 재실행했습니다. 최종 추가3개와97개 전체 결과는 제작자가 실제 CI 산출물에서 확인했습니다.

판단 보류: 실제 브라우저 렌더링·Network·접근성, 로컬 Compose, UID 제한 아래 로컬 PostgreSQL 기동,4단계 인증·인가, 운영 배포·백업/복구·외부 부하·임의 PostgreSQL 로그 설정. 의도된 학습 SQL TODO와 학습0은 결함으로 세지 않았습니다. 남겨 둔 Minor 지적은 없습니다.
