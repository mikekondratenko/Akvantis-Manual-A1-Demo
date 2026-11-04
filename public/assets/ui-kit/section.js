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
     screen are in at once. Grid cards get --rv-i (the 0.3 s steps). Slides of a horizontal slider are revealed
     one by one, from the right: each when it is ≥ 15 % in view in its track AND its section is in — those
     that arrive together 0.3 s apart (--rv-d). Not under reduced motion. */
  (function reveal() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    var secs = [].slice.call(document.querySelectorAll('section.sec')).filter(function (s) { return !s.parentNode.closest('section.sec'); });
    if (!secs.length) return;
    var CARDS = ':is(.sec-cards-grid, .sec-bento-grid, .fig-grid, .num-grid, .sec-grid) > *';
    var step = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reveal-step')) || 300; };
    var vh = innerHeight, tracks = [];
    /* the slides: waiting in view until their section is in */
    var show = function (list) { var k = 0; list.forEach(function (sl) { if (sl.classList.contains('is-in')) return;
      sl.style.setProperty('--rv-d', (k++ * step()) + 'ms'); sl.classList.add('is-in'); }); };
    var sectionIn = function (s) { return !s.classList.contains('rv') || s.classList.contains('is-in'); };
    [].forEach.call(document.querySelectorAll('.slider-track'), function (t) {
      var sec = t.closest('section.sec'); if (!sec) return;
      var slides = [].slice.call(t.children), seen = new Set();
      slides.forEach(function (sl) { sl.classList.add('rv-x'); });
      var io = new IntersectionObserver(function (es) {
        var now = []; es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); });
        if (!sectionIn(sec)) return;
        slides.forEach(function (sl) { if (seen.has(sl)) now.push(sl); }); show(now);
      }, { root: t, threshold: 0.15 });
      slides.forEach(function (sl) { io.observe(sl); });
      tracks.push({ sec: sec, run: function () { show(slides.filter(function (sl) { return seen.has(sl); })); } });
    });
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return;
      var s = e.target; s.classList.add('is-in'); io.unobserve(s);
      tracks.forEach(function (t) { if (t.sec === s) t.run(); });
      setTimeout(function () { s.classList.add('is-done'); }, 3200); }); }, { rootMargin: '0px 0px -12% 0px' });
    secs.forEach(function (s) {
      if (s.getBoundingClientRect().top < vh * 0.88) return;   // on the first screen: in, no motion
      [].forEach.call(s.querySelectorAll(CARDS), function (c, i) { c.style.setProperty('--rv-i', Math.min(i, 6)); });
      s.classList.add('rv'); io.observe(s);
    });
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
