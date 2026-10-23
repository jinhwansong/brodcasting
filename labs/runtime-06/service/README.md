# 알림5주 완성본

로그인한 내 알림만 저장·조회하고 읽음으로 바꿉니다. DB에 접수한 사건을 별도 Worker가 처리합니다.

`npm ci` → `npm run typecheck` → `npm run check` → `npm run build` 순서로 확인합니다. 실제 검사는 Docker Desktop이 필요하며 일회용 PostgreSQL·Redis를 만들고 정리합니다. 기존 DB는 사용하지 않습니다.

브라우저 실습은 `node dev-lab.mjs`를 실행하고 안내된 로컬 주소를 엽니다. 터미널에서 `worker-stop`, `worker-start`, `api-stop`, `api-start`, `stop`을 입력할 수 있습니다. 프로그램 종료 시 자신이 만든 자원만 지웁니다. 카메라·외부 메일·푸시는 사용하지 않습니다.

사용자별 사건100개, 한 페이지20개, 재접수50개의 학습용 상한이 있습니다. 실제 서비스의 보관 정책은 별도 설계해야 합니다. 학습자 과제의 답을 먼저 복사하지 마세요.
