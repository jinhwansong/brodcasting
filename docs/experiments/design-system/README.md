# 디자인 시스템 실제 화면

2026-10-21 제작자 로컬 검증입니다. [관찰 JSON](browser-observations.json)과 [검증 설명](../../verification/design-system.md)을 함께 봅니다. 화면은 테스트용 데이터이며 비밀번호·세션 토큰·DB 비밀값을 저장하지 않았습니다.

- [목록·데스크톱](home-desktop.jpg) / [목록·휴대폰](home-mobile.jpg)
- [시청·데스크톱](watch-desktop.jpg) / [시청·휴대폰](watch-mobile.jpg)
- [공통 부품·데스크톱](controls-desktop.jpg) / [공통 부품·휴대폰](controls-mobile.jpg)
- [계정·휴대폰](account-mobile.jpg) / [실제 채팅·공지](chat-notice-mobile.jpg)
- [WebRTC 수신·데스크톱](rtc-viewer-desktop.jpg) / [WebRTC 수신·휴대폰](rtc-viewer-mobile.jpg)
- [빈 목록](empty-desktop.jpg) / [디자인 가이드](guide-desktop.jpg)

휴대폰은 viewport360×800 설정에서 실제 client폭345px로 관찰했습니다. 물리 휴대폰 검사는 아닙니다. WebRTC는 카메라 대신 직접 만든 움직이는 테스트 화면으로 두 탭을 연결했습니다. 채팅/공지 입력에는 한글 IME 자동 입력으로 중복 문구·끝 글자가 남았으며 화면의 정확한 입력 문자열 일치를 주장하지 않습니다.

[SHA256 목록](SHA256SUMS.txt)은 이 디렉터리의 관찰 JSON·JPEG와 검사 요약을 대상으로 합니다.
