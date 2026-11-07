// 마크다운 → HTML 변환기. 모든 텍스트는 먼저 이스케이프한 뒤 태그를 만든다.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c]);
}

// javascript:, data:, vbscript: 등 위험한 스킴 차단
function safeUrl(url) {
  const u = url.trim().replace(/&amp;/g, '&');
  const decoded = u.replace(/[\u0000- ]/g, '').toLowerCase();
  if (/^(javascript|data|vbscript):/.test(decoded)) return '#';
  return escapeHtml(u);
}

export function parseFrontMatter(src) {
  const m = src.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  m[1].split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(':');
    if (i < 0) return;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    meta[key] = val;
  });
  return { meta, body: src.slice(m[0].length) };
}

function inline(text) {
  const codes = [];
  let s = escapeHtml(text).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    (_, alt, url, title) => `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy"${title ? ` title="${title}"` : ''}>`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const external = /^https?:/i.test(url);
    return `<a href="${safeUrl(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}

function splitRow(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}

function renderTable(lines) {
  const head = splitRow(lines[0]);
  const aligns = splitRow(lines[1]).map((c) =>
    /^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : 'left');
  const cell = (tag, c, i) => `<${tag} style="text-align:${aligns[i] || 'left'}">${inline(c)}</${tag}>`;
  const rows = lines.slice(2).map((l) => `<tr>${splitRow(l).map((c, i) => cell('td', c, i)).join('')}</tr>`);
  return `<div class="table-wrap"><table><thead><tr>${head.map((c, i) => cell('th', c, i)).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function renderList(lines) {
  const ordered = /^\s*\d+\./.test(lines[0]);
  const tag = ordered ? 'ol' : 'ul';
  const items = lines.map((l) => `<li>${inline(l.replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''))}</li>`);
  return `<${tag}>${items.join('')}</${tag}>`;
}

const isBlockStart = (l) =>
  /^(#{1,6}\s|```|>\s?|\s*([-*+]|\d+\.)\s|(-{3,}|\*{3,}|_{3,})\s*$)/.test(l);

export function renderMarkdown(src) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = line.match(/^```\s*([\w+-]*)/);
    if (fence) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      const lang = fence[1];
      out.push(`<pre><code${lang ? ` class="language-${escapeHtml(lang)}" data-lang="${escapeHtml(lang)}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const n = h[1].length;
      out.push(`<h${n}>${inline(h[2])}</h${n}>`);
      i++; continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${renderMarkdown(buf.join('\n'))}</blockquote>`);
      continue;
    }

    if (line.includes('|') && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(lines[i + 1] || '')) {
      const buf = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) buf.push(lines[i++]);
      out.push(renderTable(buf));
      continue;
    }

    if (/^\s*([-*+]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const buf = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s/.test(lines[i]) && /^\s*\d+\./.test(lines[i]) === ordered) buf.push(lines[i++]);
      out.push(renderList(buf));
      continue;
    }

    const buf = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}
