import { renderMarkdown, parseFrontMatter, esc } from './markdown.js';

const app = document.getElementById('app');
const progress = document.getElementById('progress');
const SLUG_RE = /^[a-z0-9-]+$/;

let posts = [];
const filter = { query: '', tag: '' };

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

// 글마다 고유한 그라데이션을 만들어 썸네일 대신 쓴다
function gradientFor(slug) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 85% 62%), hsl(${(h + 55) % 360} 85% 58%))`;
}

function readingTime(text) {
  return Math.max(1, Math.round(text.replace(/\s+/g, '').length / 500));
}

function tagList(tags) {
  return tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
}

function cardHtml(p) {
  return `
    <a class="post-card" href="#/post/${p.slug}">
      <div class="post-card__cover" style="background:${gradientFor(p.slug)}" aria-hidden="true">${esc(p.emoji || '📝')}</div>
      <div class="post-card__body">
        <div class="post-card__tags">${tagList(p.tags || [])}</div>
        <h2 class="post-card__title">${esc(p.title)}</h2>
        <p class="post-card__summary">${esc(p.summary || '')}</p>
        <time class="post-card__date" datetime="${esc(p.date)}">${formatDate(p.date)}</time>
      </div>
    </a>`;
}

function visiblePosts() {
  const q = filter.query.trim().toLowerCase();
  return posts.filter((p) =>
    (!filter.tag || (p.tags || []).includes(filter.tag)) &&
    (!q || `${p.title} ${p.summary} ${(p.tags || []).join(' ')}`.toLowerCase().includes(q)));
}

function renderGrid() {
  const grid = document.getElementById('grid');
  const list = visiblePosts();
  grid.innerHTML = list.length
    ? list.map(cardHtml).join('')
    : '<p class="empty">조건에 맞는 글이 없어요.</p>';
}

function renderChips() {
  const tags = [...new Set(posts.flatMap((p) => p.tags || []))];
  const chip = (label, value) =>
    `<button type="button" class="chip" data-tag="${esc(value)}" aria-pressed="${filter.tag === value}">${esc(label)}</button>`;
  document.getElementById('chips').innerHTML = chip('전체', '') + tags.map((t) => chip(t, t)).join('');
}

function showList() {
  document.title = 'My Blog';
  app.innerHTML = `
    <section class="hero">
      <p class="hero__eyebrow">Markdown · Blog</p>
      <h1 class="hero__title">생각을 <span class="gradient-text">기록</span>하는 공간</h1>
      <p class="hero__lead">마크다운으로 쓴 글이 그대로 웹페이지가 됩니다.</p>
    </section>
    <section class="apps" id="apps" aria-label="미니 웹앱">
      <h2 class="apps__title">🎮 미니 웹앱</h2>
      <div class="grid">
        <a class="post-card app-card" href="apps/2048/index.html">
          <div class="app-card__preview" aria-hidden="true">
            <iframe src="apps/2048/index.html" title="2048 미리보기" loading="lazy" tabindex="-1"></iframe>
          </div>
          <div class="post-card__body">
            <h3 class="post-card__title">2048</h3>
            <p class="post-card__summary">방향키와 스와이프로 타일을 합쳐 2048을 만드는 퍼즐 게임. 점수판과 최고 점수 기록 포함.</p>
            <span class="post-card__date">▶ 플레이하기</span>
          </div>
        </a>
      </div>
    </section>
    <h2 class="apps__title">📝 글</h2>
    <section class="toolbar" aria-label="글 찾기">
      <input class="search" id="search" type="search" placeholder="글 검색" aria-label="글 검색" value="${esc(filter.query)}">
      <div class="chips" id="chips"></div>
    </section>
    <section class="grid" id="grid" aria-live="polite"></section>`;

  renderChips();
  renderGrid();

  document.getElementById('search').addEventListener('input', (e) => {
    filter.query = e.target.value;
    renderGrid();
  });
  document.getElementById('chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    filter.tag = btn.dataset.tag;
    renderChips();
    renderGrid();
  });
}

// 헤더 메뉴에서 들어오면 해당 태그만 걸러서 목록을 보여준다
function showTag(tag) {
  filter.tag = tag;
  filter.query = '';
  showList();
  document.querySelector('.toolbar').scrollIntoView();
}

function markActiveNav() {
  const current = decodeURIComponent(location.hash);
  document.querySelectorAll('.site-nav__link').forEach((a) => {
    if (decodeURIComponent(a.getAttribute('href')) === current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function addCopyButtons() {
  app.querySelectorAll('pre').forEach((pre) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = '복사';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.querySelector('code').textContent);
        btn.textContent = '복사됨';
      } catch (e) {
        btn.textContent = '실패';
      }
      setTimeout(() => { btn.textContent = '복사'; }, 1500);
    });
    pre.appendChild(btn);
  });
}

async function showPost(slug) {
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1 || !SLUG_RE.test(slug)) return showNotFound();

  const res = await fetch(`posts/${slug}.md`);
  if (!res.ok) return showNotFound();
  const { meta, body } = parseFrontMatter(await res.text());
  const info = { ...posts[index], ...meta };
  const tags = Array.isArray(info.tags) ? info.tags : posts[index].tags || [];

  const newer = posts[index - 1];
  const older = posts[index + 1];
  const nav = (p, label) => p
    ? `<a class="pager__link" href="#/post/${p.slug}"><span>${label}</span><strong>${esc(p.title)}</strong></a>`
    : '<span></span>';

  document.title = `${info.title} · My Blog`;
  app.innerHTML = `
    <article class="post">
      <a class="back" href="#/">← 목록으로</a>
      <header class="post__header">
        <div class="post-card__tags">${tagList(tags)}</div>
        <h1 class="post__title">${esc(info.title)}</h1>
        <p class="post__meta">
          <time datetime="${esc(info.date)}">${formatDate(info.date)}</time> · 읽는 데 약 ${readingTime(body)}분
        </p>
      </header>
      <div class="prose">${renderMarkdown(body)}</div>
      <nav class="pager" aria-label="이전/다음 글">${nav(newer, '다음 글')}${nav(older, '이전 글')}</nav>
    </article>`;
  addCopyButtons();
}

const DRAFT_KEY = 'draft';
const WRITE_FIELDS = ['title', 'date', 'emoji', 'tags', 'slug', 'summary', 'body'];

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveDraft(draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    // 저장이 막힌 환경에서는 임시 저장 없이 동작한다
  }
}

function defaultDraft() {
  const date = today();
  return { title: '', date, emoji: '✏️', tags: '일상', slug: `daily-${date}`, summary: '', body: '' };
}

function showWrite() {
  document.title = '글쓰기 · My Blog';
  app.innerHTML = `
    <section class="write">
      <a class="back" href="#/">← 목록으로</a>
      <h1 class="write__title">일상 글쓰기</h1>
      <p class="write__lead">글을 쓰면 오른쪽(모바일은 아래)에 바로 미리보기가 보여요. 다 쓰면 파일을 내려받아 <code>posts/</code> 폴더에 넣어 주세요.</p>

      <div class="write__layout">
        <form class="write__form" id="write-form" autocomplete="off">
          <label class="field">제목<input id="w-title" type="text" required placeholder="오늘의 한 줄"></label>
          <div class="field-row">
            <label class="field">날짜<input id="w-date" type="date" required></label>
            <label class="field field--emoji">이모지<input id="w-emoji" type="text" maxlength="4"></label>
          </div>
          <label class="field">태그 (쉼표로 구분)<input id="w-tags" type="text" placeholder="일상, 기록"></label>
          <label class="field">파일 이름 (slug)<input id="w-slug" type="text" placeholder="daily-2026-10-31" spellcheck="false">
            <small id="w-slug-hint">영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.</small></label>
          <label class="field">한 줄 요약<input id="w-summary" type="text" placeholder="목록 카드에 보여요"></label>
          <label class="field">본문 (마크다운)<textarea id="w-body" rows="14" required placeholder="## 오늘은&#10;&#10;하고 싶은 이야기를 적어 보세요."></textarea></label>
        </form>

        <div class="write__preview">
          <h2 class="write__preview-title">미리보기</h2>
          <div class="prose" id="preview"></div>
        </div>
      </div>

      <div class="write__actions">
        <button type="button" class="btn btn--primary" id="btn-download">.md 파일 내려받기</button>
        <button type="button" class="btn" id="btn-copy">index.json 항목 복사</button>
        <button type="button" class="btn btn--ghost" id="btn-reset">새로 쓰기</button>
      </div>
      <p class="write__status" id="write-status" role="status"></p>

      <details class="write__help">
        <summary>발행하는 방법</summary>
        <ol>
          <li>내려받은 <code>.md</code> 파일을 <code>posts/</code> 폴더에 넣는다</li>
          <li>복사한 항목을 <code>posts/index.json</code> 배열에 붙여 넣는다</li>
          <li>페이지를 새로고침하면 목록에 나타난다</li>
        </ol>
        <pre id="snippet"></pre>
      </details>
    </section>`;

  const el = (k) => document.getElementById(`w-${k}`);
  const status = document.getElementById('write-status');
  const draft = { ...defaultDraft(), ...loadDraft() };
  WRITE_FIELDS.forEach((k) => { el(k).value = draft[k]; });

  const read = () => Object.fromEntries(WRITE_FIELDS.map((k) => [k, el(k).value.trim()]));

  const problem = (v) => {
    if (!v.title) return '제목을 입력해 주세요.';
    if (!v.date) return '날짜를 선택해 주세요.';
    if (!SLUG_RE.test(v.slug)) return '파일 이름은 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.';
    if (posts.some((p) => p.slug === v.slug)) return '이미 같은 파일 이름의 글이 있어요.';
    if (!v.body) return '본문을 입력해 주세요.';
    return '';
  };

  const entryOf = (v) => ({
    slug: v.slug,
    title: v.title,
    date: v.date,
    tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean),
    summary: v.summary,
    emoji: v.emoji || '📝'
  });

  const markdownOf = (v) => {
    const e = entryOf(v);
    return `---\ntitle: ${e.title}\ndate: ${e.date}\ntags: [${e.tags.join(', ')}]\nsummary: ${e.summary}\n---\n\n${v.body}\n`;
  };

  const update = () => {
    const v = read();
    saveDraft(Object.fromEntries(WRITE_FIELDS.map((k) => [k, el(k).value])));
    document.getElementById('preview').innerHTML = v.body
      ? renderMarkdown(v.body)
      : '<p class="write__placeholder">본문을 쓰면 여기에 보여요.</p>';
    document.getElementById('snippet').textContent = JSON.stringify(entryOf(v), null, 2);
    status.textContent = '';
  };

  document.getElementById('write-form').addEventListener('input', update);

  document.getElementById('btn-download').addEventListener('click', () => {
    const v = read();
    const msg = problem(v);
    if (msg) { status.textContent = msg; return; }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([markdownOf(v)], { type: 'text/markdown;charset=utf-8' }));
    link.download = `${v.slug}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
    status.textContent = `${v.slug}.md 를 내려받았어요. posts/ 폴더에 넣어 주세요.`;
  });

  document.getElementById('btn-copy').addEventListener('click', async () => {
    const v = read();
    const msg = problem(v);
    if (msg) { status.textContent = msg; return; }
    try {
      await navigator.clipboard.writeText(JSON.stringify(entryOf(v), null, 2));
      status.textContent = 'index.json 항목을 복사했어요.';
    } catch (e) {
      status.textContent = '복사하지 못했어요. 아래 "발행하는 방법"에서 직접 복사해 주세요.';
    }
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('쓰던 내용을 지우고 새로 시작할까요?')) return;
    const fresh = defaultDraft();
    WRITE_FIELDS.forEach((k) => { el(k).value = fresh[k]; });
    update();
  });

  update();
}

