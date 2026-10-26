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
   SUMMARY [data-summary] (a <dl>) lists each step's value and the total — the total in
           [data-summary-total] when the page has one (and, with form[data-uah-rate]
           and the country UA, the sum in hryvnia the invoice will carry); [data-pay] reads «Pay €…».
   COUNT   a .choice.is-count card — its behaviour is kit/choice.js (load it before this file);
           a change there fires `input`, and the strip, the bar and the total recount.
   DOCK    #<form>-dock (.order-dock): up with the first choice — the chosen card's pictures, its
           name, the other steps' values, and the sum of data-price of everything chosen (a
           choice without a price makes it «price on request»). data-currency (default EUR) and
           data-rate: the € prices shown in another currency, e.g. UAH × 48.
   PAY     form[data-pay-url="/api/pay"]: on send the order (FormData — hidden rows are disabled, so left
           out) goes to that address; the answer's pageUrl (monobank's payment page) is opened.
   GATE    [data-next] is disabled until its step is complete: the choice (data-need) and the
           required fields in use. Nothing required → open (Akvantis Club).
   PARCEL  form[data-kg] (Σ data-kg of what is chosen) and form[data-goods] (the sum less the delivery, €)
           — what np.js asks Nova Poshta a price for.
   CODE    .order-code: [data-code-open] → .order-code-row (field · [data-code] Apply · [data-code-close] ×).
   PARTS   form[data-parts-url="/api/parts"]: a payment of N parts (not «full») is applied for there
           instead (monobank «Покупка частинами»); the form waits on <url>/state, then thanks.html.
           [data-per-month="N"] shows the total over N; the button reads «Apply for N payments».
   PRIVAT  form[data-privat-url="/api/privat"]: the same plan with name="bank" value="privat" (the
           .order-seg monobank | PrivatBank) goes there instead (PrivatBank «Оплата частинами») — the
           answer's url is the bank's own page; the bank sends the buyer back to thanks.html.
   WALLET  [data-wallet] (in the Pay row, with data-when="payment=full"): the Apple Pay and Google Pay
           buttons — their own, drawn by Apple's SDK (<apple-pay-button>) and Google's pay.js (TEST),
           white on the dark page, black on a light one (where Apple's script hides its button, the kit's
           white button reads «Apple Pay»). A PROTOTYPE: not wired to the wallets — a
           press sends the form as Pay does, to monobank's page, which offers Apple Pay / Google Pay
           itself. Paying in the button needs merchant certificates (docs/order-form-questions.md 5.7).
   SEND    checked here, not by the browser's bubbles: a wrong field gets aria-invalid and a
           .field-error line, cleared as it is typed in; the button turns .is-loading; the
           answer is the .notice. No data-endpoint → nothing is sent, and the notice says so. */
