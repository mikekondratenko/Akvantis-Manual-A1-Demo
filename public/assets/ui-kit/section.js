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
                  section is the pinned part of the line's way (its width less a screen) — the
                  section is a screen plus that tall, its .drift-pin sticks — and --drift on the line goes
                  from the window's right edge (a lead before the first letter) to its last letter a margin
                  in from the right, as the section's top goes from the window's foot to −run. Nothing under reduced motion.
     REVEAL       every section comes in as it enters the window (2026-11-04) — section.css REVEAL
     LOCKUPS      `.sec-lockup[data-device="A1"]` gets the product's own mark from the catalogue
                  (ui-kit/devices/devices.js → window.DEVICES), at once, as this file runs —
                  so scripts after it (order.js) find the drawing. The text and aria-label stay
                  for no script and a screen reader. Load devices.js before this file.

   Runs itself; devices.js optional (no catalogue → the letters stay).
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  /* MOTION ON / OFF (2026-11-04) — every scroll motion here (the reveal, the drift line and its words, the quote's
     fill, the mark's wave) can be turned off for one section or a whole page: data-motion="off" on the section,
     or on <html>/<body>/any wrapper; the nearest data-motion wins, so data-motion="on" brings one block back
     inside a still page. Still blocks get .is-still; reduced motion stills them all. */
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = function (el) { if (RM) return true; var m = el && el.closest('[data-motion]'); return !!(m && m.getAttribute('data-motion') === 'off'); };
  [].forEach.call(document.querySelectorAll('section.sec'), function (s) { if (still(s)) s.classList.add('is-still'); });
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
    var secs = [].slice.call(document.querySelectorAll('section.sec')).filter(function (s) { return !s.parentNode.closest('section.sec') && !still(s); });
    if (!secs.length) return;
    var CARDS = ':is(.sec-cards-grid, .sec-bento-grid, .fig-grid, .num-grid, .sec-grid) > *';
    var step = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reveal-step')) || 300; };
    var vh = innerHeight, tracks = [];
    /* the slides: waiting in view until their section is in */
    var sectionIn = function (s) { return !s.classList.contains('rv') || s.classList.contains('is-in'); };
    [].forEach.call(document.querySelectorAll('.slider-track'), function (t) {
      var sec = t.closest('section.sec'); if (!sec || still(sec)) return;
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
    /* BANNER CONTENT (2026-11-04): in a banner (and the hero) the words come in one by one — the kicker,
       the title, the caption, the price, each button — top down and left to right, 0.07 s apart. */
    var bannerItems = function (s) {
      var items = [];
      [].forEach.call(s.children, function (c) {
        if (c.matches('.sec-media, .sec-banner, .sec-ph')) return;
        if (c.matches('.sec-head, .sec-actions') && c.children.length) [].push.apply(items, c.children); else items.push(c);
      });
      items.map(function (c) { var r = c.getBoundingClientRect(); return [c, Math.round(r.top / 8), r.left]; })
        .sort(function (a, b) { return a[1] - b[1] || a[2] - b[2]; })
        .forEach(function (p, k) { p[0].classList.add('rv-c'); p[0].style.setProperty('--rv-d', (k * 70) + 'ms'); });
    };
    var heroes = [];
    secs.forEach(function (s) {
      if (s.classList.contains('sec-hero')) { bannerItems(s); s.classList.add('rv', 'rv-init'); heroes.push(s); return; }   // on load, the words only
      if (s.getBoundingClientRect().top < vh * 0.88 && !(s.classList.contains('sec-split') && [].every.call(s.children, function (c) { return c.getBoundingClientRect().top > vh * 0.88; }))) return;   // on the first screen: in, no motion
      [].forEach.call(s.querySelectorAll(CARDS), function (c, i) { c.style.setProperty('--rv-i', Math.min(i, 6)); });
      [].forEach.call(s.querySelectorAll('.specs > .specs-row, .compare thead tr, .compare tbody tr, .sec-faq-list > *'), function (r, i) { r.style.setProperty('--rv-r', Math.min(i, 8)); });   /* table rows: 0.07 s apart */
      if (s.classList.contains('sec-cover')) bannerItems(s);
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
      secs.forEach(function (s) { s.classList.remove('rv-init'); });
      heroes.forEach(function (s) { s.classList.add('is-in'); setTimeout(function () { s.classList.add('is-done'); }, 2000); }); }); });
  })();
  /* MARK (2026-11-04) — the Akvantis mark in the header and the footer: on a hover (or a key's focus) the ring
     stays and the wave rises out through the ring's inside while the same wave comes up from below, through a
     round mask (section.css MARK). The header's mark takes the page to its top. */
  (function mark() {
    var n = 0, NS = 'http://www.w3.org/2000/svg';
    [].forEach.call(document.querySelectorAll('.header-mark > svg, .sec-footer-brand svg'), function (svg) {
      var ps = svg.querySelectorAll(':scope > path'); if (ps.length !== 3 || svg.querySelector('.mark-waves') || still(svg)) return;
      var id = 'mark-clip-' + (++n), defs = document.createElementNS(NS, 'defs'), cp = document.createElementNS(NS, 'clipPath'), c = document.createElementNS(NS, 'circle');
      cp.setAttribute('id', id); c.setAttribute('cx', '24.02'); c.setAttribute('cy', '24.18'); c.setAttribute('r', '21.1');   // the ring's inside
      cp.appendChild(c); defs.appendChild(cp); svg.insertBefore(defs, svg.firstChild);
      var mask = document.createElementNS(NS, 'g'), a = document.createElementNS(NS, 'g');
      mask.setAttribute('clip-path', 'url(#' + id + ')'); mask.setAttribute('class', 'mark-waves');
      a.setAttribute('class', 'mark-wave'); a.appendChild(ps[1]); a.appendChild(ps[2]);
      var b = a.cloneNode(true); b.setAttribute('class', 'mark-wave is-next');
      mask.appendChild(a); mask.appendChild(b); svg.appendChild(mask);
      var host = svg.closest('a, button') || svg; host.classList.add('mark-host');
    });
    [].forEach.call(document.querySelectorAll('a.header-mark'), function (a) {
      a.addEventListener('click', function (e) {
        var h = a.getAttribute('href') || '';
        if (h !== '#top' && h !== '#' && document.querySelector(h)) { var t = document.querySelector(h); if (t.getBoundingClientRect().top + scrollY > 4) return; }
        e.preventDefault();
        scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      });
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
      return !q.querySelector('.is-muted') && !still(q);
    }).map(function (q) {
      var f = q.querySelector('.sec-quote-fill');
      if (!f) { f = document.createElement('span'); f.className = 'sec-quote-fill';
        while (q.firstChild) f.appendChild(q.firstChild); q.appendChild(f); }
      return [q, f];
    });
    var drifts = [].slice.call(document.querySelectorAll('.sec-drift-text')).filter(function (d) { return !still(d); });
    /* WORDS (2026-11-04): the line is cut into words (.drift-w); on a scroll each word trails the line, a little
       more down the line, so the gaps open while the page moves and close smoothly as it stops. */
    drifts.forEach(function (d) {
      if (!d.querySelector('.drift-w')) {
        if (!d.hasAttribute('aria-label')) d.setAttribute('aria-label', d.textContent.trim());
        d.innerHTML = d.textContent.trim().split(/\s+/).map(function (w) {
          return '<span class="drift-w" aria-hidden="true">' + w.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span>';
        }).join(' ');
      }
      d.__w = [].slice.call(d.querySelectorAll('.drift-w'));
    });
    if (!fills.length && !drifts.length) return;
    var ticking = false;
    function paint() {
      ticking = false;
      var vh = innerHeight, moving = false, now = performance.now();
      var dt = Math.min(0.05, (now - (paint.t || now)) / 1000) || 0.016; paint.t = now;   // seconds since the last frame
      drifts.forEach(function (d) {
        var sec = d.closest('.sec-drift') || d.parentNode, w = sec.clientWidth;
        var m = parseFloat(getComputedStyle(sec).getPropertyValue('--grid-margin')) || 24;
        /* a lead before the first letter (2026-11-04): the line starts at the window's right edge and runs as the
           section comes up, so its first word is read in full; it ends with its last letter a margin in from the
           right. Its whole way is the line's width, at one pixel per pixel scrolled — a screen of it while the
           section comes up, the rest pinned. */
        var sw = d.offsetWidth, x0 = w - m, way = sw;   // offsetWidth: the words' own shifts don't count (scrollWidth did — the line jerked back)
        var run = Math.max(0, way - vh);
        if (sec.__run !== run) { sec.__run = run; sec.style.setProperty('--drift-run', run + 'px'); }
        var r = sec.getBoundingClientRect();
        var t = Math.max(0, Math.min(1, (vh - r.top) / way));   // top at the window's foot → −run (pinned)
        var x = x0 - way * t;
        d.style.setProperty('--drift', x.toFixed(1) + 'px');
        /* each word eases to the line on its own clock (no chain, so no spring-back): the first a little
           (a wheel's steps smoothed), each next 0.14 s later — 0.06, 0.20, 0.34 s… */
        if (!d.__p) d.__p = d.__w.map(function () { return x; });
        var cap = w * 0.8;
        for (var i = 0; i < d.__w.length; i++) {
          var p = d.__p[i] + (x - d.__p[i]) * (1 - Math.exp(-dt / (0.06 + 0.14 * i)));
          p = Math.max(x - cap, Math.min(x + cap, p));
          if (Math.abs(p - x) < 0.3) p = x; else moving = true;
          d.__p[i] = p;
          var o = p - x, css = o ? 'translate3d(' + o.toFixed(1) + 'px,0,0)' : '';
          if (d.__w[i].__css !== css) { d.__w[i].__css = css; d.__w[i].style.transform = css; }
        }
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
      if (moving) ask();   /* the words still settling */
    }
    function ask() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ask);   /* the line's width is known once the face is in */
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
