# 6단계 제작 검증

2026-10-20 사용자 연속 제작 요청과 [설계](../superpowers/specs/2026-10-20-part-06-design.md)·[계획](../superpowers/plans/2026-10-20-part-06-courseware.md)을 기준으로 제작했습니다. 학습 상태는0단계·미시작입니다. 원본0~5를 보존하고 독립 part-06에 선수 코드를 제공합니다.

## 실제 실행

Windows Node24.15.0·소유 Docker PostgreSQL18.6 loopback5546에서 전용 test/lab DB만 사용했습니다. 기존 exact 의존성을 재사용했으며 root lock의 기존 package 버전 변경0개와 기존 모든 script 값 보존을 비교했습니다. Node/독립 패키지 정책은9개입니다.

- 입력45개·저장12개 중 새 거부 골격의48실패/9통과 RED를 확인한 뒤57/57 GREEN을 확인했습니다. 첫 지연 검사에서 미처리 rejection을 발견해 즉시 catch를 연결하고 정상 assertion RED를 다시 확인했습니다.
- 실제 소켓의 새 이력/응답 유실 검사8개와 기존23개에서10실패/21통과 RED를 확인한 뒤31/31 GREEN을 확인했습니다. 선행 저장이 실패하면 ack 유실 대기를 시작하지 않게 검사해 test timeout을 과제 실패로 세지 않습니다.
- 최종 server는 기존5단계149개에서 chat-unit20개를45개로 확장하고 storage12개·recovery8개를 더해 **194/194**입니다. 같은 ID 동시 발송·내용 충돌·rollback·방별 commit 순서·50/51 경계·삭제 구멍·bigint·최소 권한을 실제 DB로 확인했습니다. counter lock 대기는 pg_stat_activity의 Lock 상태를 직접 관측합니다.
- 실제 HTTP 로그인 cookie/socket으로 commit 뒤 disconnect에 의한 ack 유실, 같은 ID 재전송1행·동일 Message, commit 뒤503·이력 복구·입장/회원권/세션/DB 장애를 검사했습니다. 중복 재전송의 추가 broadcast도 없습니다.
- client는 기존 API26/UI14 + history12 + recovery UI16 = **68/68**, 총 **262/262**입니다. 초기 새 client 검사에서는66개 중14실패/52통과 RED를 확인했습니다. 이후 늦은 이전 연결 이력과 단절 뒤 미확인 수동 재시도를 추가했습니다. history/live 중첩·낮은 seq 지연·고정 until·상한 뒤 수동 진전·동일 ID 제한 재시도·계정/방/epoch·StrictMode·timer cleanup을 확인했습니다.
- fake timer를 한 act에3500ms 전진시키면 React의 새 연결 effect가 끝에서만 실행되어 재연결1회만 관측됐습니다.500/1000/2000ms 각각의 act에서 effect를 완료해 실제 단계별3회 상한을 검증합니다. 제품의 간격/상한을 바꾸어 통과시키지 않았습니다.
- source-only 새 npm ci·타입·빌드·operator 정상/거부·실제 Vite HTTP/WebSocket 프록시·두 API 프로세스 재시작을 통과했습니다. 재시작 뒤 메시지 이력·동일 ID1행·기존 세션/즐겨찾기·logout 폐기를 확인했습니다. 테스트 secret 표식은 CLI/API/DB 로그에 없습니다. Windows 종료는 POSIX graceful signal로 세지 않습니다.
- starter는 server172통과/22의도된 실패, client53통과/15의도된 실패입니다. 모든 suite가 수집되며 module/connection/timeout 실패를 정상 TODO로 인정하지 않습니다. 양쪽 타입·빌드 통과, 기존0~5단계24/22/72/97/143/199와 정책9개 통과, 학습0의18실패/6통과를 유지했습니다.
- 게시 전 추가 점검에서5·6단계 참고 package/lock의 불필요한 상위 저장소 `file:../..` 링크를 발견했습니다. 실제 독립 앱 실행은 해당 패키지를 쓰지 않았지만 복사본 밖을 가리키는 선언을 남기지 않도록 제거했습니다. 새 정책의 RED→GREEN을 확인하고 두 단계의 새 설치·실제 프록시·재시작을 다시 검증합니다.6단계 CI에서도5단계 source-only 회귀를 수행합니다.

## 리뷰와 기록

[순차 리뷰](part-06-review.md)와 [실행 요약](../experiments/part-06/README.md)에 범위·검증·한계를 기록합니다. 자체 검토에서 설계의 미확인1개 범위를 계정·방별1개(허용2방 총2개)로 명확히 했습니다. 같은 방의 미확인 건을 취소/확인하기 전에는 새 ID로 제출하지 않습니다. 독립 과제의 ‘이력으로 미확인 발송 자동 확인’은 구현하지 않았습니다.

CI39425307415에서 추가5단계 source-only 회귀가 선행 컴파일 전에 실행돼 ERR_MODULE_NOT_FOUND로 실패했습니다.5단계를 컴파일하는 기존 회귀 검사 뒤로 순서를 옮겼습니다. 이 환경/순서 실패를 의도된 학습 실패나 성공으로 처리하지 않았습니다. 원격 CI와 artifact 무결성은 수정 후 실제 성공 뒤 기록합니다.

## 한계

실제 브라우저2개·cookie/Origin·접속 단절 UI·키보드/좁은 화면, Compose 직접 기동·공개 배포·외부 부하·다중 서버·영구 outbox·운영 보관 정책·DB 복원은 미실행입니다. 독립 리뷰어/교차 모델 리뷰를 실행하지 않았습니다. commit 뒤 live/ack 전에 서버가 중단되면 재접속/수동 이력으로 회수하며 모든 온라인 commit의 즉시 발견·모든 수신자의 표시·exactly-once를 보장하지 않습니다. 재시도/페이지/보관 상한은 성능 측정값이 아닙니다.
