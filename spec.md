# spec.md — 도트 아트 에디터 (pixel-editor)

## 1. 개요 및 기능
16x16 격자에 도트를 찍어 그림을 그리고 PNG로 저장하는 미니 웹앱. 2048 앱과 같은 톤(밝은/다크 `prefers-color-scheme` 대응, `--accent: #6c5ce7`, 44px 이상 버튼)을 따른다.

| 항목 | 결정 | 이유 |
|---|---|---|
| 도구 | 연필, 지우개, 채우기(페인트통) | 채우기는 구현이 짧고 효용이 커서 포함 |
| 선택 색 표시 | 도구 모음에 현재 색 견본 + 현재 도구 하이라이트 | 상태 명확화 |
| 팔레트 | 고정 16색 (4x4) | 16x16 도트 아트에 충분, 모바일에서 한 화면에 들어감 |
| 직접 색 고르기 | `<input type="color">` 1개 제공 (선택 시 현재 색으로 지정) | 코드 몇 줄로 자유도 확보 |
| 전체 지우기 | 있음 (확인 `confirm` 후 실행, 되돌리기로도 복구 가능) | 실수 방지 |
| 되돌리기 | 최근 50단계 undo + redo 없음 | 한 번의 드래그 = 1단계. redo는 범위 과다 |
| 격자선 토글 | 있음 (기본 켜짐) | 저장 이미지에는 영향 없음 |
| PNG 저장 | 배율 선택 x1 / x10 / x20 (기본 x20 = 320px), 투명 배경 유지, 파일명 `pixel-art-YYYYMMDD-HHMMSS.png` | 16px 원본은 보기 불편, 배율은 select 하나로 해결 |
| 자동 저장 | localStorage `pixel-editor:v1` (그림 + 선택 색 + 격자 토글) | 새로고침 시 작업 보존, 접근 실패 시 try/catch로 무시 |

팔레트 16색(추천): `#000000 #ffffff #7f7f7f #c3c3c3 #880015 #ed1c24 #ff7f27 #fff200 #22b14c #00a2e8 #3f48cc #a349a4 #b97a57 #ffaec9 #ffc90e #99d9ea`. 지우개는 칸을 투명(`null`)으로 만든다.

## 2. 파일 구조
```
/apps/pixel-editor/
  index.html   # 마크업 (캔버스, 도구, 팔레트, 버튼)
  style.css    # 레이아웃, 다크 모드, 반응형
  script.js    # 상태, 그리기, 입력, 저장, 내보내기
```
외부 라이브러리 없음. 블로그 다른 파일은 수정하지 않는다(Embed 단계 제외).

## 3. 핵심 로직
- **데이터**: 길이 256의 배열 `grid`, 값은 팔레트 색 문자열(`"#rrggbb"`) 또는 `null`(투명). 인덱스 = `y*16+x`.
- **렌더링 방식**: `<canvas>` 추천 (div 256개 대비 렌더·PNG 변환이 단순, 드래그 시 좌표 계산 한 곳). 표시용 canvas는 내부 해상도 320x320, CSS로 정사각형 크기 조절, `image-rendering: pixelated`. 투명 칸은 체크무늬로 그린다. 격자선은 표시용 canvas에만 그린다.
- **입력**: Pointer Events 통합. `pointerdown`에서 `setPointerCapture`, `pointermove`로 연속 칠하기, `pointerup/cancel`에서 종료. canvas에 `touch-action: none`으로 스크롤 방지. 좌표: `getBoundingClientRect` 기준으로 `floor((clientX-left)/width*16)`. 빠른 드래그로 칸이 건너뛰지 않도록 이전 칸과 현재 칸 사이를 Bresenham 직선으로 보간한다.
- **채우기**: 스택 기반 flood fill (4방향), 같은 색이면 무시.
- **되돌리기**: 스트로크 시작 전 `grid` 복사본을 스택에 push (최대 50). 변경이 없으면 push하지 않는다. 단축키 Ctrl/Cmd+Z.
- **PNG 변환**: 오프스크린 canvas(16x16)에 `fillRect`로 칸을 그린 뒤 선택 배율의 canvas에 `imageSmoothingEnabled=false`로 `drawImage` 확대 → `toBlob('image/png')` → `URL.createObjectURL` + 임시 `<a download>` 클릭 → `revokeObjectURL`. 격자선·체크무늬는 포함하지 않는다.

## 4. UI / 반응형
- 레이아웃: 세로 배치 기본. 상단 제목과 도구(연필/지우개/채우기/되돌리기/전체 지우기/격자 토글), 중앙 캔버스, 하단 팔레트와 저장 영역(배율 select + 저장 버튼).
- 캔버스 크기 `min(92vw, 480px)` (모바일 360px에서 약 331px, 칸당 약 20px). 데스크톱(>=760px)에서는 캔버스 좌측, 도구·팔레트 우측 2열.
- 터치 대상: 버튼·팔레트 칸 최소 44x44px (팔레트는 4열 x 4행, 칸 간격 8px).
- 접근성: 버튼에 `aria-label`/`aria-pressed`(도구, 격자 토글), 팔레트는 `role="radiogroup"` + 색 이름 `aria-label`, `:focus-visible` 윤곽선, canvas에 `role="img"`와 설명 라벨, 저장 완료 안내는 `aria-live="polite"`. 가로 스크롤 없음(`overflow-x: hidden`).

## 5. 검증 체크리스트 (Review용)
1. 마우스 클릭·드래그로 점이 찍히고, 빠르게 드래그해도 선이 끊기지 않는다.
2. 모바일 에뮬레이션(375px)에서 터치 드래그로 그려지고 페이지가 스크롤되지 않는다.
3. 팔레트 16색 선택, 직접 색 고르기가 현재 색 견본에 반영된다.
4. 지우개가 투명으로 지운다. 채우기가 인접 같은 색 영역만 채운다.
5. 되돌리기가 스트로크 단위로 동작하고 50단계 제한에서 오류가 없다. 전체 지우기 후에도 되돌리기 가능.
6. 격자선 토글이 화면에만 영향을 준다.
7. PNG 저장: 파일이 다운로드되고, x1은 16x16, x10은 160x160, x20은 320x320이며 투명 배경이 유지되고 격자선이 없다.
8. 새로고침 후 그림·색·토글이 복원된다. localStorage 차단 시에도 오류 없이 동작.
9. 다크 모드와 키보드 포커스 표시, 콘솔 에러 없음, 파일이 `/apps/pixel-editor/` 밖에 생기지 않음.

## 6. Embed 단계
`js/app.js`의 미니 웹앱 섹션(`<div class="grid">` 안, 2048 카드 뒤)에 기존 카드와 동일한 구조로 추가:
```html
<a class="post-card app-card" href="apps/pixel-editor/index.html">
  <div class="app-card__preview" aria-hidden="true">
    <iframe src="apps/pixel-editor/index.html" title="도트 아트 에디터 미리보기" loading="lazy" tabindex="-1"></iframe>
  </div>
  <div class="post-card__body">
    <h3 class="post-card__title">도트 아트 에디터</h3>
    <p class="post-card__summary">16x16 격자에 16색 팔레트로 도트 그림을 그리고 PNG로 저장하는 픽셀 아트 에디터.</p>
    <span class="post-card__date">▶ 그려보기</span>
  </div>
</a>
```
필요한 경우 iframe 미리보기가 어색하면 `css/style.css` 수정 없이 기존 `.app-card__preview` 스타일을 그대로 쓴다. 이후 깃 커밋한다.
