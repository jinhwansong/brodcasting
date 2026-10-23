# 남은 작업과 인수인계

기준일: 2026-10-23 · **사용자 명시 요청으로 제작 재개**

## 최신 상태 — 알림·보안 제작 완료

알림1~7주, 프론트 보안 F1~F3, 통합 사이트 알림함·큐 복구·CSP의 코드와 실습 교재를 제작하고 로컬 검증했습니다. [결과와 실행 범위](docs/verification/notifications-security-integrated.md), [알림 교재](notification-runtime-curriculum.md), [보안 교재](docs/tasks/security-frontend/README.md)를 따릅니다. 학습자는 **0단계·미시작**입니다.

현재 남은 별도 작업은 기존0~11의 미확인 브라우저 항목, 물리 PC WebRTC·카메라·마이크·LAN HTTPS 확인입니다. BunkerWeb과 공개 배포는 이번 범위에서 제외했습니다. 독립 리뷰·원격 CI는 로컬 검증과 구분합니다. 원래 미추적 docs/PROJECT_PLAN.md·docs/REMAINING_WORK.md는 보존합니다.

## 이전 진행 기록 — 아래 미완료 표현은 당시 상태

2026-10-22 UI 후속: 승인된 시안을 목록·시청 기본/스크린 모드·방송 스튜디오에 적용했다. 목록 프로필PC32px/모바일28px, 본문16px/14px, 제목20px 기준. 실제 두 탭의 송출·수신·종료와 모바일 배치를 확인했다. [검증](docs/verification/streaming-ui-2026-10-22.md). 알림5~7·F1~F3·최종 알림함은 아래와 같이 별도 미완료다.

사용자가 알림7주·프론트보안3강 제작과 기존에 보류했던 실제 브라우저 검증을 명시적으로 요청했습니다. 이어 숲처럼 목록·시청·채팅·알림이 연결된 하나의 사이트도 함께 만들기로 선택했습니다. [전체 실행 계획](docs/superpowers/plans/2026-10-21-notification-security-integrated.md)을 따릅니다. **아래 ‘11까지 자동 착수하지 않음’은 이전 범위 기록이며 이 최신 지시로 해제했습니다.** BunkerWeb은 이번 범위에서 제외합니다.

- 기본0~11: 기존 교재·코드 게시 완료. 전체 사이트 통합 완료를 뜻하지 않습니다.
- 디자인 시스템: 의미 색·글자·간격·공통 조작·`#/design-system` 가이드를 만들고 목록/회원/팔로우/채팅/공지/WebRTC와 독립 WebRTC 제공 UI에 적용했습니다. 디자인12·기존 화면13·RTC단위19/실제 신호9·독립 설치, 실제 데스크톱/휴대폰/두 탭 영상을 확인했습니다. [쉬운 사용법](apps/broadcast/DESIGN_SYSTEM.md)·[검증](docs/verification/design-system.md). 이후 UI도 이 기준을 사용합니다.
- 알림5주 진행 중: 인증된 자기 알림함·DB 중복 방지/순번 페이지·별도 Worker 복구를 작성했고 실제 서버17·client9를 확인했습니다. 공통 UI를 적용했으며 교재/시작 코드·독립 설치·최종 브라우저 검증이 남아 미게시 상태입니다.
- 알림4주: runtime-04의 실제 PostgreSQL·Redis·HTTP15검사, 가짜 효과/영수증의 트랜잭션과 재처리·종료, 독립 설치·쉬운 교재를 제작했습니다. [검증](docs/verification/runtime-04.md).
- 알림3주: runtime-03의 실제 Redis·Nest HTTP·별도 Worker11검사와 독립 설치·쉬운 교재를 제작했습니다. [검증](docs/verification/runtime-03.md).
- 알림2주: runtime-02의 실제 Nest 두 프로세스·HTTP/종료6검사, 독립 새 설치·쉬운 교재를 제작했습니다. [검증](docs/verification/runtime-02.md).
- 알림1주: [runtime-01 교재](docs/tasks/runtime-01/README.md)·15검사·실제5모드3회·독립 소스 복사본 검증을 제작했습니다. [검증](docs/verification/runtime-01.md).
- 통합 화면: [온에어 라운지](apps/broadcast/README.md)의 어두운 탐색·썸네일·시청·회원·팔로우·공지·DB 채팅을 구현했습니다. 실제 브라우저와 데스크톱/모바일 배치·13검사를 확인했습니다. [검증](docs/verification/broadcast-visual.md). 알림함과 최종 복구 연결 전이므로 전체 사이트 완성은 아닙니다.
- WebRTC 추가 실습: [시작 코드·쉬운 교재](docs/tasks/webrtc-01/README.md)·독립 완성본·사이트 실습실을 제작했습니다. 단위19개·실제 일회용 DB/HTTP/소켓9항목·저장소 밖 새 설치를 검증했고, 실제 두 탭의640×360 영상·수신 프레임 증가·모바일·종료/새로고침/로그아웃 정리를 확인했습니다. [검증](docs/verification/webrtc-01.md). 카메라·마이크·화면 공유·물리 PC 두 대·신뢰 인증서/LAN HTTPS는 수동 확인이 남습니다. 시청자 간 재전송·SFU/CDN은 구현하지 않았습니다.
- 남은 제작: 알림5~7주, 프론트 F1/F2/F3, 통합 사이트의 알림함·최종 복구 검증. [추가 과정 진입점](notification-runtime-curriculum.md).
- 실제 브라우저: 0/1 검색·즐겨찾기·오류복구·상세·메뉴,7의1,000보관/가상화,8의실제재생·오류·복구를 관찰하는 중입니다. 부분 관찰을 전체 브라우저 검사 완료로 세지 않습니다.
- 학습자는0·미시작 유지. 원래 미추적 docs/PROJECT_PLAN.md·docs/REMAINING_WORK.md는 수정·게시하지 않습니다.