function showNotFound() {
  document.title = '찾을 수 없음 · My Blog';
  app.innerHTML = `
    <section class="hero">
      <h1 class="hero__title">404</h1>
      <p class="hero__lead">찾으시는 글이 없어요.</p>
      <a class="back" href="#/">← 목록으로</a>
    </section>`;
}

function showError(err) {
  console.error(err);
  app.innerHTML = `
    <section class="hero">
      <h1 class="hero__title">불러오지 못했어요</h1>
      <p class="hero__lead">파일을 직접 열지 말고 로컬 서버로 실행해 주세요.<br><code>python -m http.server 8000</code></p>
    </section>`;
}

async function route() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  try {
    if (name === 'post' && arg) await showPost(decodeURIComponent(arg));
    else if (name === 'write') showWrite();
    else if (name === 'tag' && arg) showTag(decodeURIComponent(arg));
    else showList();
  } catch (err) {
    showError(err);
  }
  document.body.classList.toggle('is-post', name === 'post');
  updateProgress();
  if (name !== 'tag') window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
  markActiveNav();
}

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = document.body.classList.contains('is-post') && max > 0 ? window.scrollY / max : 0;
  progress.style.transform = `scaleX(${Math.min(1, ratio)})`;
}

async function init() {
  try {
    const res = await fetch('posts/index.json');
    if (!res.ok) throw new Error(`index.json ${res.status}`);
    posts = (await res.json()).sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    showError(err);
    return;
  }
  window.addEventListener('hashchange', route);
  // 로고를 누르면 검색·태그 필터를 초기화한 전체 목록으로 돌아간다
  document.querySelector('.brand').addEventListener('click', () => {
    filter.tag = '';
    filter.query = '';
    if (location.hash === '' || location.hash === '#/') route();
  });
  window.addEventListener('scroll', updateProgress, { passive: true });
  route();
}

init();
