/* ─────────────────────────────────────────────────────────────────────────────
   Accordion — the collapsible plate's behaviour, one source (2026-10-12)

   The look is panel.css (+ page.css on a page). Until today the four lines that open it
   lived in three copies: the passport's app.js, the preview's inline script, and the
   landing's landing.js. This is the one.

     <div class="plate">
       <button class="panel-title" type="button" aria-expanded="false" aria-controls="q1">
         <span>Question</span><svg class="panel-chevron">…</svg></button>
       <div class="panel-fold" id="q1" data-open="false" inert>
         <div class="panel-body"><p>Answer</p></div></div>
     </div>

   Contract: the button's aria-expanded, the fold's data-open (panel.css animates 0fr → 1fr
   on it) and `inert` on a closed fold, so a Tab cannot land inside it. `data-accordion="one"`
   on a container keeps one open at a time inside it.

   Runs itself on every `button.panel-title[aria-controls]` once the page is parsed; a page
   that adds plates later calls `Accordion.bind(root)`. No dependency, no kit.js.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  function set(btn, open) {
    var fold = document.getElementById(btn.getAttribute('aria-controls'));
    if (!fold) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    fold.dataset.open = open ? 'true' : 'false';
    fold.inert = !open;
  }
  function bind(root) {
    (root || document).querySelectorAll('button.panel-title[aria-controls]').forEach(function (btn) {
      if (btn.dataset.accordionBound) return;
      btn.dataset.accordionBound = '1';
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        var group = btn.closest('[data-accordion="one"]');
        if (open && group) group.querySelectorAll('button.panel-title[aria-expanded="true"]').forEach(function (b) { if (b !== btn) set(b, false); });
        set(btn, open);
        btn.dispatchEvent(new CustomEvent('accordion', { bubbles: true, detail: { open: open } }));
      });
    });
  }
  window.Accordion = { bind: bind, set: set };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bind(); });
  else bind();
})();