## 최신 인수인계 — 요청한11단계까지 제작

사용자가11까지 제작하고 중학생도 읽을 수 있는 설명을 남기라고 요청했습니다. 기본0~11의 시작 코드·공개 검사·분리된 완성본·쉬운 설명·실습 순서·설명3개·독립 변경·빈 제출을 갖췄습니다. [시작 안내](docs/LEARNING_GUIDE.md), [7](docs/verification/part-07.md)·[8](docs/verification/part-08.md)·[9](docs/verification/part-09.md)·[10](docs/verification/part-10.md)·[11](docs/verification/part-11.md), [순차 자체 검토](docs/verification/parts-07-11-review.md)를 따릅니다.

새 공개 검사64개, 실제 로컬 Docker/HTTPS/WSS/DB 복원·이미지 롤백24항목을 확인했습니다.7/8/9/11은 저장소 밖 소스 복사본을 새 설치했고10은 source-only Docker context로 빌드했습니다.7/8/11 실제 브라우저·기기 성능 수치는 여전히 미실행입니다.9의 원시 전후3회 비교는 실제 로컬 측정이며 운영 수용 인원으로 일반화하지 않습니다. 학습자는0·미시작, 설명과 독립 변경 대기입니다. 원래 미추적 docs/PROJECT_PLAN.md·docs/REMAINING_WORK.md는 보존했습니다.

**이번 요청 범위인 기본0~11의 남은 제작 항목은 없습니다.** 다음 별도 제작 범위는 알림/프로세스/큐7주 → 프론트 보안 F1/F2/F3의 전용 코드·검증 → 전체 맨 마지막 BunkerWeb입니다.11까지라는 현재 요청을 넘어 자동 착수하지 않습니다. 아래5·6·4단계 인수인계와 기본 표는 당시 기록이며 재제작 지시가 아닙니다. CI·게시 결과는 각 검증 문서에 후속 기록합니다.

## 6단계 인수인계 — 당시 기록

5단계 게시 뒤 이어서6단계 저장·재연결·복구를 제작했습니다. [설계](docs/superpowers/specs/2026-10-20-part-06-design.md)·[계획](docs/superpowers/plans/2026-10-20-part-06-courseware.md)·[검증](docs/verification/part-06.md)을 따릅니다. server194 + client68 =262개와 source-only 새 설치·실제 Vite 소켓 프록시·프로세스 재시작 뒤 저장 이력·동일 발송 ID1행을 확인했습니다. starter는 server172통과/22의도된 실패, client53통과/15의도된 실패입니다.0~5회귀·Node/독립 패키지 정책9개·기본 학습0의18실패/6통과를 유지했습니다.

