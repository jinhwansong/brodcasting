# 첫 복구 실험 뒤 읽는 해설

<details><summary>설정은 문을 열기 전에 확인합니다</summary>

API는 제한 역할·내부 DB 주소·허용 DB 이름·충분한 secret·릴리즈 값을 확인한 뒤 연결합니다. main은 모든 인터페이스로 듣지만 Compose의 내부 네트워크 안에 있고 호스트 포트가 없습니다. 공개 배포용 일반 설정으로 바꾸지 않았습니다. HTTPS 입구는 web만 담당합니다.

</details>

<details><summary>건강 확인과 정제 로그</summary>

ready는 실제 SELECT 1의 성공 여부입니다. DB를 못 만나면 false와 503을 돌려줍니다. raw 오류·URL·본문을 로그에 통째로 넣지 않고 필요한 네 필드만 골라 새 객체를 만듭니다. requestId는 서버가 생성합니다. 전달 헤더도 정확한 프록시 하나에서만 신뢰합니다.

</details>

<details><summary>복원과 권한은 별도입니다</summary>

dump를 새 DB에 넣어도 앱 역할의 권한이 맞는지는 별도 확인이 필요합니다. 원본 role을 덮거나 관리자 권한으로 앱을 켜지 않고 기존 제한 권한만 새 DB에 다시 부여합니다. 같은 세션과 이력을 실제 HTTPS/WSS로 읽고 메시지 DELETE 거부도 확인합니다.

</details>

독립 변경의 연속 준비 성공 정책은 제공하지 않습니다.
