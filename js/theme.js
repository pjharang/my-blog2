const root = document.documentElement;
const button = document.getElementById('theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');
const media = window.matchMedia('(prefers-color-scheme: dark)');

function apply(theme) {
  root.dataset.theme = theme;
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  themeColor.content = theme === 'dark' ? '#0d0f1a' : '#f7f7fb';
}

function saved() {
  try {
    return localStorage.getItem('theme');
  } catch (e) {
    return null;
  }
}

apply(root.dataset.theme);

button.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  apply(next);
  try {
    localStorage.setItem('theme', next);
  } catch (e) {
    // 저장이 막힌 환경에서는 이번 방문에만 적용된다
  }
});

// 직접 고른 적이 없을 때만 시스템 설정 변경을 따라간다
media.addEventListener('change', (e) => {
  if (!saved()) apply(e.matches ? 'dark' : 'light');
});
