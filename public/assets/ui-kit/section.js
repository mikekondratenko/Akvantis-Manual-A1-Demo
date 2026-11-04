/* ─────────────────────────────────────────────────────────────────────────────
   Section — the sections' behaviour, one source (2026-10-25). The look is section.css.

     QUOTE FILL   `.sec-quote-text` fills with white over --black-800 as the page is scrolled
                  down, and empties as it goes back up. The words are wrapped in
                  `.sec-quote-fill` here (unless the page did it) and `--fill` is set from
                  where the quote stands: 0 % while its top is below 85 % of the window, 100 %
                  once its foot passes 45 %. At 100 % the section gets `.is-filled`, and the
                  line under the words (`.sec-quote-by`) comes in. A quote with `.is-muted`
                  parts is left as it is.
     DRIFT        `.sec-drift-text` (2026-11-04) runs from left to right as its section crosses the window:
                  --drift goes from −(what does not fit + 12 % of the width) while the section's top is at
                  the window's foot, to +12 % of the width once its foot reaches the window's top.
                  Nothing under prefers-reduced-motion.
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
        var sec = d.closest('.sec') || d.parentNode, r = sec.getBoundingClientRect(), w = r.width;
        var t = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));   // top at the window's foot → foot at its top
        var over = Math.max(0, d.scrollWidth - w), from = -(over + w * 0.12), to = w * 0.12;
        d.style.setProperty('--drift', (from + (to - from) * t).toFixed(1) + 'px');
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
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
