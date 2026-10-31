/* select.js — the kit's own dropdown for a <select class="select"> (2026-10-31).
   The open list is the kit's, not the browser's: the same list the Nova Poshta fields open
   (field.css «SUGGEST» — .suggest-list > .suggest-opt), on every select of a page that loads this file.

     <label class="field"><span class="field-label">City</span>
       <select class="select" name="city" required>…</select></label>

   The <select> stays — it is what the form sends, what order.js reads and sets (value,
   data-when, data-off-when, required, aria-invalid) — kept in the field but not drawn
   (.select-native). In front of it a button.select.select-btn says the chosen option (the
   empty first option is the placeholder, in the faint ink) and opens ul.suggest-list.select-list
   under the field. A value set by a script, an option switched off or renamed, an error marked on
   the select: the button follows. ↑ ↓ / Home End move, Enter / Space take, Esc closes, a letter
   jumps to the next option that starts with it. A choice fires input + change on the select.

   Runs itself on DOMContentLoaded; KitSelect.bind(root) for selects added later. No dependency. */
(function () {
  'use strict';
  var n = 0, VAL = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value'),
      IDX = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');

  function enhance(sel) {
    if (sel.__kitSelect || sel.multiple || sel.size > 1) return;
    var id = 'ks' + (++n), box = sel.closest('.field') || sel.parentElement;
    box.classList.add('suggest', 'select-dd');
    var btn = document.createElement('button'), txt = document.createElement('span'), list = document.createElement('ul');
    btn.type = 'button'; btn.className = 'select select-btn'; btn.id = id + '-b';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id + '-l');
    txt.className = 'select-value'; btn.appendChild(txt);
    list.className = 'suggest-list select-list'; list.id = id + '-l'; list.setAttribute('role', 'listbox'); list.hidden = true;
    sel.parentNode.insertBefore(btn, sel); sel.parentNode.insertBefore(list, sel.nextSibling);   /* the button first: a wrapping <label> names it and a tap on the words opens it */
    sel.classList.add('select-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var opts = [], active = -1, typed = '', typedAt = 0;

    function sync() {
      var o = sel.options[IDX.get.call(sel)], ph = !o || o.value === '';
      txt.textContent = o ? o.textContent : '';
      btn.classList.toggle('is-placeholder', ph);
      btn.disabled = sel.disabled;
      ['aria-invalid', 'aria-describedby'].forEach(function (a) { if (sel.hasAttribute(a)) btn.setAttribute(a, sel.getAttribute(a)); else btn.removeAttribute(a); });
      if (sel.required) btn.setAttribute('aria-required', 'true'); else btn.removeAttribute('aria-required');
    }
    sel.__kitSelect = { sync: sync };
    /* a script that sets the value (order.js: an option switched off moves the choice) — the button follows */
    Object.defineProperty(sel, 'value', { configurable: true, get: function () { return VAL.get.call(sel); }, set: function (v) { VAL.set.call(sel, v); sync(); } });
    Object.defineProperty(sel, 'selectedIndex', { configurable: true, get: function () { return IDX.get.call(sel); }, set: function (v) { IDX.set.call(sel, v); sync(); } });
    new MutationObserver(function () { sync(); if (!list.hidden) draw(); })
      .observe(sel, { attributes: true, childList: true, subtree: true, characterData: true });

    function draw() {
      list.innerHTML = ''; opts = [];
      [].forEach.call(sel.options, function (o, i) {
        if (o.hidden || (o.value === '' && o.disabled)) return;   /* the placeholder is not a choice */
        var li = document.createElement('li'), b = document.createElement('b');
        li.className = 'suggest-opt'; li.id = id + '-o' + i; li.setAttribute('role', 'option'); li.dataset.i = i;
        b.textContent = o.textContent; li.appendChild(b);
        if (o.disabled) { li.setAttribute('aria-disabled', 'true'); li.classList.add('is-disabled'); }
        li.setAttribute('aria-selected', i === IDX.get.call(sel) ? 'true' : 'false');
        list.appendChild(li); opts.push(li);
      });
      if (!opts.length) { var e = document.createElement('li'); e.className = 'suggest-empty'; e.textContent = '—'; list.appendChild(e); }
    }
    function mark(k) {
      active = k; opts.forEach(function (li, j) { li.classList.toggle('is-active', j === k); });
      if (opts[k]) { btn.setAttribute('aria-activedescendant', opts[k].id); opts[k].scrollIntoView({ block: 'nearest' }); } else btn.removeAttribute('aria-activedescendant');
    }
    var usable = function (k) { return opts[k] && !opts[k].classList.contains('is-disabled'); };
    function step(from, dir) { for (var k = from + dir; k >= 0 && k < opts.length; k += dir) if (usable(k)) return k; return from; }
    function open() {
      if (btn.disabled || !list.hidden) return;
      draw(); list.hidden = false; btn.setAttribute('aria-expanded', 'true'); box.classList.add('is-open');
      var cur = -1; opts.forEach(function (li, j) { if (+li.dataset.i === IDX.get.call(sel)) cur = j; });
      mark(cur >= 0 ? cur : step(-1, 1));
    }
    function close() { if (list.hidden) return; list.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant'); box.classList.remove('is-open'); }
    function take(k) {
      if (!usable(k)) return;
      var i = +opts[k].dataset.i, changed = i !== IDX.get.call(sel);
      IDX.set.call(sel, i); sync(); close(); btn.focus();
      if (changed) { sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
      if (sel.validity.valid && sel.getAttribute('aria-invalid')) {   /* chosen: the error under it goes, as typing clears a field's */
        sel.removeAttribute('aria-invalid'); var line = box.querySelector('.field-error'); if (line) line.remove(); }
    }

    btn.addEventListener('click', function () { if (list.hidden) open(); else close(); });
    btn.addEventListener('keydown', function (e) {
      var k = e.key;
      if (list.hidden) { if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); open(); } return; }
      if (k === 'ArrowDown') { e.preventDefault(); mark(step(active, 1)); }
      else if (k === 'ArrowUp') { e.preventDefault(); mark(step(active, -1)); }
      else if (k === 'Home') { e.preventDefault(); mark(step(-1, 1)); }
      else if (k === 'End') { e.preventDefault(); mark(step(opts.length, -1)); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); take(active); }
      else if (k === 'Escape') { e.preventDefault(); close(); }
      else if (k === 'Tab') close();
      else if (k.length === 1 && /\S/.test(k)) {   /* type-ahead */
        var now = Date.now(); typed = (now - typedAt < 700 ? typed : '') + k.toLowerCase(); typedAt = now;
        var from = typed.length > 1 ? active - 1 : active;   /* a word typed on stays where it matched; one letter moves on */
        for (var j = 1; j <= opts.length; j++) { var c = ((from + j) % opts.length + opts.length) % opts.length;
          if (usable(c) && opts[c].textContent.trim().toLowerCase().indexOf(typed) === 0) { mark(c); break; } }
      }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });   /* the focus stays on the button */
    /* preventDefault: the list sits inside the field's <label>, which would pass the click on to its control — the
       button — and open the list again the moment it closed (2026-10-31) */
    list.addEventListener('click', function (e) { e.preventDefault(); var li = e.target.closest('.suggest-opt'); if (li) take(opts.indexOf(li)); });
    list.addEventListener('mousemove', function (e) { var li = e.target.closest('.suggest-opt'); if (li && usable(opts.indexOf(li))) mark(opts.indexOf(li)); });
    btn.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== btn) close(); }, 120); });
    document.addEventListener('pointerdown', function (e) { if (!box.contains(e.target)) close(); });
    sel.addEventListener('focus', function () { btn.focus(); });   /* order.js focuses the first wrong field — the button takes it */
    if (sel.form) sel.form.addEventListener('reset', function () { setTimeout(sync, 0); });
    sync();
  }

  function bind(root) { [].forEach.call((root || document).querySelectorAll('select.select'), enhance); }
  window.KitSelect = { bind: bind, sync: function (sel) { if (sel && sel.__kitSelect) sel.__kitSelect.sync(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bind(); }); else bind();
})();
