# 6단계 해설 — 첫 시도 뒤에만

먼저 예측·구현·실패 기록을 남기세요. 학습 모드에서는 요청 없이 이 파일과 참고 완성본을 읽지 않습니다.

<details><summary>A: ID와 순서를 별도로 다루는 이유</summary>

같은 계정·방의 clientMessageId unique는 재시도가 새 행을 만들지 않게 합니다. 같은 ID로 다른 text를 보내면 원본 확인이 아니므로409입니다. 서버 UUID는 행 식별, seq는 방 안의 복구 순서, timestamp는 표시 시각입니다. timestamp나 일반 sequence 할당 순서가 commit 순서를 대신하지 않습니다.

counter 행을 잠근 트랜잭션이 저장을 마칠 때까지 다음 발송이 기다립니다. 따라서 counter가 보이는 시점에는 그 번호의 저장이 commit되어 있습니다. counter 증가 후 INSERT 실패도 같은 트랜잭션에서 rollback됩니다. 이는 한 방의 쓰기를 직렬화하는 비용이 있으며 운영 처리량을 측정한 결과는 아닙니다.

</details>

<details><summary>B: ack 유실과 고정 조회 경계</summary>

commit 뒤 응답 유실/503이면 서버 행은 있고 client는 모를 수 있습니다. 같은 ID 재시도는 기존 Message를 돌려주며 추가 broadcast를 만들지 않습니다. 응답을 받았다는 사실도 모든 수신자의 표시를 보장하지 않습니다.

until은 조회를 시작할 때의 커밋 경계입니다. 후속 페이지가 계속 새 경계를 잡으면 데이터 증가 중에 조회가 끝나지 않거나 의미가 달라집니다. 끝의 next=until은 삭제 구멍에도 전진합니다. DB 복원 등으로 client cursor가 서버보다 크면409이며 조용한 초기화로 숨기지 않습니다.

</details>

<details><summary>C: live가 cursor가 아닌 신호인 이유</summary>

저장 순서와 수신자 재인가 완료 순서는 다를 수 있습니다. live2가 live1보다 먼저 와도 이력을 seq 순으로 읽으면1을 건너뛰지 않습니다. 검증한 페이지의 next만 cursor로 적용합니다. 복구 중 신호는 boolean 하나로 합쳐 이후 snapshot을 요청합니다. ID로 표시를 합치고 seq로 정렬하며 보관100개와 복구 cursor를 구분합니다.

발송 ID는 첫 제출 때만 만들고 미확인 동안 보존합니다. 제한 재시도·수동 확인도 같은 ID여야 합니다. 다른 계정/방의 callback과 cleanup된 timer는 현재 연결을 바꿀 수 없습니다. 같은 계정의 재인증과 다른 계정의 전환 정책도 별개입니다.

</details>

독립 변경인 ‘이력으로 미확인 발송을 자동 확인’의 구현은 싣지 않습니다. 제공한 reference는 ack 확인과 수동 확인만 수행합니다. 브라우저·다중 서버·영구 outbox·운영 exactly-once는 검증 범위가 아닙니다.