(function () {
  /* WORDS (2026-10-26): every word this file writes goes through T() — window.KitLang.t when a page
     has one (the preview's EN / UA switch, ui-kit/preview/lang.js), else the English as written.
     {name} in a string is filled from the second argument. */
  var T = function (s, v) { var d = (window.KitLang && KitLang.t && KitLang.t(s)) || s;
    return v ? d.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }) : d; };
  var SAY = { valueMissing: T('Please fill this in'), typeMismatch: T('Check the address'), badInput: T('Check this value') };
  var ICON = '<i data-icon="circle-alert" data-size="13"></i>';
  var $$ = function (r, s) { return [].slice.call(r.querySelectorAll(s)); };
  var acc = function (b, on) { if (window.Accordion) Accordion.set(b, on); };

  function init(form) {
    var lang = document.documentElement.lang || 'en';
    /* The prices are written in € (data-price). form[data-currency="UAH"][data-rate="48"] shows them in
       hryvnia — times the rate, whole, «23 760 грн» (2026-10-26: the Ukrainian version). */
    var cur = form.dataset.currency || 'EUR', rate = +form.dataset.rate || 1;
    var eur = function (n) { if (n == null) return cur === 'EUR' ? '€ ···' : '··· ' + cur;
      var v = n * rate, whole = cur !== 'EUR';
      return new Intl.NumberFormat(lang, { style: 'currency', currency: cur, currencyDisplay: cur === 'EUR' ? 'narrowSymbol' : 'symbol',   /* «395 €», not «395 EUR» */
        minimumFractionDigits: whole || v % 1 === 0 ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(whole ? Math.round(v) : v); };
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
      $$(form, '[data-alt-show]').forEach(function (g) { fold(g, on, 'is-shown');
        if (!on) $$(g, '.choice.is-count input').forEach(function (i) { i.value = 0; }); });   /* put away, its counts go back to 0 — they are not in the order */
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
      whens(); whens();   /* twice: what one pass turns on (a field enabled again, a choice taken by [data-pick-one]) is what the next pass reads — a row's question shows at once (2026-10-26: the courier's address stayed hidden after Pickup → Courier) */
      steps().forEach(function (s, i) { var n = s.querySelector('.num'); if (n) n.textContent = i + 1; });
      if (window.Choice) Choice.sync(form);
      steps().forEach(function (s) { var v = s.querySelector('.order-step-val'); if (v) v.innerHTML = stepVal(s, true); });

      var first = steps()[0], pick = first && first.querySelector('input:checked:not(:disabled):not([data-alt])');
      var chosen = on ? counted(first).length > 0 : !!pick;
      if (dock) { dock.classList.toggle('is-on', chosen); document.body.classList.toggle('has-dock', chosen); }
      var sum = 0, open = false, off = 0, kg = 0, ship = 0;   /* off: the discounts taken (a negative data-price — trade-in); kg: data-kg of what is chosen; ship: the delivery's price */
      $$(form, 'input:checked:not(:disabled):not([data-alt])').filter(live).forEach(function (i) {
        var l = i.closest('[data-price], label'); if (!l || !l.closest('.order-step')) return;
        if (l.dataset.kg) kg += +l.dataset.kg;
        if (i.name === 'delivery' && l.dataset.price) ship = +l.dataset.price;
        if (l.hasAttribute('data-price')) { var p = l.dataset.price; if (p === '') open = true; else { sum += +p; if (+p < 0) off += +p; } }
        else if (i.type === 'radio' && l.closest('[data-priced]')) open = true;
      });
      var codeOff = +form.dataset.codeOff || 0;   /* a code taken (CODE below): € off the total */
      if (codeOff) { sum -= codeOff; off -= codeOff; }
      $$(form, '.choice.is-count.is-on').forEach(function (c) { if (c.closest('[hidden]')) return; kg += (+c.dataset.kg || 0) * +c.querySelector('input').value; var p = c.dataset.price; if (p === undefined || p === '') open = true; else sum += +p * +c.querySelector('input').value; });
      var sumTxt = open ? eur(null) : eur(sum);
      /* what the parcel is, for a carrier's quote (np.js): its weight and its worth without the delivery, € */
      form.dataset.kg = Math.round(kg * 10) / 10; form.dataset.goods = open ? '' : sum + codeOff - ship;
      var plan = valOf('payment'), inParts = plan && plan !== 'full';
      var pay = form.querySelector('[data-pay]'); if (pay && !pay.classList.contains('is-loading')) pay.textContent = inParts ? T('Apply for {n} payments', { n: plan }) : chosen ? T('Pay {sum}', { sum: sumTxt }) : T('Pay');
      /* [data-per-month="10"]: the total over that many parts (2026-10-26 — was typed by hand) */
      $$(form, '[data-per-month]').forEach(function (el) { var n = +el.dataset.perMonth;
        el.textContent = chosen && !open ? T('{sum} / month · {n} × with ' + (valOf('bank') === 'privat' ? 'PrivatBank' : 'monobank'), { sum: eur(Math.round(sum / n * 100) / 100), n: n }) : T('monobank or PrivatBank, interest-free'); });
      var dl = form.querySelector('[data-summary]'), dt = form.querySelector('[data-summary-total]');   /* the total in a list of its own when there is one (the code stands between) */
      var rowsHtml = steps().slice(0, -1).map(function (s) { var v = stepVal(s, true);
          return v ? '<dt>' + esc(text(s.querySelector('.order-step-name'))) + '</dt><dd>' + v + '</dd>' : ''; }).join('')
        + (codeOff ? '<dt>' + esc(T('Code {code}', { code: form.dataset.code || '' })) + '</dt><dd>−' + eur(codeOff) + '</dd>' : '');
      var totalHtml = '<dt class="is-total">' + T('Total') + '</dt><dd class="is-total">' + (off && !open ? '<s class="choice-was">' + eur(sum - off) + '</s>' : '') + sumTxt + '</dd>'
        /* form[data-uah-rate]: in Ukraine the invoice is in hryvnia — the sum the bank will show, said here first */
        + (form.dataset.uahRate && cur !== 'UAH' && valOf('country') === 'UA' && !open && chosen ? '<dt>' + T('Charged in hryvnia') + '</dt><dd>≈ ' + new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(sum * form.dataset.uahRate) + '</dd>' : '');
      if (dl && dt) { dl.innerHTML = rowsHtml; dt.innerHTML = totalHtml; } else if (dl) dl.innerHTML = rowsHtml + totalHtml;
      gate();
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
      dock.querySelector('[data-dock="total-sub"]').textContent = open ? T('price on request') : '';
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
    /* GATE (2026-10-26): a step's Next is disabled until the step is complete — its choice made
       (data-need) and every required field in it that is in use filled right (a field turned off
       or hidden by a condition does not count). A step with nothing to ask (Akvantis Club) stays open. */
    function gate() {
      steps().forEach(function (s) { var b = s.querySelector('[data-next]'); if (!b) return;
        var ok = passes(s) && $$(s, 'input[required], select[required], textarea[required]').every(function (f) {
          return f.disabled || f.closest('[hidden]') || f.validity.valid; });
        b.disabled = !ok; b.setAttribute('aria-disabled', String(!ok)); });
    }
    var passes = function (s) { var n = s.dataset.need; if (!n) return true;
      if (altOn(s)) return counted(s).length > 0;
      if (!$$(form, 'input[name="' + n + '"]').filter(live).length) return true;   /* nothing to choose here now */
      return !!form.querySelector('input[name="' + n + '"]:checked:not(:disabled)'); };
    var hintOf = function (s) { return T((altOn(s) && s.dataset.altHint) || s.dataset.hint || 'Choose one first'); };
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
      send.textContent = on ? T('Sending') : sendTxt; if (!on) update(); };

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
      /* PRIVAT (2026-10-26): the plan with PrivatBank — the worker opens a payment there and answers the
         bank's page; the buyer logs in to Privat24 and confirms it on that page. */
      if (plan && plan !== 'full' && valOf('bank') === 'privat' && form.dataset.privatUrl) {
        busy(true); send.textContent = T('Opening PrivatBank');
        fetch(form.dataset.privatUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.url) throw new Error(j.error || r.status); return j; }); })
          .then(function (j) { location.assign(j.url); })
          .catch(function (e) { busy(false); tell('error', T('PrivatBank could not open the payment ({why}). Please try again in a minute.', { why: e.message })); });
        return;
      }
      if (plan && plan !== 'full' && form.dataset.partsUrl) {
        var base = form.dataset.partsUrl, tries = 0;
        var WHY = { EXCEEDED_SUM_LIMIT: 'the sum is over your limit', NOT_ENOUGH_MONEY_FOR_INIT_DEBIT: 'not enough money for the first payment',
          CLIENT_NOT_FOUND: 'no monobank client with this number', REJECTED_BY_CLIENT: 'you declined it in the app', CLIENT_PUSH_TIMEOUT: 'it was not confirmed in time',
          EXISTS_OTHER_OPEN_ORDER: 'another purchase in parts is still open', PAY_PARTS_ARE_NOT_ACCEPTABLE: 'this number of payments is not available' };
        busy(true); send.textContent = T('Sending to monobank');
        var wait = function (order) {
          send.textContent = T('Waiting for monobank');
          tell('', T('Confirm the purchase in the monobank app — we are waiting for the bank.'));
          fetch(base + '/state', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
            if (j.state === 'SUCCESS' || (j.state === 'IN_PROCESS' && j.sub === 'WAITING_FOR_STORE_CONFIRM'))
              return location.assign('thanks.html?order=' + encodeURIComponent(order) + '&parts=' + plan);
            if (j.state === 'FAIL') { busy(false); return tell('error', T('monobank did not approve it: {why}. You can pay in full instead.', { why: T(WHY[j.sub] || (j.sub || 'declined').toLowerCase().replace(/_/g, ' ')) })); }
            if (tries++ < 90) setTimeout(function () { wait(order); }, 2000);
            else { busy(false); tell('error', T('No answer from monobank yet. If you confirm it in the app, we will email you.')); }
          }).catch(function () { if (tries++ < 90) setTimeout(function () { wait(order); }, 2000); });
        };
        fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.order) throw new Error(j.error || r.status); return j; }); })
          .then(function (j) { wait(j.order); })
          .catch(function (e) { busy(false); tell('error', T('The request did not go through ({why}). Please try again in a minute.', { why: e.message })); });
        return;
      }
      if (form.dataset.payUrl) {
        busy(true); send.textContent = T('Opening payment');
        fetch(form.dataset.payUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.pageUrl) throw new Error(j.error || r.status); return j; }); })
          .then(function (j) { location.assign(j.pageUrl); })
          .catch(function (e) { busy(false); tell('error', T('The payment could not be opened ({why}). Please try again in a minute.', { why: e.message })); });
        return;
      }
      var url = form.dataset.endpoint;
      (url ? fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
              .then(function (r) { if (!r.ok) throw new Error(r.status); tell('success', T(form.dataset.thanks || 'Thank you — we will call you back.')); form.reset(); update(); })
           : new Promise(function (r) { setTimeout(r, 800); }).then(function () {
               console.info('[order] not sent — no data-endpoint:', lead);
               tell('', T('Preview: the request was not sent — the form is not connected yet.')); }))
        .catch(function () { tell('error', T('The request did not go through. Please try again in a minute.')); })
        .then(function () { busy(false); });
    });

    /* WALLET (2026-10-26, prototype): see the head of this file. */
    $$(form, '[data-wallet]').forEach(function (box) {
      var go = function () { if (form.requestSubmit) form.requestSubmit(); else { var b = form.querySelector('[data-pay]'); if (b) b.click(); } };
      var load = function (src, cb) { var s = document.createElement('script'); s.src = src; s.async = true; if (cb) s.onload = cb; document.head.appendChild(s); };
      var light = document.documentElement.dataset.theme === 'light', uk = /^uk/.test(lang);
      var a = document.createElement('div'); a.className = 'order-wallet-apple';
      var ab = document.createElement('apple-pay-button');
      ab.setAttribute('buttonstyle', light ? 'black' : 'white'); ab.setAttribute('type', 'plain'); ab.setAttribute('locale', uk ? 'uk-UA' : 'en-US');
      ab.addEventListener('click', go); a.appendChild(ab); box.appendChild(a);
      /* Apple's script hides its button where Apple Pay is not offered (a browser off Apple's list):
         the kit's white button with the words stands in, so the row never has a hole. */
      var stand = function () { if (!ab.hasAttribute('hidden') || a.querySelector('.btn')) return;
        var t = document.createElement('button'); t.type = 'button'; t.className = 'btn btn-secondary'; t.textContent = 'Apple Pay';
        t.addEventListener('click', go); ab.remove(); a.appendChild(t); };
      if (window.MutationObserver) new MutationObserver(stand).observe(ab, { attributes: true, attributeFilter: ['hidden'] });
      stand(); setTimeout(stand, 1500);
      if (!window.customElements || !customElements.get('apple-pay-button')) load('https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js');
      var g = document.createElement('div'); g.className = 'order-wallet-google'; box.appendChild(g);
      var draw = function () { try { var c = new google.payments.api.PaymentsClient({ environment: 'TEST' });
        g.appendChild(c.createButton({ onClick: function (e) { if (e && e.preventDefault) e.preventDefault(); go(); },
          buttonColor: light ? 'black' : 'white', buttonType: 'plain', buttonSizeMode: 'fill', buttonRadius: 16, buttonLocale: uk ? 'uk' : 'en' })); } catch (e) { g.remove(); } };
      if (window.google && google.payments) draw(); else load('https://pay.google.com/gp/p/js/pay.js', draw);
    });

    /* CODE (2026-10-26): [data-code-open] gives its place to the row with the field; × puts it back
       (the code cleared). Apply (inside the field, field.css .input-action) turns busy while the code is
       checked, then the field says how it went: .is-success (the check; the field read-only until ×)
       or .is-error, and a line under it. Typing again clears it. Taken, the code's € come off the
       total (form[data-code-off]; the old total struck over the new). Codes are not connected yet:
       form[data-demo-codes] «CODE:€ CODE:€» (default AKVANTIS20:20 FRIEND20:20 — the worker knows the
       same) pass; any other is not found. */
    $$(form, '.order-code').forEach(function (box) {
      var open = box.querySelector('[data-code-open]'), row = box.querySelector('.order-code-row'), f = row && row.querySelector('input:not([type=hidden])'),
          apply = box.querySelector('[data-code]'), close = box.querySelector('[data-code-close]'), field = box.querySelector('.input-action'),
          word = apply && apply.querySelector('span'), line = null;
      if (!open || !row || !field) return;
      var DEMO = {}; (form.dataset.demoCodes || 'AKVANTIS20:20 FRIEND20:20').toUpperCase().split(/\s+/).forEach(function (c) { var k = c.split(':'); DEMO[k[0]] = +k[1] || 0; });
      var kept = box.querySelector('[data-code-value]');   /* only a code taken is sent (name="code") — not one typed and left */
      var take = function (code, eurOff) { if (kept) kept.value = code || ''; if (code) { form.dataset.code = code; form.dataset.codeOff = String(eurOff); } else { delete form.dataset.code; delete form.dataset.codeOff; }
        form.dispatchEvent(new Event('change', { bubbles: true })); };   /* order.js recounts: the line, the struck total */
      var state = function (kind, msg) {
        field.classList.toggle('is-success', kind === 'success'); field.classList.toggle('is-error', kind === 'error');
        if (kind === 'error') f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
        f.readOnly = kind === 'success'; apply.setAttribute('aria-label', kind === 'success' ? T('Applied') : T('Apply'));
        if (line) { line.remove(); line = null; }
        if (msg) { line = document.createElement('p'); line.className = kind === 'success' ? 'field-success' : 'field-error'; line.setAttribute('role', kind === 'error' ? 'alert' : 'status');
          line.innerHTML = '<i data-icon="' + (kind === 'success' ? 'circle-check' : 'circle-alert') + '" data-size="13"></i>' + esc(msg); box.appendChild(line);
          if (window.KitIcons && KitIcons.render) KitIcons.render(line); }
      };
      open.addEventListener('click', function () { open.hidden = true; row.hidden = false; f.focus(); });
      close.addEventListener('click', function () { row.hidden = true; open.hidden = false; f.value = ''; state(''); take(''); open.focus(); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); apply.click(); } });
      f.addEventListener('input', function () { if (field.classList.contains('is-error')) state(''); });
      apply.addEventListener('click', function () {
        if (!f.value.trim()) { state('error', T('Type the code first')); f.focus(); return; }
        state(''); apply.classList.add('is-loading'); apply.setAttribute('aria-busy', 'true'); word.textContent = T('Checking');
        setTimeout(function () { apply.classList.remove('is-loading'); apply.removeAttribute('aria-busy'); word.textContent = T('Apply');
          var c = f.value.trim().toUpperCase();
          if (c in DEMO) { f.value = c; take(c, DEMO[c]); state('success', T('Code applied — {sum} off', { sum: eur(DEMO[c]) })); }
          else state('error', T('We could not find this code')); }, 1200);
      });
    });

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
