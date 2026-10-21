# 첫 시도 뒤 보는 해설

A는 입력을 다시 확인한 뒤 pool.connect로 client 하나를 빌립니다. BEGIN 후 영수증 INSERT에 ON CONFLICT DO NOTHING RETURNING id를 사용합니다. 새 행을 넣었다면 같은 client로 가짜 발송을 INSERT합니다. 기존 ID라면 mode를 조회해 같은 작업인지 확인합니다. 다른 mode를 같은 ID에 붙이면 영구 오류입니다. 정상 경로에서 COMMIT하고 duplicate 여부를 반환합니다. 실패하면 ROLLBACK하고 오류를 다시 던집니다. ROLLBACK도 실패한 연결은 정상 연결처럼 pool에 돌려주지 않습니다.

B는 permanent를 먼저 구분하여 UnrecoverableError를 던집니다. transient는 attemptsMade가0·1일 때 실패하고2일 때 저장합니다. slow는 제공된500ms 대기를 사용합니다. after-commit은 A가 새 결과를 저장한 경우에만 오류를 냅니다. 다음 시도에서 A가 duplicate:true를 반환하면 정상 완료합니다. 큐 기록을 지워도 DB 영수증은 남으므로 다음 실행의 효과가 늘지 않습니다.

공개 검사는 가짜 효과 테이블에만 검사 전용 제약을 추가해 INSERT가 실패하도록 만듭니다. PostgreSQL 제약 오류23514를 관찰하고 영수증과 효과가 모두0행인지 확인합니다. 단순히 ‘어떤 오류든 발생했다’를 트랜잭션 검사로 대신하지 않습니다.

독립 변경의 정답은 없습니다. 설명 세 가지와 직접 변경한 증거가 없으면 학습 통과가 아닙니다.
