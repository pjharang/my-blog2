const root = document.documentElement;

function apply(theme) {
  root.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('aria-label', theme === 'dark' ? '라이트모드로 전환' : '다크모드로 전환');
  }
}

export function initTheme() {
  const btn = document.getElementById('theme-toggle');
  apply(root.getAttribute('data-theme') || 'light');
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* 저장 불가 환경 무시 */ }
  });
}
