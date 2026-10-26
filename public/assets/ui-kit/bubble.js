/* ─────────────────────────────────────────────────────────────────────────────
   Bubble — its behaviour (2026-10-26). The look and the markup: bubble.css.

   Any [data-bubble="words"] is an (i): a click opens one bubble for the page with those words
   under it (over it, without room), a second click, a click elsewhere, Esc or a scroll away
   close it. Inside a <label> the click is the (i)'s own — the choice it sits on is not taken.
   aria-expanded on the (i), aria-describedby to the bubble while open. Words are set as text
   (no HTML); a page in another language translates the attribute (preview/lang.js does).
   Runs itself; no kit.js.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var tip = null, owner = null, GAP = 10, EDGE = 16;
  function make() {
    tip = document.createElement('div'); tip.className = 'bubble'; tip.id = 'kit-bubble'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    document.body.appendChild(tip);
  }
  function place() {
    if (!owner) return;
    var r = owner.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var cx = r.left + r.width / 2, x = Math.max(EDGE, Math.min(vw - EDGE - w, cx - w / 2));
    var above = r.bottom + GAP + h > vh - EDGE && r.top - GAP - h > EDGE;
    tip.classList.toggle('is-above', above);
    tip.style.left = Math.round(x) + 'px';
    tip.style.top = Math.round(above ? r.top - GAP - h : r.bottom + GAP) + 'px';
    tip.style.setProperty('--bubble-nose', Math.round(Math.max(14, Math.min(w - 14, cx - x))) + 'px');
  }
  function close(refocus) {
    if (!owner) return;
    var b = owner; owner = null;
    b.setAttribute('aria-expanded', 'false'); b.removeAttribute('aria-describedby');
    tip.classList.remove('is-open'); tip.hidden = true;
    if (refocus) b.focus();
  }
  function open(b) {
    if (!tip) make();
    close(); owner = b;
    tip.textContent = b.getAttribute('data-bubble');
    tip.hidden = false; place();
    b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-describedby', tip.id);
    requestAnimationFrame(function () { tip.classList.add('is-open'); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-bubble]');
    if (b) { e.preventDefault(); e.stopPropagation(); if (owner === b) close(); else open(b); return; }   /* preventDefault: a label around it does not take its input */
    if (owner && !tip.contains(e.target)) close();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && owner) close(true); });
  window.addEventListener('resize', place);
  window.addEventListener('scroll', function () {
    if (!owner) return;
    var r = owner.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) close(); else place();
  }, true);
  function init() { [].forEach.call(document.querySelectorAll('[data-bubble]'), function (b) { if (!b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false'); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.KitBubble = { open: open, close: close };
})();
