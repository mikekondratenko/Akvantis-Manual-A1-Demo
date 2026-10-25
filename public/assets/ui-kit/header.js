/* ─────────────────────────────────────────────────────────────────────────────
   Header — the top bar's behaviour, one source (2026-10-25)

   The look is header.css. What a page used to wire itself (A1-Landing-Page/landing.js) lives
   here, so every page with the bar gets the same two things:

     FIXED  the bar stays (2026-10-25): 24 from the top of the window at the top of the page,
            12 once the page is scrolled — `.is-scrolled` on the bar, which header.css moves.
     INK    the line under the link of the section on screen — `.header-ink` in the nav,
            `.is-here` on the link. A link's section counts once its top passes 35 % of the
            window. On a phone the nav scrolls sideways and the current link is brought in.

   Markup: `.header` with `.header-nav` holding `a[href^="#"]` links and an empty
   `<span class="header-ink" aria-hidden="true"></span>`. Runs itself; no dependency.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  function start() {
    if (!document.querySelector('.header')) return;

    /* ── FIXED: 24 at the top, 12 once scrolled ── */
    var bar = document.querySelector('.header');
    var mark = function () { bar.classList.toggle('is-scrolled', scrollY > 8); };
    addEventListener('scroll', mark, { passive: true }); mark();

    /* ── INK ── */
    var nav = document.querySelector('.header-nav'), ink = nav && nav.querySelector('.header-ink');
    if (!ink) return;
    var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var was = -1;
    function place() {
      var line = innerHeight * 0.35, cur = -1;
      secs.forEach(function (s, i) { if (s && !s.hidden && s.getBoundingClientRect().top <= line) cur = i; });
      /* At the foot of the page the last section counts, even if it never reaches the line. */
      var de = document.documentElement;
      if (scrollY + innerHeight >= de.scrollHeight - 4) { for (var k = secs.length - 1; k >= 0; k--) if (secs[k] && !secs[k].hidden) { cur = k; break; } }
      links.forEach(function (a, i) { a.classList.toggle('is-here', i === cur); });
      if (cur < 0) { ink.classList.remove('is-on'); was = cur; return; }
      var a = links[cur];
      ink.style.width = a.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + a.offsetLeft + 'px)';
      ink.classList.add('is-on');
      if (cur !== was && nav.scrollWidth > nav.clientWidth)
        nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
      was = cur;
    }
    addEventListener('scroll', place, { passive: true }); addEventListener('resize', place); place();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
