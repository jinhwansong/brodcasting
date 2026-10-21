# 8단계 검증 — 영상 시청·실패 처리

2026-10-21 · 제작자 검증 · 학습자는0단계·미시작

## 실행한 확인

5개 공개 검사. native controls·한국어 track·실제 이벤트를 받는 상태·play 거절·오류 재시도·이전 영상 Promise/이벤트 격리·자원 해제. 저장소 밖 독립 설치와 실제 HTML/JS/WebM2개/VTT의 HTTP5경로. 직접 만든4초/12fps/320×180 무음 VP9 두 파일의 실제48프레임 디코딩을 확인.

루트 labs 타입 검사·빌드, 시작 코드의 의도된 행동 실패 분류를 확인했다. 실행 기록은 [요약](../experiments/part-08/verification-summary.json)과 [강의](../tasks/part-08/README.md)를 따른다. 9단계 원시 자료는 [load](../experiments/part-09/reference-load.json),10단계 실제 복구는 [Compose](../experiments/part-10/reference-compose.json)에 있다. CI와 원격 반영은 후속 게시 절에 별도로 기록한다.

## 학습 설명과 리뷰

중학생도 읽을 수 있는 [쉬운 설명](../tasks/part-08/lesson.md), 파일 지도·작은 실습 순서·실행 명령·설명3개·첫 시도 뒤 해설·빈 제출을 제공했다. 완성본은 별도 경로다. 독립 변경의 답을 제공하거나 학습 통과로 처리하지 않았다.

[순차 자체 검토](parts-07-11-review.md)를 수행했다. Code review: skipped (ce-code-review unavailable) — 사용자의 순차 메인 실행 규칙으로 필수 독립 leaf 파이프라인을 실행할 수 없어 독립 리뷰 완료를 주장하지 않는다.

## 미확인 범위

브라우저의 실제 재생·자막·버퍼링·자동재생 제한은 미확인. 모의 미디어 사건을 실제 브라우저 증거로 부르지 않는다. P2P/그리드·CDN·ABR·재생 지연은 쉬운 개념 설명이며 실제 전달망 구현은 아니다.

## Linux CI 게시 근거

[실행 39539737766](https://github.com/jinhwansong/brodcasting/actions/runs/39539737766)의 ui/load/recovery 세 작업이 모두 성공했다. 검증한 코드 커밋은 88492e1949bef3135a9f257416c16ff6660fbbb8, tree는 5050be328859775633df23ae583a6bf3c23a7883다. Node24.19.0에서 공개 검사64개·실제 복구24항목·저장소 밖 독립 설치4개·시작 코드 분류를 확인했다. 결과 ZIP3개의 GitHub SHA256과 내부 보고서14개 SHA256을 내려받아 확인했다. [CI 증거](../experiments/parts-07-11/ci-verification.json)에 해시·검증 범위가 있다. 브라우저·독립 리뷰는 여전히 미실행이다.
