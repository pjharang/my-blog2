---
title: 해시 라우팅으로 페이지 이동 만들기
date: 2026-11-05
tags: [개발, JavaScript]
summary: 서버 없이도 페이지가 바뀌는 것처럼 보이는 해시 라우팅의 원리를 짧은 코드로 정리했어요.
---

## 해시 라우팅이란

주소의 `#` 뒤 부분이 바뀌어도 브라우저는 페이지를 새로 요청하지 않습니다. 이 점을 이용하면 정적 호스팅에서도 여러 화면을 만들 수 있어요.

```js
window.addEventListener('hashchange', () => {
  const path = location.hash.slice(1) || '/';
  console.log('현재 경로:', path);
});
```

## 이 블로그의 주소

| 주소 | 화면 |
| --- | --- |
| `#/` | 글 목록 |
| `#/post/<slug>` | 글 상세 |
| `#/tag/<태그>` | 태그별 목록 |
