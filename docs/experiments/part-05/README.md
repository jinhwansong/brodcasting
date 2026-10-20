# 5단계 실행 요약

[Linux CI39419360850](https://github.com/jinhwansong/brodcasting/actions/runs/39419360850)도 성공했습니다. Node24.19.0·실제 proxy socket·SIGTERM 종료를 확인했고 artifact ZIP과 내부 보고서6개의 SHA256을 검증했습니다. 테스트 대상 commit/tree와 해시는 아래 JSON에 기록합니다.

2026-10-20, Windows Node24.15.0·Docker PostgreSQL18.6에서 실제 실행했습니다. [JSON 요약](verification-summary.json)은 상태·개수·exit code·원시 보고서 SHA256만 저장하며 비밀번호·secret·쿠키·CSRF·해시를 넣지 않습니다. RED→GREEN과 한계는 [검증 문서](../../verification/part-05.md)에 기록했습니다.

| 확인 | 결과 |
| --- | --- |
| reference | server149 + client50 = 199통과 |
| starter | server110통과/39의도된 실패, client41통과/9의도된 실패 |
| source-only | 새 npm ci·타입·빌드·operator 정상/거부·실제 HTTP/WebSocket 프록시 |
| 실제 소켓 | 두 클라이언트 송수신·API 재시작 뒤 재인증·폐기 후 기존 연결 차단 |
| 실제 API 재시작 | 두 번·세션/즐겨찾기 유지·옛 cookie 거부 |
| 로그 | 생성한 테스트 비밀번호/secret 표식이 CLI/API/DB 출력에 없음 |
| 이전 과정 | 0~4단계24/22/72/97/143 + Node 정책7 통과 |

원시 JSON은 git-ignored test-results/part-05/에 있습니다. 요약의 SHA256은 그때의 파일 바이트를 연결합니다. 재실행하면 시간 정보 때문에 달라질 수 있습니다. 원격 CI artifact는 별도 실행 commit·ZIP digest·내부 manifest와 연결해 기록했습니다.

실제 브라우저·Compose 파일 직접 기동·공개 배포·독립 리뷰어·다중 서버·메시지 저장/복구는 포함하지 않습니다. Windows 프로세스 종료를 POSIX graceful signal 증거로 바꾸지 않습니다.
