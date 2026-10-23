# 프론트 보안 실제 브라우저 증거

2026-10-22~23 로컬 실습 관찰입니다.

- [F1 유사 호스트 거부](f1-rejected.jpg), [모바일360px](f1-mobile.jpg): 입력을 태그로 만들지 않고 텍스트로 표시하며 허용 링크 이외는 제거했습니다.
- [CSP 관찰 모드](csp-report.jpg): 인라인 표식은 실행되며 script-src-elem / report가 표시됐습니다.
- [CSP 강제 모드](csp-enforce.jpg): 표식은 실행되지 않고 script-src-elem / enforce가 표시됐습니다. 정상 API·WebSocket·영상·자막은 동작했습니다.
- [의존성 조회](dependency-audit.json): 잠금 파일에 대한 당시 결과입니다.

초기 CSP 캡처의 브라우저 탭 제목은 복사된 F1 이름일 수 있습니다. 화면 본문은 F3이며 최종 소스와 빌드의 제목은 F3로 수정했습니다. 관찰하지 않은 조작을 캡처에 추가하지 않았습니다.
