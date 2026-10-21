# 10단계 참고 배포 환경

제작자 비교용입니다. 이 폴더는 server/client와 lock·Dockerfile·Compose·Nginx를 포함해 독립 빌드할 수 있습니다. npm ci, npm run typecheck, npm run build 또는 Compose를 사용합니다. 평문 개발 서버 대신 로컬 TLS 프록시에서 실행합니다.

원본 저장소 docs/tasks/part-10/README.md에 PowerShell 준비·임시 비밀 환경변수·인증서·빈 DB/제한 역할·실행·백업/새 DB 복원·실패 이미지 롤백 순서가 있습니다. 공개 배포용 설정이 아닙니다. 자동 재현은 원본 저장소의 npm run verify:reference:part-10입니다. 실제 브라우저 검증은 보류했습니다. 독립 변경 답은 포함하지 않습니다.
