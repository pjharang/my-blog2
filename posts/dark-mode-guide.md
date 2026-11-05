---
title: CSS 변수로 다크모드 만들기
date: 2026-10-28
tags: [CSS, 개발]
summary: 프레임워크 없이 CSS 변수와 data 속성만으로 깜빡임 없는 다크모드를 구현하는 방법.
---

다크모드는 생각보다 간단합니다. 핵심은 **색을 변수로 빼 두는 것**입니다.

## 1. 색상을 변수로

```css
:root {
  --bg: #f7f7fb;
  --text: #1a1b2e;
}

[data-theme='dark'] {
  --bg: #0d0f1a;
  --text: #ecedff;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

## 2. 깜빡임 방지

저장된 테마를 JavaScript로 뒤늦게 적용하면 흰 화면이 잠깐 보입니다. `<head>` 안에서 CSS보다 먼저 실행되는 짧은 인라인 스크립트로 해결합니다.

```js
const saved = localStorage.getItem('theme');
const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = saved ?? (prefersDark ? 'dark' : 'light');
```

## 3. 체크리스트

- [x] 첫 방문 시 시스템 설정 따르기
- [x] 토글 선택을 `localStorage`에 저장
- [ ] 코드 블록, 표, 인용문도 대비 확인

> 두 테마 모두에서 글자 대비가 충분한지 꼭 눈으로 확인하세요.
