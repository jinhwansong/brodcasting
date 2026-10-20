# 5단계 제작 검증

2026-10-20 사용자 ‘계속 작업’ 요청에 따라 [설계](../superpowers/specs/2026-10-20-part-05-design.md)와 [계획](../superpowers/plans/2026-10-20-part-05-courseware.md)을 자체 검토하고 순차 제작했습니다. 학습 상태는 **0단계·미시작**입니다.

## 실제 실행

Windows Node24.15.0·Docker PostgreSQL18.6의 이번 작업 소유 loopback 컨테이너를 사용했습니다. 별도 part05 test/lab와 고유 schema/role만 검증했습니다. Socket.IO/client4.8.4와 Nest websocket/adapter12.1.3을 정확히 추가했고 기존 root lock의 패키지 버전 변경이 없음을 비교했습니다.

- Service 입력20·회원권DB3개를 컴파일 가능한 거부 골격에 적용해23실패 RED를 확인했습니다. 구현 후 기존 서버103개와 합한126개가 통과했습니다.
- 실제 HTTP 가입/로그인 쿠키로 socket.io-client를 연결했습니다. 최초 namespace 인증 거부 골격에서는18개 중17개 실패를 확인했고 구현 후 통과했습니다. 후속 경합·첫 이벤트 세션 재검사·연결 후 store 장애를 더해 현재 socket23개입니다.
- 현재 server는 기존unit19 + main11 + DB16 + HTTP54 + wire3 + chat-unit20 + chat-DB3 + socket23 = **149/149** 통과입니다. client는 기존API26 + 기존UI14 + chatUI10 = **50/50**, 합계 **199/199**입니다.
- 익명/위조cookie/다른·누락Origin, 서버 identity, 입장 전/다른 방/삭제된 회원권 발송·수신, 로그아웃/만료/삭제 사용자, store·회원권DB503, frame/이벤트/대기/연결 상한, 빠른 방 이동, 유휴·서버 종료 정리를 실제 PG/socket으로 확인했습니다.
- 소스만 임시 폴더로 복사해 새 npm ci·타입·빌드·operator 정상/거부를 실행했습니다. Vite의 실제 WebSocket 프록시에서 두 클라이언트가 송수신했고 API 두 번 재시작·세션/즐겨찾기 유지·재인증·로그아웃 뒤 소켓/옛 쿠키 거부·로그 표식 부재를 확인했습니다. Windows 종료는 POSIX graceful signal 증거로 세지 않습니다.
- starter는 server110통과/39의도된 실패, client41통과/9의도된 실패입니다. 기존 HTTP·인증·API/UI 선수 기능은 제공하며 A Service/B Gateway/C hook을 남깁니다. 수집·연결·모듈·시간 초과를 정상 TODO로 받아들이지 않습니다.
- 0~4단계24/22/72/97/143개, Node 정책7개를 재실행해 통과했습니다. 기본 학습0은 기존18실패/6통과입니다. 양쪽5단계 타입·빌드를 확인했습니다.

## 재현과 수정

1. 이전 방 수신자 재인가를 지연한 뒤 회원권을 삭제하고 새 방에 입장시키면, 늦은403이 새 방 상태를 지웠습니다. 실제 DB 권한 검사 앞에 제어 가능한 지연을 둔 새 검사에서 RED를 확인하고 roomVersion을 전달/유휴 정리에 적용해 GREEN을 확인했습니다.
2. 계정B를 거쳐 다시A로 돌아오면 숨겨 둔A의 초안이 되살아났습니다. 기존 재인증 검사를 확장해 RED를 확인하고 다른 계정 전환 때 실제 초안을 지워 GREEN을 확인했습니다.
3. starter의 지연 재현 검사는 선행 입장 실패를 확인하지 않고 지연 진입을 기다려 timeout이 났습니다. 유효한 입장의 ack를 먼저 검증하도록 개선해 골격은 assertion 실패로 즉시 끝나게 했습니다. 이 개선 중 DB503 검사를 성공 입장 helper로 잘못 바꾼 부분은 원래503 직접 검사로 복구했습니다. 환경 실패를 학습 통과로 바꾸지 않았습니다.
4. Engine session middleware의 DB 실패는 namespace에 도달하기 전 transport400이 됩니다. 실패 여부만 request에 전달하고 namespace가 정제503으로 거부하게 했으며 연결 전/후 store 장애를 모두 확인했습니다.

## 리뷰와 증거

[순차 리뷰](part-05-review.md), [실행 요약](../experiments/part-05/README.md), [JSON 요약](../experiments/part-05/verification-summary.json)에 범위와 원시 보고서 SHA256을 기록합니다. 사용자 AGENTS의 순차 실행 지시에 따라 같은 컨텍스트에서 검토했으며 독립 리뷰어·교차 모델·새 컨텍스트 리뷰를 수행했다고 주장하지 않습니다. 필수 수정 보류는 없습니다.

[Linux CI39419360850](https://github.com/jinhwansong/brodcasting/actions/runs/39419360850)가 커밋 `660b1bbcaf9f9c0d187ad3917e7ad456c3ffada1`·트리 `576f0399a4e96a609036a39b6a4d118d6e26b03b`에서 성공했습니다. Node24.19.0에서199개·독립 설치/실제 proxy socket·starter 실패 수집·0~4회귀·양쪽 타입/빌드를 확인했습니다. Linux SIGTERM 종료도 통과했습니다. artifact12262713042 ZIP의 SHA256을 GitHub digest와 비교하고 내부 보고서6개를 SHA256SUMS와 대조했습니다. 상세 해시는 JSON 요약에 기록했습니다.

## 한계

실제 브라우저2개·Cookie/Origin 전송·키보드/좁은 화면, Compose 파일 직접 기동, 공개 배포·외부 부하·다중 서버·메시지 영구 저장/재연결 복구·BunkerWeb은 미검증입니다. 메시지는 휘발성이며 ack는 모든 수신·저장 보장이 아닙니다. 이미 인가된 진행 중 전달은 취소하지 않습니다. 프레임8192·연결20·10이벤트/초·대기4·화면100개는 단일 프로세스 로컬 보호 상한이며 성능 측정 결과가 아닙니다.
