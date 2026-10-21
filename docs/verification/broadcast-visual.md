# 온에어 라운지 화면·연결 검증

2026-10-21 사용자의 ‘SOOP·치지직 같은 스타일’ 요청에 따라 [화면 계약](../superpowers/specs/2026-10-21-broadcast-visual-refresh.md)을 바꾸고 apps/broadcast를 제작했습니다. 어두운 탐색 화면, 직접 작성한 SVG 썸네일6개, 검색/정렬/팔로우, hash 시청 경로, 영상/오른쪽 채팅, 공지, 계정 dialog를 연결했습니다. 기존6단계의 세션·CSRF·권한·저장/복구 구조를 재사용합니다.

## 실제 확인한 범위

- UI의 새5개 흐름을 TODO 상태에서 실패시킨 뒤 구현했습니다. 추가 검사 포함 최종13개가 통과합니다. 검색/빈 결과, 실제 API 모양의6개 목록, 시청 경로/뒤로 가기, 비로그인 계정 창, 로그인 팔로우 저장, 제목 초점, 느린 재조회 중 영상/초안 보존, 로그아웃 뒤 이전 계정 상태 숨김, DOM 읽기 순서와 네 Player의 StrictMode 회귀를 포함합니다.
- 서버·클라이언트 타입 검사/빌드, 기존8단계 Player5개와10단계 운영 계약6개, Node/독립 패키지 정책19개를 통과했습니다.
- 저장소 밖 소스만 복사본의 새 npm ci·서버/클라이언트 타입·빌드를 통과했습니다. 이 독립 설치 검사는 HTTP 실행을 포함하지 않습니다. 실제 HTTP/소켓은 아래 로컬 브라우저에서 별도로 확인했습니다.
- 실제 로컬 PostgreSQL과 제한 앱 역할을 사용하는 API에 UI를 연결했습니다. 가입·로그인·CSRF 팔로우 저장, 권한 거부 뒤 사용자 승인 범위의 r1 참여/관리 반영, 실제 채팅 DB 저장, 두 탭의 같은 세션에서 이력과 추가 메시지 수신을 관찰했습니다. 가짜 로그인/채팅 응답으로 성공을 표시하지 않았습니다.
- 실제 video 재생에서 readyState4·4초 끝남을 관찰했습니다. 계정 창의 Escape 닫기와 초점 복귀도 관찰했습니다.
- 데스크톱 clientWidth1265와964에서 관찰했습니다. 임시360px viewport에서 clientWidth345/scrollWidth345, video top122, chat top563.34, notice top1128.34로 영상→정보→채팅→공지 배치를 확인하고 viewport를 되돌렸습니다. DOM 읽기 순서도 채팅→공지입니다. 실제 스크린리더 소프트웨어 검사는 수행하지 않았습니다.

[실제 브라우저 요약](../experiments/broadcast/browser.json), [UI 로그](../experiments/broadcast/ui.log), [독립 설치](../experiments/broadcast/standalone.json), [검증 요약](../experiments/broadcast/verification.json), [SHA256](../experiments/broadcast/SHA256SUMS)을 보존합니다. 스크린샷은 [홈 데스크톱](../experiments/broadcast/home-desktop.jpg), [시청 데스크톱](../experiments/broadcast/watch-desktop.jpg), [홈 모바일](../experiments/broadcast/home-mobile.jpg), [시청 모바일](../experiments/broadcast/watch-mobile.jpg)입니다. 브라우저가 반환한 실제 JPEG 형식으로 저장했습니다.

## 발견하고 고친 동작

개발 모드에서 영상이 readyState0에 멈췄습니다. StrictMode가 Effect의 설치→정리→재설치를 수행할 때 정리 함수가 src를 제거한 뒤 재설치가 복구하지 않는 것이 원인이었습니다. 실제 브라우저와 실패 검사로 확인하고 Effect 설치 때 필요한 src를 복원했습니다. 원래 정지/자원 해제는 유지했습니다. 새 사이트와 같은 제공 코드를 쓰는8단계 완성본,10단계 완성본/제공 코드 총4곳을 고쳤고 회귀 검사를 추가했습니다. JSDOM의 pause/load 미지원 출력은 실제 재생 증거로 사용하지 않았습니다.

시청 제목의 초점을 영상 데이터가 도착한 뒤 옮기고 preventScroll로 영상이 위로 잘리는 문제를 피했습니다. 화면 전환 때 맨 위로 이동합니다. 팔로우 저장 후 느린 재조회가 시청 화면을 없애 영상/초안을 초기화하던 현상은 실패 검사 후 같은 계정·같은 방송에 한해 이전 응답을 유지하도록 고쳤습니다. 계정 epoch가 달라지면 이전 응답을 보여주지 않습니다.

## 남은 범위

알림함/큐 연결·알림5~7주·F1/F2/F3·최종 복구는 진행 중입니다. 현재 샘플은 기존 공동 연습방 r1/r2에 연결되며 방송별 독립 방으로 설명하지 않습니다. 실제 라이브 송출·시청자 집계·공개 HTTPS/WSS·운영 보안·장시간 성능을 검증한 서비스가 아닙니다. 기본0~11 전체 브라우저 검증의 완료도 뜻하지 않습니다.

생성/정리·계정 전환·캐시 노출·DOM 읽기 순서·자체 자산·의존성 변경을 순차 자체 검토했습니다. **Code review: skipped (ce-code-review unavailable)** — 사용자 순차 실행 규칙에 따라 독립 리뷰를 수행하지 않았습니다. 학습자는0·미시작입니다.
