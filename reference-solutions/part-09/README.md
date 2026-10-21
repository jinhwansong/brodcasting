# 9단계 참고 서버·부하 실험

제작자 비교용입니다. 이 폴더에서 npm ci, npm run typecheck, npm run build로 서버를 독립 설치·빌드합니다. 실제 부하 발생기와 임시 DB/계정 수명 관리는 원본 저장소 checks/part-09/에 있습니다. 독립 복사본 자체가 원본 저장소 밖의 DB/비밀값을 자동 사용하지 않습니다.

원본 저장소의 docs/tasks/part-09/README.md 순서와 전용 PART09_TEST_ADMIN_URL을 준비한 뒤 npm run experiment:reference:part-09로 제작자 비교를 실행합니다. 초기 과제에는 같은 검사를 적용하며 학습자의 설명·독립 변경을 대신하지 않습니다. API의 세션·회원권·입력·연결 상한은 6단계 선수 계약입니다. 전달 동시성만 1/4로 비교합니다.
