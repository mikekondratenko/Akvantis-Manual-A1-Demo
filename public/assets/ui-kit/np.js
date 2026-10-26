/* np.js — choosing a Nova Poshta branch or parcel locker in a form, from the carrier's own
   list (2026-10-26). The kit's field (field.css «SUGGEST»), Nova Poshta's public JSON API.

   MARKUP  <div class="np-pick" data-np="branch|locker" [data-np-endpoint] [data-np-weight="9"]
                [data-np-size="38x37x14"]>
             <div class="field suggest"> label · input[data-np-city] · ul.suggest-list </div>
             <div class="field suggest"> label · input[data-np-point][name][required] · ul </div>
             <input type="hidden" data-np-ref name="…_ref">
           </div>
   CITY    typed (Ukrainian — «Київ», «Львів»), searched with Address.searchSettlements; only
           places with branches are offered.
   POINT   once a city is taken: Address.getWarehouses of that place, filtered as typed (a number
           or a street). branch = post and cargo branches; locker = Nova Poshta parcel lockers.
           data-np-weight (kg) and data-np-size (cm, any order) leave out the points that cannot
           take the parcel — a branch «до 10 кг», a locker whose cell is too small.
   FILTER  also out: a locker «ТІЛЬКИ ДЛЯ МЕШКАНЦІВ» (residents only) and a point not working.
   VALUE   the point's line goes in the visible field (the order reads it), its Ref in the
           hidden one. Typed over and not taken from the list, the field says «Choose from the
           list» (a custom validity — order.js shows it on send).
   KEY     no API key: searchSettlements and getWarehouses answer without one. The endpoint is
           Nova Poshta's by default; a page with a worker points data-np-endpoint at its own
           proxy (where a key can be added and answers cached). */
