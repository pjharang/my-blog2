# Build 서브에이전트 지침: 2048 게임

## 역할
`C:\Users\Admin\my-blog2\spec.md`(승인된 계획서)를 읽고 그대로 구현한다.

## 수정 가능 범위
- 생성 가능: `C:\Users\Admin\my-blog2\apps\2048\index.html`, `style.css`, `script.js`
- 그 외 모든 파일(블로그 index.html, js/, css/, posts/, spec.md 등)은 수정 금지.

## 규칙
- HTML/CSS/JS만 사용, 외부 라이브러리 없음, 상대경로로 자체 완결.
- 모바일(터치 스와이프, 375px 폭)에서도 동작해야 한다.
- spec.md의 기능(이동/합치기, 새 타일, 승리/게임오버 오버레이, 새 게임, 점수/최고점수 localStorage, 키보드+스와이프, 다크모드, reduced-motion)을 모두 구현한다.
- 구현 후 `node`로 slideRow 로직을 간단히 검증해도 좋다(임시 파일은 작성 금지, 인라인 `node -e`만 사용).
- 커밋하지 않는다.

## 완료 보고
만든 파일 목록과 주요 구현 사항을 짧게 보고한다.
