# 8단계 — 영상이 멈추면 이유를 알려 주기 (2주)

목표는 영상을 화면에 붙이는 데서 끝나지 않습니다. **재생 중인지, 기다리는 중인지, 실패했는지**를 보고 알 수 있게 만듭니다. [쉬운 설명](lesson.md)을 먼저 읽으세요. [구현 해설](explanation.md)은 첫 시도 뒤에 읽습니다.

## 먼저 예상하기

1. 재생 버튼을 눌렀는데 브라우저가 거절하면 ‘재생 중’이라고 써도 될까요?
2. A영상을 불러오다가 B로 바꿨습니다. 나중에 A의 오류가 오면 어느 화면을 바꿔야 할까요?
3. 영상이 기다리는 중인 것과 영상 파일이 없는 것은 어떻게 다를까요?

## 실행하기

루트의 Node 준비와 `npm ci` 뒤 다음을 실행합니다. 서버·DB는 필요 없습니다.

```sh
npm run dev:part-08
```

http://127.0.0.1:5188 에서 영상 선택·플레이어 자리·7단계 채팅 실험실을 확인합니다. 영상은 각 4초인 직접 만든 무음 도형 영상입니다. 한국어 자막을 제공합니다. 출처·사용 허가는 labs/part-08/public/media/LICENSE.md에 있습니다. 외부 방송 영상을 내려받지 않습니다.

| 파일 (labs/part-08/ 아래) | 역할 |
| --- | --- |
| src/Player.tsx | **내 과제**: video, 이벤트 상태·재생 실패·재시도·정리 |
| src/App.tsx | 제공: 영상 선택과 채팅 실험실 연결 |
| src/Replay.tsx, Timeline.tsx, useReplay.ts, window.ts | 제공: 7단계 선수 구현 |
| public/media/ | 제공: 자체 제작 WebM 두 개, 한국어 VTT 자막 |

처음에는 Player만 TODO입니다. 참고 완성본을 미리 복사하지 말고 공개 검사 checks/part-08/player.test.tsx가 기대하는 행동부터 읽으세요.

## 1주 — 화면 상태를 실제 사건과 연결하기

1. video에 controls·playsInline·preload="metadata"를 넣습니다. 기본 조작을 먼저 사용합니다. 직접 모든 플레이어 버튼을 새로 만들 필요는 없습니다.
2. track으로 한국어 자막을 연결합니다. 자막 파일은 영상과 같은 서버에서 제공합니다.
3. ‘불러오는 중’에서 시작합니다. loadedmetadata/playing/waiting/pause/ended/error를 받아 알맞은 문장을 표시합니다. 버튼 클릭만으로 재생 중으로 바꾸지 않습니다.
4. 최근 이벤트는 8개만 남깁니다. 끝없이 기록하지 않습니다. 영상 파일의 오류는 내부 오류 문장 대신 짧은 안내로 보여 줍니다.
5. play()는 Promise를 돌려줍니다. 실패를 잡고 직접 재생 버튼을 누르거나 파일을 확인하라는 안내를 보여 줍니다. 자동재생은 브라우저가 막을 수 있습니다.

## 2주 — 바꾸기·실패·다시 시작하기

1. 영상이 바뀌면 이전 이벤트를 떼고 pause → src 제거 → load 순서로 이전 자원을 놓습니다. 이전 play의 늦은 실패도 무시해야 합니다.
2. ‘영상 다시 불러오기’는 같은 파일을 새 플레이어로 다시 시작합니다. 오류 안내도 새 시도에 맞춰 초기화합니다.
3. ‘없는 파일로 오류 연습’을 선택합니다. 멈춘 화면만 남지 않도록 안내와 재시도를 확인합니다.
4. 영상 재생과 채팅 생성기를 함께 켜고 입력·스크롤을 관찰합니다. 두 부분이 같은 브라우저 자원을 쓴다는 점을 기록합니다.

```sh
npm run typecheck:part-08
npm run build:part-08
npm run check:part-08
npm run preview:part-08
```

빌드 미리보기는 http://127.0.0.1:4288 입니다. 자동 검사는 미디어 사건과 실패를 흉내 내 UI의 반응을 검사합니다. 실제 영상 디코딩·자막 표시·브라우저 자동재생 정책을 통과했다고 뜻하지 않습니다. [브라우저 양식](browser-checklist.md)에 직접 확인한 브라우저와 실제 이벤트를 남기세요. 제작 중 브라우저 검증은 보류했습니다.

## 설명 질문 3개

1. waiting을 왜 ‘오류’라고 하지 않았나요? 다시 playing이 오면 어떻게 바뀌나요?
2. 영상 전환 때 이전 자원과 늦은 Promise는 각각 어디서 처리하나요?
3. 파일 재생과 라이브의 차이, P2P와 시청 지연의 차이를 내 말로 설명하세요.

독립 변경: 완성본·해설 없이 **영상별 마지막 시청 위치를 이 탭의 메모리에 저장하고, 다른 영상에서 돌아왔을 때 metadata를 받은 뒤에만 복원**하세요. 없는 파일·끝난 영상·유효하지 않은 위치의 정책부터 정하고 검사하세요. 이 답은 제공하지 않습니다.

[제출 양식](submission.md)에 예상·실제·도움받은 부분을 적습니다. 학습 통과는 설명과 독립 변경까지 직접 확인한 뒤 결정합니다.

공식 자료: [MDN HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement), [play의 실패](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [video 자막](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track).
