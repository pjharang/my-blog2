# Build 서브에이전트 지침: 기존 웹앱을 새 웹앱 규칙에 맞추기

## 배경
`CLAUDE.md`의 "웹앱 규칙"에 두 규칙이 추가됐다. 기존 웹앱 2개(`apps/2048/`, `apps/pixel-editor/`)를 이 규칙에 맞게 고친다.
1. 모든 웹앱은 블로그의 색상 팔레트를 따른다. 색은 `css/style.css`의 CSS 변수를 참조하고, 앱 안에서 색 값을 새로 정하지 않는다. (다크모드도 변수를 따라간다.)
2. 웹앱에는 사용법 안내 문구를 반드시 포함한다. 화면 안에서 바로 보이게 넣는다.

## 수정 가능 범위
- 수정 가능: `C:\Users\Admin\my-blog2\apps\2048\{index.html, style.css, script.js}`, `C:\Users\Admin\my-blog2\apps\pixel-editor\{index.html, style.css, script.js}`
- 읽기만 가능: `C:\Users\Admin\my-blog2\css\style.css`, `CLAUDE.md`, `js\theme.js`, 블로그 `index.html`
- 그 외 모든 파일(블로그 css/js/index.html, posts/, spec.md, review.md 등) 수정 금지. 커밋 금지.
- 기능과 동작은 바꾸지 않는다. 게임 규칙, 그리기 도구, PNG 저장 등은 그대로 둔다.

## 작업 1: 블로그 CSS 변수 참조
- 각 앱의 `index.html` `<head>`에서 앱 자신의 `style.css` **앞에** `<link rel="stylesheet" href="../../css/style.css">`를 추가해 블로그 변수를 불러온다. (경로는 상대경로 유지: GitHub Pages에서 `/my-blog2/` 아래에서도 동작해야 한다.)
- 블로그 `style.css`는 `body { display: flex; ... }`, `.container`, `.grid`, `.btn`, `.chip`, `.tag`, `.field`, `.back`, `.hint` 등 전역/공용 규칙을 갖고 있다. 불러온 뒤 앱의 레이아웃이나 클래스가 깨지지 않는지 확인하고, 충돌하면 앱 `style.css`에서 해당 요소를 명시적으로 덮어쓴다(앱 CSS가 뒤에 로드된다). 블로그 CSS 파일은 수정하지 않는다.
- 앱 `style.css`의 `:root` 안 자체 색 정의와 `@media (prefers-color-scheme: dark)` 블록을 없애고, UI 색은 블로그 변수로 바꾼다. 쓸 수 있는 변수: `--bg`, `--surface`, `--surface-2`, `--text`, `--text-muted`, `--border`, `--accent`, `--accent-2`, `--accent-soft`, `--shadow`, `--radius`, `--radius-sm`, `--font`, `--mono`.
  - 앱 고유의 비색상 변수(`--size`, `--gap`, `--canvas-size` 등)는 그대로 둔다.
  - 보드·패널·버튼·텍스트·테두리·오버레이 같은 UI 색은 변수로 바꾼다. 반투명이 필요하면 `color-mix(in srgb, var(--bg) 80%, transparent)` 같은 식으로 변수에서 만든다.
- **예외(데이터 색)**: 2048의 숫자별 타일 색, 도트 에디터의 16색 팔레트 색, 투명 칸 체크무늬 표시처럼 앱의 내용 자체인 색은 그대로 둬도 된다. 이런 예외에는 CSS/JS 주석으로 한 줄 이유를 적는다.
- 도트 에디터의 `script.js`가 캔버스에 칠하는 UI 색(격자선, 선택 표시 등)은 `getComputedStyle(document.documentElement).getPropertyValue('--border')`처럼 변수에서 읽도록 바꾼다. 테마가 바뀌면 다시 읽어 다시 그린다.

## 작업 2: 다크모드를 블로그 방식에 맞추기
블로그는 `<html data-theme="light|dark">`로 테마를 정하고 `localStorage`의 `theme` 키에 저장한다(없으면 `prefers-color-scheme`). 앱은 같은 출처에서 열리므로 이 값을 읽을 수 있다.
- 각 앱 `index.html` `<head>` 맨 앞(CSS보다 먼저)에 블로그 `index.html`의 인라인 테마 스크립트와 같은 동작의 스크립트를 넣어 `document.documentElement.dataset.theme`을 정한다. (`try/catch`로 localStorage 접근 실패를 처리한다.)
- 블로그 안 iframe 미리보기에서 사용자가 테마를 바꾸면 앱도 맞아야 하므로, 앱에서 `window.addEventListener('storage', ...)`로 `theme` 키 변경 시 `data-theme`을 갱신한다.

## 작업 3: 사용법 안내 문구
- `apps/2048/`: 이미 `.hint`에 조작 안내가 있다. 새 변수 스타일에서도 잘 보이는지만 확인한다.
- `apps/pixel-editor/`: 화면 안에 보이는 안내 문구를 추가한다. 내용: 칸을 클릭하거나 드래그해서 점을 찍는다, 색은 팔레트에서 고른다, 도구(연필·지우개·채우기) 설명, `Ctrl+Z`(맥은 `Cmd+Z`)로 되돌리기, 완성하면 배율을 고르고 "PNG 저장". 길면 `<details open>`으로 접을 수 있게 하되 기본은 펼친 상태로 둔다. 모바일에서는 손가락으로 드래그해 그린다는 점도 한 줄 넣는다.

## 규칙
- HTML/CSS/JS만 사용, 외부 라이브러리 추가 금지.
- 모바일 375px에서 가로 스크롤이 없어야 하고 터치 대상 44px 이상을 유지한다.
- 구현 후 `node --check`로 수정한 JS 문법을 확인한다. 브라우저 최종 검증은 별도 Review 서브에이전트가 한다.

## 완료 보고
수정한 파일 목록, 변수로 바꾼 색과 예외로 남긴 색(이유 포함), 충돌을 덮어쓴 부분, 추가한 안내 문구를 8줄 이내로 보고한다.
