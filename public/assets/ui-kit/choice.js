/* choice.js — the behaviour of a counted choice (choice.css «A COUNTED CARD», 2026-10-25).
   A page that cannot load kit.js (a landing) uses this; a tool may too.

     .choice.is-count > … .stepper > [data-step="-1"] · input[type=number] · [data-step="1"]
       − / + step the count within the input's min…max (0…20 if unset); the end of the range
       dims its button; a tap on the card (not on the stepper), or Enter / Space on it, takes
       one or puts it back; the counter shows only while the count is over 0;
       the card is `.is-on` while the count is over 0. Each change fires `input` on the field
       (it bubbles), so a form listening for input recounts.
     Choice.sync(root)   re-reads the counts after a script set a value itself.

     .choice-finish[data-device="K1"]   a row of finishes in a card (2026-10-25), built from the
       catalogue (window.DEVICES / COLOURS, ui-kit/devices/devices.js): swatch.css's discs and
       the finish's name under them. data-colours="black steel" picks some of the device's
       finishes (all by default), data-default the first chosen. A disc chosen: a picture
       [data-device-pic="K1"] in the card, if there is one, turns to that finish (data-src="…/{img}.png", the
       catalogue's image name), a hidden input inside the row gets the finish's id, the card's
       own radio is chosen, and the card gets data-finish-label (the strip and the bar read it).

   Runs itself on DOMContentLoaded; no dependency. */
(function () {
  'use strict';
  var $$ = function (r, s) { return [].slice.call(r.querySelectorAll(s)); };
  var lim = function (i) { return [i.min === '' ? 0 : +i.min, i.max === '' ? 20 : +i.max]; };
  var cards = function (root) { root = root || document;
    return root.matches && root.matches('.choice.is-count') ? [root] : $$(root, '.choice.is-count'); };
  function sync(root) {
    cards(root).forEach(function (c) {
      var i = c.querySelector('input[type=number]'); if (!i) return;
      var v = +i.value || 0, m = lim(i);
      c.classList.toggle('is-on', v > 0);
      $$(c, '[data-step]').forEach(function (b) { b.disabled = +b.dataset.step < 0 ? v <= m[0] : v >= m[1]; });
    });
  }
  function set(i, v) { var m = lim(i); i.value = Math.max(m[0], Math.min(m[1], v)); i.dispatchEvent(new Event('input', { bubbles: true })); sync(i.closest('.choice')); }
  function bind(root) {
    cards(root).forEach(function (c) {
      if (c.__choice) return; c.__choice = true;
      var i = c.querySelector('input[type=number]'); if (!i) return;
      c.addEventListener('click', function (e) { if (e.target.closest('.stepper')) return; set(i, +i.value > 0 ? 0 : 1); });
      /* The counter is hidden at 0, so the card itself takes the keyboard: Enter / Space = a tap. */
      if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
      c.setAttribute('role', 'button');
      c.addEventListener('keydown', function (e) {
        if (e.target !== c || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault(); set(i, +i.value > 0 ? 0 : 1); });
      $$(c, '[data-step]').forEach(function (b) { b.addEventListener('click', function () { set(i, (+i.value || 0) + +b.dataset.step); }); });
      i.addEventListener('input', function () { sync(c); });
    });
    sync(root);
  }
  /* FINISHES */
  function finishes(root) {
    var DEV = {}, COL = {};
    (window.DEVICES || []).forEach(function (d) { if (!DEV[d.code]) DEV[d.code] = d; });
    (window.COLOURS || []).forEach(function (c) { COL[c.id] = c; });
    $$(root || document, '.choice-finish[data-device]').forEach(function (row) {
      if (row.__finish) return; row.__finish = true;
      var d = DEV[row.dataset.device]; if (!d) return;
      var card = row.closest('.choice'), field = row.querySelector('input[type=hidden]');
      var list = row.dataset.colours ? row.dataset.colours.split(/\s+/) : (d.colours || []);
      var discs = document.createElement('div'); discs.className = 'pair-row';
      discs.setAttribute('role', 'radiogroup'); discs.setAttribute('aria-label', d.code + ' finish');
      var name = document.createElement('span'); name.className = 'pair-name';
      var pick = function (fid, quiet) {
        $$(discs, '.swatch-btn').forEach(function (b) { var on = b.dataset.id === fid; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); });
        var label = (COL[fid] || {}).label || fid; label = (window.KitLang && KitLang.t && KitLang.t(label)) || label; name.textContent = label;   /* a finish name through the page's language, if it has one (2026-10-29) */
        if (field) field.value = fid;
        if (card) card.dataset.finishLabel = label;
        var img = card && card.querySelector('[data-device-pic="' + d.code + '"]'), file = d.imgs && d.imgs[fid];
        if (img && file && row.dataset.src) img.src = row.dataset.src.replace('{img}', file);
        if (quiet) return;
        var radio = card && card.querySelector('input[type=radio]');
        if (radio && !radio.checked) radio.checked = true;
        (radio || field || row).dispatchEvent(new Event('change', { bubbles: true }));
      };
      list.forEach(function (fid) {
        var c = COL[fid] || {}, b = document.createElement('button');
        b.type = 'button'; b.className = 'swatch-btn' + (c.hex2 ? ' swatch-split' : ''); b.dataset.id = fid;
        b.setAttribute('role', 'radio'); b.setAttribute('aria-label', (window.KitLang && KitLang.t && KitLang.t(c.label || fid)) || c.label || fid);
        if (c.hex2) { b.style.setProperty('--swatch-a', c.hex); b.style.setProperty('--swatch-b', c.hex2); } else b.style.background = c.hex || 'transparent';
        b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); pick(fid); });
        discs.appendChild(b);
      });
      row.appendChild(discs); row.appendChild(name);
      pick(list.indexOf(row.dataset.default) >= 0 ? row.dataset.default : list[0], true);
    });
  }

  window.Choice = { bind: bind, sync: sync, finishes: finishes };
  var go = function () { finishes(); bind(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
