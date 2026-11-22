/* ─────────────────────────────────────────────────────────────────────────────
   Mobile fold — a section that folds under its name on a phone (2026-11-22, Michael: «the page would turn
   gigantic»). The look is section.css «MOBILE FOLD»; the opening is accordion.js.

     <section class="sec sec-faq" data-mfold>…</section>              the name: the section's own h2
     <section class="sec sec-cards" data-mfold="Cartridges">…</section> the name given (else aria-label)

   Up to 767 wide every [data-mfold] section is wrapped, closed, in the kit's line plate: a row with its name and a
   large plus (a cross when open), a divider under it — no fill, no corners. Its head keeps its lead; the plate says
   the title. Wider than that the section is put back exactly as it was. A link to a folded section (an <a href="#id">
   anywhere) opens it on the way, so «Buy» → #order lands on the form open.

   MobileFold.open(section) opens one from a page's own script (a bar, a button that is not a link).
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var mq = matchMedia('(max-width: 767px)'), made = [], n = 0;

  function name (sec) {
    var given = sec.getAttribute('data-mfold');
    if (given) return given;
    var h2 = sec.querySelector(':scope > .sec-head h2');
    if (h2) return h2.textContent.replace(/\s+/g, ' ').trim();   /* words only: a drawn lockup (A1) would come in empty */
    return sec.getAttribute('aria-label') || '';
  }
  function wrap (sec) {
    if (sec.querySelector(':scope > .mfold') || sec.closest('[hidden]')) return;
    var id = 'mfold-' + (++n), kids = [].slice.call(sec.childNodes);
    var plate = document.createElement('div'); plate.className = 'plate is-line mfold';
    plate.innerHTML = '<button class="panel-title" type="button" aria-expanded="false" aria-controls="' + id + '">'
      + '<span class="mfold-name"></span><i data-icon="plus" data-size="24" class="sec-faq-sign mfold-sign"></i></button>'
      + '<div class="panel-fold" id="' + id + '" data-open="false" inert><div class="panel-body"></div></div>';
    plate.querySelector('.mfold-name').textContent = name(sec);
    var body = plate.querySelector('.panel-body'); kids.forEach(function (k) { body.appendChild(k); });
    sec.appendChild(plate); sec.classList.add('has-mfold');
    if (window.Accordion && Accordion.bind) Accordion.bind(plate);
    made.push({ sec: sec, plate: plate, kids: kids });
  }
  function unwrap (m) { m.kids.forEach(function (k) { m.sec.insertBefore(k, m.plate); }); m.plate.remove(); m.sec.classList.remove('has-mfold'); }
  function open (sec) {
    made.forEach(function (m) {
      if (m.sec !== sec) return;
      var b = m.plate.querySelector(':scope > .panel-title'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click();
    });
  }
  /* the first fold of a run draws the line over it too: the section shown before it (a hidden one does not count) is not a fold */
  function edges () {
    made.forEach(function (m) {
      var p = m.sec.previousElementSibling;
      while (p && (p.hidden || getComputedStyle(p).display === 'none')) p = p.previousElementSibling;
      m.sec.classList.toggle('is-mfold-first', !(p && p.classList.contains('has-mfold')));
    });
  }
  function sync () {
    if (mq.matches) { [].forEach.call(document.querySelectorAll('section[data-mfold]'), wrap); edges(); }
    else { made.forEach(function (m) { unwrap(m); m.sec.classList.remove('is-mfold-first'); }); made = []; }
  }

  function start () {
    sync(); if (mq.addEventListener) mq.addEventListener('change', sync);
    document.addEventListener('click', function (e) {   /* a link into a folded section opens it before the page goes there */
      var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
      var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) open(t);
    }, true);
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) open(t); }
  }
  window.MobileFold = { open: open, sync: sync };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
