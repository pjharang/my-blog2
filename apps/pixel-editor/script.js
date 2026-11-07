(function () {
  'use strict';

  var N = 16;
  var CELL = 20;
  var MAX_UNDO = 50;
  var STORAGE_KEY = 'pixel-editor:v1';
  var PALETTE = [
    ['#000000', '검정'], ['#ffffff', '흰색'], ['#7f7f7f', '진회색'], ['#c3c3c3', '연회색'],
    ['#880015', '짙은 빨강'], ['#ed1c24', '빨강'], ['#ff7f27', '주황'], ['#fff200', '노랑'],
    ['#22b14c', '초록'], ['#00a2e8', '하늘'], ['#3f48cc', '파랑'], ['#a349a4', '보라'],
    ['#b97a57', '갈색'], ['#ffaec9', '분홍'], ['#ffc90e', '금색'], ['#99d9ea', '연하늘']
  ];

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var paletteEl = document.getElementById('palette');
  var undoBtn = document.getElementById('undo');
  var clearBtn = document.getElementById('clear');
  var gridBtn = document.getElementById('grid-toggle');
  var saveBtn = document.getElementById('save');
  var scaleSel = document.getElementById('scale');
  var colorInput = document.getElementById('color-input');
  var swatch = document.getElementById('current-swatch');
  var hexEl = document.getElementById('current-hex');
  var statusEl = document.getElementById('status');
  var toolBtns = Array.prototype.slice.call(document.querySelectorAll('.tool'));

  var grid = new Array(N * N).fill(null);
  var color = '#000000';
  var tool = 'pencil';
  var showGrid = true;
  var undoStack = [];

  // ---------- 순수 로직 ----------
  function bresenham(x0, y0, x1, y1) {
    var pts = [];
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    var err = dx + dy;
    for (;;) {
      pts.push([x0, y0]);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return pts;
  }

  function floodFill(g, x, y, newColor) {
    var target = g[y * N + x];
    if (target === newColor) return false;
    var stack = [[x, y]];
    while (stack.length) {
      var p = stack.pop();
      var cx = p[0], cy = p[1];
      if (cx < 0 || cy < 0 || cx >= N || cy >= N) continue;
      var i = cy * N + cx;
      if (g[i] !== target) continue;
      g[i] = newColor;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    return true;
  }

  function sameGrid(a, b) {
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // ---------- 렌더링 ----------
  function render() {
    var x, y, v;
    for (y = 0; y < N; y++) {
      for (x = 0; x < N; x++) {
        v = grid[y * N + x];
        if (v) {
          ctx.fillStyle = v;
        } else {
          ctx.fillStyle = ((x + y) % 2 === 0) ? '#ffffff' : '#d9d9d9';
        }
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i <= N; i++) {
        var p = i * CELL + 0.5;
        if (i === N) p = i * CELL - 0.5;
        ctx.moveTo(p, 0); ctx.lineTo(p, N * CELL);
        ctx.moveTo(0, p); ctx.lineTo(N * CELL, p);
      }
      ctx.stroke();
    }
  }

  function say(msg) { statusEl.textContent = msg; }

  // ---------- 저장/불러오기 ----------
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ grid: grid, color: color, showGrid: showGrid }));
    } catch (e) { /* 무시 */ }
  }

  function isColor(s) { return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s); }

  function restore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && Array.isArray(d.grid) && d.grid.length === N * N) {
        grid = d.grid.map(function (v) { return isColor(v) ? v : null; });
      }
      if (d && isColor(d.color)) color = d.color;
      if (d && typeof d.showGrid === 'boolean') showGrid = d.showGrid;
    } catch (e) { /* 무시 */ }
  }

  // ---------- UI 상태 ----------
  function updateColorUI() {
    swatch.style.background = color;
    hexEl.textContent = color;
    colorInput.value = color;
    var chips = paletteEl.children;
    for (var i = 0; i < chips.length; i++) {
      chips[i].setAttribute('aria-checked', String(chips[i].dataset.color === color));
    }
  }

  function updateToolUI() {
    toolBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.tool === tool));
    });
  }

  function updateUndoUI() { undoBtn.disabled = undoStack.length === 0; }

  function setColor(c) {
    color = c.toLowerCase();
    if (tool === 'eraser') { tool = 'pencil'; updateToolUI(); }
    updateColorUI();
    persist();
  }

  function pushUndo(snapshot) {
    undoStack.push(snapshot);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    updateUndoUI();
  }

  function undo() {
    if (!undoStack.length) return;
    grid = undoStack.pop();
    updateUndoUI();
    render();
    persist();
  }

  // ---------- 팔레트 생성 ----------
  PALETTE.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', p[1] + ' ' + p[0]);
    b.setAttribute('aria-checked', 'false');
    b.dataset.color = p[0];
    b.style.background = p[0];
    b.addEventListener('click', function () { setColor(p[0]); });
    paletteEl.appendChild(b);
  });

  // ---------- 입력 ----------
  var drawing = false;
  var snapshot = null;
  var changed = false;
  var last = null;

  function cellFromEvent(e) {
    var r = canvas.getBoundingClientRect();
    var x = Math.floor((e.clientX - r.left) / r.width * N);
    var y = Math.floor((e.clientY - r.top) / r.height * N);
    return [Math.max(0, Math.min(N - 1, x)), Math.max(0, Math.min(N - 1, y))];
  }

  function paint(x, y) {
    var v = tool === 'eraser' ? null : color;
    var i = y * N + x;
    if (grid[i] !== v) { grid[i] = v; changed = true; }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    var c = cellFromEvent(e);
    snapshot = grid.slice();
    changed = false;
    if (tool === 'fill') {
      if (floodFill(grid, c[0], c[1], color)) changed = !sameGrid(grid, snapshot);
      finish();
      return;
    }
    drawing = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    last = c;
    paint(c[0], c[1]);
    render();
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    var c = cellFromEvent(e);
    if (last && c[0] === last[0] && c[1] === last[1]) return;
    var pts = last ? bresenham(last[0], last[1], c[0], c[1]) : [c];
    pts.forEach(function (p) { paint(p[0], p[1]); });
    last = c;
    render();
  });

  function finish() {
    drawing = false;
    last = null;
    if (snapshot && changed) {
      pushUndo(snapshot);
      persist();
    }
    snapshot = null;
    changed = false;
    render();
  }

  canvas.addEventListener('pointerup', function () { if (drawing || snapshot) finish(); });
  canvas.addEventListener('pointercancel', function () { if (drawing || snapshot) finish(); });
  canvas.addEventListener('lostpointercapture', function () { if (drawing) finish(); });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------- 버튼 ----------
  toolBtns.forEach(function (b) {
    b.addEventListener('click', function () { tool = b.dataset.tool; updateToolUI(); });
  });

  undoBtn.addEventListener('click', undo);

  clearBtn.addEventListener('click', function () {
    if (!window.confirm('캔버스를 전부 지울까요? (되돌리기로 복구할 수 있습니다)')) return;
    if (grid.every(function (v) { return v === null; })) return;
    pushUndo(grid.slice());
    grid = new Array(N * N).fill(null);
    render();
    persist();
  });

  gridBtn.addEventListener('click', function () {
    showGrid = !showGrid;
    gridBtn.setAttribute('aria-pressed', String(showGrid));
    render();
    persist();
  });

  colorInput.addEventListener('input', function () { setColor(colorInput.value); });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    }
  });

  // ---------- PNG 저장 ----------
  function pad(n) { return String(n).padStart(2, '0'); }

  saveBtn.addEventListener('click', function () {
    var scale = parseInt(scaleSel.value, 10) || 20;
    var off = document.createElement('canvas');
    off.width = N; off.height = N;
    var octx = off.getContext('2d');
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var v = grid[y * N + x];
        if (v) { octx.fillStyle = v; octx.fillRect(x, y, 1, 1); }
      }
    }
    var out = document.createElement('canvas');
    out.width = N * scale; out.height = N * scale;
    var cx = out.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.drawImage(off, 0, 0, out.width, out.height);
    out.toBlob(function (blob) {
      if (!blob) { say('저장에 실패했습니다.'); return; }
      var d = new Date();
      var name = 'pixel-art-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
        '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.png';
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      say(name + ' 저장 완료 (' + out.width + 'x' + out.height + ')');
    }, 'image/png');
  });

  // ---------- 시작 ----------
  restore();
  gridBtn.setAttribute('aria-pressed', String(showGrid));
  updateColorUI();
  updateToolUI();
  updateUndoUI();
  render();
})();
