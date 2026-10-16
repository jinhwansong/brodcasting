# 프론트 보안 전용 강의 F1·F2·F3

한 강의당 3~4시간을 권장합니다. F1은 1단계 이후, F2는 4단계 이후, F3는 10단계 이후에 진행합니다. 방송 제목·공지·채팅처럼 다른 사람이 작성한 문자열, 로그인 상태, 배포 산출물이 각각 어디서 신뢰 경계를 넘는지 배우는 과정입니다.

이번 산출물은 **강의와 실습 명세**입니다. 보안용 별도 시작 코드·공개 테스트·참고 구현은 후속 제작이며, 이 문서가 실행된 보안 기능을 뜻하지 않습니다. 실제 브라우저 검증도 사용자 요청으로 미실행입니다. 학습할 때 현재 단계 폴더의 첫 구현을 보존하고 별도 실습 브랜치에서 진행하세요. [제출 양식](submission.md)에 예상을 먼저 적습니다.

## F1 출력과 링크 경계

### 먼저 예상하기

방송 제목이 `<strong data-probe="title">안내</strong>`라면 글자 그대로 보여야 할까요, 굵은 HTML로 보여야 할까요? 채팅 내용과 공지가 같은 출력 계약인지 적으세요. 이어 ‘JSX를 쓰니 모든 문자열이 안전하다’는 설명에서 빠진 출력 위치를 찾아보세요.

### 핵심 개념

