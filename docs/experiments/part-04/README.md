# 4단계 실행 요약

2026-10-20, Windows Node24.15.0·Docker PostgreSQL18.6에서 실제 실행했습니다. [JSON 요약](verification-summary.json)은 상태·개수·exit code·원시 보고서 SHA256만 보관합니다. 자격증명·쿠키·토큰·해시는 넣지 않았습니다. [제작 검증](../../verification/part-04.md)에 RED→GREEN·자체 리뷰·미검증 범위를 구분했습니다.

| 실행 | 결과 |
| --- | --- |
| reference 전체 | 서버/실제 DB/HTTP/wire/기동103 + client40 = 143통과 |
| starter 수집 | 서버54통과/49의도된 실패, client40통과 |
| source-only 독립 설치 | 새 npm ci·타입·빌드, operator 정상/거부·제한 DB 역할·Vite 프록시 통과 |
| 실제 프로세스 재시작 | 두 번, 로그인·즐겨찾기 유지 및 로그아웃 후 옛 쿠키401 |
| 로그 검사 | 생성한 테스트 비밀번호/secret 표식이 CLI/API/DB 출력에 없음 |
| 이전 과정 | 0/1/2/3단계24/22/72/97 + 정책6 통과 |
| 기본 학습0 골격 | 기존18실패/6통과 유지 |

원시 결과는 git-ignored test-results/part-04/의 reference-db.json·reference-client.json·starter-summary.json·standalone-summary.json·regression-summary.json입니다. JSON 요약의 SHA256은 당시 원시 파일 바이트를 연결하며, 재실행하면 보고서 시간 정보 때문에 달라질 수 있습니다. CI artifact는 별도 SHA256SUMS와 실행 commit에 연결하고 실제 녹색 실행이 확인된 후 기록합니다.

실제 브라우저·Compose 파일 직접 기동·공개 배포·POSIX graceful signal·독립 리뷰어·소켓·BunkerWeb 결과는 포함하지 않습니다. Windows 재시작 증거를 Linux signal 검증으로 바꾸지 않습니다. 임시 DB 컨테이너는 이 작업에서 만든 것만 검증 후 정리합니다.

추가 확인: [Linux CI39412577725](https://github.com/jinhwansong/brodcasting/actions/runs/39412577725)가 commit6166e964에서 성공했습니다. 독립 실행 요약은 Node24.19.0·linux·gracefulSignals=true이며 로컬 Windows 기록과 분리해 JSON의 ci 필드에 저장했습니다. Artifact12260206842 ZIP 바이트 SHA256과 내부 보고서6개의 manifest를 검증했습니다. 실제 브라우저·독립 리뷰어·Compose 파일 직접 기동·공개 배포·소켓·BunkerWeb은 여전히 미검증입니다.
