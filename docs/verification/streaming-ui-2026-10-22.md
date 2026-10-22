# 방송 목록·시청 모드·방송 스튜디오 검증

검증일2026-10-22. 승인된 시안과 목록 프로필 축소 지시를 적용했다. 기존 색상·서버 데이터·회원·권한 처리는 유지했다. 단위 검사와 브라우저 관찰을 구분한다.

## 실행 결과

- `check:broadcast`:14개 통과. 스크린 모드 전환·Escape·목록 복귀와 영상 DOM/채팅 초안 보존 검사 포함.
- `check:broadcast:design`:조작9개, 스타일/독립 복사본4개 통과. 방송하기/방송 찾기 전환 시 영상 요소 보존 포함.
- `check:broadcast:rtc`:서버7·client12·실제 PostgreSQL/HTTP/소켓9 통과.
- `typecheck:broadcast`, `build:broadcast`, `git diff --check` 통과.
- Vite의 기존 native config import 확장자 예고 경고와 jsdom의 미구현 media 메서드 경고는 남는다. 실제 영상은 아래 별도 브라우저에서 검증했다.

## 실제 브라우저

일회용 로컬 DB와 API3006/UI5190, Codex 내장 브라우저를 사용했다. Docker Desktop이 중지되어 있어 시작한 뒤 검증했다. 개인 카메라나 화면을 캡처하지 않았다.

- PC 목록:client width1265/scrollWidth1265, 프로필32px, 본문16px.
- 모바일 목록:width360/scrollWidth360, 프로필28px, 본문14px, 제목20px. 이전 CSS가 모바일 프로필을35px로 덮는 문제를 실제 관찰하고 수정했다.
- 기본·스크린 모드:스크린에서는 탐색 메뉴가 사라지고 오른쪽340px 채팅이 화면 높이를 채움. width1280/scrollWidth1280. Escape로 복귀.
- 샘플 영상의4초 재생 종료 상태가 모드 복귀 후에도4초/ended=true로 유지됨.
- `screen mode draft` 초안이 스크린 진입·Escape 복귀 모두에서 유지됨. 새 DB 계정에 채팅방 권한을 부여하지 않았으므로 이번 검증에서 메시지는 전송하지 않았음. 권한 부족 안내와 전송 비활성을 확인함.
- 방송 스튜디오:합성 테스트 화면 송출, 방 주소로 다른 탭 접속·시청. 수신 영상640×360/readyState4, 실제 수신118프레임·169,304bytes 관찰. 종료 후 두 탭 모두 대기로 돌아가고 시청자 화면에 송출자 종료 안내 표시.
- 모바일 스튜디오:width345/scrollWidth345, 제공된 방송 조작 표시 확인.

스크린샷은 [증거 폴더](../experiments/streaming-ui-2026-10-22/)에 있다. `studio-desktop.jpg`, `rtc-viewer.jpg`는 송출 중, `studio-mobile.jpg`는 종료 뒤 대기 화면이다. `watch-desktop.jpg`와 `screen-desktop.jpg`는 권한 없는 연습방 상태를 포함한다.

## 범위와 남은 확인

카메라·마이크 실기기, 사용자가 직접 고르는 화면 공유, 서로 다른 PC/외부망은 이번에 실행하지 않았다. 기존 최대4명 peer 연결과 STUN/TURN 없는 로컬 실습 제약은 그대로다. 방송별 라이브 채팅·OBS·녹화·SFU·CDN은 추가하지 않았다. 시청 UI의 채팅은 기존 공동 연습방이다.

제공 WebRTC UI와 이미지 파일은 독립 교재 양쪽에 동기화했다. 이번에는 독립 새 설치를 재실행하지 않았으며 이전 검증 기록과 구분한다. 독립 리뷰는 수행하지 않았고 코드·검사·실제 화면을 순차 자체 검토했다. 학습자는0·미시작을 유지한다.
