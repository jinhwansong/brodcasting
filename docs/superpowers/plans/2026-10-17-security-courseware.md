# 보안·프론트·인프라 교재 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkboxes. 사용자는 강의별 제작·검증·커밋·푸시와 이후 계획의 중간 승인 생략을 위임했다.

**Goal:** 방송 서비스의 가용성과 보안을 함께 배우도록 보안 과정을 편성하고 프론트 전용 강의와 맨 마지막 BunkerWeb 실습 교재를 제공한다.

**Architecture:** 원본 CURRICULUM.md는 유지하고 SECURITY_CURRICULUM.md를 추가 명세로 연결한다. 기존 단계에 서버 보안 과제를 연결하며, 프론트 전용 강의 3개와 최종 BunkerWeb 강의는 별도 과제·제출 증거로 구분한다. 학습자의 현재 단계는 0·미시작을 유지한다.

**Tech Stack:** 기존 React·TypeScript·Vite·NestJS·PostgreSQL·Socket.IO·Docker Compose. 이번 변경은 교재 문서이며 실행 코드·의존성·배포 환경을 바꾸지 않는다.

**Spec:** 사용자 2026-10-17 요청: 보안 강의, 프론트 보안 강의, 인프라 학습과 연결한 맨 마지막 BunkerWeb 강의. 기존 CURRICULUM.md의 설명·독립 변경·증거·미실행 구분 원칙.

## Global Constraints

- 원본 단계 번호와 기간 합계를 임의로 고치지 않는다. 추가 학습 시간은 별도로 안내한다.
- 실제 브라우저 검증은 사용자 요청으로 미실행이다. Docker·WAF·TLS·공개 배포도 실행하지 않는다.
- 실습은 본인 로컬 환경·가상 계정과 데이터로 한정한다. 실제 비밀값·사용자 로그는 커밋하지 않는다.
- 보안 점검표 작성, 테스트 성공, WAF 설치만으로 안전성을 인증하지 않는다.
- 향후 버전별 구현을 만든 것으로 표시하지 않는다. 이번 산출물은 강의 본문·실습 절차·제출 양식이다.
- 기본 학습 범위와 실행 명령은 0단계로 유지한다. 새 문서는 명시적으로 선택한다.

## Review Focus

- 프론트 검증·버튼 숨김·CORS를 서버 권한 검사로 오해하지 않도록 구분한다.
- XSS·URL·CSP·쿠키가 각자 다루는 경계와 남는 위험을 설명한다.
- BunkerWeb을 맨 마지막에 두고 일반 웹·WebSocket·실제 미디어 경로의 점검 범위를 구분한다.
- 공식 quickstart의 공개 포트·도메인 전제를 그대로 학습 환경에 적용하지 않도록 로컬 네트워크 경계를 명시한다.
- 작성된 강의와 실행 검증·향후 코드 제작 상태를 혼동하지 않도록 표에 나눈다.

### Task 1: 보안 과정과 프론트 강의

**Files:** Create SECURITY_CURRICULUM.md, docs/tasks/security-frontend/{README.md,submission.md}. Modify README.md, AGENTS.md.

**Interfaces:** F1=출력·링크, F2=인증 상태·브라우저 경계, F3=번들·CSP·공급망. 기존 2~10단계 보안 과제와 연결한다. 각 강의는 사전 예상·작은 실습·요청/DOM/빌드 증거·설명 3개·독립 변경을 갖는다.

- [x] 확인한 React·Vite·MDN·OWASP 공식 자료를 연결하고 기술 주장과 과제 설계의 근거를 구분한다.
- [x] 프론트 세 강의의 요구사항·실패 사례·통과 기준과 빈 제출 양식을 작성한다.
- [x] 로컬 링크 검사 Expected: broken 0. 문서만 바뀌므로 구현을 흉내 내는 테스트를 추가하지 않는다.

### Task 2: 최종 BunkerWeb 강의·검토·게시

**Files:** Create docs/tasks/security-bunkerweb/{README.md,submission.md}, docs/verification/security-courseware.md. Modify progress.md.

**Interfaces:** 기존 11단계와 알림 추가 과정, 앞선 보안 과제 이후의 마지막 강의다. 보호 계층·네트워크·TLS·WAF 탐지/차단·오탐·WebSocket·로그·복구를 실습한다. 실제 운영 배포는 별도다.

- [x] 현재 공식 BunkerWeb 개념·기능·통합·문제 해결 문서로 강의와 검증 행렬을 작성한다. 구체 버전의 Compose 구현은 후속 코드 제작으로 표시한다.
- [x] 독립 문서 리뷰 1회에서 보안 경계·공식 근거·미실행 기록·끝 순서를 검토한다. 중요한 오류는 수정하고 근거를 다시 확인한다.
- [x] 링크·비밀값 패턴·diff·실행 코드 불변을 확인한다. Expected: 문제 0, 코드/lockfile 변경 0.
- [x] 학습자 미시작 상태를 보존하고 교재 제작 기록만 갱신·커밋한다.

**게시 절차:** 최신 main을 확인한 뒤 expected SHA로 게시하고 전체 tree 일치를 검증한다. 알림은 제목만 전달한다.

자체 검토: 이번 범위는 커리큘럼 확장과 강의 문서다. 실제 보안 기능의 완성이나 환경 설치를 주장하지 않는다. 사용자가 승인한 직접 제작 + 마지막 독립 리뷰 방식을 유지한다.