A 트랜잭션/중복 방지·B 이력·C 복구/제한 재시도3주 교재와 설명3개·독립 이력 확인·빈 제출·브라우저 후속을 제공했습니다. 최종 [Linux CI39425787959](https://github.com/jinhwansong/brodcasting/actions/runs/39425787959)도 성공했으며5·6단계 독립 설치/SIGTERM·artifact ZIP과 내부 보고서7개 SHA256을 확인했습니다. 다음은 **7단계 브라우저 성능·장시간 사용**입니다. 실제 기기/브라우저 측정은 보류 상태이므로 수치를 만들어 완료 처리하지 않습니다. 학습0·미시작, 사용자 미추적 docs의 두 문서 보존, 실제 브라우저·Compose 직접 기동·공개 배포·독립 리뷰 보류를 유지합니다.

## 5단계 인수인계 — 당시 기록

후속 ‘계속 작업’ 요청으로5단계 WebSocket 채팅을 제작했습니다. [설계](docs/superpowers/specs/2026-10-20-part-05-design.md)·[계획](docs/superpowers/plans/2026-10-20-part-05-courseware.md)·[검증](docs/verification/part-05.md)을 따릅니다. 실제 server/DB/HTTP/socket149개 + client50개 =199개, source-only 새 설치·실제 Vite socket 프록시·두 클라이언트 송수신·API 재시작·폐기와0~4회귀를 확인했습니다. starter는 server110통과/39의도된 실패, client41통과/9의도된 실패이며 인증 선수 기능은 제공합니다. A입력/회원권·B입장/발송·C구독 수명3주 교재·해설·설명3개·독립 한 연결 방 이동·빈 제출·브라우저 후속 양식을 작성했습니다.

다음 제작은 **6단계 메시지 저장·재연결·복구**입니다.5단계의 메시지는 휘발성이며 ack/UUID만으로 저장·중복 제거·복구 보장을 제공하지 않습니다. 실제 브라우저·Compose 직접 기동·공개 배포·독립 리뷰는 보류합니다. 학습0·미시작과 미추적 docs/PROJECT_PLAN.md·docs/REMAINING_WORK.md 보존을 유지합니다.

## 4단계 인수인계 — 당시 기록

사용자가 docs 계획을 읽고 나머지 제작을 계속하라고 요청해 앞선 중지를 해제했습니다. 4단계 화면·실행 진입점·3주 교재를 이어서 제작했습니다. 학습자는 **0단계·미시작**입니다.

| 대상 | 현재 결과 |
| --- | --- |
| Task 1/2 | 기존 SQL·해싱·세션·CSRF·HTTP·권한 구현 보존, 실제 DB에서 재검증 |
| Task 3 | 가입·로그인·개인 즐겨찾기·방별 공지 연결, epoch/revision·초안 정책 확인 |
| Task 4 | 양쪽 main.ts, A/B/C 3주 교재·해설·빈 제출·브라우저 후속 양식 제공 |
| 완성본 | 실제 DB/HTTP/wire/실행 설정 103 + client 40 = 143 통과 |
| 시작 코드 | 서버 54통과/49의도된 실패, client 40통과. 인증·권한 TODO 유지 |
| 독립 실행 | 소스 복사·새 npm ci·타입·빌드·operator 정상/거부·프록시·실제 API 2회 재시작·로그 확인 |
| 회귀 | 0/1/2/3단계 24/22/72/97, Node 정책6 통과. 0단계 시작 코드는18실패/6통과 유지 |
| 리뷰 | 사용자 순차 실행 규칙에 따른 자체 리뷰. 계정 변경 첫 렌더의 초안 노출 RED→GREEN 수정 |

현재 근거는 [4단계 검증](docs/verification/part-04.md), [실행 요약](docs/experiments/part-04/README.md)입니다. 다음 제작은 아래 **나머지 기본 과정의 5단계 WebSocket 채팅**부터입니다. 이후 6~11단계·알림7주·보안 F1~F3·맨 마지막 BunkerWeb 순서를 유지합니다. 전용 F2 독립 과제는 다른 탭의 계정 변경 신호 후 서버 재확인으로 확장했습니다.

Windows Node24.15.0 + Docker PostgreSQL18.6 검증과 별도 [Linux CI39412577725](https://github.com/jinhwansong/brodcasting/actions/runs/39412577725)를 모두 확인했습니다. Linux SIGTERM 종료·artifact ZIP과 보고서6개 SHA256도 확인했습니다. 실제 브라우저·공개 배포·운영 보안·소켓·BunkerWeb은 미검증입니다. 사용자가 원래 갖고 있던 미추적 docs/PROJECT_PLAN.md·docs/REMAINING_WORK.md는 수정·커밋에서 제외했으며 관리 문서는 루트의 같은 이름 파일입니다.

## 중지 당시 기록 — 역사 보존, 현재 미완료 목록 아님

이번 요청은 지금까지 한 작업의 푸시와 Markdown 정리입니다. 아래 체크리스트는 이후 재개할 때 사용할 기록이며 지금 실행하라는 지시가 아닙니다. [기획서](PROJECT_PLAN.md), [현재 학습 상태](progress.md), [4단계 설계](docs/superpowers/specs/2026-10-17-part-04-design.md), [상세 구현 계획](docs/superpowers/plans/2026-10-17-part-04-courseware.md)을 함께 읽으세요.

## 보관한 상태

| 대상 | 확인한 상태 | 재개 시 주의 |
| --- | --- | --- |
| 0~3단계 | 완성 교재가 main에 게시됨. 중간 저장 전 main은 `12f463315d51ebab11c1d15bdf235972c202701f` | 기존 교재·기본 명령·학습 0단계를 보존 |
| 4단계 Task 1 | SQL·해싱·사용자/방 접근 정책 작성, 당시 실제 DB+unit 28/28 | 시작 코드의 해싱·정책 골격은 의도된 과제 |
| 4단계 Task 2 | 세션·Guard·HTTP·CSRF·권한·실제 DB 검사 89/89 | 마지막 녹색 CI는 아래 검증 기록 참조 |
| 4단계 client API | API 계약 검사 26/26 | 실제 HTTP wire 3개는 구현 후 재검증 필요 |
| AuthPanel/useSession | 파일 작성, 현재 client 타입 검사 통과 | App 연결·행동 검증 미완료, 완성 기능으로 취급하지 않음 |
| App / 공지 편집 | App은 제목만 표시, NoticePanel 없음 | UI 14개 모두 미통과 |
| 실행 진입점 | createApp 주입 테스트 가능, server/src/main.ts 없음 | 단독 API 실행·종료·production 거부 미완료 |
| 교재·독립 실행·리뷰 | Task 4 미착수 | 4단계 완료 처리 금지 |

로컬 보관 위치는 `brodcasting-part00/.worktrees/part-04`, 브랜치는 `courseware/part-04`였습니다. 중간 저장 직전 코드 HEAD는 `901dede`이며 AuthPanel.tsx/useSession.ts는 이 문서화 작업에서 처음 커밋합니다. 로컬 경로는 실행 환경이 바뀌면 없어질 수 있으므로 GitHub의 중간 저장 트리를 기준으로 복구하세요. CI용 `courseware/part-04-ci`의 마지막 기록 커밋은 `2e7e612423aafda8e87f68d9be040f710f77afb9`이며 최신 client API 구현 이전 상태입니다.

## 재개 첫 순서

- [ ] 사용자의 명시적 재개 요청을 확인한다. 중간 저장 이전의 연속 제작 승인만으로 자동 재개하지 않는다.
- [ ] 최신 원격 main과 작업 트리를 확인하고 다른 변경을 보존한다. 깨끗한 worktree를 사용한다.
- [ ] 이 문서와 기획서·4단계 검증 문서·상세 계획을 읽고 Task 3의 미완료 화면부터 이어간다. 이미 검증한 서버를 이유 없이 다시 작성하지 않는다.
- [ ] Node와 lock에 맞춰 설치하고 필요한 범위의 검사를 실행한다. root 기본 `npm test`는 계속 학습 0단계의 의도된 미완성 검증이다.

## 4단계 Task 3 — 화면 연결

- [ ] `reference-solutions/part-04/client/src/App.tsx`에 AuthPanel/useSession, 기존 검색·정렬·페이지 목록·개인 즐겨찾기를 연결한다.
- [ ] `NoticePanel.tsx`를 작성해 방 선택·서버 canEdit·일반 텍스트 공지·관리자 편집을 연결한다. 화면 버튼 표시로 서버 권한을 대신하지 않는다.
- [ ] 인증 epoch와 방 선택 revision으로 이전 계정/이전 방의 늦은 GET·쓰기 응답을 무시한다. 이전 쓰기의 finally가 새 계정의 저장 중 상태를 해제하지 않아야 한다.
- [ ] 401 뒤 같은 계정 재인증은 초안을 보존하고 자동 재전송하지 않는다. 403과 결과 불명인 연결 실패도 초안을 보존하고 권한/데이터 재조회를 안내한다. 명시적 로그아웃 성공 또는 다른 계정 로그인은 이전 초안을 지운다.
- [ ] 토큰은 메모리에만 두고 비밀번호 입력은 제출 후 비운다. 공지·제목·이름은 텍스트로 표시한다. StrictMode의 초기 세션 조회 중복과 인증 동작 직렬화를 검증한다.
- [ ] 기존 색상·레이아웃·키보드·라벨·포커스와 좁은 화면 대응을 유지한다. 브라우저 검증은 계속 보류한다.
- [ ] API 26개 + UI 14개 + 실제 wire 3개를 포함한 전체 검사를 통과시킨다. 현재 테스트 구성이 바뀌지 않으면 서버 92개(기존 89+wire 3)와 client 40개로 총 132개다. **132는 목표 수이며 통과 기록이 아니다.**
- [ ] 완성된 client 선수 코드를 labs에 제공한다. 서버의 password/AuthService/AuthGuard/access-policy 학습 과제는 fail-closed로 남긴다. 양쪽 타입 검사·빌드를 확인한다.

화면 행동 계약은 `checks/part-04/ui.test.tsx`의 14개와 `ui-fixture.ts`를 확인합니다. API 공개 계약은 `client-api.test.ts`, 실제 연결은 `wire.test.ts`에 있습니다. 테스트를 삭제하거나 실패 상태를 통과로 바꾸지 않습니다.

## 4단계 Task 4 — 실행·교재·검증

- [ ] 양쪽 `server/src/main.ts`의 설정 검증을 먼저 실패 테스트로 고정한다. DB URL·part04_app 역할·64자리 hex secret 필수, loopback listen, production 실행 거부, 연결/쿼리 제한시간, 종료 시 app/pool 정리를 구현한다. 비밀값 fallback을 두지 않는다.
- [ ] operator CLI의 migration/seed/provision-app/grant-admin 정상 경로와 기존 역할·권한 오류 경로를 실제 DB에서 확인한다. 고정 관리자 계정/평문 비밀번호 seed를 넣지 않는다.
- [ ] source-only 복사본에서 새 npm ci·타입 검사·빌드·API·Vite 프록시를 검사한다. 실제 API 프로세스 재시작 후 같은 DB/secret의 세션·즐겨찾기 유지, 로그아웃 후 재시작해도 옛 쿠키 401을 확인한다. createApp 재생성 검사와 실제 프로세스 재시작 증거를 구분한다.
- [ ] 별도 소유 test/lab DB와 schema/role만 사용하고 테스트 비밀번호·secret marker가 오류 출력에 섞이지 않는지 확인한다. 결과 요약과 CI artifact 무결성 근거를 저장한다.
- [ ] 시작 코드의 의도된 실패를 별도 수집한다. 모듈·연결·시간 초과·미처리 오류는 정상 과제 실패로 분류하지 않는다.
- [ ] 기존 0/1/2/3단계 회귀와 Node 정책을 확인한다. 당시 게시 검증 수는 24/22/72/97개, 4단계 추가 후 정책 검사는 6개다. 실제 실행한 결과만 기록한다.
- [ ] `docs/tasks/part-04/`의 README·해설·빈 제출·브라우저 후속 양식을 작성한다. A 해싱/B 세션/C 권한 3주, 예측·공식 근거·힌트·설명 3개·독립 ‘모든 기기 로그아웃’ 과제를 포함한다. 독립 과제 정답은 제공하지 않는다.
- [ ] 참고 완성본 README·로컬 secret 생성·DB 역할·Compose 절차를 작성한다. F2의 독립 과제가 본 과정과 겹치므로 ‘다른 탭의 계정 변경 신호를 받은 뒤 서버 재확인’으로 확장하되 구현 답은 추가하지 않는다.
- [ ] 전체 최종 리뷰 1회와 필요한 수정/재현 검증을 수행한다. 현재는 리뷰 미실시다. 중간 저장을 최종 리뷰 완료로 세지 않는다.
- [ ] 검증 후에만 제작 4단계 완료를 기록한다. 학습자는 0단계·미시작을 유지한다. 이후 main 푸시 확인과 제목 알림을 남긴다.

## 기본 과정 범위 — 제작 전 요구사항 표

각 단계는 기획만 남기는 것으로 끝내지 않고 시작 코드·공개 검증·해설·분리된 참고 완성본·설명/변경 과제·실행 증거까지 제작해야 합니다.

| 순서 | 남은 핵심 내용 | 완료를 판단할 증거 |
| --- | --- | --- |
| 5 WebSocket 채팅 | Gateway/Service, 인증·Origin, 방 입장/발송 권한·길이·형식, 세션 만료·로그아웃, 구독 정리 | 실제 소켓 정상/거부·방 분리·정리 검사. 두 브라우저 확인은 별도 후속 |
| 6 저장·재연결 | DB 이력, 서버 ID/정렬, client 발송 ID, 확인 응답·중복 제거·복구 경계·재시도 상한 | 저장 성공/응답 유실 재현, 중복 행·중복 표시·복구 누락 경계 |
| 7 프론트 성능 | 10/100/500건 등 기기별 메시지 재생, DOM/메모리 상한·가상화·묶음·스크롤·입력 | 동일 기기/빌드/조건/시간의 전후 측정. 수치는 실행 전 작성 금지 |
| 8 영상 | 허용된 샘플 video, 미디어 이벤트·버퍼링·오류 복구·자막·자원 정리 | 실제 이벤트와 실패 증거, 지원 범위. HLS는 선택 |
| 9 부하 | 로컬 다중 클라이언트·방/발송률/시간 고정, 지연 분포·오류율·회복·중단 상한 | 기준선→증가→유지→해제 원시 결과와 동일 조건 개선 비교 |
| 10 배포·복구 | HTTPS/WSS·프록시 신뢰·내부 포트·비밀값·로그·상태 확인·DB 백업/복원·롤백 | 새 환경 설치·실패·복구 실행 증거. 공개 배포/유료 자원은 별도 범위 |
| 11 설명·지원 자료 | 새 요구 영향 분석·독립 변경·사례 3개·AI/본인 기여 구분 | 설명과 직접 변경 결과, 관측한 결과와 한계 |

## 알림·프로세스·큐 추가 7주

원본 CURRICULUM.md에 있는 개요를 기준으로 상세 교재를 새로 작성해야 합니다. 원본이 연결한 `notification-runtime-curriculum.md`는 현재 저장소에 없으므로 읽었다고 주장하거나 빈 링크를 유지한 채 완료 처리하지 않습니다.

| 주 | 제작할 내용 |
| --- | --- |
| 1 | 프로세스·스레드·동시성·Node 이벤트 루프의 차이를 작은 실행 실험으로 확인 |
| 2 | 같은 NestJS 코드의 API/알림 bootstrap 분리, 별도 프로세스와 수명·장애 경계 |
| 3 | BullMQ·Redis의 enqueue/Worker·job 상태·재시도·중복/멱등 처리 |
| 4 | 가짜 발송기·실패/재시도/최종 실패·종료 중 작업, 실제 이메일/FCM은 선택 |
| 5 | 알림 저장·목록·읽음·재접속 복구·사용자별 접근 |
| 6 | API/Worker 병목·자원 경쟁·측정에 따른 분리 판단, 9단계와 연결 |
| 7 | Docker Compose의 API/Worker/Redis/DB·내부 네트워크·비밀값·상태/복구, 10단계로 연결 |

## 보안 전용·최종 인프라

- [ ] F1: 일반 텍스트 출력·URL origin/경로 허용·새 창 링크 정책의 시작 코드·공개 검증·참고 구현을 만든다. 기존 강의와 독립 과제를 보존한다.
- [ ] F2: 현재 서버 인증과 연결해 UI 권한/쿠키·토큰 저장/CORS·CSRF/만료를 다룬다. 본 과정의 초안·401 기능을 전용 브라우저 실습 완료로 세지 않는다. 다른 탭 신호도 인증의 근거가 될 수 없고 서버를 재확인한다.
- [ ] F3: 번들 공개 값·CSP·외부 스크립트·의존성 변경을 실습 코드와 빌드/헤더 검사로 연결한다. 실제 브라우저 CSP 동작은 보류 범위로 따로 둔다.
- [ ] 단계별 실시간 보안·속도/보관 상한·최소 권한·로그 정제를 각 강의와 연결한다.
- [ ] **모든 기본·알림·보안 과정 뒤 마지막**에 BunkerWeb 전용 Compose와 내부 네트워크·프록시·TLS·WebSocket·WAF·오탐 조정·로그·롤백을 제작한다. 착수할 때 공식 버전과 설정을 다시 확인한다. WAF를 애플리케이션 권한 검사로 대체하지 않는다.

## 중지 당시 실제 검증 기록과 제한

- 서버 마지막 녹색: [run 39181743044](https://github.com/jinhwansong/brodcasting/actions/runs/39181743044), CI `def5a6a19d047cdce1ccab9a02b07ec196fa173f`, 로컬 `1fc654d27327c923ff99b81ec831425b7bc5664b`. unit 19 + DB 16 + HTTP 54 = 89개. 현재 체크포인트 전체의 재검증 기록은 아니다.
- wire/UI 도입 당시: [run 39183170436](https://github.com/jinhwansong/brodcasting/actions/runs/39183170436), CI `2e7e612423aafda8e87f68d9be040f710f77afb9`. 서버 기존 89개 통과, wire 3개와 client 40개 실패. 이후 API만 구현했다.
- 이번 중간 저장 확인: reference client `tsc --noEmit` exit 0, client 전체 40개 중 API 26개 통과/UI 14개 실패(exit 1). App은 제목뿐이며 추가한 AuthPanel/useSession은 아직 렌더링되지 않는다. UI 연결 전 동작 보장을 하지 않는다.
- 로컬 Docker·PostgreSQL 실행 도구가 없어 실제 DB는 GitHub Actions PostgreSQL 18.6 service로 확인했다. 사용자/namespace/권한 우회나 브라우저 설치를 재시도하지 않는다.
- 실제 브라우저·공개 서비스·운영 보안·BunkerWeb 실행은 미검증이다. 현재 4단계 workflow는 중간 저장의 미완성 UI 때문에 실패할 수 있으며 끄거나 성공 처리하지 않는다.

재개 후 client 확인 명령은 다음과 같습니다. 현재는 세 번째 명령이 UI 14개 때문에 실패하는 것이 기록된 상태입니다.

```sh
npm ci
npm --prefix reference-solutions/part-04/client run typecheck
LAB_TARGET=reference node node_modules/vitest/vitest.mjs run --config checks/part-04/client.config.ts
```

실제 DB 전체는 전용 test DB와 `PART04_TEST_ADMIN_URL`을 준비한 뒤 `npm run check:reference:part-04`로 실행합니다. 비밀값을 커밋·문서·공유 로그에 넣지 않습니다. 새로 실행하지 않은 결과를 이전 CI의 녹색 상태로 대체하지 않습니다.
