/* ─────────────────────────────────────────────────────────────────────────────
   Grid overlay — the layout grid over a page, and the button that shows it (2026-10-12)

   One <script src="…/ui-kit/grid-overlay.js" defer> and nothing else: it adds the overlay
   (`.grid-overlay`, one cell per grid.css column at the current width) and a frosted round
   button in the bottom-right corner (`.btn.btn-frost.btn-round.grid-fab`). The choice is
   kept in this browser only (localStorage `akv-kit-grid`, the preview's key, so the kit's
   preview and a page agree). Styles: grid.css. Requires tokens, grid, button.
   For a preview or a prototype; take the script tag out before a page goes live.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var K = 'akv-kit-grid';
  function init() {
    if (document.querySelector('.grid-overlay')) return;
    var o = document.createElement('div'); o.className = 'grid-overlay'; o.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 20; i++) o.appendChild(document.createElement('i'));
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-frost btn-round grid-fab';
    b.innerHTML = '<i data-icon="columns-3" data-size="16"></i>';   /* the kit's icon (icons.js) */
    document.body.append(o, b);
    var fill = function () {
      var n = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-cols'), 10) || 12;
      [].forEach.call(o.children, function (c, i) { c.style.display = i < n ? '' : 'none'; });
    };
    var set = function (on) {
      o.classList.toggle('is-on', on); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Hide grid' : 'Show grid'); b.title = on ? 'Hide grid' : 'Show grid';
      try { localStorage.setItem(K, on ? '1' : ''); } catch (e) {}
    };
    b.addEventListener('click', function () { set(!o.classList.contains('is-on')); });
    addEventListener('resize', fill); fill();
    var on = false; try { on = localStorage.getItem(K) === '1'; } catch (e) {}
    set(on);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