문자열을 React의 일반 children으로 표시하는 것과 HTML로 해석시키는 것은 다른 계약입니다. `dangerouslySetInnerHTML`, `innerHTML`, 외부 위젯의 HTML 삽입 지점을 추적하세요. 리치 텍스트가 실제 요구사항이면 유지되는 sanitizer와 허용 태그 정책을 별도 설계합니다. 이번 강의의 방송 제목·채팅은 **일반 텍스트만** 허용하므로 HTML 지원을 추가하지 않습니다. 근거: [React의 HTML 삽입 주의사항](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html), [OWASP XSS 예방](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

링크의 href는 일반 텍스트와 다른 사용 지점입니다. URL 파싱 후 허용할 프로토콜·origin을 결정하고, 단순히 문자열에 호스트 이름이 포함되는지 검사하지 않습니다. 제목의 길이를 제한하는 것과 링크 이동 정책도 서로 다른 문제입니다.

### 실습 A — 텍스트 출력

1. 현재 1단계 실습 브랜치의 가짜 제목·설명에 위의 **실행 코드가 없는 표식 문자열**을 넣습니다. 실제 사용자 데이터는 쓰지 않습니다.
2. 목록과 상세에서 글자 그대로 표시하고 `strong[data-probe="title"]` 요소가 생성되지 않는 검증을 만드세요. 즐겨찾기와 선택 기능의 기존 회귀도 유지합니다.
3. HTML 문자열 삽입 경로가 있는지 현재 실습 소스만 검색하고, 발견한 위치마다 입력 출처·출력 목적·필요성을 적습니다. 경로가 없으면 ‘없음’과 검색 범위를 기록합니다.
4. jsdom의 DOM assertion과 실제 브라우저의 스크립트 실행·CSP·네이티브 조작 확인을 나눠 기록하세요. jsdom에서 표식 요소가 없다는 증거만으로 모든 XSS를 막았다고 결론내리지 않습니다.

### 실습 B — 공지 외부 링크 정책

이름과 계약을 먼저 정하고 직접 구현하세요.

```ts
function getApprovedNoticeLink(value: unknown): string | null
```

이번 연습의 정책은 길이 1~2048인 문자열, 절대 HTTPS URL, 정확히 `https://docs.example.test` origin, 사용자명·비밀번호 없음입니다. 앞뒤 공백은 제거한 뒤 길이를 검사하고, URL 파서가 정상화한 href를 반환합니다. 나머지는 null입니다. `example.test`는 실습용 이름이며 실제 요청하거나 이동할 필요가 없습니다.

| 입력 | 기대 |
| --- | --- |
| `https://docs.example.test/guide?q=react#intro` | 승인된 URL |
| `https://docs.example.test:443/guide` | URL 파서 기준 같은 origin으로 승인 |
| `http://docs.example.test/guide` | 거부 |
| `https://docs.example.test.evil.invalid/` | 거부 |
| `https://docs.example.test@other.invalid/` | 거부 |
| `https://user:pass@docs.example.test/` | 거부 |
| `https://docs.example.test:444/guide` | 거부 |
| `/guide`, `//docs.example.test/guide` | 거부 |
| `javascript:void(0)`, `data:text/plain,hello`, null, 숫자, 빈 문자열, 길이 초과 | 거부 |

승인된 값만 실제 a의 href로 전달합니다. 거부된 값은 클릭 가능한 링크로 만들지 않습니다. 새 창 링크에는 새 문서와의 연결·referrer 노출 정책을 결정하고 `rel` 설정을 검증하세요. 링크 라벨은 계속 텍스트로 표시합니다. 정책은 이 연습의 제품 요구사항이며 모든 사이트에 같은 호스트 목록을 쓰라는 일반 규칙이 아닙니다. [MDN URL](https://developer.mozilla.org/en-US/docs/Web/API/URL), [새 창 링크](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#target)를 참고하세요.

### 설명 3개와 독립 변경

1. 같은 문자열이 text children과 href·HTML 삽입에 들어갈 때 왜 같은 판단을 하면 안 되나요?
2. origin 동등성과 호스트 부분 문자열 검사의 차이를 위 표의 두 입력으로 설명하세요.
3. DOM 검증으로 확인한 것과 실제 브라우저에서 추가로 확인할 것을 구분하세요.

독립 변경: 허용 origin을 2개로 늘리되 **각 origin에 서로 다른 경로 접두사**를 허용하세요. `/guide`와 `/guides-evil` 경계를 먼저 정하고, 경로 정상화·상대 경로를 포함한 검증을 직접 추가하세요. 완성 코드는 제공하지 않습니다.

## F2 인증 상태와 브라우저 경계

### 먼저 예상하기

개발자 도구로 ‘관리자’ 버튼을 보이게 바꾸면 공지가 수정될까요? 다른 방 id로 직접 요청하면 어떤 응답이 와야 하나요? 로그아웃 뒤 이미 열린 소켓은 언제 권한을 잃어야 하나요? 서버를 만들기 전 답을 적습니다.

### 핵심 개념

프론트는 로그인·권한 상태를 사용자에게 표시하고 서버의 허용 결과를 반영합니다. 권한 판단은 요청을 받은 서버의 신뢰 가능한 사용자·자원 정보로 수행합니다. 401·403의 UI 동작은 해당 API 규약에 맞춰 구분하며, 실패한 변경을 화면에서 성공처럼 확정하지 않습니다. [OWASP 권한 검사](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)를 읽으세요.

쿠키·메모리·localStorage 각각을 누가 읽을 수 있고 브라우저가 언제 전송하며 새로고침·로그아웃 뒤 무엇이 남는지 표로 비교하세요. HttpOnly는 JavaScript의 쿠키 읽기를 제한하지만 XSS가 사용자의 권한으로 요청하는 모든 상황을 막아주지는 않습니다. 쿠키 속성·세션 수명·폐기는 서버와 연결해서 검증합니다. [OWASP 세션 관리](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)를 근거로 사용합니다.

CORS는 브라우저의 교차 origin 응답 접근과 관계된 정책입니다. 서버의 사용자 권한 검사, 쿠키가 붙는 변경 요청의 CSRF 방어도 각각 확인해야 합니다. 허용되지 않은 브라우저 응답 읽기와 서버에 요청이 도착했는지를 구분하세요. 근거: [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [OWASP CSRF 예방](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### 실습 — 같은 요청을 다른 주체로

4단계의 가짜 계정 A·B, 방 R1·R2를 사용합니다. 서버가 없는 현재 시점에는 **미실행**으로 둡니다.

| 조작 | 확인할 결과 |
| --- | --- |
| 비로그인으로 내 즐겨찾기 직접 조회 | API 규약에 따른 인증 거부, 보호 데이터 없음 |
| A의 세션으로 B의 즐겨찾기 조회·변경 | 거부, B의 데이터 불변 |
| R1 관리자에게 R2 공지 변경 요청 | 방별 권한 거부, 공지 불변 |
| 버튼 표시만 바꾼 일반 사용자 | 서버가 동일하게 거부 |
| 세션 만료·로그아웃 뒤 변경 요청 | 재인증 안내, 성공 표시 없음 |
| 로그아웃 뒤 기존 소켓으로 입장·발송 | 정의한 폐기 정책에 따라 거부·연결 종료 |
| 다른 origin에서 쿠키를 동반한 변경 시도 | 선택한 CSRF 방어의 실제 거부와 상태 불변 |

Network 기록에는 메서드·경로·응답 상태·정제된 오류 종류만 남깁니다. 쿠키·Authorization·세션 원문·실제 개인 데이터는 제거하세요. HAR 전체를 그대로 커밋하지 않습니다. 브라우저 차단과 서버 거부를 각각 기록하고, 직접 API 요청 검증을 프론트 조작으로 대신하지 않습니다.

### 설명 3개와 독립 변경

1. 버튼 숨김, CORS, 서버 권한 검사가 각각 무엇을 판단하는지 실제 요청으로 설명하세요.
2. HttpOnly·Secure·SameSite와 세션 폐기가 다루는 경계를 구분하세요.
3. 401·403·네트워크 단절에서 표시 상태와 실패한 변경을 어떻게 처리했나요?

독립 변경: 공지를 읽는 중 세션이 만료된 뒤 수정하려는 흐름을 추가하세요. 작성 내용의 보존 정책, 재로그인 후 자동 재전송 여부를 명세하고, 다른 계정으로 로그인한 경우에도 권한을 새로 확인하는 검증을 만드세요.

## F3 번들과 배포 경계

### 먼저 예상하기

프론트 환경변수에 `VITE_INTERNAL_SECRET=COURSE_PUBLIC_SENTINEL`이라는 **가짜 표식**을 넣으면 빌드 파일에서 찾을 수 있을까요? Git에서 파일을 제외하는 것과 사용자에게 전달되는 번들에서 제외하는 것은 같은가요? 실행 전에 예상하세요.

### 실습 A — 브라우저로 보내는 값

별도 실습 브랜치에서만 가짜 표식을 import.meta.env로 화면에 참조하고 배포 빌드를 만드세요. dist에서 표식이 발견되는지 검색합니다. 이후 표식을 제거하고 다시 빌드해 산출물을 확인하세요. 실제 비밀값으로 시도하지 않습니다. Vite의 `VITE_` 접두사 값이 클라이언트에 노출된다는 [공식 문서](https://vite.dev/guide/env-and-mode#env-variables)를 읽고 공개 설정·서버 전용 비밀값을 분류합니다. 소스맵·외부 스크립트·의존성도 브라우저에 전달되는 범위와 권한을 적습니다.

### 실습 B — CSP를 관찰한 뒤 제한하기

10단계의 로컬 배포 빌드와 응답 헤더를 사용합니다. Vite 개발 서버의 HMR 동작과 배포 빌드 결과를 섞지 않습니다. 먼저 **Content-Security-Policy-Report-Only 응답 헤더**로 필요한 출처를 조사하고 정상 경로의 위반을 분류하세요. Report-Only는 차단하지 않으며 meta 태그로 대신할 수 없습니다. 이후 별도 브랜치에서 차단 정책을 적용하고 동일 흐름을 다시 검증합니다. [MDN CSP 가이드](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)를 근거로 삼습니다.

정책 설계 표에 script-src, style-src, connect-src, img-src, media-src, frame-ancestors, object-src, base-uri가 필요한 이유를 기록합니다. HTTP API·WebSocket·허용 테스트 영상·자막·로그인·오류 복구를 각각 확인하세요. 모든 출처 허용이나 광범위한 inline/eval 허용으로 위반을 지우는 대신 필요한 코드·출처·nonce/hash 정책을 검토합니다. CSP 보고에는 URL 등 민감한 정보가 포함될 수 있으므로 보고 수집·보관 범위도 정하세요.

### 실습 C — 의존성 변경 판단

lockfile을 기준으로 실제 사용하는 의존성의 공식 보안 공지와 영향 조건을 확인합니다. 스캐너가 낸 패키지명·취약 버전·실제 사용 경로를 연결하고, 수정 버전·호환성·회귀 결과를 기록하세요. 자동 강제 업그레이드를 일괄 적용하지 않습니다. 검사하지 못했거나 버전 근거가 없으면 취약점 없음으로 표시하지 않습니다.

### 설명 3개와 독립 변경

1. Git 제외, 빌드 환경변수, 전달된 JS 번들의 차이를 표식 실험으로 설명하세요.
2. CSP Report-Only 결과와 실제 차단 증거는 어떻게 다른가요? 정상 채팅·영상에 필요한 출처는 무엇인가요?
3. 스캐너 결과 하나를 실제 사용 경로·수정 선택·회귀 증거로 연결하세요.

독립 변경: 외부 영상 출처 하나를 추가하고 특정 media-src 범위만 넓혀 보세요. script-src·connect-src를 불필요하게 넓히지 않았는지 정상/거부 경로로 검증합니다.

## 공통 통과 기준

각 강의의 정상·거부·경계 입력, 설명 3개, 독립 변경, 도움 범위와 실제 증거를 제출합니다. 브라우저가 필요한 항목은 실행 전까지 미실행으로 남깁니다. F1의 작은 출력 실습이나 F3의 CSP만으로 전체 서비스를 안전하다고 판정하지 않습니다. 다음은 [전체 과정의 맨 마지막 BunkerWeb 강의](../security-bunkerweb/README.md)와 연결됩니다.
