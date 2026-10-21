# 알림4주 참고 완성본

[첫 시도와 쉬운 설명](../../docs/tasks/runtime-04/README.md) 뒤에 비교합니다. 소스만 별도 폴더로 복사한 뒤 Node engines에 맞는 Node와 Docker Linux 엔진을 준비합니다.

```sh
npm ci
npm run typecheck
npm run check
```

실제 PostgreSQL·Redis와 제한 앱 역할을 일회용으로 만들고15개 검사 뒤 정리합니다. 외부 발송은 없습니다. 가짜 효과와 영수증을 같은 DB 트랜잭션에 저장하는 실험이며 실제 이메일의 exactly-once 보장은 아닙니다. 수동 API/Worker 환경은 교재에 설명합니다. DB schema.sql은 별도 실습 DB에만 적용합니다.
