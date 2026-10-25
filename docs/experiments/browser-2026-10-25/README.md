# 브라우저 검증 화면과 관찰

[판정·실행 범위](../../verification/browser-2026-10-25.md) · [읽기 전용 DOM 관찰](observations.json).

- [0단계 모바일](part-00-mobile.jpg), [1단계 모바일 상세](part-01-mobile.jpg)
- [2단계 HTTP 복구](part-02-recovery.jpg), [3단계 API 재시작 뒤 저장 유지](part-03-restart.jpg), [4단계 로그인·새로고침](part-04-login-reload.jpg)
- [7단계 자동 정지 뒤 보관 상한](part-07-stopped.jpg), [8단계 영상 오류 복구](part-08-recovery.jpg)
- F2 [A의 알림](f2-account-a.jpg) → [B의 빈 알림함](f2-account-b-empty.jpg) → [재시작 뒤 읽음 유지](f2-restart-read.jpg)

모바일 첫 설정은 새 탭에 적용되지 않아 실제 너비1265px로 관찰됐습니다. 이를 모바일 성공으로 세지 않았으며 탭 생성 뒤 설정을 다시 적용한 corrected viewport 항목과 최종 화면을 사용합니다.390px 창의 본문은 스크롤바를 제외하면375px입니다. 비밀번호·쿠키·카메라 영상·음성 원본은 저장하지 않았습니다.