(function () {
  var API = 'https://api.novaposhta.ua/v2.0/json/';
  var TYPES = { branch: ['841339c7-591a-42e2-8233-7a0a00f0ed6f', '9a68df70-0267-42a8-bb5c-37f427e36ee4'],   /* post · cargo branch */
                locker: ['f9316480-5f2d-425d-bc2c-ac7cd29decf0'] };                                          /* Nova Poshta parcel locker */
  var esc = function (t) { var d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; };

  function call(url, method, props, signal) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: signal,
      body: JSON.stringify({ apiKey: '', modelName: 'Address', calledMethod: method, methodProperties: props }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.success) throw new Error((j.errors || []).join(' ') || 'Nova Poshta'); return j.data; });
  }

  /* One combobox: an input, its list, a source (q → Promise of [{line, sub, value}]), and what
     to do when one is taken. ↑ ↓ move, Enter takes, Esc closes. */
  function combo(input, list, source, onPick, opts) {
    var box = input.closest('.suggest'), items = [], active = -1, timer, ctl, picked = null;
    var id = input.id || (input.id = 'np-' + Math.random().toString(36).slice(2, 8));
    list.id = id + '-list'; list.setAttribute('role', 'listbox'); list.hidden = true;
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id); input.setAttribute('aria-expanded', 'false'); input.autocomplete = 'off';
    var open = function (on) { list.hidden = !on; input.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    var mark = function (i) { active = i; [].forEach.call(list.children, function (li, j) { li.classList.toggle('is-active', j === i);
      if (j === i) { input.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); } }); };
    var draw = function () {
      list.innerHTML = items.length ? items.map(function (it, i) {
        return '<li class="suggest-opt" role="option" id="' + id + '-o' + i + '"><b>' + esc(it.line) + '</b>' + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</li>'; }).join('')
        : '<li class="suggest-empty">' + esc(opts.empty) + '</li>';
      active = -1; open(true);
    };
    var take = function (i) { var it = items[i]; if (!it) return; picked = it; input.value = it.line; input.setCustomValidity(''); open(false); onPick(it);
      input.dispatchEvent(new Event('input', { bubbles: true })); };
    var run = function () {
      var q = input.value.trim(); if (ctl) ctl.abort();
      if (q.length < (opts.min || 0)) { items = []; open(false); return; }
      ctl = new AbortController(); box.classList.add('is-busy');
      Promise.resolve().then(function () { return source(q, ctl.signal); }).then(function (r) { items = r; draw(); })
        .catch(function (e) { if (e.name !== 'AbortError') { items = []; list.innerHTML = '<li class="suggest-empty">Nova Poshta does not answer — try again in a minute</li>'; open(true); } })
        .then(function () { box.classList.remove('is-busy'); });
    };
    input.addEventListener('input', function (e) { if (!e.isTrusted) return;   /* our own event after a pick */
      picked = null; input.setCustomValidity(input.value.trim() ? 'Choose from the list' : ''); onPick(null);
      clearTimeout(timer); timer = setTimeout(run, 250); });
    input.addEventListener('focus', function () { if (!picked && (opts.min === 0 || input.value.trim().length >= opts.min)) run(); });
    input.addEventListener('keydown', function (e) {
      if (list.hidden) { if (e.key === 'ArrowDown') { run(); e.preventDefault(); } return; }
      if (e.key === 'ArrowDown') { mark(Math.min(items.length - 1, active + 1)); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { mark(Math.max(0, active - 1)); e.preventDefault(); }
      else if (e.key === 'Enter') { if (active >= 0) { take(active); e.preventDefault(); } }
      else if (e.key === 'Escape') { open(false); }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });   /* keep the focus in the field */
    list.addEventListener('click', function (e) { var li = e.target.closest('.suggest-opt'); if (li) take([].indexOf.call(list.children, li)); });
    input.addEventListener('blur', function () { setTimeout(function () { open(false); }, 120); });
    return { reset: function () { picked = null; items = []; input.value = ''; input.setCustomValidity(''); open(false); } };
  }

  function init(root) {
    var url = root.dataset.npEndpoint || API, kind = root.dataset.np === 'locker' ? 'locker' : 'branch';
    var kg = parseFloat(root.dataset.npWeight) || 0;
    var size = (root.dataset.npSize || '').split(/[x×]/).map(Number).filter(Boolean).sort(function (a, b) { return a - b; });
    var city = root.querySelector('[data-np-city]'), point = root.querySelector('[data-np-point]'), ref = root.querySelector('[data-np-ref]');
    var place = null;
    var fits = function (w) {
      var max = +w.PlaceMaxWeightAllowed || +w.TotalMaxWeightAllowed || 0;
      if (kg && max && max < kg) return false;
      var d = w.ReceivingLimitationsOnDimensions;
      if (size.length === 3 && d && d.Width) { var c = [d.Width, d.Height, d.Length].map(Number).sort(function (a, b) { return a - b; });
        if (size[0] > c[0] || size[1] > c[1] || size[2] > c[2]) return false; }
      if (/тільки для/i.test(w.Description)) return false;   /* «ТІЛЬКИ ДЛЯ МЕШКАНЦІВ» — a locker behind a door */
      return w.WarehouseStatus === 'Working' || !w.WarehouseStatus;
    };
    var pointBox = combo(point, point.parentNode.querySelector('.suggest-list'), function (q, signal) {
      if (!place) return Promise.resolve([]);   /* no city yet — nothing to list */
      return Promise.all(TYPES[kind].map(function (t) {
        return call(url, 'getWarehouses', { SettlementRef: place.Ref, TypeOfWarehouseRef: t, FindByString: q, Limit: '300', Page: '1' }, signal); }))
        .then(function (rs) { return [].concat.apply([], rs).filter(fits).sort(function (a, b) {   /* the number typed first: «55» → №55, then №55…, then the streets */
          var r = function (w) { return w.Number === q ? 0 : String(w.Number).indexOf(q) === 0 ? 1 : 2; };
          return r(a) - r(b) || a.Number - b.Number; }).slice(0, 60)
          .map(function (w) { var parts = w.Description.split(': '), limit = (parts[0].match(/\(([^)]*)\)/) || [])[1];
            /* «№12 · вул. Родини Бунге, 8», and under it what the point says of itself — «до 30 кг на одне місце» */
            return { line: '№' + w.Number + ' · ' + (parts.slice(1).join(': ') || w.ShortAddress), sub: limit || '', value: w.Ref }; }); });
    }, function (it) { ref.value = it ? it.value : ''; }, { min: 0, empty: kind === 'locker' ? 'No parcel locker here takes this parcel — try a branch' : 'Nothing found — try the number or the street' });
    /* Held until a city is taken: disabled, and data-hold tells order.js (which turns hidden
       fields off and back on) to leave it off when the row opens. */
    var hold = function (on) { point.disabled = on; if (on) point.dataset.hold = ''; else delete point.dataset.hold; };
    hold(true);
    combo(city, city.parentNode.querySelector('.suggest-list'), function (q, signal) {
      return call(url, 'searchSettlements', { CityName: q, Limit: '20', Page: '1' }, signal).then(function (d) {
        return ((d[0] && d[0].Addresses) || []).filter(function (a) { return a.Warehouses > 0; })
          .map(function (a) { return { line: a.Present, value: a }; }); });
    }, function (it) {
      place = it ? it.value : null; pointBox.reset(); ref.value = '';
      hold(!place); point.required = true;
      if (place) setTimeout(function () { point.focus(); }, 0);
    }, { min: 2, empty: 'No such place with a Nova Poshta branch — type it in Ukrainian: Київ, Львів…' });
  }

  var go = function () { [].forEach.call(document.querySelectorAll('.np-pick'), init); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
