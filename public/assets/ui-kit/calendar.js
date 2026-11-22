/* calendar.js — the kit's date picker for a text field, on its own (2026-11-22).
   The same calendar as Kit.calendar in kit.js (the builder's), for pages that do not load kit.js — the landing's
   return form first. The look is calendar.css; the colours are the ramp's, so it is right on either theme.

     <label class="field"><span class="field-label">Date</span>
       <input type="text" class="dark-input" name="received" data-calendar placeholder="ДД.ММ.РРРР"></label>

   The field stays a text input and stays typeable: DD.MM.YYYY, the format the kit prints. The calendar is an aid,
   not a gate — a date somebody knows is faster from the keyboard. Whatever it writes back is in one format.
   Weeks start on Monday. Month and weekday names in the page's language (<html lang>), from the browser (Intl).
   data-calendar-max="today" — the days after today are drawn faint and cannot be picked (a delivery date, a receipt).
   A pick fires `input` and `change` on the field. KitCalendar.bind(root) for fields added later; KitCalendar.parse(v)
   → a Date or null; KitCalendar.iso(v) → YYYY-MM-DD or ''. Runs itself on DOMContentLoaded. No dependency;
   uses KitIcons for the arrows when icons.js is on the page. */
(function () {
  'use strict';
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var WORDS = {
    uk: { prev: 'Попередній місяць', next: 'Наступний місяць', pick: 'Оберіть дату' },
    de: { prev: 'Vorheriger Monat', next: 'Nächster Monat', pick: 'Datum wählen' },
    en: { prev: 'Previous month', next: 'Next month', pick: 'Choose a date' }
  }[lang] || { prev: 'Previous month', next: 'Next month', pick: 'Choose a date' };

  var monthFmt, dowNames;
  try {
    /* the month alone, then the year: «Листопад 2026», not the long form's «листопад 2026 р.» */
    var mf = new Intl.DateTimeFormat(lang, { month: 'long' });
    monthFmt = { format: function (d) { return mf.format(d) + ' ' + d.getFullYear(); } };
    var wd = new Intl.DateTimeFormat(lang, { weekday: 'short' });
    dowNames = [];
    for (var k = 0; k < 7; k++) dowNames.push(wd.format(new Date(2024, 0, 1 + k)).replace('.', ''));   /* 1 Jan 2024 is a Monday */
  } catch (e) {
    monthFmt = { format: function (d) { return (d.getMonth() + 1) + '.' + d.getFullYear(); } };
    dowNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  }
  var title = function (d) { var t = monthFmt.format(d); return t.charAt(0).toUpperCase() + t.slice(1); };

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var format = function (d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); };
  /* Strict on purpose: a half-typed date is not a date, and guessing at `7.5` would walk the grid to a month nobody asked for. */
  function parse(v) {
    var m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/.exec(String(v || ''));
    if (!m) return null;
    var day = +m[1], mon = +m[2] - 1, year = +m[3], d = new Date(year, mon, day);
    return d.getDate() === day && d.getMonth() === mon && d.getFullYear() === year ? d : null;
  }
  var same = function (a, b) { return !!a && !!b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear(); };
  var arrow = function (name) { return window.KitIcons ? KitIcons.svg(name, { size: 16 }) : (name === 'chevron-left' ? '‹' : '›'); };

  function attach(input) {
    if (input.__kitCal) return; input.__kitCal = true;
    input.setAttribute('autocomplete', 'off');
    var maxToday = input.dataset.calendarMax === 'today';
    var pop = document.createElement('div');
    pop.className = 'cal'; pop.hidden = true;
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', input.dataset.calendarLabel || WORDS.pick);
    document.body.appendChild(pop);
    var view = null;   /* the month on show — not the date chosen: paging and closing must not move the field */

    function draw() {
      var sel = parse(input.value), today = new Date(); today.setHours(0, 0, 0, 0);
      if (!view) view = sel ? new Date(sel.getFullYear(), sel.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1);
      var first = new Date(view.getFullYear(), view.getMonth(), 1), lead = (first.getDay() + 6) % 7, cells = '';
      for (var i = 0; i < 42; i++) {
        var d = new Date(first.getFullYear(), first.getMonth(), 1 - lead + i), cls = 'cal-day', late = maxToday && d > today;
        if (d.getMonth() !== view.getMonth()) cls += ' is-out';
        if (same(d, today)) cls += ' is-today';
        if (same(d, sel)) cls += ' is-on';
        if (late) cls += ' is-off';
        cells += '<button type="button" class="' + cls + '" data-cal="' + format(d) + '" tabindex="-1"' + (late ? ' disabled' : '') + '>' + d.getDate() + '</button>';
      }
      var nextOff = maxToday && new Date(view.getFullYear(), view.getMonth() + 1, 1) > today;
      pop.innerHTML = '<div class="cal-head">'
        + '<button type="button" class="cal-nav" data-cal-step="-1" aria-label="' + WORDS.prev + '">' + arrow('chevron-left') + '</button>'
        + '<div class="cal-title">' + title(view) + '</div>'
        + '<button type="button" class="cal-nav" data-cal-step="1" aria-label="' + WORDS.next + '"' + (nextOff ? ' disabled' : '') + '>' + arrow('chevron-right') + '</button>'
        + '</div><div class="cal-grid">' + dowNames.map(function (w) { return '<div class="cal-dow">' + w + '</div>'; }).join('') + cells + '</div>';
    }
    /* anchored to the field in page coordinates, so no clipping box can cut it off */
    function place() {
      var r = input.getBoundingClientRect();
      pop.style.left = (r.left + window.scrollX) + 'px';
      pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
    }
    function open() { var sel = parse(input.value); view = sel ? new Date(sel.getFullYear(), sel.getMonth(), 1) : null; draw(); place(); pop.hidden = false; }
    function close() { pop.hidden = true; }
    var isOpen = function () { return !pop.hidden; };
    function pick(v) {
      input.value = v;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    }

    pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
    pop.addEventListener('click', function (e) {
      var step = e.target.closest('[data-cal-step]');
      if (step) { if (!step.disabled) { view = new Date(view.getFullYear(), view.getMonth() + (+step.dataset.calStep), 1); draw(); } return; }
      var day = e.target.closest('[data-cal]'); if (day && !day.disabled) pick(day.dataset.cal);
    });
    input.addEventListener('focus', open);
    input.addEventListener('click', function () { if (!isOpen()) open(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) { e.preventDefault(); close(); } if (e.key === 'Tab') close(); });
    /* typing a complete date walks the grid to it */
    input.addEventListener('input', function () { if (!isOpen()) return; var d = parse(input.value); if (d) view = new Date(d.getFullYear(), d.getMonth(), 1); draw(); });
    document.addEventListener('mousedown', function (e) { if (isOpen() && e.target !== input && !pop.contains(e.target)) close(); });
    window.addEventListener('resize', function () { if (isOpen()) place(); });
    window.addEventListener('scroll', function () { if (isOpen()) place(); }, true);
  }

  function bind(root) { [].forEach.call((root || document).querySelectorAll('input[data-calendar]'), attach); }
  window.KitCalendar = {
    bind: bind, parse: parse, format: format,
    iso: function (v) { var d = parse(v); return d ? d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) : ''; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bind(); }); else bind();
})();
