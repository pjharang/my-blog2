---
title: 오늘 배운 것
date: 2026-10-31
tags: [일상, 개발]
summary: 클로드 코드로 블로그를 만들면서 알게 된 HTML, CSS, JavaScript의 역할을 간단히 정리했어요.
---

오늘은 클로드 코드와 함께 **프레임워크 없이** 블로그를 만들었습니다. 만들면서 HTML, CSS, JavaScript가 각각 무슨 일을 하는지 또렷하게 보여서 정리해 둡니다.

## 한눈에 보기

| 기술 | 비유 | 이 블로그에서 한 일 |
| --- | --- | --- |
| HTML | 뼈대 | 헤더, 본문 영역, 푸터의 구조 |
| CSS | 옷과 화장 | 색, 여백, 카드, 다크모드, 모바일 배치 |
| JavaScript | 두뇌와 근육 | 글 불러오기, 마크다운 변환, 화면 전환 |

## HTML: 구조를 만든다

HTML은 "무엇이 어디에 있는가"를 정합니다. 이 블로그의 `index.html`에는 헤더와 비어 있는 `<main>` 영역, 푸터만 있고, 글 내용은 나중에 JavaScript가 채워 넣습니다.

```html
<header class="site-header">...</header>
<main id="app"></main>
<footer class="site-footer">...</footer>
```

- `header`, `main`, `footer` 같은 **시맨틱 태그**를 쓰면 의미가 분명해집니다
- 버튼에 `aria-label`을 달면 화면 낭독기도 이해할 수 있습니다

## CSS: 모양을 꾸민다

CSS는 "어떻게 보이는가"를 정합니다. 오늘 가장 인상 깊었던 것은 **색을 변수로 빼 두는 방법**이었어요.

```css
:root { --bg: #f7f7fb; --text: #1a1b2e; }
[data-theme='dark'] { --bg: #0d0f1a; --text: #ecedff; }
body { background: var(--bg); color: var(--text); }
```

- 변수 값만 바꾸면 **다크모드**가 완성됩니다
- `@media (min-width: 720px)` 로 화면이 넓어질 때만 2열 배치로 바꿉니다
- 작은 화면부터 만들고 큰 화면으로 확장하는 **모바일 우선** 방식을 썼습니다

## JavaScript: 동작을 만든다

JavaScript는 "무엇이 일어나는가"를 정합니다. 이 블로그의 핵심 동작은 대부분 여기에 있습니다.

1. `fetch()` 로 `.md` 파일을 읽어 온다
2. 마크다운을 HTML로 바꾼다 (직접 만든 변환기)
3. 주소의 `#/post/글이름` 을 보고 어떤 화면을 보여줄지 정한다
4. 다크모드 선택을 `localStorage` 에 저장한다

```js
const res = await fetch('posts/welcome.md');
const html = renderMarkdown(await res.text());
app.innerHTML = html;
```

> 글 내용을 화면에 넣을 때는 먼저 HTML 특수문자를 이스케이프해야 안전하다는 것도 배웠습니다.

## 세 가지의 관계

세 기술은 서로 맡은 일이 달라서 함께 쓸 때 힘이 납니다.

- HTML이 **무엇**을 보여줄지
- CSS가 **어떻게** 보여줄지
- JavaScript가 **언제, 어떤 내용으로** 보여줄지

## 오늘의 한 줄 정리

- [x] 역할을 나눠서 생각하니 코드를 어디에 써야 할지 쉬워졌다
- [x] 로컬 서버가 필요한 이유(`fetch` 는 `file://` 에서 안 된다)를 알았다
- [ ] 다음에는 코드 하이라이팅을 직접 만들어 보고 싶다
