/* ─────────────────────────────────────────────────────────────────────────────
   Locale — the location picker's behaviour, one source (2026-10-18)
   The look is locale.css. Until today the same forty lines lived in two copies, the
   landing's landing.js and the guide's manual.js, and had already begun to differ
   (one toggled a region off on a second press, one did not). This is the one.

     <a class="lang-mark locale locale-lang" href="#regions" aria-controls="regions">…</a>
     <div class="regions" id="regions" role="dialog" aria-modal="true">
       <a class="regions-scrim" href="#"></a>
       <div class="regions-sheet"> … <a class="regions-x" href="#"></a>
         <nav class="regions-list"><a class="region" href="/de/" data-region="de"
           data-short="De" lang="de">…</a> …</nav></div></div>

   Contract:
   · The trigger opens the sheet; the ×, the scrim and Esc close it, and the focus goes
     back to the trigger. Without the script the sheet still opens and closes on
     `:target` — the links are real links.
   · A region is a link to its page. Pressing it remembers the choice in localStorage
     `akv-region` — the key the passport and the landing already share, so the reader's
     region is one setting across the A1 pages — and follows the link.
   · The current region is the row the page marks `aria-current="true"`; failing that,
     the row whose `lang` is the page's own. Pressing the current one only closes.
   · An empty `.locale-code` in the trigger is filled with that row's `data-short`.
   Runs itself once the page is parsed.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var KEY = 'akv-region';
  function init() {
    var sheet = document.getElementById('regions');
    if (!sheet) return;
    var triggers = [].slice.call(document.querySelectorAll('a.lang-mark.locale[href="#regions"], a.lang-mark.locale[aria-controls="regions"]'));
    if (!triggers.length) return;
    var root = document.documentElement, last = null;
    var lang = (root.lang || 'en').toLowerCase();
    var rows = [].slice.call(sheet.querySelectorAll('.region'));
    var cur = rows.filter(function (r) { return r.getAttribute('aria-current') === 'true'; })[0] ||
              rows.filter(function (r) { return (r.getAttribute('lang') || '').toLowerCase() === lang; })[0];
    if (cur) {
      rows.forEach(function (r) { if (r === cur) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current'); });
      triggers.forEach(function (t) {
        var c = t.querySelector('.locale-code');
        if (c && !c.textContent.trim()) c.textContent = cur.getAttribute('data-short') || '';
      });
    }
    function set(open) {
      sheet.classList.toggle('is-open', open);
      root.classList.toggle('regions-lock', open);
      if (open) { var x = sheet.querySelector('.regions-x'); if (x) x.focus({ preventScroll: true }); }
      else if (last) last.focus({ preventScroll: true });
    }
    triggers.forEach(function (t) {
      t.addEventListener('click', function (e) { e.preventDefault(); last = t; set(true); });
    });
    sheet.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      if (a.classList.contains('region')) {
        try { localStorage.setItem(KEY, a.getAttribute('data-region') || ''); } catch (err) {}
        if (a.getAttribute('aria-current') === 'true') { e.preventDefault(); set(false); }
        return;
      }
      if (a.getAttribute('href') === '#') { e.preventDefault(); set(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('is-open')) set(false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
