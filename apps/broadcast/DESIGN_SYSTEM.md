# 온에어 라운지 디자인 시스템

방송을 찾고 영상에 집중하며 채팅하는 흐름을 기준으로 화면을 만듭니다. 어두운 바탕·민트색 조작·읽기 쉬운 한글·같은 버튼과 입력창을 사용합니다.

실행한 사이트에서 **‘디자인 가이드’**를 누르면 실제 부품을 볼 수 있습니다. 주소는 `#/design-system`입니다. 색·글자·간격, 버튼의 선택/저장 중/비활성, 입력 오류, 빈 목록, 대화상자와 방송 카드 조합을 확인할 수 있어요. 예제 동작은 실제 서버에 저장하지 않습니다.

[쉽게 설명한 수정 방법과 작은 실습](client/src/ui/README.md)을 먼저 읽으세요. [설계 기준](../../docs/superpowers/specs/2026-10-21-onair-design-system.md)과 [실제 검증](../../docs/verification/design-system.md)도 남겼습니다.

공통 부품을 목록·계정·팔로우·채팅·공지·WebRTC에 적용했습니다. 기존0~11단계의 옛 교재 화면을 전부 새로 그리는 작업은 포함하지 않았습니다. 알림5주와 통합 알림함에도 같은 부품을 적용했습니다. [알림 검증](../../docs/verification/notifications-security-integrated.md)을 참고하세요.

저장소 루트에서 확인합니다.

```sh
npm run check:broadcast:design
npm run check:broadcast
npm run typecheck:broadcast
npm run build:broadcast
```

디자인 검사는13항목(조작9·스타일/제공 복사본4), 화면 검사는15항목입니다. 영상 기능까지 바꾸었다면 `npm run check:broadcast:rtc`와 실제 두 탭의 영상도 확인하세요. 테스트 통과만으로 화면이 보기 좋아졌다고 판단하지 않고 넓은 화면과 휴대폰 화면을 함께 봅니다.

2026-10-22에는 승인된 시안을 따라 목록 프로필을PC32px·모바일28px로 줄이고, 본문PC16px·모바일14px·제목20px 기준을 적용했습니다. 시청 중 ‘스크린 모드’를 누르면 영상과 채팅이 넓어지고 Escape로 돌아옵니다. 방송 스튜디오에서는 ‘방송하기’에 제목·테스트 화면·카메라·화면 공유·마이크·종료를 모으고, ‘방송 찾기’에서 열린 실제 WebRTC 방송을 선택합니다. [추가 설계](../../docs/superpowers/specs/2026-10-22-streaming-ui.md)·[브라우저 검증](../../docs/verification/streaming-ui-2026-10-22.md)을 참고하세요.
