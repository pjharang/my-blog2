export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// javascript:, data: 등 실행 가능한 스킴은 차단한다
function safeUrl(url) {
  const compact = url.replace(/[\s\u0000-\u001f]/g, '');
  return /^(javascript|vbscript|data):/i.test(compact) ? '#' : url;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

// 코드·이미지·링크 태그는 자리표시자로 빼 두었다가 마지막에 복원한다
// (그렇지 않으면 URL 안의 _ 나 * 가 강조 문법으로 오인된다)
function inline(text) {
  const stash = [];
  const hold = (html) => `\u0000${stash.push(html) - 1}\u0000`;

  text = text.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${esc(code)}</code>`));
  text = esc(text);

  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) =>
    hold(`<img src="${safeUrl(src)}" alt="${alt}" loading="lazy">`));
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const external = /^https?:/i.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `${hold(`<a href="${safeUrl(href)}"${attrs}>`)}${label}</a>`;
  });

  text = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(^|[^\p{L}\p{N}])_(.+?)_(?![\p{L}\p{N}])/gu, '$1<em>$2</em>');

  return text.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[i]);
}

const LIST_RE = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function isBlockStart(line, next) {
  return (
    /^```/.test(line) ||
    /^#{1,6}\s/.test(line) ||
    /^>/.test(line) ||
    /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    LIST_RE.test(line) ||
    (line.includes('|') && next !== undefined && TABLE_SEP_RE.test(next))
  );
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function parseList(lines, i) {
  const first = lines[i].match(LIST_RE);
  const base = first[1].length;
  const tag = /\d/.test(first[2]) ? 'ol' : 'ul';
  const items = [];

  while (i < lines.length) {
    const m = lines[i].match(LIST_RE);
    if (!m || m[1].length < base) break;
    if (m[1].length > base) {
      const [sub, next] = parseList(lines, i);
      items[items.length - 1].children += sub;
      i = next;
      continue;
    }
    items.push({ text: m[3], children: '' });
    i++;
  }

  const body = items.map(({ text, children }) => {
    const task = text.match(/^\[( |x|X)\]\s+(.*)$/);
    if (task) {
      const checked = task[1] !== ' ' ? ' checked' : '';
      return `<li class="task"><input type="checkbox" disabled${checked}> ${inline(task[2])}${children}</li>`;
    }
    return `<li>${inline(text)}${children}</li>`;
  });
  return [`<${tag}>${body.join('')}</${tag}>`, i];
}

function parseBlocks(lines) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    const fence = line.match(/^```\s*([\w+-]*)/);
    if (fence) {
      const code = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++;
      const lang = fence[1];
      const label = lang ? ` data-lang="${esc(lang)}"` : '';
      out.push(`<pre${label}><code>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const html = inline(heading[2]);
      out.push(`<h${level} id="${slugify(html)}">${html}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    if (/^>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${parseBlocks(quote)}</blockquote>`);
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])) {
      const head = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((c) =>
        c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : '');
      const cell = (tag, c, n) => {
        const style = aligns[n] ? ` style="text-align:${aligns[n]}"` : '';
        return `<${tag}${style}>${inline(c)}</${tag}>`;
      };
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]));
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c, n) => cell('th', c, n)).join('')}</tr></thead>` +
        `<tbody>${rows.map((r) => `<tr>${r.map((c, n) => cell('td', c, n)).join('')}</tr>`).join('')}</tbody></table></div>`
      );
      continue;
    }

    if (LIST_RE.test(line)) {
      const [html, next] = parseList(lines, i);
      out.push(html);
      i = next;
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i], lines[i + 1])) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join('\n')).replace(/\n/g, '<br>')}</p>`);
  }

  return out.join('\n');
}

export function renderMarkdown(source) {
  return parseBlocks(source.replace(/\r\n?/g, '\n').split('\n'));
}

// 글 상단의 --- 블록(front matter)을 분리한다
export function parseFrontMatter(source) {
  const text = source.replace(/\r\n?/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };

  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const value = kv[2].trim();
    meta[kv[1]] = value.startsWith('[')
      ? value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
      : value.replace(/^["']|["']$/g, '');
  }
  return { meta, body: text.slice(m[0].length) };
}
