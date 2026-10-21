# 알림 추가 과정 1주 — 프로세스·스레드·이벤트 루프 제작 계획

> 실행: 사용자 ‘작업 그냥 하면되’와 기존 자동 제작 위임에 따라 현재 세션에서 순차 구현한다. 서브에이전트는 사용하지 않는다. 설계·실행 방식 중간 재승인은 생략한다.

**Goal:** 같은 CPU 계산을 다섯 방식으로 실행해 계산 결과, 이벤트 처리 순서, PID/스레드 ID, 메모리 전달·공유, 자식 종료를 직접 비교하는 교재를 만든다.

**Architecture:** Node 내장 기능만 사용한다. 학습 코드는 `labs/runtime-01`, 비교용 완성본은 `reference-solutions/runtime-01`, 공개 검사는 `checks/runtime-01`, 쉬운 교재는 `docs/tasks/runtime-01`에 둔다. 외부 서버·포트·GPU·Redis·DB가 필요 없는 독립 실습이다.

**Tech Stack:** Node.js ESM, node:test, worker_threads, child_process, setImmediate.

**Spec:** [기존 추가 과정 요구](../../../CURRICULUM.md), [전체 남은 범위](../../../REMAINING_WORK.md). 이번 구현 단위는 추가 과정 첫 주다. 나머지 여섯 주·보안·BunkerWeb을 완료로 세지 않는다.

## 제약과 선택

- Node 지원 범위 `^22.22.2 || ^24.15.0 || >=26.0.0`을 유지한다. 외부 의존성이나 기본 npm test 변경은 없다.
- 루트와 독립 패키지에서 같은 파일을 실행하되 완성본은 루트의 소스·node_modules에 기대지 않는다.
- 학습자의 핵심 과제는 동일 합 계산과 일정량마다 실행권 양보하기다. 자식 생성·정리는 선수 코드로 제공한다.
- 비교 방식은 main/promise/cooperative/thread/process. 0부터 n-1까지 i%97의 합, n은 정수 1,000~5,000,000. 기본 1,000,000. 명령 인수는 숫자 하나만 허용한다.
- 순서는 예약한 setImmediate 콜백(probe)과 계산 결과(result)로 기록한다. 이것은 HTTP 응답 지연이나 실제 사용자 수가 아니다. 처리 시간에 새 worker/process 시작·종료 비용이 포함된다.
- 스레드는 같은 PID·다른 threadId, 프로세스는 다른 PID를 관찰한다. 일반 객체 복사와 SharedArrayBuffer+Atomics의 명시적 공유를 구분한다.
- 자식 종료 코드 7을 실제로 발생시킨다. 이 실험이 스레드의 메모리 고갈·네이티브 충돌을 격리한다고 주장하지 않는다.
- 원래 미추적 docs/PROJECT_PLAN.md·docs/REMAINING_WORK.md 보존, 학습 0·미시작 유지.

## 검토 집중점

1. 입력 상한 우회: 소수·NaN·문자열·추가 CLI 인수 거부 검사.
2. cooperative 마지막 불완전 묶음: 10,001회와 100,003회의 정확한 합 검사.
3. await만 붙여 별도 스레드로 착각: 실제 probe/result 순서 검사.
4. 자식 오류와 조기 종료: 제한시간, 비정상 종료, 부모 생존 검사. 소유 자식은 exit를 기다리고 정리한다.
5. 외부 복사본 숨은 의존성: 저장소 밖 임시 소스 복사본에서 검사·실험 후 소유 폴더만 삭제한다.

## Task 1: 계산과 실행권 양보

Files: 양쪽 `src/work.mjs`, `checks/runtime-01/work.test.mjs`, `run.mjs`.

- [ ] 고정 입력/기대 합, 검증 경계, main/promise/cooperative 순서 검사를 먼저 작성한다.
- [ ] TODO 구현에서 의도한 실패를 실행한다. import 오류를 의도된 실패로 세지 않는다.
- [ ] `checksum(count)`와 `cooperative(count)`를 완성본에 구현한다. 후자는 10,000개마다 setImmediate로 양보한다.
- [ ] 공개 검사와 시작 코드의 의도된 실패를 별도로 확인한다.

## Task 2: 실제 스레드·프로세스 비교

Files: 양쪽 `src/child.mjs`, `src/runtime.mjs`, `src/experiment.mjs`, `checks/runtime-01/runtime.test.mjs`.

- [ ] 실제 다섯 실행의 합, PID/threadId, 객체 복사/공유, 비정상 자식 종료 검사를 먼저 실패시킨다.
- [ ] 단일 소유 자식을 실행하고 message/error/exit/10초 제한을 처리한다. exit 전 성공 처리하지 않는다. shell 문자열로 자식을 만들지 않는다.
- [ ] 반복 세 번의 실제 원시 JSON을 생성한다. 고정 성능 합격 수치는 두지 않는다.

## Task 3: 독립 실행·교재·게시

Files: 양쪽 package/README, 공개 standalone/experiment runner, `docs/tasks/runtime-01/*`, 추가 과정 개요 `notification-runtime-curriculum.md`, 검증·인수인계·CI.

- [ ] 중학생 수준 쉬운 비유, 파일 지도, 명령, 관찰 순서, 설명 세 개, 정답 없는 독립 변경, 빈 제출을 작성한다.
- [ ] 외부 임시 복사본 npm ci/공개 검사/실험, 문법 검사, 기존 도구 정책·0/1 회귀, 기본 학습의 의도된 실패를 확인한다.
- [ ] 자체 순차 검토와 한계를 기록한다. 독립 리뷰·브라우저·GPU 측정을 꾸미지 않는다.
- [ ] 소유 경로만 커밋·푸시하고 CI/원격 결과를 확인한다. 후속 단위는 runtime-02 Nest bootstrap 분리다.

## 완료 기준

시작 코드/완성본/공개 검사/실제 실험/쉬운 설명/독립 복사 실행/원격 확인을 갖춘다. 실행하지 않은 검증은 미확인으로 남긴다. 학습자는 0단계·미시작이며 제작 성공으로 진도를 넘기지 않는다.
