# 3단계 제작 검증 — 제작 중

학습 상태는 0단계·미시작입니다. 현재 3단계는 검증 브랜치에서 제작 중이며 본 강의의 main 게시 완료를 뜻하지 않습니다.

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

실제 HTTP·UI·실험·독립 설치·최종 리뷰는 후속 제작 중입니다. 브라우저는 사용자 요청으로 미실행이며 로컬 Compose 실행도 확인하지 않았습니다. 실행하지 않은 결과를 채우지 않습니다.
