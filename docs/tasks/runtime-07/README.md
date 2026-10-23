# 알림7주 — 함께 실행하고 다시 살리기

서버·Worker·Redis·DB를 각각 다른 상자에 넣어 실행합니다. Compose는 어느 상자가 먼저 준비돼야 하는지 적은 안내서예요.

## 먼저 예상하기

실행 전에 무엇이 성공하고 무엇이 거부돼야 하는지 적으세요. compose.yaml의 API secret 연결과 Worker 네트워크 TODO를 직접 구현합니다. 참고 완성본은 첫 구현 뒤에 비교하세요.

## 실습 순서

1. npm ci와 npm run check로 설정 검사를 실행합니다. 시작 코드에는 의도된 실패가 있습니다.
2. API에 db_password와 session_secret을 연결하고 Worker를 backend 네트워크에 연결합니다. 비밀번호를 YAML에 직접 쓰지 않습니다.
3. node setup-secrets.mjs를 실행합니다. .secrets 파일은 Git과 Docker 빌드에서 제외됩니다. 기존 파일은 덮어쓰지 않습니다.
4. docker compose --project-name course-r07-practice up --build --wait -d로 실행합니다. docker compose --project-name course-r07-practice port api 3015로 로컬 API 주소를 확인합니다. DB와 Redis는 PC에 포트를 열지 않습니다.
5. 자동 복구 실험은 node checks/recovery.mjs로 실행합니다. 저장소 밖 복사본과 고유 프로젝트를 만들어 API 로그인·읽음·Worker 재시작·Redis 중단 중 접수·복구를 확인하고 자기 자원만 정리합니다.
6. 직접 만든 실습을 끝낼 때 프로젝트 이름을 확인한 뒤 docker compose --project-name course-r07-practice down을 실행합니다. 볼륨 삭제는 저장한 알림도 지우므로 데이터가 필요하면 유지하세요.

## 설명3개

1. depends_on과 실제 준비 상태 확인은 어떤 차이가 있나요?
2. Worker를 다시 켜도 같은 알림이 두 번 생기지 않는 이유는 무엇인가요?
3. Redis가 꺼져도 DB 접수증이 남아야 하는 이유를 설명하세요.

## 독립 변경

Worker만 다시 시작한 경우와 API만 다시 시작한 경우를 나눠 관찰하세요. 로그인 상태·알림 수·읽음 상태 중 무엇이 남아야 하는지 먼저 적습니다.

[쉬운 해설](explanation.md) · [빈 제출 양식](submission.md). 테스트 통과만으로 학습 통과가 되지 않습니다. 학습 상태는0·미시작입니다.
