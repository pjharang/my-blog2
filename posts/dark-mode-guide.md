---
title: CSS 변수로 다크모드 만들기
date: 2026-11-06
tags: [CSS, 개발]
summary: 프레임워크 없이 CSS 변수와 data 속성만으로 깜빡임 없는 다크모드를 구현하는 방법.
---

## 핵심 아이디어

색상을 전부 **CSS 변수**로 정의하고, `data-theme` 속성에 따라 값만 바꿉니다.

```css
:root { --bg: #fff; --text: #111; }
[data-theme="dark"] { --bg: #111; --text: #eee; }
body { background: var(--bg); color: var(--text); }
```

## 깜빡임 방지

CSS가 로드되기 전에 `<head>`의 인라인 스크립트로 테마를 먼저 지정합니다.

1. `localStorage`에 저장된 값을 확인한다
2. 없으면 `prefers-color-scheme`을 따른다
3. 결과를 `<html>`의 `data-theme`에 적용한다

> 토글 버튼에는 `aria-label`을 꼭 달아 주세요.
