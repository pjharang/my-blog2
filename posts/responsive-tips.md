---
title: 모바일에서 잘 보이는 레이아웃 팁
date: 2026-10-20
tags: [CSS, 모바일]
summary: 모바일 우선 설계, 터치 영역, 가로 스크롤 방지까지 반응형 웹의 기본기를 정리했습니다.
---

모바일에서 잘 보이는 페이지는 **작은 화면부터** 설계하는 데서 시작합니다.

## 기본 원칙

1. `<meta name="viewport" content="width=device-width, initial-scale=1">` 를 꼭 넣는다
2. 기본 스타일은 모바일, 큰 화면은 `min-width` 미디어 쿼리로 확장한다
3. 터치 대상은 최소 **44px**

## 예시

```css
.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
```

## 자주 하는 실수

| 문제 | 해결 |
| --- | --- |
| 가로 스크롤 발생 | `max-width: 100%`, 긴 코드는 요소 안에서만 스크롤 |
| 글씨가 너무 작음 | 본문 16px 이상 |
| 버튼이 눌리기 어려움 | 높이 44px 이상 확보 |

- 기준 너비: 360px, 768px, 1200px
  - 실제 기기 또는 개발자 도구에서 확인
