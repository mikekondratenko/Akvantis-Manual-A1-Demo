/* ─────────────────────────────────────────────────────────────────────────────
   QR, как его рисует Stick Maker.

   ⚠ Это копия модуля из `Stick-Maker/public/index.html`, снятая 2026-09-15, а не
   вторая реализация: кодировщик, написанный дважды, — это два кодировщика,
   которые начнут расходиться на первом же краевом случае, и разойдутся молча.
   Появится третий потребитель — модулю место в `ui-kit/`, и тогда он приедет
   сюда синком, как всё остальное.

   Почему вообще свой, а не библиотека: ни зависимости, ни шага сборки, а символ,
   который не сканируется, хуже, чем никакого. Версии 1–3 проверены декодером и
   совпадают с segno модуль в модуль; выше 42 байт модуль ничего не рисует.

   API: `QR.svg(text)` → строка с `<svg>`, залитая `currentColor`.
   ───────────────────────────────────────────────────────────────────────────── */
window.QR = (function () {
  /* [total codewords, blocks, ec codewords per block] — level M. Data codewords are
     total − blocks × ec, and the byte capacity is that less the 12-bit header.

     ── 2026-08-24: 4 and 5 added, and the reason is the Digital Link ──
     The table stopped at version 3 because the only thing this encoder had ever been asked for
     was `akvantis.com`, which is twelve bytes and a version 1 symbol. A GS1 Digital Link with a
     serial is not:

       https://a1.akvantis.com/01/04270005511009/21/A1-2634-000001   → 59 bytes

     Version 3-M holds 42, so the encoder returned null and the sheet drew no code at all. That
     is the correct failure for a URL somebody typed too long, and the wrong one for the payload
     the label is now specified to carry.

     Versions 4 and 5 are two blocks rather than one, and the interleaver below already deals
     with that — `per = dataLen / blocks` and the two loops that follow are the standard's own
     interleave. It works here only because both versions split into blocks of **equal** length
     (4-M is 32 + 32, 5-M is 43 + 43). Version 6 does not: it is 27 + 27 + 27 + 27 at a different
     EC count, and versions past that mix two group sizes, which this interleaver cannot express.
     So 5 is the ceiling until somebody writes the group split, and 84 bytes is comfortably more
     than any payload on this label — the longest is 59.

     Capacities, for reading the LIMIT below against: 3-M is 42 bytes, 4-M is 62, 5-M is 84. */
  var VER = [ [26, 1, 10], [44, 1, 16], [70, 1, 26], [100, 2, 18], [134, 2, 24] ];
  var ALIGN = [ [], [6, 18], [6, 22], [6, 26], [6, 30] ];

  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    for (var i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 285; }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }

  function rsGen(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var ng = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); }
      g = ng;
    }
    return g;
  }
  function rsEnc(data, n) {
    var g = rsGen(n), rem = new Array(n).fill(0);
    for (var i = 0; i < data.length; i++) {
      var f = data[i] ^ rem[0];
      rem.shift(); rem.push(0);
      for (var j = 0; j < n; j++) rem[j] ^= mul(g[j + 1], f);
    }
    return rem;
  }

  function bytesOf(str) {
    var out = [], s = unescape(encodeURIComponent(str));
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function pick(len) {
    for (var v = 0; v < VER.length; v++) {
      var t = VER[v][0], blocks = VER[v][1], ec = VER[v][2];
      var data = t - blocks * ec;
      if (data * 8 - 12 >= len * 8) return v + 1;
    }
    return 0;
  }

  function codewords(bytes, ver) {
    var spec = VER[ver - 1], total = spec[0], blocks = spec[1], ec = spec[2];
    var dataLen = total - blocks * ec;

    var bits = [];
    function put(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    put(4, 4); put(bytes.length, 8);
    bytes.forEach(function (b) { put(b, 8); });
    for (var t = 0; t < 4 && bits.length < dataLen * 8; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var dat = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
      dat.push(b);
    }
    for (var p = 0; dat.length < dataLen; p++) dat.push(p % 2 ? 0x11 : 0xEC);

    var per = dataLen / blocks, dBlocks = [], eBlocks = [];
    for (var b2 = 0; b2 < blocks; b2++) {
      var chunk = dat.slice(b2 * per, (b2 + 1) * per);
      dBlocks.push(chunk); eBlocks.push(rsEnc(chunk, ec));
    }
    var out = [];
    for (var c = 0; c < per; c++) for (var bb = 0; bb < blocks; bb++) out.push(dBlocks[bb][c]);
    for (var e = 0; e < ec; e++) for (var b3 = 0; b3 < blocks; b3++) out.push(eBlocks[b3][e]);
    return out;
  }

  function matrix(ver) {
    var n = 17 + 4 * ver;
    var m = [], fn = [];
    for (var i = 0; i < n; i++) { m.push(new Array(n).fill(0)); fn.push(new Array(n).fill(0)); }

    function finder(r, c) {
      for (var dr = -1; dr <= 7; dr++) for (var dc = -1; dc <= 7; dc++) {
        var rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
        var d = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        m[rr][cc] = (d !== 2 && d <= 3) ? 1 : 0;
        fn[rr][cc] = 1;
      }
    }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);

    ALIGN[ver - 1].forEach(function (r) {
      ALIGN[ver - 1].forEach(function (c) {
        if ((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) return;
        for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) {
          m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0;
          fn[r + dr][c + dc] = 1;
        }
      });
    });

    for (var t = 8; t < n - 8; t++) {
      m[6][t] = m[t][6] = (t % 2 === 0) ? 1 : 0;
      fn[6][t] = fn[t][6] = 1;
    }
    m[n - 8][8] = 1; fn[n - 8][8] = 1;                       // dark module
    for (var f = 0; f < 9; f++) { if (!fn[8][f]) fn[8][f] = 1; if (!fn[f][8]) fn[f][8] = 1; }
    for (var f2 = 0; f2 < 8; f2++) { fn[8][n - 1 - f2] = 1; fn[n - 1 - f2][8] = 1; }
    return { m: m, fn: fn, n: n };
  }

  function place(g, cw) {
    var n = g.n, bit = 0, up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (var i = 0; i < n; i++) {
        var row = up ? n - 1 - i : i;
        for (var c = 0; c < 2; c++) {
          var cc = col - c;
          if (g.fn[row][cc]) continue;
          var b = bit < cw.length * 8 ? (cw[bit >> 3] >> (7 - (bit & 7))) & 1 : 0;
          g.m[row][cc] = b; bit++;
        }
      }
      up = !up;
    }
  }

  function maskFn(k) {
    return [
      function (r, c) { return (r + c) % 2 === 0; },
      function (r) { return r % 2 === 0; },
      function (r, c) { return c % 3 === 0; },
      function (r, c) { return (r + c) % 3 === 0; },
      function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
      function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
      function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
      function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
    ][k];
  }

  function fmtBits(mask) {
    var ECBITS = 0; // level M
    var d = (ECBITS << 3) | mask, rem = d;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537);
    return ((d << 10) | rem) ^ 0x5412;
  }

  function putFormat(g, mask) {
    var n = g.n, bits = fmtBits(mask);
    /* Bit 0 is the first module placed and it is the MSB of the 15-bit word — the sequence
       is written most-significant first, not least. Reading it the other way puts a
       well-formed format block in backwards, which every decoder rejects. */
    function bit(i) { return (bits >> (14 - i)) & 1; }
    for (var i = 0; i <= 5; i++) g.m[8][i] = bit(i);
    g.m[8][7] = bit(6); g.m[8][8] = bit(7); g.m[7][8] = bit(8);
    for (var j = 9; j <= 14; j++) g.m[14 - j][8] = bit(j);
    for (var k = 0; k <= 6; k++) g.m[n - 1 - k][8] = bit(k);
    for (var l = 7; l <= 14; l++) g.m[8][n - 15 + l] = bit(l);
    g.m[n - 8][8] = 1;
  }

  function penalty(m, n) {
    var p = 0, i, j, run, dark = 0;
    for (i = 0; i < n; i++) {
      for (var dir = 0; dir < 2; dir++) {
        run = 1;
        for (j = 1; j < n; j++) {
          var a = dir ? m[j][i] : m[i][j], b = dir ? m[j - 1][i] : m[i][j - 1];
          if (a === b) { run++; if (run === 5) p += 3; else if (run > 5) p += 1; }
          else run = 1;
        }
      }
    }
    for (i = 0; i < n - 1; i++) for (j = 0; j < n - 1; j++) {
      var v = m[i][j];
      if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) p += 3;
    }
    var pat1 = [1,0,1,1,1,0,1,0,0,0,0], pat2 = [0,0,0,0,1,0,1,1,1,0,1];
    function scan(get) {
      for (i = 0; i < n; i++) for (j = 0; j + 11 <= n; j++) {
        var ok1 = true, ok2 = true;
        for (var k = 0; k < 11; k++) {
          var v2 = get(i, j + k);
          if (v2 !== pat1[k]) ok1 = false;
          if (v2 !== pat2[k]) ok2 = false;
        }
        if (ok1 || ok2) p += 40;
      }
    }
    scan(function (r, c) { return m[r][c]; });
    scan(function (r, c) { return m[c][r]; });
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (m[i][j]) dark++;
    p += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;
    return p;
  }

  function build(text) {
    var bytes = bytesOf(text), ver = pick(bytes.length);
    if (!ver) return null;
    var cw = codewords(bytes, ver);
    var best = null;
    for (var k = 0; k < 8; k++) {
      var g = matrix(ver);
      place(g, cw);
      var f = maskFn(k);
      for (var r = 0; r < g.n; r++) for (var c = 0; c < g.n; c++)
        if (!g.fn[r][c] && f(r, c)) g.m[r][c] ^= 1;
      putFormat(g, k);
      var sc = penalty(g.m, g.n);
      if (!best || sc < best.score) best = { score: sc, m: g.m, n: g.n, ver: ver, mask: k };
    }
    return best;
  }

  function svg(text) {
    var q = build(text);
    if (!q) return '';
    var d = '';
    for (var r = 0; r < q.n; r++) for (var c = 0; c < q.n; c++)
      if (q.m[r][c]) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + q.n + ' ' + q.n +
           '" shape-rendering="crispEdges" aria-label="' + text +
           '"><path d="' + d + '" fill="currentColor"/></svg>';
  }
  /* 84 — version 5-M, the last version this interleaver can express. Read the VER note for why
     it is not 6. `LIMIT` is quoted in the rail's own message, so the two cannot drift. */
  return { svg: svg, build: build, LIMIT: 84 };
})();
