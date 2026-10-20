# 6단계 실행 요약

2026-10-20, Windows Node24.15.0·소유 PostgreSQL18.6에서 실제 실행했습니다. [JSON 요약](verification-summary.json)은 개수·exit code·원시 보고서 SHA256만 기록하며 cookie/token/비밀번호/secret을 포함하지 않습니다. [검증 문서](../../verification/part-06.md)에 RED→GREEN과 한계를 구분했습니다.

| 확인 | 결과 |
| --- | --- |
| reference | server194 + client68 =262통과 |
| starter | server172통과/22의도된 실패, client53통과/15의도된 실패 |
| 저장 | 실제 동시 ID·rollback·counter Lock 관측·고정 watermark·bigint·권한 |
| 실제 소켓 | 저장 뒤 disconnect/ack 유실·동일 ID1행·503 결과 불명·이력 |
| source-only | 새 npm ci·타입·빌드·operator·실제 HTTP/WebSocket 프록시 |
| API 두 번 재시작 | 메시지 이력·중복 방지·세션/즐겨찾기·logout 폐기 |
| 이전 과정 | 0~5단계24/22/72/97/143/199 + Node/독립 package 정책9 통과 |
| 상위 저장소 link 제거 | 5·6단계의 새 source-only 설치/실제 socket/재시작 재검증 |
| 루트 학습 | 0단계·미시작,18의도된 실패/6통과 유지 |

원시 보고서는 ignored test-results/part-06/에 있고 해시는 그 실행의 파일 바이트를 연결합니다. 재실행 시 시간 필드가 달라질 수 있습니다. CI는 별도 tested commit/tree·ZIP digest·내부 manifest를 확인한 뒤 기록합니다.

실제 브라우저·Compose 직접 기동·독립 리뷰·공개 배포·분산 exactly-once·영구 outbox·DB 복원은 미실행입니다. Windows 종료를 Linux SIGTERM 증거로 바꾸지 않습니다. 방별 직렬화와 상한은 성능 측정 결과가 아닙니다.
