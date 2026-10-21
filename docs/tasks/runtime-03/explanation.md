# 첫 시도 뒤 보는 해설

parseNotice는 TypeScript 타입을 믿는 대신 실제 들어온 값의 키·타입·범위를 확인합니다. Queue와 Worker가 같은 파서를 사용하므로 Redis에 직접 잘못된 데이터가 들어가도 처리 함수가 그대로 믿지 않습니다. 형식이 맞아도 이 가짜 작업 API를 공개할 수 있다는 뜻은 아닙니다.

jobOptions는 단지 retry 숫자만 정하는 함수가 아닙니다. ID와 완료/실패 보관 정책도 함께 정합니다. 기존 작업 ID로 다시 접수할 때 새 body를 덮어쓰지 않는 동작은 공개 검사가 실제 Redis로 확인합니다. 삭제 뒤 다시 접수하는 반대 경계도 확인합니다.

producer의 Redis 요청 실패는 빠르게 드러내고 Worker 연결은 재접속을 고려합니다. 공식 [연결 설정](https://docs.bullmq.io/guide/connections)에서 maxRetriesPerRequest와 연결 재시도 설정의 역할을 구분하세요. BullMQ6.3.19와 ioredis6.0.0을 고정했습니다. 버전6의 제거된 옛 repeat API는 사용하지 않습니다.

자동 검사기의 64MB/noeviction은 메모리를 조용히 지워 버리지 않기 위한 실험 설정입니다. 완료 기록 상한은 waiting/active의 전역 개수 제한이 아닙니다. 무한한 접수를 안전하게 받는 공개 API를 만들었다고 해석하지 않습니다. 이번에는 고정된 소수의 로컬 작업만 실행합니다.

제작자의11개 검사 통과와 학습자의 설명·독립 변경 통과는 따로 기록합니다.
