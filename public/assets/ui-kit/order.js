/* order.js — the kit's order form (section.css «ORDER»), from the A1 landing (2026-10-25).
   Everything is read from the markup; nothing about a product is typed here.

   STEPS   one open at a time (accordion.js). A step after the one reached is locked: dimmed,
           does not open, shows no value. «Next» ([data-next]) passes — unless the step names a
           radio group that must be chosen first (data-need="bundle", data-hint="Choose …").
           A step already reached can be reopened. A closed step shows in its strip
           (.order-step-val) what was chosen: the <b> of each chosen option, «n × name» of each
           counted card, and the fields marked data-show.
   ALT     input[data-alt]: «something else instead». On, the cards [data-alt-off] are hidden (the rest moves up)
           (their inputs off), [data-alt-show] comes forward with nothing taken (2026-10-25), and the
           steps [data-alt-skip] are left out.
   COUNTRY select[name=country]: an element with data-country="DE PL" is there only for those
           countries; a radio taken in it falls back to the first one left (2026-10-25).
   OFF     option[data-off-when="name=value"]: that option is disabled while the radio is taken —
           Ukraine while AKVANTIS service is (Germany and Poland only); data-off-note
           is added to its words while it is off.
   WHEN    [data-when="name=value"] (or «a=b&c=d», all of them; a select answers as a radio does) is there only while that radio is taken; [data-when-not] only
           while it is not — the delivery that the installer brings, the address a pickup does not
           need. A field hidden so is not checked and not sent.
   ONE     [data-pick-one] around a radio list: when only one is left to choose, it is chosen.
   SEGMENT .order-seg: a radio group drawn as the kit's segmented tabs (the delivery's Pickup | Courier;
           a label's data-icon gives its tab an icon) —
           needs kit.js (Kit.segmented) and segmented.css on the page.
   SAY     [data-say="…"] on something shown in a step is that step's value (the delivery the installer brings).
   NUMBERS a step's .num is its place among the steps shown, so a skipped step leaves no gap.
   SUMMARY [data-summary] (a <dl>) lists each step's value and the total (and, with form[data-uah-rate]
           and the country UA, the sum in hryvnia the invoice will carry); [data-pay] reads «Pay €…».
   COUNT   a .choice.is-count card — its behaviour is kit/choice.js (load it before this file);
           a change there fires `input`, and the strip, the bar and the total recount.
   DOCK    #<form>-dock (.order-dock): up with the first choice — the chosen card's pictures, its
           name, the other steps' values, and the sum of data-price of everything chosen (a
           choice without a price makes it «price on request»). data-currency, default EUR.
   PAY     form[data-pay-url="/api/pay"]: on send the order (FormData — hidden rows are disabled, so left
           out) goes to that address; the answer's pageUrl (monobank's payment page) is opened.
   PARTS   form[data-parts-url="/api/parts"]: a payment of N parts (not «full») is applied for there
           instead (monobank «Покупка частинами»); the form waits on <url>/state, then thanks.html.
           [data-per-month="N"] shows the total over N; the button reads «Apply for N payments».
   SEND    checked here, not by the browser's bubbles: a wrong field gets aria-invalid and a
           .field-error line, cleared as it is typed in; the button turns .is-loading; the
           answer is the .notice. No data-endpoint → nothing is sent, and the notice says so. */
