---
title: fetch로 파일 읽어 오기, 이것만 알면 돼요
date: 2026-10-26
tags: [개발, JavaScript]
summary: 블로그가 마크다운 파일을 불러오는 핵심 도구, fetch의 기본 사용법을 짧게 정리했어요.
---

이 블로그는 `fetch()` 한 줄로 글 파일을 읽어 옵니다. 처음 배우는 분도 이해할 수 있게 기본만 정리해 볼게요.

## fetch가 하는 일

`fetch()`는 **주소에서 데이터를 가져오는** 함수입니다. 결과를 바로 주는 대신 약속(Promise)을 돌려주기 때문에 `await` 로 기다립니다.

```js
const res = await fetch('posts/welcome.md');
const text = await res.text();
console.log(text);
```

## 꼭 확인할 것

1. `res.ok` 로 성공 여부를 확인한다
2. 내용 종류에 맞게 `res.text()` 또는 `res.json()` 을 쓴다
3. 실패했을 때 보여줄 화면을 준비한다

```js
async function load(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`불러오기 실패: ${res.status}`);
  return res.text();
}
```

## 자주 만나는 문제

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| 파일을 못 읽는다 | `file://` 로 직접 열었다 | 로컬 서버로 실행한다 |
| 404 오류 | 경로나 파일 이름이 다르다 | 대소문자까지 확인한다 |
| 예전 내용이 보인다 | 브라우저 캐시 | 강력 새로고침(Ctrl+Shift+R) |

> 막히면 개발자 도구의 **Network** 탭에서 요청이 어떻게 갔는지부터 보세요.

## 정리

- [x] `fetch` 는 주소에서 데이터를 가져온다
- [x] `await` 와 `res.ok` 확인이 기본이다
- [ ] 다음에는 `try/catch` 로 오류 화면을 꾸며 보기
