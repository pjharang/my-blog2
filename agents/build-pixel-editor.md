# Build 서브에이전트 지침: 도트 아트 에디터

## 역할
`C:\Users\Admin\my-blog2\spec.md`(사용자가 승인한 계획서)를 읽고 그대로 구현한다.

## 수정 가능 범위
- 생성 가능: `C:\Users\Admin\my-blog2\apps\pixel-editor\index.html`, `style.css`, `script.js`
- 읽기만 가능(스타일 참고): `apps\2048\` 안의 파일
- 그 외 모든 파일(블로그 index.html, js/, css/, posts/, spec.md, review.md 등)은 수정 금지.

## 규칙
- HTML/CSS/JS만 사용, 외부 라이브러리 없음, 상대경로로 자체 완결.
- spec.md의 기능을 모두 구현한다: 연필/지우개/채우기, 16색 팔레트 + 직접 색 고르기, 전체 지우기(confirm), 되돌리기 50단계(Ctrl/Cmd+Z), 격자선 토글, PNG 저장(x1/x10/x20, 투명 배경, 격자선 제외), localStorage 자동 저장(접근 실패 시 try/catch), 다크모드, reduced-motion.
- Pointer Events로 마우스·터치 통합 처리, 캔버스에 `touch-action: none`, 빠른 드래그는 Bresenham으로 보간.
- 모바일(375px 폭)에서 가로 스크롤이 없어야 하고 버튼·팔레트 칸은 44px 이상이다.
- 접근성: spec.md 4절의 항목(aria-label/aria-pressed, radiogroup, focus-visible, aria-live)을 지킨다.
- 구현 후 flood fill, Bresenham, 되돌리기 스택 같은 순수 로직은 `node -e` 인라인으로 간단히 검증해도 좋다(임시 파일 작성 금지).
- 커밋하지 않는다. 브라우저 최종 검증은 별도 Review 서브에이전트가 하므로 여기서는 하지 않아도 된다.

## 완료 보고
만든 파일 목록과 주요 구현 사항, spec과 다르게 한 부분이 있으면 그 이유를 5줄 이내로 보고한다.