(function () {
  var SAY = { valueMissing: 'Please fill this in', typeMismatch: 'Check the address', badInput: 'Check this value' };
  var ICON = '<i data-icon="circle-alert" data-size="13"></i>';
  var $$ = function (r, s) { return [].slice.call(r.querySelectorAll(s)); };
  var acc = function (b, on) { if (window.Accordion) Accordion.set(b, on); };

  function init(form) {
    var lang = document.documentElement.lang || 'en';
    var cur = form.dataset.currency || 'EUR';
    var eur = function (n) { return n == null ? '€ ···' : new Intl.NumberFormat(lang, { style: 'currency', currency: cur,
      minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n); };
    var dock = document.getElementById(form.id + '-dock');
    var alt = form.querySelector('input[data-alt]');
    var steps = function () { return $$(form, '.order-step:not([hidden])'); };
    var live = function (i) { return !i.disabled && !i.closest('[hidden]'); };
    var valOf = function (n) { var sel = form.querySelector('select[name="' + n + '"]'); if (sel && live(sel)) return sel.value;   /* a select answers too: data-when="country=UA" */
      var i = $$(form, 'input[name="' + n + '"]:checked').filter(live)[0]; return i ? i.value : ''; };
    var cond = function (c) { return c.split('&').every(function (t) { var k = t.split('='); return valOf(k[0]) === k.slice(1).join('='); }); };   /* «a=b&c=d»: all of them */
    var reached = 0;

    /* What a choice is called: its .choice-name (lockups and all) or its <b>. `text` reads a
       lockup as its code; `html` keeps the lockup's drawing (the strips and the bar show it). */
    var nameEl = function (i) { var l = i.closest('label, .choice.is-count'); return l && l.querySelector('.choice-name, b'); };
    var text = function (el) { var c = el.cloneNode(true);
      $$(c, '.sec-lockup').forEach(function (k) { k.textContent = k.getAttribute('aria-label') || k.dataset.device || ''; });
      return c.textContent.replace(/\s+/g, ' ').trim(); };
    var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
    /* A card with a finish (choice.js) adds it: «A1 + K1 · Brushed Steel». */
    var fin = function (i) { var c = i.closest('.choice'); return c && c.dataset.finishLabel ? ' · ' + c.dataset.finishLabel : ''; };
    var label = function (i) { var n = nameEl(i); return (n ? text(n) : i.value) + fin(i); };
    var labelHtml = function (i) { var n = nameEl(i); return (n ? n.innerHTML.trim() : esc(i.value)) + esc(fin(i)); };
    var counted = function (root, html) { return $$(root, '.choice.is-count').map(function (c) {
      var i = c.querySelector('input'), n = +i.value; return n > 0 ? n + ' × ' + (html ? labelHtml(i) : label(i)) : ''; }).filter(Boolean); };
    var stepVal = function (s, html) {
      var bits = $$(s, 'input:checked:not(:disabled):not([data-alt])').filter(function (i) { return live(i) && !i.closest('.order-seg'); }).map(html ? labelHtml : label).concat(counted(s, html));
      $$(s, '[data-say]').forEach(function (e) { if (!e.closest('[hidden]')) bits.push(esc(e.dataset.say)); });   /* a note that is the step's value */
      $$(s, '[data-show]').forEach(function (f) { if (f.closest('[hidden]')) return;
        var v = (f.tagName === 'SELECT' ? (f.selectedOptions[0] || {}).text || '' : f.value).replace(/\s+—.*$/, '').trim();   /* a select shows its option's words, without the note after a dash */
        if (v) bits.push(html ? esc(v) : v); });
      return bits.join(' · ');
    };

    function update() {
      var on = !!(alt && alt.checked);
      /* Fold / unfold: the height is set from the content, the class runs the transition
         (section.css «The alternative on»); open, the height is let go again. */
      var fold = function (g, open, cls) {
        if (g.classList.contains(cls) === (cls === 'is-shown' ? open : !open)) return;
        g.style.maxHeight = g.scrollHeight + 'px'; void g.offsetHeight;
        g.classList.toggle(cls, cls === 'is-shown' ? open : !open);
        if (open) setTimeout(function () { if (g.classList.contains(cls) === (cls === 'is-shown')) g.style.maxHeight = 'none'; }, 450);
      };
      $$(form, '[data-alt-off]').forEach(function (g) { fold(g, !on, 'is-off'); $$(g, 'input').forEach(function (i) { i.disabled = on; }); });
      $$(form, '[data-alt-show]').forEach(function (g) { fold(g, on, 'is-shown'); });
      $$(form, '[data-alt-skip]').forEach(function (s) { s.hidden = on; });
      var land = form.querySelector('select[name="country"]');
      if (land) $$(form, '[data-country]').forEach(function (g) {
        var off = g.dataset.country.split(/\s+/).indexOf(land.value) < 0; g.hidden = off;
        $$(g, 'input').forEach(function (i) { i.disabled = off;
          if (off && i.checked && i.type === 'radio') { i.checked = false;
            var to = $$(form, 'input[name="' + i.name + '"]').filter(live)[0]; if (to) to.checked = true; } }); });
      var again = false, whens = function () {
      $$(form, '[data-when]').forEach(function (g) { g.hidden = !cond(g.dataset.when); });
      /* an option a choice rules out: disabled; taken, the select moves to the first one left */
      $$(form, 'option[data-off-when]').forEach(function (o) { o.disabled = cond(o.dataset.offWhen);
        if (o.dataset.base == null) o.dataset.base = o.textContent;   /* data-off-note follows the name only while it is off */
        o.textContent = o.dataset.base + (o.disabled && o.dataset.offNote ? ' — ' + o.dataset.offNote : '');
        var sel = o.parentNode.closest('select') || o.parentNode;
        if (o.disabled && o.selected) { var to = [].filter.call(sel.options, function (x) { return !x.disabled; })[0]; if (to) sel.value = to.value; } });
      $$(form, '[data-when-not]').forEach(function (g) { g.hidden = cond(g.dataset.whenNot); });
      /* what is hidden so is not sent either: its fields go disabled (out of the FormData) */
      $$(form, '[data-when] :is(input, select, textarea), [data-when-not] :is(input, select, textarea)').forEach(function (i) {
        if (i.closest('[hidden]')) { if (!i.disabled) { i.disabled = true; i.dataset.whenOff = ''; } }
        else if ('whenOff' in i.dataset) { delete i.dataset.whenOff; if (!('hold' in i.dataset)) i.disabled = false; } });   /* data-hold: another script keeps it off (np.js until a city) */   /* only what it turned off itself — a field another script holds stays held */
      /* [data-pick-one]: a list down to one choice takes it — the only courier of a country */
      $$(form, '[data-pick-one]').forEach(function (l) { var rs = $$(l, 'input[type=radio]').filter(live);
        if (rs.length === 1 && !rs[0].checked) { rs[0].checked = true; again = true; } });
      };
      whens(); if (again) whens();   /* a choice taken by [data-pick-one] shows what it asks (its own data-when) */
      steps().forEach(function (s, i) { var n = s.querySelector('.num'); if (n) n.textContent = i + 1; });
      if (window.Choice) Choice.sync(form);
      steps().forEach(function (s) { var v = s.querySelector('.order-step-val'); if (v) v.innerHTML = stepVal(s, true); });

      var first = steps()[0], pick = first && first.querySelector('input:checked:not(:disabled):not([data-alt])');
      var chosen = on ? counted(first).length > 0 : !!pick;
      if (dock) { dock.classList.toggle('is-on', chosen); document.body.classList.toggle('has-dock', chosen); }
      var sum = 0, open = false;
      $$(form, 'input:checked:not(:disabled):not([data-alt])').filter(live).forEach(function (i) {
        var l = i.closest('[data-price], label'); if (!l || !l.closest('.order-step')) return;
        if (l.hasAttribute('data-price')) { var p = l.dataset.price; if (p === '') open = true; else sum += +p; }
        else if (i.type === 'radio' && l.closest('[data-priced]')) open = true;
      });
      $$(form, '.choice.is-count.is-on').forEach(function (c) { if (c.closest('[hidden]')) return; var p = c.dataset.price; if (p === undefined || p === '') open = true; else sum += +p * +c.querySelector('input').value; });
      var sumTxt = open ? eur(null) : eur(sum);
      var plan = valOf('payment'), inParts = plan && plan !== 'full';
      var pay = form.querySelector('[data-pay]'); if (pay && !pay.classList.contains('is-loading')) pay.textContent = inParts ? 'Apply for ' + plan + ' payments' : chosen ? 'Pay ' + sumTxt : 'Pay';
      /* [data-per-month="10"]: the total over that many parts (2026-10-26 — was typed by hand) */
      $$(form, '[data-per-month]').forEach(function (el) { var n = +el.dataset.perMonth;
        el.textContent = chosen && !open ? eur(Math.round(sum / n * 100) / 100) + ' / month · ' + n + ' × with monobank' : 'monobank «Покупка частинами»'; });
      var dl = form.querySelector('[data-summary]');
      if (dl) dl.innerHTML = steps().slice(0, -1).map(function (s) { var v = stepVal(s, true);
          return v ? '<dt>' + esc(text(s.querySelector('.order-step-name'))) + '</dt><dd>' + v + '</dd>' : ''; }).join('')
        + '<dt class="is-total">Total</dt><dd class="is-total">' + sumTxt + '</dd>'
        /* form[data-uah-rate]: in Ukraine the invoice is in hryvnia — the sum the bank will show, said here first */
        + (form.dataset.uahRate && valOf('country') === 'UA' && !open && chosen ? '<dt>Charged in hryvnia</dt><dd>≈ ' + new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(sum * form.dataset.uahRate) + '</dd>' : '');
      if (!dock || !chosen) return;
      var card = on ? null : pick.closest('.choice');
      var pics = card ? $$(card, '.choice-pic') : $$(form, '.choice.is-count.is-on .choice-pic').slice(0, 3);
      var holder = dock.querySelector('.order-dock-pics'); holder.innerHTML = '';
      pics.forEach(function (p) { var c = p.cloneNode(true); c.removeAttribute('id'); holder.appendChild(c); });
      dock.querySelector('[data-dock="name"]').innerHTML = on ? labelHtml(alt) : labelHtml(pick);
      dock.querySelector('[data-dock="sub"]').textContent = on ? counted(first).join(', ')
        : steps().slice(1, -1).map(stepVal).filter(Boolean).join(' · ');
      var total = dock.querySelector('[data-dock="total"]');
      total.textContent = open ? eur(null) : eur(sum); total.classList.toggle('order-tbd', open);
      dock.querySelector('[data-dock="total-sub"]').textContent = open ? 'price on request' : '';
    }

    /* SEGMENTS: .order-seg holds a radio group (sr-only); the kit's segmented tabs are drawn
       from it (Kit.segmented, kit.js) and a tab takes its radio — «Pickup | Courier» (2026-10-26). */
    $$(form, '.order-seg').forEach(function (g) {
      var rs = $$(g, 'input[type=radio]'), host = document.createElement('div'); g.appendChild(host);
      if (!window.Kit || !Kit.segmented) return;
      Kit.segmented(host, rs.map(function (r) { var ic = r.parentNode.dataset.icon;   /* <label data-icon="truck"> → the tab's icon (icons.js) */
          return { label: r.parentNode.textContent.trim(), value: r.value, icon: ic && window.KitIcons ? KitIcons.svg(ic, { size: 20 }) : null }; }),
        Math.max(0, rs.findIndex(function (r) { return r.checked; })),
        function (v, i) { rs[i].checked = true; rs[i].dispatchEvent(new Event('change', { bubbles: true })); });
    });

    /* counts: kit/choice.js steps them and fires `input`, which recounts here. */

    /* steps */
    /* With the alternative on, the step needs a count over 0 (data-alt-hint says so). */
    var altOn = function (s) { return alt && alt.checked && s.contains(alt); };
    var passes = function (s) { var n = s.dataset.need; if (!n) return true;
      if (altOn(s)) return counted(s).length > 0;
      if (!$$(form, 'input[name="' + n + '"]').filter(live).length) return true;   /* nothing to choose here now */
      return !!form.querySelector('input[name="' + n + '"]:checked:not(:disabled)'); };
    var hintOf = function (s) { return (altOn(s) && s.dataset.altHint) || s.dataset.hint || 'Choose one first'; };
    var lock = function () { steps().forEach(function (s, i) {
      var off = i > reached, b = s.querySelector('.panel-title');
      b.disabled = off; s.classList.toggle('is-locked', off);
      if (off && b.getAttribute('aria-expanded') === 'true') acc(b, false); }); };
    var openStep = function (step) {
      steps().forEach(function (s) { acc(s.querySelector('.panel-title'), s === step); });
      setTimeout(function () { step.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 260);
    };
    var hint = function (s, msg) {
      var h = s.querySelector('.order-hint');
      if (!msg) { if (h) h.remove(); return; }
      if (!h) { h = document.createElement('p'); h.className = 'field-error order-hint'; h.setAttribute('role', 'alert');
        s.querySelector('.panel-body > .sec-actions').before(h); }
      h.textContent = msg;
    };
    $$(form, '[data-next]').forEach(function (b) { b.addEventListener('click', function () {
      var all = steps(), s = b.closest('.order-step'), i = all.indexOf(s);
      if (!passes(s)) { hint(s, hintOf(s)); return; }
      hint(s, ''); reached = Math.max(reached, i + 1); lock();
      if (all[i + 1]) openStep(all[i + 1]);
    }); });

    form.addEventListener('change', function () { steps().forEach(function (s) { if (passes(s)) hint(s, ''); }); update(); lock(); });
    form.addEventListener('input', function () { steps().forEach(function (s) { if (passes(s)) hint(s, ''); }); update(); });
    update(); lock();

    /* send */
    var send = form.querySelector('[type=submit]'), notice = form.querySelector('.notice'), sendTxt = send ? send.textContent : '';
    var mark = function (el, msg) {
      var box = el.closest('.field') || el.parentElement, line = box.querySelector('.field-error');
      if (!msg) { el.removeAttribute('aria-invalid'); if (line) line.remove(); return; }
      el.setAttribute('aria-invalid', 'true');
      if (!line) { line = document.createElement('span'); line.className = 'field-error'; line.id = form.id + '-' + el.name + '-error'; box.appendChild(line); }
      line.innerHTML = ICON + msg; el.setAttribute('aria-describedby', line.id);
    };
    $$(form, 'input, textarea').forEach(function (el) { el.addEventListener('input', function () { if (el.validity.valid) mark(el); }); });
    var tell = function (kind, text) { if (!notice) return;
      notice.className = 'notice' + (kind ? ' is-' + kind : ''); notice.setAttribute('role', kind === 'error' ? 'alert' : 'status');
      notice.querySelector('span').textContent = text; notice.hidden = false; };
    var busy = function (on) { if (!send) return; send.classList.toggle('is-loading', on); send.setAttribute('aria-busy', on);
      send.textContent = on ? 'Sending' : sendTxt; if (!on) update(); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var all = steps(), stuck = all.filter(function (s) { return !passes(s); })[0], first = null;
      if (stuck) { all.forEach(function (x) { acc(x.querySelector('.panel-title'), x === stuck); }); tell('error', hintOf(stuck) + '.'); return; }
      $$(form, 'input:not([type=radio]):not([type=checkbox]):not([type=hidden]), textarea').forEach(function (el) {
        if (el.closest('[hidden]')) return;
        var v = el.validity, why = Object.keys(SAY).filter(function (k) { return v[k]; })[0];
        var msg = why ? SAY[why] : v.customError ? el.validationMessage : '';   /* a script's own word: «Choose from the list» */
        mark(el, msg); if (msg && !first) first = el; });
      reached = all.length - 1; lock();
      if (first) { var s = first.closest('.order-step');
        if (s && s.querySelector('.panel-title').getAttribute('aria-expanded') !== 'true') all.forEach(function (x) { acc(x.querySelector('.panel-title'), x === s); });
        setTimeout(function () { first.focus(); }, 300); return; }
      var lead = Object.fromEntries(new FormData(form)); lead.page = location.href; lead.lang = lang;
      if (notice) notice.hidden = true; busy(true);
      /* PAY (2026-10-26): form[data-pay-url="/api/pay"] — the order goes to the page's own worker, which
         counts the total itself, opens a monobank invoice and answers { pageUrl }; the buyer goes there. */
      /* PARTS (2026-10-26): a plan of N payments goes to form[data-parts-url] instead — monobank pushes
         the offer to the buyer's app; the form waits on <url>/state until it is approved or not. */
      var plan = valOf('payment');
      if (plan && plan !== 'full' && form.dataset.partsUrl) {
        var base = form.dataset.partsUrl, tries = 0;
        var WHY = { EXCEEDED_SUM_LIMIT: 'the sum is over your limit', NOT_ENOUGH_MONEY_FOR_INIT_DEBIT: 'not enough money for the first payment',
          CLIENT_NOT_FOUND: 'no monobank client with this number', REJECTED_BY_CLIENT: 'you declined it in the app', CLIENT_PUSH_TIMEOUT: 'it was not confirmed in time',
          EXISTS_OTHER_OPEN_ORDER: 'another purchase in parts is still open', PAY_PARTS_ARE_NOT_ACCEPTABLE: 'this number of payments is not available' };
        busy(true); send.textContent = 'Sending to monobank';
        var wait = function (order) {
          send.textContent = 'Waiting for monobank';
          tell('', 'Confirm the purchase in the monobank app — we are waiting for the bank.');
          fetch(base + '/state', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
            if (j.state === 'SUCCESS' || (j.state === 'IN_PROCESS' && j.sub === 'WAITING_FOR_STORE_CONFIRM'))
              return location.assign('thanks.html?order=' + encodeURIComponent(order) + '&parts=' + plan);
            if (j.state === 'FAIL') { busy(false); return tell('error', 'monobank did not approve it: ' + (WHY[j.sub] || (j.sub || 'declined').toLowerCase().replace(/_/g, ' ')) + '. You can pay in full instead.'); }
            if (tries++ < 90) setTimeout(function () { wait(order); }, 2000);
            else { busy(false); tell('error', 'No answer from monobank yet. If you confirm it in the app, we will email you.'); }
          }).catch(function () { if (tries++ < 90) setTimeout(function () { wait(order); }, 2000); });
        };
        fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.order) throw new Error(j.error || r.status); return j; }); })
          .then(function (j) { wait(j.order); })
          .catch(function (e) { busy(false); tell('error', 'The request did not go through (' + e.message + '). Please try again in a minute.'); });
        return;
      }
      if (form.dataset.payUrl) {
        busy(true); send.textContent = 'Opening payment';
        fetch(form.dataset.payUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.pageUrl) throw new Error(j.error || r.status); return j; }); })
          .then(function (j) { location.assign(j.pageUrl); })
          .catch(function (e) { busy(false); tell('error', 'The payment could not be opened (' + e.message + '). Please try again in a minute.'); });
        return;
      }
      var url = form.dataset.endpoint;
      (url ? fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
              .then(function (r) { if (!r.ok) throw new Error(r.status); tell('success', form.dataset.thanks || 'Thank you — we will call you back.'); form.reset(); update(); })
           : new Promise(function (r) { setTimeout(r, 800); }).then(function () {
               console.info('[order] not sent — no data-endpoint:', lead);
               tell('', 'Preview: the request was not sent — the form is not connected yet.'); }))
        .catch(function () { tell('error', 'The request did not go through. Please try again in a minute.'); })
        .then(function () { busy(false); });
    });

    /* a code: not checked yet — says so (2026-10-25, the skeleton) */
    $$(form, '[data-code]').forEach(function (b) { b.addEventListener('click', function () {
      var f = b.closest('.order-code').querySelector('input'); hint(b.closest('.order-step'), f.value.trim() ? 'Codes are not connected yet — the discount shows here once they are.' : 'Type the code first'); }); });

    /* a link that names an option chooses it on its way down: <a href="#order" data-choose="A1"> */
    $$(document, 'a[data-choose]').forEach(function (a) { a.addEventListener('click', function () {
      var i = form.querySelector('input[value="' + a.dataset.choose + '"]');
      if (alt && i !== alt) alt.checked = false;
      if (i) { i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); }
      openStep(steps()[0]); }); });
  }

  var go = function () { $$(document, 'form.order-form').forEach(init); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
