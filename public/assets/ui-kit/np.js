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
   CITY    data-np="city": the place alone (the courier's city, before the street).
   QUOTE   label[data-np-quote] — Nova Poshta's price and date for the place, see QUOTE below.
   KEY     no API key: searchSettlements and getWarehouses answer without one. The endpoint is
           Nova Poshta's by default; a page with a worker points data-np-endpoint at its own
           proxy (where a key can be added and answers cached). */
(function () {
  var API = 'https://api.novaposhta.ua/v2.0/json/';
  var TYPES = { branch: ['841339c7-591a-42e2-8233-7a0a00f0ed6f', '9a68df70-0267-42a8-bb5c-37f427e36ee4'],   /* post · cargo branch */
                locker: ['f9316480-5f2d-425d-bc2c-ac7cd29decf0'] };                                          /* Nova Poshta parcel locker */
  var T = function (s) { return (window.KitLang && KitLang.t && KitLang.t(s)) || s; };   /* the words, as in order.js */
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
        .catch(function (e) { if (e.name !== 'AbortError') { items = []; list.innerHTML = '<li class="suggest-empty">' + esc(T('Nova Poshta does not answer — try again in a minute')) + '</li>'; open(true); } })
        .then(function () { box.classList.remove('is-busy'); });
    };
    input.addEventListener('input', function (e) { if (!e.isTrusted) return;   /* our own event after a pick */
      picked = null; input.setCustomValidity(input.value.trim() ? T('Choose from the list') : ''); onPick(null);
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
    var form = root.closest('form'), place = null;
    /* A place chosen here is the place of every Nova Poshta row that has none yet (a branch → the
       locker, the courier), and the place the prices are asked for (QUOTE, below). */
    var tell = function (p) { var r = form && form.querySelector('[data-np-city-ref]'); if (r) r.value = p ? p.DeliveryCity : '';
      if (form) form.dispatchEvent(new CustomEvent('np-city', { detail: { place: p, from: root } })); };
    var fits = function (w) {
      var max = +w.PlaceMaxWeightAllowed || +w.TotalMaxWeightAllowed || 0;
      if (kg && max && max < kg) return false;
      var d = w.ReceivingLimitationsOnDimensions;
      if (size.length === 3 && d && d.Width) { var c = [d.Width, d.Height, d.Length].map(Number).sort(function (a, b) { return a - b; });
        if (size[0] > c[0] || size[1] > c[1] || size[2] > c[2]) return false; }
      if (/тільки для/i.test(w.Description)) return false;   /* «ТІЛЬКИ ДЛЯ МЕШКАНЦІВ» — a locker behind a door */
      return w.WarehouseStatus === 'Working' || !w.WarehouseStatus;
    };
    var pointBox = point && combo(point, point.parentNode.querySelector('.suggest-list'), function (q, signal) {
      if (!place) return Promise.resolve([]);   /* no city yet — nothing to list */
      return Promise.all(TYPES[kind].map(function (t) {
        return call(url, 'getWarehouses', { SettlementRef: place.Ref, TypeOfWarehouseRef: t, FindByString: q, Limit: '300', Page: '1' }, signal); }))
        .then(function (rs) { return [].concat.apply([], rs).filter(fits).sort(function (a, b) {   /* the number typed first: «55» → №55, then №55…, then the streets */
          var r = function (w) { return w.Number === q ? 0 : String(w.Number).indexOf(q) === 0 ? 1 : 2; };
          return r(a) - r(b) || a.Number - b.Number; }).slice(0, 60)
          .map(function (w) { var parts = w.Description.split(': '), limit = (parts[0].match(/\(([^)]*)\)/) || [])[1];
            /* «№12 · вул. Родини Бунге, 8», and under it what the point says of itself — «до 30 кг на одне місце» */
            return { line: '№' + w.Number + ' · ' + (parts.slice(1).join(': ') || w.ShortAddress), sub: limit || '', value: w.Ref }; }); });
    }, function (it) { ref.value = it ? it.value : ''; }, { min: 0, empty: kind === 'locker' ? T('No parcel locker here takes this parcel — try a branch') : T('Nothing found — try the number or the street') });
    /* Held until a city is taken: disabled, and data-hold tells order.js (which turns hidden
       fields off and back on) to leave it off when the row opens. */
    var hold = function (on) { if (!point) return; point.disabled = on; if (on) point.dataset.hold = ''; else delete point.dataset.hold; };
    hold(true);
    if (form) form.addEventListener('np-city', function (e) {   /* another row named the place: take it if this one has none */
      var p = e.detail.place; if (e.detail.from === root || !p || place) return;
      place = p; city.value = p.Present; city.setCustomValidity(''); hold(false); if (point) point.required = true;
    });
    var cityBox = combo(city, city.parentNode.querySelector('.suggest-list'), function (q, signal) {
      return call(url, 'searchSettlements', { CityName: q, Limit: '20', Page: '1' }, signal).then(function (d) {
        return ((d[0] && d[0].Addresses) || []).filter(function (a) { return a.Warehouses > 0; })
          .map(function (a) { return { line: a.Present, value: a }; }); });
    }, function (it) {
      place = it ? it.value : null; if (pointBox) { pointBox.reset(); ref.value = ''; }
      hold(!place); if (point) point.required = true;
      if (place && point) setTimeout(function () { point.focus(); }, 0);
      tell(place);
    }, { min: 2, empty: T('No such place with a Nova Poshta branch — type it in Ukrainian: Київ, Львів…') });
  }

  /* ── QUOTE (2026-10-26) ── a row label[data-np-quote="WarehouseWarehouse | WarehousePostomat |
     WarehouseDoors"] gets Nova Poshta's own price and date for the place chosen, the parcel's
     weight (form[data-kg]) and worth (form[data-goods], €, declared in hryvnia): the price in
     its .choice-price and in its data-price (€, the form's rate back), the day in [data-np-term].
     From form[data-np-sender] (a city Ref) — Kyiv until the client says (docs 4.4). Asked again
     only when the place, the weight or the worth changes. */
  var KYIV = '8d5a980d-391c-11dd-90d9-001a92567626';
  function quotes(form) {
    var rows = [].slice.call(form.querySelectorAll('[data-np-quote]')); if (!rows.length) return;
    var refEl = form.querySelector('[data-np-city-ref]'), to = refEl && refEl.value;
    var rate = +form.dataset.rate || +form.dataset.uahRate || 48, kg = Math.max(0.5, +form.dataset.kg || 0.5);
    var worth = Math.max(1, Math.round((+form.dataset.goods || 0) * rate)), key = [to, kg, worth].join('|');
    if (!to || form.dataset.npQuoted === key) return;
    form.dataset.npQuoted = key;
    var url = form.dataset.npEndpoint || API, from = form.dataset.npSender || KYIV, lang = document.documentElement.lang || 'en';
    var money = function (uah) { return form.dataset.currency === 'UAH'
      ? new Intl.NumberFormat(lang, { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(Math.round(uah))
      : new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(uah / rate); };
    var doc = function (method, svc) { return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: '',
      modelName: 'InternetDocument', calledMethod: method, methodProperties: { CitySender: from, CityRecipient: to, ServiceType: svc, Weight: String(kg),
        Cost: String(worth), CargoType: 'Parcel', SeatsAmount: '1' } }) }).then(function (r) { return r.json(); })
      .then(function (j) { if (!j.success || !j.data || !j.data[0]) throw new Error('quote'); return j.data[0]; }); };
    rows.forEach(function (row) {
      var svc = row.dataset.npQuote, price = row.querySelector('.choice-price'), term = row.querySelector('[data-np-term]');
      row.classList.add('is-quoting');
      Promise.all([doc('getDocumentPrice', svc), doc('getDocumentDeliveryDate', svc).catch(function () { return null; })]).then(function (r) {
        if (form.dataset.npQuoted !== key) return;   /* asked again since */
        var uah = +r[0].Cost; row.dataset.price = String(Math.round(uah / rate * 100) / 100);
        if (price) { price.textContent = money(uah); price.classList.remove('order-tbd'); }
        var d = r[1] && r[1].DeliveryDate && r[1].DeliveryDate.date;
        if (term && d) term.textContent = T('Delivery {date}').replace('{date}', new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'long' }));
        form.dispatchEvent(new Event('change', { bubbles: true }));   /* order.js recounts */
      }).catch(function () { delete form.dataset.npQuoted; }).then(function () { row.classList.remove('is-quoting'); });
    });
  }

  var go = function () {
    [].forEach.call(document.querySelectorAll('.np-pick'), init);
    [].forEach.call(document.querySelectorAll('form'), function (f) {
      if (!f.querySelector('[data-np-quote]')) return;
      var t; var later = function () { clearTimeout(t); t = setTimeout(function () { quotes(f); }, 400); };
      f.addEventListener('change', later); f.addEventListener('input', later); f.addEventListener('np-city', later);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
