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
       Not in the catalogue: data-swatches='[{id, label, hex, img}, …]' on the row (2026-10-29 —
       the accessories' colours); the same discs, the same picture swap.

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
      var d = DEV[row.dataset.device], cols = COL;
      /* A thing not in the catalogue (an accessory, 2026-10-29) brings its finishes along:
         data-swatches='[{"id":"black","label":"Black","hex":"#2A2A2B","img":"club-go500-bk"}, …]' */
      if (!d && row.dataset.swatches) { try { var sw = JSON.parse(row.dataset.swatches); d = { code: row.dataset.device, colours: [], imgs: {} };
        cols = Object.assign({}, COL);
        sw.forEach(function (c) { d.colours.push(c.id); d.imgs[c.id] = c.img; cols[c.id] = c; });   /* this row's own — the catalogue's «black» stays the taps' */ } catch (e) { d = null; } }
      if (!d) return;
      var card = row.closest('.choice'), field = row.querySelector('input[type=hidden]');
      var list = row.dataset.colours ? row.dataset.colours.split(/\s+/) : (d.colours || []);
      var discs = document.createElement('div'); discs.className = 'pair-row';
      discs.setAttribute('role', 'radiogroup'); discs.setAttribute('aria-label', d.code + ' finish');
      var name = document.createElement('span'); name.className = 'pair-name';
      var pick = function (fid, quiet) {
        $$(discs, '.swatch-btn').forEach(function (b) { var on = b.dataset.id === fid; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); });
        var label = (cols[fid] || {}).label || fid; label = (window.KitLang && KitLang.t && KitLang.t(label)) || label; name.textContent = label;   /* a finish name through the page's language, if it has one (2026-10-29) */
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
        var c = cols[fid] || {}, b = document.createElement('button');
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

  /* CUSTOM (2026-10-29) — a thing the buyer puts a name on (the towel): a switch in the card, and
     a popup with the thing large and the name on it, as it will be embroidered.
       <div class="choice-custom" data-label="Your name on it" data-ask="Your towel" data-note="…"
            data-max="28" data-extra="5" data-art="…/club-towel-plain.webp"
            data-inks='[{"id":"blue","label":"Blue","hex":"#2F55BE"}, …]'>
         <input type="hidden" name="towel_name"><input type="hidden" name="towel_ink" value="blue"></div>
     On: the popup (popup.css) asks the name and the colour, the picture showing it as it is typed —
     the mark, then the name, left-aligned; a long name gets smaller, and a name too long for one line
     breaks before the surname. Saved: the card's picture is that art, the card is taken (1 if 0), its
     price goes up by data-extra, data-finish-label «Name» · Blue. Cancelled with no name: off again.
     Off: the plain thing at its own price. The art is .custom-art (choice.css), drawn in cqw, so the
     same piece fits the card's 116 and the popup's 420. */
  var L = function (t) { return (window.KitLang && KitLang.t && KitLang.t(t)) || t; };
  var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
  var MARK = function () { var m = document.querySelector('.header-mark svg'); return m ? m.outerHTML : '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="3"/></svg>'; };
  function art(src) {
    var el = document.createElement('div'); el.className = 'custom-art';
    el.innerHTML = '<img src="' + src + '" alt=""><div class="custom-print"><span class="custom-mark">' + MARK() + '</span><span class="custom-name"></span></div>';
    var name = el.querySelector('.custom-name'), text = '';
    var fit = function () {   /* the name as large as fits: one line from 6.4 down to 4.2 % of the art; then two lines (name / surname) from 5.2 down to 2.8 % */
      var W = el.clientWidth; if (!W) return; var max = W * .509, words = text.split(' ');
      var at = function (pc, two) { name.style.fontSize = (W * pc / 100) + 'px';
        name.innerHTML = two ? esc(words[0]) + '<br>' + esc(words.slice(1).join(' ')) : esc(text); return name.scrollWidth <= max + 0.5; };
      for (var pc = 6.4; pc >= 4.2; pc -= .2) if (at(pc, false)) return;
      if (words.length > 1) for (pc = 5.2; pc >= 2.8; pc -= .2) if (at(pc, true)) return;
      at(words.length > 1 ? 2.8 : 4.2, words.length > 1);
    };
    if (window.ResizeObserver) new ResizeObserver(fit).observe(el);
    return { el: el, set: function (t, hex) { text = (t || '').replace(/\s+/g, ' ').trim(); el.style.setProperty('--custom-ink', hex || '#2F55BE'); el.classList.toggle('is-empty', !text); fit(); } };
  }
  var pop = null;
  function editor(o) {   /* o: { title, note, max, art, inks, name, ink, done(name|null, ink) } */
    if (!pop) {
      pop = document.createElement('div'); pop.className = 'popup-overlay'; pop.hidden = true;
      pop.innerHTML = '<div class="popup is-start custom-pop" role="dialog" aria-modal="true" aria-labelledby="custom-t">'
        + '<button class="icon-btn popup-close" type="button" data-x></button>'
        + '<div class="popup-header"><div class="popup-title" id="custom-t"></div><div class="popup-text"></div></div>'
        + '<div class="custom-stage"></div>'
        + '<label class="field"><input class="dark-input" type="text" autocomplete="off" spellcheck="false"></label>'
        + '<div class="custom-inks"><div class="pair-row"></div><span class="pair-name"></span></div>'
        + '<div class="popup-actions"><button class="btn btn-tertiary" type="button" data-x></button><button class="btn btn-secondary" type="button" data-ok></button></div></div>';
      document.body.appendChild(pop);
      pop.querySelector('.popup-close').innerHTML = window.KitIcons ? KitIcons.svg('x', { size: 16 }) : '×';
    }
    var input = pop.querySelector('input'), back = document.activeElement, ink = o.ink, a = art(o.art);
    var stage = pop.querySelector('.custom-stage'); stage.innerHTML = ''; stage.appendChild(a.el);
    pop.querySelector('.popup-title').textContent = o.title; pop.querySelector('.popup-text').textContent = o.note || '';
    pop.querySelector('.popup-close').setAttribute('aria-label', L('Close'));
    pop.querySelector('[data-ok]').textContent = L('Save'); pop.querySelector('.popup-actions [data-x]').textContent = L('Cancel');
    input.maxLength = o.max || 28; input.value = o.name || ''; input.placeholder = L('Your name'); input.setAttribute('aria-label', L('Your name'));
    var hexOf = function (id) { return (o.inks.filter(function (k) { return k.id === id; })[0] || o.inks[0]).hex; };
    var row = pop.querySelector('.custom-inks .pair-row'), nm = pop.querySelector('.custom-inks .pair-name'); row.innerHTML = '';
    var draw = function () { a.set(input.value || L('Your name'), hexOf(ink));
      [].forEach.call(row.children, function (b) { var on = b.dataset.id === ink; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); });
      var k = o.inks.filter(function (k) { return k.id === ink; })[0]; nm.textContent = k ? L(k.label) : ''; };
    o.inks.forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.className = 'swatch-btn'; b.dataset.id = k.id;
      b.setAttribute('role', 'radio'); b.setAttribute('aria-label', L(k.label)); b.style.background = k.hex;
      b.addEventListener('click', function () { ink = k.id; draw(); }); row.appendChild(b); });
    row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', L('Colour'));
    input.oninput = draw;
    var end = function (v) { pop.hidden = true; document.removeEventListener('keydown', key, true); pop.onclick = null; input.oninput = null; if (back && back.focus) back.focus(); o.done(v, ink); };
    var save = function () { var v = input.value.replace(/\s+/g, ' ').trim(); if (!v) { input.focus(); input.classList.add('is-error'); setTimeout(function () { input.classList.remove('is-error'); }, 900); return; } end(v); };
    var key = function (e) { if (e.key === 'Escape') { e.preventDefault(); end(null); } else if (e.key === 'Enter' && e.target === input) { e.preventDefault(); save(); } };
    pop.onclick = function (e) { if (e.target === pop || e.target.closest('[data-x]')) end(null); else if (e.target.closest('[data-ok]')) save(); };
    document.addEventListener('keydown', key, true);
    pop.hidden = false; draw(); setTimeout(function () { input.focus(); input.select(); }, 0);
  }
  function customs(root) {
    $$(root || document, '.choice-custom').forEach(function (row) {
      if (row.__custom) return; row.__custom = true;
      var card = row.closest('.choice'), form = row.closest('form');
      var nameF = row.querySelector('input[name$="_name"]'), inkF = row.querySelector('input[name$="_ink"]');
      var count = card && card.querySelector('input[type=number]'), price = card && card.querySelector('.choice-price');
      var inks = []; try { inks = JSON.parse(row.dataset.inks || '[]'); } catch (e) {}
      var base = card ? +card.dataset.price || 0 : 0, extra = +row.dataset.extra || 0;
      var pics = card && card.querySelector('.choice-pics'), pic = pics && pics.querySelector('.choice-pic'), a = art(row.dataset.art || (pic && pic.src) || '');
      a.el.classList.add('choice-pic'); a.el.hidden = true; if (pics) pics.appendChild(a.el);
      row.innerHTML += '<div class="toggle-row is-lead"><button class="toggle-switch" type="button" role="switch" aria-checked="false"><span class="toggle-knob"></span></button><span class="toggle-row-label"></span></div><div class="choice-text-line"></div>';
      var sw = row.querySelector('.toggle-switch'), line = row.querySelector('.choice-text-line');
      row.querySelector('.toggle-row-label').textContent = L(row.dataset.label || 'Your name on it');
      sw.setAttribute('aria-label', L(row.dataset.label || 'Your name on it'));
      nameF = row.querySelector('input[name$="_name"]'); inkF = row.querySelector('input[name$="_ink"]');
      row.addEventListener('click', function (e) { e.stopPropagation(); });   /* not a tap on the card */
      var money = function (eur) { var cur = form && form.dataset.currency, rate = form && +form.dataset.rate || 1;
        return cur === 'UAH' ? new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(Math.round(eur * rate)) : '€' + eur.toFixed(2); };
      var hexOf = function (id) { return (inks.filter(function (k) { return k.id === id; })[0] || inks[0] || {}).hex; };
      var labelOf = function (id) { var k = inks.filter(function (k) { return k.id === id; })[0]; return k ? L(k.label) : ''; };
      var paint = function () { var v = nameF.value, on = !!v;
        sw.setAttribute('aria-checked', on ? 'true' : 'false');
        line.innerHTML = on ? '<span>«' + esc(v) + '»</span><button class="btn-link" type="button">' + esc(L('Edit')) + '</button>' : '';
        if (pic) pic.hidden = on; a.el.hidden = !on; if (on) a.set(v, hexOf(inkF.value));
        if (card) { card.dataset.price = String(base + (on ? extra : 0)); if (on) card.dataset.finishLabel = '«' + v + '» · ' + labelOf(inkF.value); else delete card.dataset.finishLabel; }
        if (price) price.textContent = money(base + (on ? extra : 0));
        nameF.dispatchEvent(new Event('change', { bubbles: true })); };
      var setCount = function (n) { if (!count) return; count.value = n; count.dispatchEvent(new Event('input', { bubbles: true })); sync(card); };
      var open = function () { editor({ title: L(row.dataset.ask || 'Your name on it'), note: L(row.dataset.note || ''), max: +row.dataset.max || 28,
        art: row.dataset.art || (pic && pic.src), inks: inks, name: nameF.value, ink: inkF.value || (inks[0] || {}).id,
        done: function (v, ink) { if (v) { nameF.value = v; inkF.value = ink; if (count && !(+count.value)) setCount(1); } paint(); } }); };
      sw.addEventListener('click', function () { if (nameF.value) { nameF.value = ''; paint(); } else open(); });
      line.addEventListener('click', function (e) { if (e.target.closest('button')) open(); });
      paint();
    });
  }

  window.Choice = { bind: bind, sync: sync, finishes: finishes, customs: customs, art: art };
  var go = function () { finishes(); customs(); bind(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
