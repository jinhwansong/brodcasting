# 5단계 순차 리뷰

범위: e2f276e 이후 part-05의 인증 소켓·회원권·hook·교재·CI/lock 변경. `ce-simplify-code`와 `ce-code-review`의 correctness/security/reliability/testing/standards 기준을 사용자 순차 실행 규칙에 맞춰 적용했습니다. 독립 리뷰로 표시하지 않습니다.

## Actionable Findings

- 수정 완료: 늦은 이전 방의 수신 재인가403이 새 방을 지우는 경합. 실제 DB 지연 재현 RED→roomVersion 비교→GREEN 및 전체 socket 회귀.
- 수정 완료: 다른 계정을 거쳐 돌아올 때 이전 초안 복원. UI 재인증 검사 RED→계정 변경 시 실제 삭제→GREEN.
- 수정 완료: starter 지연 재현의 선행 입장 실패를 누락해 시간 초과. 정상 입장 ack를 먼저 검증하며 DB503 실패 검사는 별도로 유지.
- 필수 수정 보류 없음. 저장·복구·자동 재시도·Redis·운영 배포는 계획상 다음 과정이며 이번 변경에 넣지 않았습니다.

## Coverage

설계/계획 Task1~4와 실제 파일·공개 검증을 비교했습니다. Origin을 Engine 단계에서 검사하고 namespace 인증이 이벤트보다 먼저 끝나는지, 공식 cookie SID를 store에서 다시 읽는지, 각 전달의 수신자도 재인가하는지 확인했습니다. 회원권 SELECT 최소 권한·operator만 INSERT·서버 identity·입력 정제·401/403/503 구분·직렬 queue와 상한·유휴 timer 정리·재가입/방 전환 경합을 추적했습니다.

UI의 계정/방 소유 초안, cleanup의 동일 handler, 늦은 callback/ack/finally, 일반 텍스트 렌더·수신 형식·100개 보관을 확인했습니다. 기존 useSession·SQL·목록·공지 코드를 선수 기능으로 재사용하고 원본0~4단계 소스를 보존했습니다. 학생 TODO와 비교용 완성본 분리는 계획된 복사이며 새 공유 계층을 만들지 않았습니다. 기존 의존성 버전·기본8명령·학습0과 문서 링크를 확인합니다.

독립 설치는 빈 소유 DB/역할과 포트를 먼저 확인하며 실제 HTTP/WebSocket 프록시·operator·API 재시작·로그 표식 검사를 수행합니다. 고정된 loopback 환경을 운영 배포와 구분했습니다. 일반 lint 명령은 저장소에 없습니다.

## Verdict

로컬과 Linux CI39419360850에서199개와 source-only 설치·실제 소켓·0~4회귀를 통과한5단계 교재입니다. CI artifact ZIP과 내부 보고서6개의 SHA256도 확인했습니다. 필수 수정 보류 없이 게시할 수 있습니다. 독립 리뷰어·브라우저 검증 완료로 해석하지 않습니다.
