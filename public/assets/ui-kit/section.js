/* ─────────────────────────────────────────────────────────────────────────────
   Section — the sections' behaviour, one source (2026-10-25). The look is section.css.

     QUOTE FILL   `.sec-quote-text` fills with white over --black-800 as the page is scrolled
                  down, and empties as it goes back up. The words are wrapped in
                  `.sec-quote-fill` here (unless the page did it) and `--fill` is set from
                  where the quote stands: 0 % while its top is below 85 % of the window, 100 %
                  once its foot passes 45 %. At 100 % the section gets `.is-filled`, and the
                  line under the words (`.sec-quote-by`) comes in. A quote with `.is-muted`
                  parts is left as it is.
     DRIFT        `.sec-drift` (2026-11-04) pins and runs its line from right to left: --drift-run on the
                  section is the line's run (its width less the window's, plus a margin either end) — the
                  section is a screen plus that tall, its .drift-pin sticks — and --drift on the line goes
                  from +margin (its first letter in from the left) to −run+margin (its last in from the right)
                  as the section's top goes from the window's top to −run. Nothing under reduced motion.
     REVEAL       every section comes in as it enters the window (2026-11-04) — section.css REVEAL
     LOCKUPS      `.sec-lockup[data-device="A1"]` gets the product's own mark from the catalogue
                  (ui-kit/devices/devices.js → window.DEVICES), at once, as this file runs —
                  so scripts after it (order.js) find the drawing. The text and aria-label stay
                  for no script and a screen reader. Load devices.js before this file.

   Runs itself; devices.js optional (no catalogue → the letters stay).
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  (function lockups() {
    var D = {}; (window.DEVICES || []).forEach(function (d) { if (d.svg && !D[d.code]) D[d.code] = d.svg; });
    [].forEach.call(document.querySelectorAll('.sec-lockup[data-device]'), function (el) {
      var svg = D[el.dataset.device]; if (!svg) return;
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.dataset.device);
      el.setAttribute('role', 'img'); el.innerHTML = svg;
    });
  })();
  /* REVEAL (2026-11-04) — sections come in as they enter the window (section.css REVEAL); the ones on the first
     screen are in at once. Grid cards get --rv-i (the 0.3 s steps). Slides rise like cards when their section
     is in — those in view 0.3 s apart (--rv-d), the rest at once. Not under reduced motion. */
  (function reveal() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    var secs = [].slice.call(document.querySelectorAll('section.sec')).filter(function (s) { return !s.parentNode.closest('section.sec'); });
    if (!secs.length) return;
    var CARDS = ':is(.sec-cards-grid, .sec-bento-grid, .fig-grid, .num-grid, .sec-grid) > *';
    var step = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reveal-step')) || 300; };
    var vh = innerHeight, tracks = [];
    /* the slides: waiting in view until their section is in */
    var sectionIn = function (s) { return !s.classList.contains('rv') || s.classList.contains('is-in'); };
    [].forEach.call(document.querySelectorAll('.slider-track'), function (t) {
      var sec = t.closest('section.sec'); if (!sec) return;
      var slides = [].slice.call(t.children);
      slides.forEach(function (sl) { sl.classList.add('rv-x'); });
      /* on the reveal: the slides in view rise 0.3 s apart, the rest are in at once (they wait off-screen) */
      var run = function () { var k = 0, tr = t.getBoundingClientRect();
        slides.forEach(function (sl) { var r = sl.getBoundingClientRect(), seen = r.right > tr.left + 8 && r.left < tr.right - 8;
          sl.style.setProperty('--rv-d', seen ? (k++ * step()) + 'ms' : '0ms'); sl.classList.add('is-in'); }); };
      tracks.push({ sec: sec, run: run });   /* run once the sections are marked (below) */
    });
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return;
      var s = e.target.__rvSec || e.target; s.classList.add('is-in'); io.unobserve(e.target);
      tracks.forEach(function (t) { if (t.sec === s) t.run(); });
      setTimeout(function () { s.classList.add('is-done'); }, 3600);   /* after the longest stagger (cards: 6 × 0.3 s) */ }); }, { rootMargin: '0px 0px -12% 0px' });
    secs.forEach(function (s) {
      if (s.getBoundingClientRect().top < vh * 0.88 && !(s.classList.contains('sec-split') && [].every.call(s.children, function (c) { return c.getBoundingClientRect().top > vh * 0.88; }))) return;   // on the first screen: in, no motion
      [].forEach.call(s.querySelectorAll(CARDS), function (c, i) { c.style.setProperty('--rv-i', Math.min(i, 6)); });
      [].forEach.call(s.querySelectorAll('.specs > .specs-row, .compare thead tr, .compare tbody tr, .sec-faq-list > *'), function (r, i) { r.style.setProperty('--rv-r', Math.min(i, 8)); });   /* table rows: 0.07 s apart */
      if (s.classList.contains('sec-text')) [].forEach.call(s.children, function (c, k) { c.style.setProperty('--rv-d', (k * 70) + 'ms'); });   /* top down, 0.07 s apart (2026-11-04; was 0.7) */
      if (s.classList.contains('sec-split')) {   /* the halves: left first, 0.07 s apart (by where they stand) */
        var halves = [].slice.call(s.children).map(function (c) { var r = c.getBoundingClientRect(); return [c, r.left, r.top]; });
        var side = halves.length > 1 && Math.abs(halves[0][1] - halves[1][1]) > 40;   // side by side → by left, stacked → by top
        halves.sort(function (a, b) { return side ? a[1] - b[1] : a[2] - b[2]; })
          .forEach(function (p, k) { p[0].style.setProperty('--rv-d', (k * 70) + 'ms'); });   /* 0.07 s (was 0.7) */
      }
      /* a tall section whose content stands on its middle (image + text, a screen high) is watched by its
         content, not its top — or it would be over before the picture is in view (2026-11-04) */
      var watch = s;
      if (s.classList.contains('sec-split')) { var top = null;
        [].forEach.call(s.children, function (c) { var r = c.getBoundingClientRect(); if (!top || r.top < top.getBoundingClientRect().top) top = c; });
        if (top) { watch = top; top.__rvSec = s; } }
      s.classList.add('rv', 'rv-init'); io.observe(watch);
    });
    tracks.forEach(function (t) { if (sectionIn(t.sec)) t.run(); });   /* a slider on the first screen: its slides now */
    requestAnimationFrame(function () { requestAnimationFrame(function () {   /* the hidden state is drawn with no transition */
      secs.forEach(function (s) { s.classList.remove('rv-init'); }); }); });
  })();
  /* EXPAND (2026-11-04) — .xp-row: one card open; from 768 on a pointer the card under it opens,
     a tap or Enter on its button opens it anywhere. The closed cards' words are inert. */
  (function expand() {
    var hover = matchMedia('(hover: hover) and (min-width: 768px)');
    [].forEach.call(document.querySelectorAll('.xp-row'), function (row) {
      var cards = [].slice.call(row.children);
      var open = function (c) { cards.forEach(function (x) { var on = x === c; x.classList.toggle('is-open', on);
        var b = x.querySelector('.xp-toggle'); if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
        var body = x.querySelector('.xp-body'); if (body) body.inert = !on; }); };
      cards.forEach(function (c) {
        var b = c.querySelector('.xp-toggle'); if (b) b.addEventListener('click', function () { open(c); });
        c.addEventListener('mouseenter', function () { if (hover.matches) open(c); }); });
      open(row.querySelector('.xp-card.is-open') || cards[0]);
    });
  })();
  function start() {
    var fills = [].slice.call(document.querySelectorAll('.sec-quote-text')).filter(function (q) {
      return !q.querySelector('.is-muted');
    }).map(function (q) {
      var f = q.querySelector('.sec-quote-fill');
      if (!f) { f = document.createElement('span'); f.className = 'sec-quote-fill';
        while (q.firstChild) f.appendChild(q.firstChild); q.appendChild(f); }
      return [q, f];
    });
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var drifts = still ? [] : [].slice.call(document.querySelectorAll('.sec-drift-text'));
    if (!fills.length && !drifts.length) return;
    var ticking = false;
    function paint() {
      ticking = false;
      var vh = innerHeight;
      drifts.forEach(function (d) {
        var sec = d.closest('.sec-drift') || d.parentNode, w = sec.clientWidth;
        var m = parseFloat(getComputedStyle(sec).getPropertyValue('--grid-margin')) || 24;
        var run = Math.max(0, d.scrollWidth - w + m * 2);
        if (sec.__run !== run) { sec.__run = run; sec.style.setProperty('--drift-run', run + 'px'); }
        var r = sec.getBoundingClientRect();
        var t = run ? Math.max(0, Math.min(1, -r.top / run)) : 0;   // pinned: top at the window's top → −run
        d.style.setProperty('--drift', (m - run * t).toFixed(1) + 'px');
      });
      fills.forEach(function (p) {
        var r = p[0].getBoundingClientRect();
        var from = vh * 0.85, to = vh * 0.45 - r.height;      // top at 85 % → foot at 45 %
        var t = (from - r.top) / (from - to);
        t = Math.max(0, Math.min(1, t));
        p[1].style.setProperty('--fill', (t * 100).toFixed(2) + '%');
        /* who said it comes in once the words are white */
        var sec = p[0].closest('.sec-quote'); if (sec) sec.classList.toggle('is-filled', t >= 0.995);
      });
    }
    function ask() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ask);   /* the line's width is known once the face is in */
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
