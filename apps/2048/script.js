(function () {
  'use strict';
  var N = 4;
  var KEY = 'app2048.best';

  var state = { board: [], score: 0, best: 0, won: false, keepPlaying: false, over: false };

  function emptyBoard() {
    var b = [];
    for (var i = 0; i < N; i++) b.push([0, 0, 0, 0]);
    return b;
  }

  // 한 줄을 왼쪽으로 밀고 병합
  function slideRow(row) {
    var vals = row.filter(function (v) { return v !== 0; });
    var out = [];
    var gained = 0;
    var mergedIdx = [];
    for (var i = 0; i < vals.length; i++) {
      if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
        var s = vals[i] * 2;
        out.push(s);
        gained += s;
        mergedIdx.push(out.length - 1);
        i++;
      } else {
        out.push(vals[i]);
      }
    }
    while (out.length < N) out.push(0);
    var moved = out.some(function (v, k) { return v !== row[k]; });
    return { row: out, gained: gained, moved: moved, merged: mergedIdx };
  }

  function transpose(b) {
    var t = emptyBoard();
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) t[c][r] = b[r][c];
    return t;
  }

  // dir: 'left' | 'right' | 'up' | 'down'
  function move(board, dir) {
    var b = (dir === 'up' || dir === 'down') ? transpose(board) : board.map(function (r) { return r.slice(); });
    var rev = (dir === 'right' || dir === 'down');
    var gained = 0, moved = false;
    var mergedMap = emptyBoard();
    var result = b.map(function (row, r) {
      var input = rev ? row.slice().reverse() : row;
      var res = slideRow(input);
      var line = rev ? res.row.slice().reverse() : res.row;
      res.merged.forEach(function (i) { mergedMap[r][rev ? N - 1 - i : i] = 1; });
      gained += res.gained;
      if (res.moved) moved = true;
      return line;
    });
    if (dir === 'up' || dir === 'down') {
      result = transpose(result);
      mergedMap = transpose(mergedMap);
    }
    return { board: result, gained: gained, moved: moved, mergedMap: mergedMap };
  }

  function canMove(b) {
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        if (b[r][c] === 0) return true;
        if (c + 1 < N && b[r][c] === b[r][c + 1]) return true;
        if (r + 1 < N && b[r][c] === b[r + 1][c]) return true;
      }
    }
    return false;
  }

  function addRandomTile(b) {
    var empties = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (b[r][c] === 0) empties.push([r, c]);
    if (!empties.length) return null;
    var p = empties[Math.floor(Math.random() * empties.length)];
    b[p[0]][p[1]] = Math.random() < 0.9 ? 2 : 4;
    return p;
  }

  function loadBest() {
    try { return parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { return 0; }
  }
  function saveBest(v) {
    try { localStorage.setItem(KEY, String(v)); } catch (e) { /* ignore */ }
  }

  // ---- DOM ----
  var $tiles, $score, $best, $overlay, $msg, $keep;

  function render(newPos, mergedMap) {
    $tiles.innerHTML = '';
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var v = state.board[r][c];
        if (!v) continue;
        var el = document.createElement('div');
        el.className = 'tile';
        if (v >= 1000 && v < 10000) el.className += ' small';
        else if (v >= 10000) el.className += ' smaller';
        el.setAttribute('data-value', String(v));
        el.textContent = v;
        el.style.left = 'calc(' + c + ' * ((100% - 3 * var(--gap)) / 4 + var(--gap)))';
        el.style.top = 'calc(' + r + ' * ((100% - 3 * var(--gap)) / 4 + var(--gap)))';
        if (newPos && newPos[0] === r && newPos[1] === c) el.className += ' new';
        else if (mergedMap && mergedMap[r][c]) el.className += ' merged';
        $tiles.appendChild(el);
      }
    }
    $score.textContent = state.score;
    $best.textContent = state.best;
  }

  function showOverlay(msg, canKeep) {
    $msg.textContent = msg;
    $keep.hidden = !canKeep;
    $overlay.hidden = false;
  }
  function hideOverlay() { $overlay.hidden = true; }

  function newGame() {
    state.board = emptyBoard();
    state.score = 0;
    state.won = false;
    state.keepPlaying = false;
    state.over = false;
    addRandomTile(state.board);
    addRandomTile(state.board);
    hideOverlay();
    render();
  }

  function act(dir) {
    if (!$overlay.hidden) return;
    var res = move(state.board, dir);
    if (!res.moved) return;
    state.board = res.board;
    state.score += res.gained;
    if (state.score > state.best) {
      state.best = state.score;
      saveBest(state.best);
    }
    var pos = addRandomTile(state.board);
    render(pos, res.mergedMap);
    if (!state.won && !state.keepPlaying && state.board.some(function (row) { return row.indexOf(2048) !== -1; })) {
      state.won = true;
      showOverlay('승리!', true);
      return;
    }
    if (!canMove(state.board)) {
      state.over = true;
      showOverlay('게임 오버', false);
    }
  }

  var KEYMAP = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down',
    A: 'left', D: 'right', W: 'up', S: 'down'
  };

  function init() {
    $tiles = document.getElementById('tiles');
    $score = document.getElementById('score');
    $best = document.getElementById('best');
    $overlay = document.getElementById('overlay');
    $msg = document.getElementById('overlay-msg');
    $keep = document.getElementById('keep-going');

    var bg = document.querySelector('.grid-bg');
    for (var i = 0; i < N * N; i++) bg.appendChild(document.createElement('i'));

    state.best = loadBest();

    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var dir = KEYMAP[e.key];
      if (!dir) return;
      e.preventDefault();
      act(dir);
    });

    var board = document.getElementById('board');
    var sx = 0, sy = 0, tracking = false;
    board.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    board.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    board.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
      if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left');
      else act(dy > 0 ? 'down' : 'up');
    }, { passive: true });

    document.getElementById('new-game').addEventListener('click', newGame);
    document.getElementById('overlay-new').addEventListener('click', newGame);
    $keep.addEventListener('click', function () {
      state.keepPlaying = true;
      hideOverlay();
      if (!canMove(state.board)) { state.over = true; showOverlay('게임 오버', false); }
    });

    newGame();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
