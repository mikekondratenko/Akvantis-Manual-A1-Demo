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
  var SIDE = 1024, ROOM = 240;
  function place() {
    if (!owner) return;
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    tip.classList.remove('is-side'); tip.style.width = '';
    /* From 1024 (2026-11-11): beside the (i), to the end of its form or [data-bubble-within] box */
    if (vw >= SIDE) {
      var o = owner.getBoundingClientRect(), box = owner.closest('[data-bubble-within], form');
      var end = Math.min(vw - EDGE, box ? box.getBoundingClientRect().right - EDGE : vw - EDGE), sx = o.right + GAP, room = Math.floor(end - sx);
      if (room >= ROOM) {
        tip.classList.add('is-side'); tip.classList.remove('is-above'); tip.style.width = room + 'px';
        var sh = tip.offsetHeight, cy = o.top + o.height / 2, sy = Math.max(EDGE, Math.min(vh - EDGE - sh, cy - 20));
        tip.style.left = Math.round(sx) + 'px'; tip.style.top = Math.round(sy) + 'px';
        tip.style.setProperty('--bubble-nose-y', Math.round(Math.max(14, Math.min(sh - 14, cy - sy))) + 'px');
        return;
      }
    }
    var r = owner.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var cx = r.left + r.width / 2, x = Math.max(EDGE, Math.min(vw - EDGE - w, cx - w / 2));
    /* below 1024 always under the (i) (2026-11-11, Michael: on a phone it drops down); over it only beside-less desktops without room */
    var above = vw >= SIDE && r.bottom + GAP + h > vh - EDGE && r.top - GAP - h > EDGE;
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
