const root = document.documentElement;
const button = document.getElementById('theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');

function apply(theme) {
  root.dataset.theme = theme;
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  themeColor.content = theme === 'dark' ? '#000000' : '#f2fff8';
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
