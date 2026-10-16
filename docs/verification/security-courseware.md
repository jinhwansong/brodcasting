# 보안·프론트·인프라 교재 작성 검증

## 범위

2026-10-17 KST 사용자는 방송 서비스의 보안 강의, 프론트 보안 강의, 인프라 학습과 연결한 맨 마지막 BunkerWeb 강의를 요청했습니다. 기존 CURRICULUM.md 원문은 보존하고 SECURITY_CURRICULUM.md와 전용 강의·제출 양식으로 확장했습니다. 기존 학습자 상태 0·미시작은 유지합니다.

이번 산출물은 **교육 문서**입니다. 보안 코드·공개 테스트·참고 정답·Compose 구현·실제 환경 설치의 완료를 주장하지 않습니다. HTTP/DB/인증/소켓 강의의 구현은 해당 단계 제작 때 보안 요구사항과 함께 작성합니다. 프론트 F1~F3와 최종 BunkerWeb 강의에는 사전 예상·실습 순서·실패/정상 증거·설명 3개·독립 변경·빈 제출 양식을 제공했습니다.

## 근거 확인

공식 자료를 열람하고 과제의 신뢰 경계와 적용 범위를 확인했습니다. 아래 자료는 원문 복사 대신 개념을 요약하고 실습을 설계하는 근거입니다. 버전별 구현을 제작할 때 다시 확인합니다.

- [OWASP 위협 모델링](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html), [권한](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [입력 검증](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [WebSocket 보안](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)
- [React 일반 컴포넌트·HTML 삽입](https://react.dev/reference/react-dom/components/common), [OWASP XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [세션](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN URL](https://developer.mozilla.org/en-US/docs/Web/API/URL), [링크](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a), [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), [Vite 환경변수](https://vite.dev/guide/env-and-mode)
- BunkerWeb [개념](https://docs.bunkerweb.io/latest/concepts/), [통합](https://docs.bunkerweb.io/latest/integrations/), [Quickstart](https://docs.bunkerweb.io/latest/quickstart-guide/), [기능](https://docs.bunkerweb.io/latest/features/), [문제 해결](https://docs.bunkerweb.io/latest/troubleshooting/). 열람한 예제의 이미지 tag는 1.6.16이며 실제 설치한 버전이 아닙니다.

## 검토 원칙

- Ruling: 사용자 요청을 기존 커리큘럼의 보안 확장으로 반영하고 단계 번호·원문 기간을 바꾸지 않았습니다. 추가 강의 시간은 별도로 안내합니다. 잘못 판단했을 때 비용은 주차 배분을 추후 다시 조정하는 것입니다.
- Ruling: 완성된 인프라 설정을 검증 없이 제공하는 대신, 이번 범위를 강의·실습 명세로 명시하고 버전 고정 코드와 실행 증거를 후속 제작에 둡니다. 잘못 판단했을 때 비용은 독자가 별도 코드 교재 제작을 기다려야 하는 것입니다.
- Ruling: 기존 위임에 따라 중간 계획 승인 없이 직접 작성하고 마지막 독립 검토 후 main에 게시합니다. 잘못 판단했을 때 비용은 문서 구성을 되돌림 커밋으로 조정하는 것입니다.

## 실제 확인과 미실행

실제 검사 결과: 로컬 문서 링크·제목 anchor 8개 파일에서 문제 0, 변경 파일 10개 모두 Markdown, 실행 코드·lockfile 변경 0, 비밀값 패턴 0, 원본 CURRICULUM.md 변경 없음, `git diff --check` 통과입니다.

새 컨텍스트 독립 리뷰 1회(gpt-6-astra high, `6b7ddbb..956244b`)에서 **Critical 0 / Important 0 / Minor 0**입니다. 공식 CSP·BunkerWeb·WebSocket 자료와 대조했고, 프론트/서버/WAF 책임·최종 순서·로컬 환경 경계·문서와 실행의 구분을 확인했습니다. 제품 코드나 환경에 대한 검증은 수행하지 않았습니다.

- Ruling: 리뷰가 판단을 보류한 실제 브라우저·인증·CSP·TLS·Docker·WAF·WebSocket·부하·복구는 미실행으로 유지합니다. 강의 문서 검토로 런타임을 대신할 수 없기 때문입니다. 잘못 판단했을 때 비용은 후속 코드·환경 검증에서 결함을 발견하는 것입니다.

제품 코드를 바꾸지 않아 코드 자동 테스트를 추가하거나 재실행하지 않습니다. 기반 main `6b7ddbb`의 0단계 24개·1단계 22개·도구 호환성 3개 검증 기록은 각 파트 문서에 있고, 이번 보안 기능의 실행 증거로 재사용하지 않습니다.

브라우저·CSP 헤더·인증 서버·쿠키·BunkerWeb·Docker·TLS·WAF·WebSocket 프록시·오탐·부하·복구 실습은 모두 **미실행**입니다. 강의의 미실행 행렬은 학생이나 제작자의 성공 기록이 아닙니다.
