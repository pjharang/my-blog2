import { renderMarkdown, parseFrontMatter, escapeHtml } from './markdown.js';
import { initTheme } from './theme.js';

const main = document.getElementById('main');
let postsCache = null;

async function loadPosts() {
  if (!postsCache) {
    const res = await fetch('posts/index.json');
    if (!res.ok) throw new Error('글 목록을 불러오지 못했습니다.');
    const list = await res.json();
    postsCache = list.sort((a, b) => b.date.localeCompare(a.date));
  }
  return postsCache;
}

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
}

function tagsHtml(tags = []) {
  return tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
}

function cardHtml(p) {
  return `
    <a class="post-card" href="#/post/${encodeURIComponent(p.slug)}">
      <span class="post-card__emoji" aria-hidden="true">${escapeHtml(p.emoji || '📝')}</span>
      <time class="post-card__date" datetime="${escapeHtml(p.date)}">${formatDate(p.date)}</time>
      <h3 class="post-card__title">${escapeHtml(p.title)}</h3>
      <p class="post-card__summary">${escapeHtml(p.summary || '')}</p>
      <span class="post-card__tags">${tagsHtml(p.tags)}</span>
    </a>`;
}

async function renderList(activeTag) {
  const posts = await loadPosts();
  const tags = [...new Set(posts.flatMap((p) => p.tags || []))];
  const shown = activeTag ? posts.filter((p) => (p.tags || []).includes(activeTag)) : posts;
  document.title = 'my-blog2';
  main.innerHTML = `
    <section class="hero">
      <div class="hero__inner">
        <p class="hero__eyebrow">Markdown Blog</p>
        <h1 class="hero__title">기록하고, 나누고, 다시 읽다</h1>
        <p class="hero__lead">마크다운 한 장이 그대로 글이 되는 작고 빠른 블로그입니다.</p>
      </div>
    </section>
    <section class="container" aria-labelledby="list-title">
      <h2 id="list-title" class="section-title">${activeTag ? `#${escapeHtml(activeTag)}` : '최신 글'}</h2>
      <div class="filter" role="group" aria-label="태그 필터">
        <a class="chip${activeTag ? '' : ' chip--active'}" href="#/">전체</a>
        ${tags.map((t) => `<a class="chip${t === activeTag ? ' chip--active' : ''}" href="#/tag/${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join('')}
      </div>
      <div class="post-grid">${shown.map(cardHtml).join('') || '<p class="empty">글이 없습니다.</p>'}</div>
    </section>`;
}

async function renderPost(slug) {
  const posts = await loadPosts();
  if (!posts.some((p) => p.slug === slug)) return renderNotFound();
  const res = await fetch(`posts/${encodeURIComponent(slug)}.md`);
  if (!res.ok) return renderNotFound();
  const { meta, body } = parseFrontMatter(await res.text());
  document.title = `${meta.title || slug} · my-blog2`;
  main.innerHTML = `
    <article class="post container container--narrow">
      <a class="back-link" href="#/">← 목록으로</a>
      <header class="post__header">
        <h1 class="post__title">${escapeHtml(meta.title || slug)}</h1>
        <p class="post__meta"><time datetime="${escapeHtml(meta.date || '')}">${meta.date ? formatDate(meta.date) : ''}</time>
        <span class="post__tags">${tagsHtml(Array.isArray(meta.tags) ? meta.tags : [])}</span></p>
      </header>
      <div class="prose">${renderMarkdown(body)}</div>
    </article>`;
}

function renderNotFound() {
  document.title = '페이지를 찾을 수 없습니다 · my-blog2';
  main.innerHTML = `
    <div class="container container--narrow not-found">
      <h1>404</h1>
      <p>찾으시는 페이지가 없습니다.</p>
      <a class="back-link" href="#/">← 목록으로</a>
    </div>`;
}

async function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('/').filter(Boolean).map(decodeURIComponent);
  try {
    if (parts.length === 0) await renderList();
    else if (parts[0] === 'post' && parts[1]) await renderPost(parts[1]);
    else if (parts[0] === 'tag' && parts[1]) await renderList(parts[1]);
    else renderNotFound();
  } catch (err) {
    main.innerHTML = `<div class="container"><p class="empty">${escapeHtml(err.message)}</p></div>`;
  }
  window.scrollTo(0, 0);
}

initTheme();
window.addEventListener('hashchange', route);
route();
