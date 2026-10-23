# 쉬운 해설

CSP는 브라우저가 받아들이는 출처를 제한하는 추가 방어입니다. script-src는 스크립트, connect-src는 API와 소켓, media-src는 영상·자막을 다룹니다. Report-Only는 차단하지 않고 meta 태그로 대신할 수 없습니다. 이 실습은 전체 inline/eval 허용으로 위반을 숨기지 않습니다. 보고 원문은 저장하지 않고 응답만 처리해 URL 같은 정보가 로그에 쌓이지 않도록 했습니다.
