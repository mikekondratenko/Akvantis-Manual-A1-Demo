/* ─────────────────────────────────────────────────────────────────────────────
   Tools UI Kit — builders (Akvantis A1)

   The behavioural half of the kit, ported from the Shokobox Card Generator. Two
   controls in this kit are built rather than written as markup — the segmented
   tabs and the icon toggle — because both carry a sliding thumb whose position is
   derived from the option count, and a hand-written copy of that maths is a copy
   that will eventually disagree with the stylesheet.

   Exposed as `window.Kit`. No dependencies, no build step.
   ───────────────────────────────────────────────────────────────────────────── */

(function (root) {
  'use strict';

  var Kit = {};
  /* One counter for every control that has to name its own elements. */
  Kit._n = 0;

  /* ══════════════ TOAST ══════════════
     Kept even where nothing copies yet, so the confirmation is the same object in
     every tool the day one of them grows a copy gesture. Creates its own node on
     first use, so a page only needs the markup if it wants to place it itself. */
  var toastEl = null, toastTimer = null;

  Kit.toast = function (msg, opts) {
    opts = opts || {};
    if (!toastEl) {
      toastEl = document.getElementById('toast');
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'toast';
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
      }
    }
    toastEl.innerHTML = '';
    if (opts.chip) {
      var chip = document.createElement('span');
      chip.className = 'toast-chip';
      chip.style.background = opts.chip;
      toastEl.appendChild(chip);
    }
    toastEl.appendChild(document.createTextNode(msg));
    toastEl.classList.toggle('toast-invert', !!opts.invert);
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, opts.ms || 1800);
  };

  /* ══════════════ SEGMENTED TABS ══════════════
     N equal segments on a padded track, selection carried by a white thumb. The
     thumb's width is `(100% - 8px) / N` because the track has 4px of padding on
     each side; its travel is a plain N × 100% translate of that width. */
  /* opts.scroll — many options: each segment is as wide as its label, the track scrolls
     sideways, and the thumb is measured from the active button instead of being 1/n of
     the track. The chosen segment is scrolled into view. Without it, nothing changes. */
  Kit.segmented = function (container, options, activeIndex, onChange, opts) {
    var scroll = !!(opts && opts.scroll);
    container.className = 'segmented' + (scroll ? ' is-scroll' : '');
    container.innerHTML = '';
    /* Scroll mode: the segments and the thumb live on an inner rail that scrolls and is
       masked at its ends (segmented.css), so the track keeps its own fill and padding. */
    var host = container;
    if (scroll) { host = document.createElement('div'); host.className = 'segmented-rail'; container.appendChild(host); }

    var thumb = document.createElement('div');
    thumb.className = 'segmented-thumb';
    if (!scroll) thumb.style.width = 'calc((100% - 8px) / ' + options.length + ')';
    host.appendChild(thumb);

    var place = function (i) {
      if (!scroll) { thumb.style.transform = 'translateX(' + (i * 100) + '%)'; return; }
      var b = btns[i]; if (!b) return;
      thumb.style.width = b.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    };

    var btns = options.map(function (opt, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'segment-btn' + (i === activeIndex ? ' is-active' : '');
      btn.dataset.value = String(opt.value);
      if (opt.icon) {
        var iconSpan = document.createElement('span');
        iconSpan.className = 'segment-icon';
        iconSpan.innerHTML = opt.icon;
        btn.appendChild(iconSpan);
      }
      var labelSpan = document.createElement('span');
      labelSpan.textContent = opt.label;
      btn.appendChild(labelSpan);
      btn.addEventListener('click', function () {
        btns.forEach(function (b, j) { b.classList.toggle('is-active', j === i); });
        place(i);
        if (scroll && btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        if (onChange) onChange(opt.value, i);
      });
      host.appendChild(btn);
      return btn;
    });

    place(activeIndex);
    /* Scroll mode: open the mask at the end that has segments hidden behind it. */
    var fades = function () {
      var max = host.scrollWidth - host.clientWidth;
      container.classList.toggle('is-fade-start', host.scrollLeft > 1);
      container.classList.toggle('is-fade-end', host.scrollLeft < max - 1);
    };
    if (scroll) { host.addEventListener('scroll', fades, { passive: true }); fades(); }
    /* Measured geometry goes stale if the face loads late or the track is shown later. */
    if (scroll) {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(activeIndex); fades(); });
      if (window.ResizeObserver) new ResizeObserver(function () {
        var a = btns.findIndex(function (b) { return b.classList.contains('is-active'); }); place(a < 0 ? 0 : a); fades();
      }).observe(host);
    }
    return btns;
  };

  /* ══════════════ ICON TOGGLE ══════════════
     Same mechanism and the same curve as the segmented tabs — the two controls
     must not animate differently — and, since 2026-10-21 (Figma `Tab Bar`), the same
     inset thumb: the track has 4px of padding, so the thumb is `(100% - 8px) / N`.

     Why this reuses the DOM instead of rebuilding it: selecting a panel usually
     re-runs whatever rendered the section, and a freshly-inserted element has no
     previous position to transition from, so the thumb arrives instead of
     travelling and the animation never plays. When the container already holds a
     toggle of the same shape we keep every node and only move the selection.
     onChange is re-registered rather than closed over, because each render passes
     a fresh callback and the buttons outlive it. */
  Kit.iconToggle = function (container, options, activeIndex, onChange) {
    var btns = container.__iconsegBtns;
    var sameShape = Array.isArray(btns) && btns.length === options.length &&
      options.every(function (o, i) { return btns[i].dataset.value === String(o.value); });

    if (sameShape) {
      container.__iconsegOnChange = onChange;
      container.__iconsegSelect(activeIndex);
      return btns;
    }

    container.className = 'iconseg';
    container.innerHTML = '';
    container.__iconsegOnChange = onChange;

    var thumb = document.createElement('div');
    thumb.className = 'iconseg-thumb';
    thumb.style.width = 'calc((100% - 8px) / ' + options.length + ')';
    container.appendChild(thumb);

    btns = [];

    function select(i) {
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', String(j === i)); });
      thumb.style.transform = 'translateX(' + (i * 100) + '%)';
    }
    container.__iconsegSelect = select;

    options.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'iconseg-btn';
      btn.dataset.value = String(opt.value);
      btn.setAttribute('aria-pressed', String(i === activeIndex));
      if (opt.icon) {
        var iconSpan = document.createElement('span');
        iconSpan.className = 'iconseg-icon';
        iconSpan.innerHTML = opt.icon;
        btn.appendChild(iconSpan);
      }
      var labelSpan = document.createElement('span');
      labelSpan.textContent = opt.label;
      btn.appendChild(labelSpan);
      btn.addEventListener('click', function () {
        select(i);
        if (container.__iconsegOnChange) container.__iconsegOnChange(opt.value, i);
      });
      container.appendChild(btn);
      btns.push(btn);
    });

    container.__iconsegBtns = btns;
    // Park the thumb on the opening selection — nothing has been clicked yet.
    select(activeIndex);
    return btns;
  };

  /* ══════════════ TOGGLE SWITCH ══════════════
     The markup is static (a button plus a knob); this only wires the state, so a
     switch behaves identically whether it was written by hand or generated. */
  Kit.toggle = function (el, onChange) {
    el.addEventListener('click', function () {
      if (el.disabled) return;
      var next = el.getAttribute('aria-checked') !== 'true';
      el.setAttribute('aria-checked', String(next));
      if (onChange) onChange(next);
    });
    return {
      get: function () { return el.getAttribute('aria-checked') === 'true'; },
      set: function (v) { el.setAttribute('aria-checked', String(!!v)); }
    };
  };

  /* ══════════════ MARK PICKER ══════════════
     A dropdown whose options are drawings: the product lockups, grouped by series. The
     drawing is `.dd*` in `kit.css`; this is what makes it work.

     Written for the Digital Passport builder, out of the Stick Maker's picker — where
     the argument for it was made: a native `<select>` renders text and nothing else, so
     sixteen models would have to be named, and the name of a mark is not the mark. On a
     label, choosing the wrong lockup off a list of strings is a mistake you find in
     print.

       Kit.markPicker(host, {
         items      : [{ id, group, svg, h, core, word, gen }],
         value      : id of the current item,
         labelledBy : id of the field label, for the button's accessible name,
         placeholder: words for the button while nothing is chosen (2026-10-22) — without
                      it the first item is chosen for you, as before,
         onChange   : function (id) {}
       })

     Returns { set(id), value() } so a consumer can move the selection without going
     through the DOM.

     ── Every mark at one height, and the height is the widest one's arithmetic ──
     The lockups are drawn at very different widths — 53 units to 351 — so rows size them
     by height and let the width run. 13px is not a thumbnail size somebody liked: a row
     is about 188px across once the rail, the plate, the menu and the option have taken
     their padding, and the widest mark is 10.4 wide to 1 tall, so any common height above
     18 puts it past the edge. One mark clamped to fit would be sixteen marks at two
     sizes, which is the comparison the picker exists to make.

     `core` is for the two lockups drawn inside a taller box: scaling by `h / core` makes
     the *word* 13 in both, so the set is optically one size rather than arithmetically. */
  var MARK_PX = 13;
  function markHeight(d) {
    return +(MARK_PX * (d.h || MARK_PX) / (d.core || d.h || MARK_PX)).toFixed(2);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  Kit.markPicker = function (host, opts) {
    opts = opts || {};
    var items = opts.items || [];
    var value = opts.value || (opts.placeholder ? '' : (items[0] && items[0].id));
    var uid = 'dd' + (++Kit._n);

    var groups = [];
    items.forEach(function (d) {
      var g = groups.filter(function (x) { return x.name === d.group; })[0];
      if (!g) groups.push(g = { name: d.group, items: [] });
      g.items.push(d);
    });

    host.className = 'dd';
    host.dataset.open = 'false';
    host.innerHTML =
      '<button class="dd-btn" type="button" id="' + uid + 'b" aria-haspopup="listbox" ' +
        'aria-expanded="false"' +
        (opts.labelledBy ? ' aria-labelledby="' + opts.labelledBy + ' ' + uid + 'b"' : '') + '>' +
        '<span class="dd-mark" data-current></span>' +
        '<span class="dd-gen" data-gen hidden></span>' +
        icon('chevron-down', { size: 14, cls: 'dd-chevron' }) +
      '</button>' +
      '<div class="dd-menu" role="listbox" tabindex="-1">' +
        groups.map(function (g) {
          var gid = uid + '-' + String(g.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return '<div class="dd-group" id="' + gid + '" role="presentation">' + esc(g.name) + '</div>' +
            '<div role="group" aria-labelledby="' + gid + '">' +
              g.items.map(function (d) {
                return '<button class="dd-opt" type="button" role="option" ' +
                  'data-id="' + esc(d.id) + '" aria-selected="false">' +
                  (d.word
                    ? '<span class="dd-word">' + esc(d.word) + '</span>'
                    : '<span class="dd-mark" style="height:' + markHeight(d) + 'px">' + (d.svg || '') + '</span>') +
                  (d.gen ? '<span class="dd-gen">' + esc(d.gen) + '</span>' : '') +
                '</button>';
              }).join('') +
            '</div>';
        }).join('') +
      '</div>';

    var btn     = host.querySelector('.dd-btn');
    var menu    = host.querySelector('.dd-menu');
    var current = host.querySelector('[data-current]');
    var genTag  = host.querySelector('[data-gen]');
    var options = [].slice.call(host.querySelectorAll('.dd-opt'));
    var cursor  = 0;

    function itemOf(id) {
      return items.filter(function (d) { return d.id === id; })[0] || (opts.placeholder ? null : items[0]);
    }

    function paint() {
      var d = itemOf(value);
      if (!d && opts.placeholder) {
        current.textContent = opts.placeholder; current.style.height = '';
        current.classList.add('is-word', 'is-placeholder'); genTag.hidden = true;
        options.forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
        return;
      }
      if (!d) return;
      current.classList.remove('is-placeholder');
      current.innerHTML = d.word ? esc(d.word) : (d.svg || '');
      current.style.height = d.word ? '' : markHeight(d) + 'px';
      current.classList.toggle('is-word', !!d.word);
      /* Hidden rather than emptied: an element with no text still takes its gap, and a
         control with a blank tag beside its mark is a control lying about its state. */
      genTag.textContent = d.gen || '';
      genTag.hidden = !d.gen;
      options.forEach(function (o, i) {
        var on = o.dataset.id === value;
        o.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) cursor = i;
      });
    }

    /* The arrows walk the options and the row scrolls itself into view — a cursor that
       has left the visible part of a 320px menu is a cursor nobody can follow. */
    function move(i) {
      if (!options.length) return;
      cursor = Math.max(0, Math.min(options.length - 1, i));
      options.forEach(function (o, k) { o.classList.toggle('is-active', k === cursor); });
      options[cursor].scrollIntoView({ block: 'nearest' });
    }
    function open()  { host.dataset.open = 'true';  btn.setAttribute('aria-expanded', 'true');  move(cursor); menu.focus(); }
    function close(refocus) {
      host.dataset.open = 'false'; btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus();
    }
    function choose(id) {
      value = id; paint(); close(true);
      if (opts.onChange) opts.onChange(id);
    }

    btn.addEventListener('click', function () {
      host.dataset.open === 'true' ? close(false) : open();
    });
    menu.addEventListener('click', function (e) {
      var o = e.target.closest && e.target.closest('.dd-opt');
      if (o) choose(o.dataset.id);
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown')      { e.preventDefault(); move(cursor + 1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); move(cursor - 1); }
      else if (e.key === 'Home')      { e.preventDefault(); move(0); }
      else if (e.key === 'End')       { e.preventDefault(); move(options.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[cursor].dataset.id); }
      else if (e.key === 'Escape')    { e.preventDefault(); close(true); }
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    /* A menu that stays open when the pointer goes elsewhere is a menu the person has to
       dismiss twice. Capture, so it fires before a click lands on another control. */
    document.addEventListener('mousedown', function (e) {
      if (host.dataset.open === 'true' && !host.contains(e.target)) close(false);
    }, true);

    paint();
    return {
      set: function (id) { value = id; paint(); },
      value: function () { return value; }
    };
  };

  /* ══════════════ DIVIDER ══════════════ */
  Kit.divider = function () {
    var d = document.createElement('div');
    d.className = 'sidebar-divider';
    return d;
  };

  /* ══════════════ FIELD ══════════════
     Label above a 48px input, as one flex item, so the parent's own gap sets the
     spacing on every seam instead of ad-hoc margins. */
  Kit.field = function (labelText, value, onInput, opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'field-group';

    var label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = labelText;

    var input = document.createElement(opts.multiline ? 'textarea' : 'input');
    input.className = 'dark-input';
    if (!opts.multiline) input.type = opts.type || 'text';
    else input.rows = opts.rows || 2;
    if (opts.min !== undefined) input.min = opts.min;
    if (opts.max !== undefined) input.max = opts.max;
    if (opts.step !== undefined) input.step = opts.step;
    if (opts.id) { input.id = opts.id; label.htmlFor = opts.id; }
    input.value = value == null ? '' : value;
    input.placeholder = opts.placeholder || '';
    input.addEventListener(opts.event || 'input', function () { if (onInput) onInput(input.value, input); });

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.input = input;
    return wrap;
  };

  /* ══════════════ STEPPER ══════════════
     Wraps an existing `<input type="number" class="dark-input">` in the kit's stepper
     plate and gives it − / + ends. Takes the element rather than building it, so the
     markup stays readable and `min` / `max` / `step` keep living on the input where
     everything else — the browser, validation, the rest of this file — expects them.

     Hold-to-repeat: one step on press, then a 1000 ms pause, then a step every 70 ms.
     The pause is what makes a click a click. Without it a slightly slow press runs the
     value away, which is the failure mode of every counter that repeats immediately.

     Repeating stops on pointerup, on pointercancel and on leaving the window — a timer
     that outlives the gesture that started it will happily count to the maximum while
     the user is looking at something else. */
  /* The glyphs come from Kit.icons — the same plus the collapsible plate and any icon
     button use. Two drawings of a plus at two stroke weights is how a kit stops looking
     like one kit, and the stepper was the last place still carrying its own copy. */

  Kit.stepper = function (input, opts) {
    if (!input || input.__stepper) return input && input.__stepper;
    opts = opts || {};

    var step = parseFloat(opts.step != null ? opts.step : input.step) || 1;
    var min  = opts.min != null ? +opts.min : (input.min === '' ? -Infinity : +input.min);
    var max  = opts.max != null ? +opts.max : (input.max === '' ?  Infinity : +input.max);
    /* Decimals are taken from the step, so a 0.5 step cannot produce 34.99999999 —
       floating point addition on a text field is visible to the user immediately. */
    var dec = (String(step).split('.')[1] || '').length;

    var wrap = document.createElement('div');
    wrap.className = 'stepper';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    /* The buttons are direct children of .stepper, not wrapped: the stylesheet puts the
       value between them with `order`, and order only applies to flex children. Wrap
       them and both ends collect on one side again. */
    function clamp(v) { return Math.min(max, Math.max(min, v)); }
    function value() { var v = parseFloat(input.value); return isNaN(v) ? clamp(0) : v; }

    function sync() {
      var v = value();
      dec_.forEach(function (b) { b.disabled = v <= min; });
      inc_.forEach(function (b) { b.disabled = v >= max; });
    }

    function bump(dir) {
      var next = clamp(value() + dir * step);
      if (next === value()) { sync(); return; }
      input.value = dec ? next.toFixed(dec) : String(next);
      // Both, and in this order: `input` is what live readouts listen to, `change` is
      // what the page's own handlers were already written against.
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
    }

    var dec_ = [], inc_ = [];
    var holdTimer = null, repeatTimer = null;

    function stop() {
      clearTimeout(holdTimer); clearInterval(repeatTimer);
      holdTimer = repeatTimer = null;
    }

    function mk(dir, icon, label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stepper-btn';
      b.innerHTML = icon;
      b.setAttribute('aria-label', label);
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        bump(dir);
        stop();
        holdTimer = setTimeout(function () {
          repeatTimer = setInterval(function () {
            bump(dir);
            if (b.disabled) stop();     // the end of the range ends the gesture too
          }, opts.repeatMs || 70);
        }, opts.holdMs != null ? opts.holdMs : 1000);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        b.addEventListener(ev, stop);
      });
      wrap.appendChild(b);
      (dir < 0 ? dec_ : inc_).push(b);
      return b;
    }

    mk(-1, Kit.icons.minus, 'Decrease');
    mk(+1, Kit.icons.plus,  'Increase');

    window.addEventListener('blur', stop);
    input.addEventListener('input', sync);
    sync();

    input.__stepper = { el: wrap, input: input, sync: sync, set: function (v) { input.value = v; sync(); } };
    return input.__stepper;
  };

  /* Every numeric field in a subtree, in one call — steppers are the default for a
     number input in this kit, not an opt-in. */
  Kit.steppers = function (root, opts) {
    var list = (root || document).querySelectorAll('input[type="number"].dark-input');
    return [].map.call(list, function (el) { return Kit.stepper(el, opts); });
  };

  /* ══════════════ SLIDER ══════════════
     A range plus the two things it is never useful without: a live readout of its
     value, and the names of its two ends. Returned with `.input` so the caller can
     read or drive it. */
  /* ══════════════ RANGE ══════════════
     Wraps a native <input type="range"> in the kit's bar: a track, a fill drawn over it,
     and the input laid on top invisible. Returns the .range element.

     Why the fill is its own element rather than a gradient on the input: the browser
     does not park the thumb's centre across the full width. It runs from half a thumb in
     to half a thumb from the far end, because the thumb has to stay inside the control.
     A fill painted as a plain percentage of the box therefore drifts away from the handle
     at both ends — by up to 12px here, half the thumb — and the gap is worst exactly where
     it is most visible, at 0 and at the maximum. paint() measures to the handle's centre
     instead, which is the one number that matches what the eye is comparing. */
  var RANGE_THUMB = 24;

  Kit.range = function (input) {
    if (!input || input.__range) return input && input.__range;

    var el = document.createElement('div');
    el.className = 'range';
    input.parentNode.insertBefore(el, input);

    var track = document.createElement('div');
    track.className = 'range-track';
    var fill = document.createElement('div');
    fill.className = 'range-fill';
    el.appendChild(track);
    el.appendChild(fill);
    el.appendChild(input);
    input.classList.remove('slider');
    input.classList.add('range-input');

    function paint() {
      var min = parseFloat(input.min) || 0;
      var max = parseFloat(input.max);
      if (isNaN(max)) max = 100;
      var t = max === min ? 0 : (parseFloat(input.value) - min) / (max - min);
      fill.style.width = (RANGE_THUMB / 2 + t * (el.clientWidth - RANGE_THUMB)) + 'px';
    }

    input.addEventListener('input', paint);
    input.addEventListener('change', paint);
    // clientWidth is in the maths, so a resize has to repaint.
    window.addEventListener('resize', paint);
    paint();

    el.paint = paint;
    input.__range = el;
    return el;
  };

  /* Every range input in a subtree, in one call. */
  Kit.ranges = function (root) {
    var list = (root || document).querySelectorAll('input[type="range"]:not(.range-input)');
    return [].map.call(list, function (el) { return Kit.range(el); });
  };

  Kit.slider = function (labelText, opts, onInput) {
    opts = opts || {};
    var wrap = document.createElement('div');

    var head = document.createElement('div');
    head.className = 'value-row';
    var name = document.createElement('span');
    name.className = 'toggle-row-label';
    name.textContent = labelText;
    var val = document.createElement('span');
    val.className = 'val';
    head.appendChild(name);
    head.appendChild(val);

    var input = document.createElement('input');
    input.type = 'range';
    input.className = 'slider';
    input.min = opts.min != null ? opts.min : 0;
    input.max = opts.max != null ? opts.max : 100;
    input.step = opts.step != null ? opts.step : 1;
    input.value = opts.value != null ? opts.value : input.min;
    if (opts.id) input.id = opts.id;
    input.setAttribute('aria-label', labelText);

    var fmt = opts.format || function (v) { return v; };
    function sync() { val.textContent = fmt(input.value); }
    input.addEventListener('input', function () { sync(); if (onInput) onInput(+input.value, input); });
    sync();

    wrap.appendChild(head);
    wrap.appendChild(input);
    /* Wrapped after it is in the tree: Kit.range() inserts the bar where the input
       stands, so the input needs a parent to be inserted before. */
    Kit.range(input);

    if (opts.ends) {
      var ends = document.createElement('div');
      ends.className = 'ends';
      var a = document.createElement('span'); a.textContent = opts.ends[0];
      var b = document.createElement('span'); b.textContent = opts.ends[1];
      ends.appendChild(a); ends.appendChild(b);
      wrap.appendChild(ends);
    }

    wrap.input = input;
    wrap.sync = sync;
    return wrap;
  };

  /* ══════════════ FORMAT BAR ══════════════
     A row of four buttons over a textarea: heading, subheading, bold, italic.

     ── WHAT IT IS NOT ──
     It is not a rich-text editor. The textarea still holds plain text and the marks are
     Markdown's — `#`, `##`, `**`, `*` — which the consumer renders however it likes. The
     alternative was `contenteditable`, and that trades a file you can read, diff, paste
     into an email and escape on the way out for a soup of browser-generated HTML whose
     exact tags depend on which browser typed it. On a page that carries warranty terms,
     what is stored has to be the words.

     So the buttons do not format anything. They type the marks for you, around whatever
     is selected — which is the entire difference between "I have to remember the syntax"
     and "I do not", and it is the whole reason this exists rather than a line of grey
     help text.

     ── TOGGLING ──
     Every button is a toggle, because a person who applied a heading by pressing a button
     will try to remove it by pressing the same button. Pressing `H1` on a line that is
     already `# ` takes it back to a paragraph; pressing it on a `## ` line promotes it.
     Bold and italic unwrap a selection that is already wrapped.

       Kit.formatBar(textarea, { marks: ['h1','h2','bold','italic'] })

     The textarea keeps focus and its selection through every press, and an `input` event
     is dispatched afterwards so whatever was already listening repaints. */
  var FORMAT_MARKS = {
    h1:     { icon: 'h1',     label: 'Heading',     line: '# ' },
    h2:     { icon: 'h2',     label: 'Subheading',  line: '## ' },
    bold:   { icon: 'bold',   label: 'Bold',        wrap: '**' },
    italic: { icon: 'italic', label: 'Italic',      wrap: '*' }
  };

  Kit.formatBar = function (ta, opts) {
    opts = opts || {};
    var which = opts.marks || ['h1', 'h2', 'bold', 'italic'];

    var bar = document.createElement('div');
    bar.className = 'fmt-bar';
    ta.parentNode.insertBefore(bar, ta);

    /* Applied by rewriting `value` wholesale and putting the selection back by hand.
       `execCommand('insertText')` would give free undo, but it is deprecated, absent in
       Firefox for this case, and silently does nothing where it is absent — which is a
       button that appears to work and does not. A visible rewrite that always happens
       beats an invisible one that sometimes does. */
    function apply (v, selStart, selEnd) {
      ta.value = v;
      ta.setSelectionRange(selStart, selEnd);
      ta.focus();
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /* The whole of every line the selection touches, so pressing `H1` with the caret
       anywhere in a line does what the person meant. */
    function lineSpan () {
      var v = ta.value;
      var a = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
      var b = v.indexOf('\n', ta.selectionEnd);
      return [a, b < 0 ? v.length : b];
    }

    function toggleLine (prefix) {
      var v = ta.value, span = lineSpan();
      var before = v.slice(0, span[0]), after = v.slice(span[1]);
      var lines = v.slice(span[0], span[1]).split('\n');
      /* Off only when every line already carries this exact prefix — a mixed selection
         is brought up to the prefix rather than half-cleared, which is what every editor
         does and what anybody dragging across three lines expects. */
      var all = lines.every(function (l) { return l.indexOf(prefix) === 0; });
      var out = lines.map(function (l) {
        var bare = l.replace(/^#{1,6}\s+/, '');
        return all ? bare : prefix + bare;
      }).join('\n');
      apply(before + out + after, span[0], span[0] + out.length);
    }

    /* ── COUNTING ASTERISKS, NOT MATCHING THEM ──
       The obvious check — "is there a `*` just before the selection?" — is wrong, and it
       was wrong here until 2026-09-10: pressing Italic on text that was already bold saw
       the first star of `**`, decided the text was italic, and removed one from each side,
       turning `**two**` into `*two*`. The button demoted the bold instead of adding
       anything, which is the worst kind of bug in a toolbar — it does something, so it
       does not look broken.

       `*` and `**` are the same character, so what settles it is the length of the run.
       Italic is present when the runs either side are ODD; bold when they are at least
       two. `***two***` reads as both, and each button takes away only its own share. */
    function runBefore (v, i) { var n = 0; while (i - n - 1 >= 0 && v[i - n - 1] === '*') n++; return n; }
    function runAfter  (v, i) { var n = 0; while (i + n < v.length && v[i + n] === '*') n++; return n; }
    function leadRun (str) { var n = 0; while (n < str.length && str[n] === '*') n++; return n; }
    function tailRun (str) { var n = 0; while (n < str.length && str[str.length - 1 - n] === '*') n++; return n; }
    function has (before, after, n) {
      return n === 1 ? (before % 2 === 1 && after % 2 === 1) : (before >= 2 && after >= 2);
    }

    function toggleWrap (mark) {
      var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
      var sel = v.slice(s, e), n = mark.length;

      /* The marks are inside the selection — the person dragged across them. */
      var li = leadRun(sel), ti = tailRun(sel);
      if (sel.length > li + ti && has(li, ti, n)) {
        var inner = sel.slice(n, sel.length - n);
        return apply(v.slice(0, s) + inner + v.slice(e), s, s + inner.length);
      }

      /* Or around it — which is what a previous press of this button left. */
      if (has(runBefore(v, s), runAfter(v, e), n)) {
        return apply(v.slice(0, s - n) + sel + v.slice(e + n), s - n, e - n);
      }

      /* Nothing selected: the marks go in and the caret lands between them, ready to
         type. An empty `****` left in the text would be four characters the person then
         has to delete. */
      apply(v.slice(0, s) + mark + sel + mark + v.slice(e),
            s + n, s + n + sel.length);
    }

    which.forEach(function (key) {
      var m = FORMAT_MARKS[key];
      if (!m) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'icon-btn icon-btn-sm';
      b.innerHTML = Kit.icons[m.icon] || '';
      b.title = m.label;
      b.setAttribute('aria-label', m.label);
      /* `mousedown` is where the default is prevented, not `click`: by the time a click
         fires the textarea has already lost focus and with it the selection the button
         was about to act on. */
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        if (m.line) toggleLine(m.line); else toggleWrap(m.wrap);
      });
      bar.appendChild(b);
    });

    return bar;
  };

  /* ══════════════ SCENE PANEL ══════════════
     A tuning panel built from a flat spec: rows of {key, label, min, max, step, value},
     with a title row wherever a string appears instead of an object. Every change calls
     onChange(key, value) — one callback rather than one per row, so the caller maps the
     panel onto its scene in a single place.

     Toggled by a key, hidden by default. It is developer furniture, not a feature, and
     a tool that shows its tuning panel to everyone has shipped its workbench. */
  Kit.scenePanel = function (host, spec, onChange, opts) {
    opts = opts || {};
    host.className = 'scene-panel';
    host.innerHTML = '';
    host.hidden = true;

    var rows = {};
    var choices = {};

    spec.forEach(function (item) {
      if (typeof item === 'string') {
        var t = document.createElement('div');
        t.className = 'scene-panel-title';
        t.textContent = item;
        host.appendChild(t);
        return;
      }
      /* A choice row rather than a slider: same label column, a strip of small pills in
         place of the track. For the settings that pick a thing instead of a quantity —
         which source a scene reads from, say — where a range would be a lie. */
      if (item.options) {
        var row = document.createElement('label');
        var rname = document.createElement('span');
        rname.textContent = item.label;
        var seg = document.createElement('span');
        seg.className = 'scene-panel-seg';
        choices[item.key] = item.value;
        var pills = item.options.map(function (o) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = o.label;
          b.classList.toggle('is-on', o.value === item.value);
          b.addEventListener('click', function () {
            pills.forEach(function (p) { p.classList.remove('is-on'); });
            b.classList.add('is-on');
            choices[item.key] = o.value;
            onChange(item.key, o.value);
          });
          seg.appendChild(b);
          return b;
        });
        row.appendChild(rname); row.appendChild(seg);
        // The value column stays empty so the label grid keeps its three tracks.
        row.appendChild(document.createElement('span'));
        host.appendChild(row);
        return;
      }

      var label = document.createElement('label');
      var name = document.createElement('span');
      name.textContent = item.label;

      var input = document.createElement('input');
      input.type = 'range';
      input.min = item.min; input.max = item.max; input.step = item.step;
      input.value = item.value;

      var val = document.createElement('span');
      val.className = 'val';

      var dp = (String(item.step).split('.')[1] || '').length;
      function show() { val.textContent = dp ? (+input.value).toFixed(dp) : input.value; }
      input.addEventListener('input', function () { show(); onChange(item.key, +input.value); });
      show();

      label.appendChild(name); label.appendChild(input); label.appendChild(val);
      host.appendChild(label);
      rows[item.key] = { input: input, show: show, def: item.value };
    });

    if (opts.reset !== false || opts.copy) {
      var bar = document.createElement('div');
      bar.className = 'scene-panel-row';

      if (opts.reset !== false) {
        var reset = document.createElement('button');
        reset.type = 'button';
        reset.textContent = 'Reset';
        reset.addEventListener('click', function () {
          Object.keys(rows).forEach(function (k) {
            rows[k].input.value = rows[k].def;
            rows[k].show();
            onChange(k, +rows[k].def);
          });
        });
        bar.appendChild(reset);
      }

      /* Copy values. A tuning panel is worth nothing if the numbers it arrives at have
         to be transcribed by hand — that is where they get mistyped and where the
         settling ends. This writes them out as source, ready to paste back. */
      if (opts.copy) {
        var copy = document.createElement('button');
        copy.type = 'button';
        copy.textContent = 'Copy values';
        copy.addEventListener('click', function () {
          var text = opts.copy(values());
          var done = function () {
            copy.textContent = 'Copied';
            setTimeout(function () { copy.textContent = 'Copy values'; }, 1200);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
          } else fallback(text, done);
        });
        bar.appendChild(copy);
      }

      host.appendChild(bar);
    }

    function fallback(text, done) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { console.log(text); }
      document.body.removeChild(ta);
    }

    function values() {
      var out = {};
      Object.keys(rows).forEach(function (k) { out[k] = +rows[k].input.value; });
      if (choices) Object.keys(choices).forEach(function (k) { out[k] = choices[k]; });
      return out;
    }

    if (opts.hint) {
      var hint = document.createElement('div');
      hint.className = 'scene-panel-hint';
      hint.textContent = opts.hint;
      host.appendChild(hint);
    }

    var api = {
      el: host, rows: rows, values: values,
      /* Push a value in from outside without firing onChange — for the settings that
         something else in the page can also move. A panel showing a number the scene
         no longer holds is worse than a panel with no number at all. */
      set: function (k, v) {
        var r = rows[k];
        if (!r) return;
        r.input.value = v;
        r.show();
      },
      toggle: function () { host.hidden = !host.hidden; return !host.hidden; },
      show: function () { host.hidden = false; },
      hide: function () { host.hidden = true; }
    };

    /* Bound on keydown, and only when nothing is being typed into — a hotkey that fires
       while the cursor is in a text field is a hotkey that eats the letter. */
    if (opts.key) {
      window.addEventListener('keydown', function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        var t = e.target, tag = t && t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
        if (e.key.toLowerCase() !== opts.key.toLowerCase()) return;
        e.preventDefault();
        api.toggle();
      });
    }

    return api;
  };

  /* ══════════════ ICONS ══════════════
     Since 2026-10-21 the kit's icons are one set — Lucide plus a few of Akvantis' own, built into
     icons.js by ui-kit/build-icons.mjs (grid 24, 1.5 px stroke at every size, round, currentColor).
     The audit that day found a plus drawn six ways; this file used to hold one of them.

       Kit.icon('chevron-down', { size: 16 })   → the <svg>
       <i data-icon="chevron-down"></i>          → swapped for it by icons.js, on load and later

     When icons.js has not run yet, Kit.icon returns the <i data-icon> placeholder, which icons.js
     swaps the moment it starts — so the order the two files load in does not matter.

     Kit.icons keeps its old keys for the tools that read them; each now resolves to the set. */
  function icon(name, opts) {
    opts = opts || {};
    if (root.KitIcons) return root.KitIcons.svg(name, opts);
    return '<i data-icon="' + name + '"' + (opts.size ? ' data-size="' + opts.size + '"' : '') +
      (opts.fill ? ' data-fill' : '') + (opts.cls ? ' class="' + opts.cls + '"' : '') + '></i>';
  }
  Kit.icon = icon;
  var LEGACY_ICONS = {
    h1: ['heading-1', 16], h2: ['heading-2', 16], bold: ['bold', 16], italic: ['italic', 16],
    plus: ['plus', 16], minus: ['minus', 16],
    box: ['box', 20], cube: ['cube', 20], flat: ['dieline', 20],
    drop: ['upload', 18], download: ['download', 16], print: ['printer', 16], back: ['chevron-left', 16],
    perspective: ['perspective', 20], orthographic: ['orthographic', 20],
    play: ['play', 18, true], rows: ['rows-3', 20], tiles: ['layout-grid', 20],
    endPanels: ['end-panels', 24], longPanels: ['long-panels', 24]
  };
  Kit.icons = {};
  Object.keys(LEGACY_ICONS).forEach(function (k) {
    var d = LEGACY_ICONS[k];
    Object.defineProperty(Kit.icons, k, { enumerable: true, get: function () { return icon(d[0], { size: d[1], fill: d[2] }); } });
  });

  /* ══════════════ HOTKEYS ══════════════
     Kit.hotkey('c', fn) — one key, one handler, bound once on the document.

     Three things it does that a bare keydown listener does not, and each of them is
     a bug someone has already hit:

     • It matches the physical key, through `event.code`, not the character the
       layout produced. On a Cyrillic or a Dvorak keyboard `event.key` for the key
       marked C is not "c", and a shortcut that stops existing when the layout
       changes is worse than no shortcut. The letter given here names the position.

     • It stays out of the way of typing. While the focus is in an input, a
       textarea, a select or anything contenteditable, the key is a letter the
       person meant to write, not a command — see the note in box.html.

     • It ignores anything held with a modifier, so ⌘C, ⌃C and ⌥C still do what the
       browser and the operating system say they do. A tool that eats copy to
       toggle a panel is a tool people stop trusting with a keyboard.

     Handlers are stacked per key and run in the order they were registered; the
     document listener is installed on first use and never removed. */
  var hotkeys = null;

  function isTyping(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }

  Kit.hotkey = function (key, fn) {
    if (typeof fn !== 'function') return;
    var code = String(key).length === 1 && /[a-z]/i.test(key)
      ? 'Key' + String(key).toUpperCase()   // 'c' → 'KeyC', the position not the letter
      : String(key);                        // anything else is given as a KeyboardEvent.code

    if (!hotkeys) {
      hotkeys = {};
      document.addEventListener('keydown', function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (isTyping(e.target)) return;
        var list = hotkeys[e.code];
        if (!list || !list.length) return;
        e.preventDefault();
        for (var i = 0; i < list.length; i++) list[i](e);
      });
    }

    (hotkeys[code] || (hotkeys[code] = [])).push(fn);
  };

  /* ══════════════ CALENDAR ══════════════
     Kit.calendar(input, opts) — a month on a popover under a text field holding a date.

     The format is DD.MM.YYYY, which is what the labels this kit builds are printed in, and
     it is the reason the control exists: `07.05.2026` is 7 May and 5 July in the same eleven
     characters, and a bare text field cannot say which one it took. A grid with the weekday
     letters over it can only be read one way.

     The field stays a text input and stays typeable. This is an aid, not a gate — a date
     somebody already knows is faster from the keyboard than from twelve clicks through the
     months, and a picker that refuses typing is a picker people fight. What the calendar
     guarantees is that whatever it writes back is written in one format.

     Weeks start on Monday. The kit's labels are European and so is the week they are printed
     in; a Sunday-first grid puts the weekend on both ends of the row.

     opts.onPick(value, date) fires after the field is written, so a caller can re-render
     whatever the field feeds. Returns { open, close, destroy, sync }.  */
  var CAL_DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  var CAL_MONTH = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];

  function calPad(n) { return (n < 10 ? '0' : '') + n; }
  function calFormat(d) {
    return calPad(d.getDate()) + '.' + calPad(d.getMonth() + 1) + '.' + d.getFullYear();
  }
  /* Strict on purpose. A half-typed date is not a date, and guessing at `7.5` would have the
     calendar jump to a month the person never asked for while they were still typing. */
  function calParse(v) {
    var m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/.exec(String(v || ''));
    if (!m) return null;
    var day = +m[1], mon = +m[2] - 1, year = +m[3];
    var d = new Date(year, mon, day);
    if (d.getDate() !== day || d.getMonth() !== mon || d.getFullYear() !== year) return null;
    return d;
  }
  function calSameDay(a, b) {
    return !!a && !!b && a.getDate() === b.getDate() &&
           a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }

  Kit.calendar = function (input, opts) {
    if (!input) return null;
    opts = opts || {};

    var pop = document.createElement('div');
    pop.className = 'cal';
    pop.hidden = true;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', opts.label || 'Choose a date');
    document.body.appendChild(pop);

    /* The month on show, which is not the same thing as the date chosen: paging to March and
       closing without picking must not move the field. */
    var view = null;

    function selected() { return calParse(input.value); }

    function draw() {
      var sel = selected();
      var today = new Date();
      if (!view) view = sel ? new Date(sel.getFullYear(), sel.getMonth(), 1) : new Date();

      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      /* getDay() is Sunday-0; this is the offset to the Monday on or before the first. */
      var lead = (first.getDay() + 6) % 7;
      var start = new Date(first.getFullYear(), first.getMonth(), 1 - lead);

      var cells = '';
      for (var i = 0; i < 42; i++) {
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        var cls = 'cal-day';
        if (d.getMonth() !== view.getMonth()) cls += ' is-out';
        if (calSameDay(d, today)) cls += ' is-today';
        if (calSameDay(d, sel))   cls += ' is-on';
        cells += '<button type="button" class="' + cls + '" data-cal="' + calFormat(d) + '" ' +
                 'tabindex="-1">' + d.getDate() + '</button>';
      }

      pop.innerHTML =
        '<div class="cal-head">' +
          '<button type="button" class="cal-nav" data-cal-step="-1" aria-label="Previous month">' +
            icon('chevron-left', { size: 16 }) +
          '</button>' +
          '<div class="cal-title">' + CAL_MONTH[view.getMonth()] + ' ' + view.getFullYear() + '</div>' +
          '<button type="button" class="cal-nav" data-cal-step="1" aria-label="Next month">' +
            icon('chevron-right', { size: 16 }) +
          '</button>' +
        '</div>' +
        '<div class="cal-grid">' +
          CAL_DOW.map(function (w) { return '<div class="cal-dow">' + w + '</div>'; }).join('') +
          cells +
        '</div>';
    }

    /* Anchored to the field in page coordinates rather than parented to it: the rails these
       fields sit in scroll and clip their overflow, and a popover inside one is cut off by
       the panel it belongs to. */
    function place() {
      var r = input.getBoundingClientRect();
      pop.style.left = (r.left + window.scrollX) + 'px';
      pop.style.top  = (r.bottom + window.scrollY + 6) + 'px';
    }

    function open() {
      var sel = selected();
      view = sel ? new Date(sel.getFullYear(), sel.getMonth(), 1) : new Date();
      draw(); place();
      pop.hidden = false;
    }
    function close() { pop.hidden = true; }
    function isOpen() { return !pop.hidden; }

    function pick(value) {
      input.value = value;
      /* The field is somebody else's — fire the event it would have got from a keystroke, so
         a caller listening for input needs to know nothing about this control. */
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (opts.onPick) opts.onPick(value, calParse(value));
      close();
    }

    pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
    pop.addEventListener('click', function (e) {
      var step = e.target.closest('[data-cal-step]');
      if (step) {
        view = new Date(view.getFullYear(), view.getMonth() + (+step.dataset.calStep), 1);
        draw();
        return;
      }
      var day = e.target.closest('[data-cal]');
      if (day) pick(day.dataset.cal);
    });

    input.addEventListener('focus', open);
    input.addEventListener('click', function () { if (!isOpen()) open(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { e.preventDefault(); close(); }
    });
    /* Typing a complete date walks the calendar to it, so the grid is never showing a
       different month from the one in the field. */
    input.addEventListener('input', function () {
      if (!isOpen()) return;
      var d = selected();
      if (d) { view = new Date(d.getFullYear(), d.getMonth(), 1); }
      draw();
    });

    function away(e) {
      if (!isOpen()) return;
      if (e.target === input || pop.contains(e.target)) return;
      close();
    }
    document.addEventListener('mousedown', away);
    window.addEventListener('resize', function () { if (isOpen()) place(); });
    /* Capture, because the rail scrolls in its own box and that scroll does not bubble. */
    window.addEventListener('scroll', function () { if (isOpen()) place(); }, true);

    return {
      open: open,
      close: close,
      sync: function () { if (isOpen()) draw(); },
      destroy: function () {
        document.removeEventListener('mousedown', away);
        if (pop.parentNode) pop.parentNode.removeChild(pop);
      }
    };
  };

  /* ══════════════ PROGRESS ══════════════
     Kit.progress(host, opts) — the Figma `Progress Bar` (700:5724): a level on a 144 plate,
     the reading in the middle, − and + at the ends. The look is progress.css.

       opts.value / min / max / step   numbers, default 0 / 0 / 100 / 1
       opts.unit                       '%' by default; '' for none
       opts.label                      the line under the number ('Salt level')
       opts.accent                     the cyan → blue fill instead of the neutral one
       opts.readonly                   a reading only: no ends, no drag, no keys
       opts.format(v)                  how the number is printed (default: as is)
       opts.onChange(v)                after every change the person makes

     Set three ways, and all three are the same `set()`: the ends (one step on press, then
     the stepper's 1000 ms pause and a step every 70 ms while held), a press or drag on the
     plate (the level goes where the finger is), and the keys — ← ↓ / → ↑ a step,
     PageDown / PageUp ten, Home / End the ends. The plate is the `role="slider"`, so a screen
     reader hears one control with one value rather than two buttons and a number.
     Returns { el, get(), set(v) }. */
  Kit.progress = function (host, opts) {
    opts = opts || {};
    var min = opts.min != null ? +opts.min : 0, max = opts.max != null ? +opts.max : 100;
    var step = opts.step != null ? +opts.step : 1;
    var dec = (String(step).split('.')[1] || '').length;
    var fmt = opts.format || function (v) { return v.toFixed(dec); };
    var value = min;

    host.className = 'progress' + (opts.accent ? ' is-accent' : '') + (opts.readonly ? ' is-readonly' : '');
    host.innerHTML =
      '<div class="progress-fill"></div>' +
      '<button type="button" class="progress-step" data-step="-1" tabindex="-1" aria-hidden="true">' +
      icon('minus', { size: 24 }) + '</button>' +
      '<div class="progress-read"><div class="progress-value"><span class="progress-num"></span>' +
      (opts.unit === '' ? '' : '<span class="progress-unit"></span>') + '</div>' +
      (opts.label ? '<div class="progress-label"></div>' : '') + '</div>' +
      '<button type="button" class="progress-step" data-step="1" tabindex="-1" aria-hidden="true">' +
      icon('plus', { size: 24 }) + '</button>';
    var num = host.querySelector('.progress-num'), unit = host.querySelector('.progress-unit');
    var label = host.querySelector('.progress-label');
    var less = host.querySelector('[data-step="-1"]'), more = host.querySelector('[data-step="1"]');
    if (unit) unit.textContent = opts.unit != null ? opts.unit : '%';
    if (label) label.textContent = opts.label;

    host.setAttribute('role', opts.readonly ? 'meter' : 'slider');
    host.setAttribute('aria-valuemin', min); host.setAttribute('aria-valuemax', max);
    if (opts.label) host.setAttribute('aria-label', opts.label);
    if (!opts.readonly) host.tabIndex = 0;

    function snap(v) {
      v = Math.round((v - min) / step) * step + min;
      return +Math.min(max, Math.max(min, v)).toFixed(dec);
    }
    function set(v, fromUser) {
      v = snap(+v); var changed = v !== value; value = v;
      host.style.setProperty('--progress', max === min ? 0 : (v - min) / (max - min));
      num.textContent = fmt(v);
      host.setAttribute('aria-valuenow', v);
      host.setAttribute('aria-valuetext', fmt(v) + (unit ? unit.textContent : ''));
      less.disabled = v <= min; more.disabled = v >= max;
      cover();
      if (fromUser && changed && opts.onChange) opts.onChange(v);
    }
    /* What the fill is under. On the accent ramp the words and glyphs are white (Figma) — but
       only where the ramp is actually behind them: a reading at 30 % sits on the pale track,
       where white would vanish. Each of the three (−, the reading, +) turns white only when
       the fill covers it whole. */
    var read = host.querySelector('.progress-read');
    function cover() {
      var W = host.clientWidth; if (!W) return;
      var t = max === min ? 0 : (value - min) / (max - min), edge = t * W;
      [less, read, more].forEach(function (el) {
        var right = el === read ? (W + read.offsetWidth) / 2 : el.offsetLeft + el.offsetWidth;
        el.classList.toggle('is-on-fill', edge >= right);
      });
    }
    if (window.ResizeObserver) new ResizeObserver(cover).observe(host);
    set(opts.value != null ? opts.value : min);
    if (opts.readonly) return { el: host, get: function () { return value; }, set: function (v) { set(v); } };

    /* The ends — hold to repeat, the stepper's timing. */
    var hold = null, rep = null;
    function stop() { clearTimeout(hold); clearInterval(rep); hold = rep = null; }
    [less, more].forEach(function (b) {
      var dir = +b.dataset.step;
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation(); if (b.disabled) return;
        set(value + dir * step, true);
        hold = setTimeout(function () { rep = setInterval(function () {
          if (b.disabled) return stop(); set(value + dir * step, true); }, 70); }, 1000);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { b.addEventListener(t, stop); });
    });
    window.addEventListener('blur', stop);

    /* The plate — the level goes where the finger is. */
    function fromX(e) {
      var r = host.getBoundingClientRect();
      set(min + Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (max - min), true);
    }
    host.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.progress-step')) return;
      host.setPointerCapture(e.pointerId); host.classList.add('is-dragging'); host.focus(); fromX(e);
      var move = function (ev) { fromX(ev); };
      var up = function () {
        host.classList.remove('is-dragging');
        host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up);
      };
      host.addEventListener('pointermove', move); host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    });

    host.addEventListener('keydown', function (e) {
      var k = e.key, big = step * 10;
      if (k === 'ArrowRight' || k === 'ArrowUp') set(value + step, true);
      else if (k === 'ArrowLeft' || k === 'ArrowDown') set(value - step, true);
      else if (k === 'PageUp') set(value + big, true);
      else if (k === 'PageDown') set(value - big, true);
      else if (k === 'Home') set(min, true);
      else if (k === 'End') set(max, true);
      else return;
      e.preventDefault();
    });

    return { el: host, get: function () { return value; }, set: function (v) { set(v); } };
  };

  /* ══════════════ COLOUR PICKER ══════════════
     Kit.colorPicker(input) — the kit's own popover for an `<input type="color">`: the color
     mesh (hue by angle, saturation by radius), a brightness bar, the hex, the eyedropper.
     The look is in swatch.css (`.cpick`).

     It DRIVES the input rather than replacing it: the input keeps the value, and every change
     is written there with the `input` event the native panel would have fired, `change` on
     close. So a consumer that listens to the input needs to know nothing about this.

     Nobody has to call it. A click (or Enter / Space) on any `input.swatch-input[type=color]`
     anywhere in the document is caught below, the native panel is kept shut, and this one
     opens — the swatch rails of the tools and the Builder get it without an edit.
     Returns { open, close }. One popover for the page, re-pointed at whichever input opened. */
  function cpHexToRgb(h) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h || '').trim());
    if (!m) return null;
    var x = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
  }
  function cpRgbToHex(r) {
    return '#' + r.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('').toUpperCase();
  }
  function cpHsvToRgb(h, s, v) {
    var f = function (n) { var k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [f(5) * 255, f(3) * 255, f(1) * 255];
  }
  function cpRgbToHsv(r) {
    var R = r[0] / 255, G = r[1] / 255, B = r[2] / 255;
    var max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min, h = 0;
    if (d) {
      if (max === R) h = ((G - B) / d) % 6; else if (max === G) h = (B - R) / d + 2; else h = (R - G) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, max ? d / max : 0, max];
  }

  var cp = null;   // the one popover, built on first use

  function cpBuild() {
    var pop = document.createElement('div');
    pop.className = 'cpick'; pop.hidden = true;
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Choose a color');
    pop.innerHTML =
      '<div class="cpick-wheel"><canvas></canvas><div class="cpick-dim"></div>' +
      '<button type="button" class="cpick-handle" role="slider" aria-label="Hue and saturation"></button></div>' +
      '<input class="cpick-range" type="range" min="0" max="100" step="1" aria-label="Brightness">' +
      '<div class="cpick-row"><span class="cpick-chip" aria-hidden="true"></span>' +
      '<input class="cpick-hex" type="text" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hex">' +
      '<button type="button" class="cpick-tool" aria-label="Pick from the screen" title="Pick from the screen" hidden>' +
      icon('pipette', { size: 18 }) + '</button></div>';
    document.body.appendChild(pop);

    var wheel = pop.querySelector('.cpick-wheel'), canvas = pop.querySelector('canvas');
    var dim = pop.querySelector('.cpick-dim'), handle = pop.querySelector('.cpick-handle');
    var range = pop.querySelector('.cpick-range'), chip = pop.querySelector('.cpick-chip');
    var hex = pop.querySelector('.cpick-hex'), tool = pop.querySelector('.cpick-tool');
    var st = { h: 0, s: 0, v: 1, input: null, anchor: null, drawn: 0 };

    /* True HSV at V = 1, hue clockwise from three o'clock DOWNWARD in hue (red → magenta →
       blue), which is the mesh on the `.swatch-custom` disc: `conic-gradient(from 90deg, red,
       magenta, blue, cyan, green, yellow)`. Drawn once per pixel size. */
    function paintWheel() {
      var px = Math.round(wheel.clientWidth * (window.devicePixelRatio || 1));
      if (!px || st.drawn === px) return;
      st.drawn = px; canvas.width = canvas.height = px;
      var ctx = canvas.getContext('2d'), img = ctx.createImageData(px, px), d = img.data, c = px / 2;
      for (var y = 0; y < px; y++) for (var x = 0; x < px; x++) {
        var dx = x + .5 - c, dy = y + .5 - c, r = Math.sqrt(dx * dx + dy * dy) / c;
        var i = (y * px + x) * 4;
        if (r > 1) { d[i + 3] = 0; continue; }
        var a = Math.atan2(dy, dx) * 180 / Math.PI;
        var rgb = cpHsvToRgb((360 - a) % 360, r, 1);
        d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
        d[i + 3] = r > 1 - 1.5 / c ? 255 * (1 - r) * c / 1.5 : 255;   // a soft edge, one pixel
      }
      ctx.putImageData(img, 0, 0);
    }

    function render(skipHex) {
      var rgb = cpHsvToRgb(st.h, st.s, st.v), hx = cpRgbToHex(rgb);
      var R = wheel.clientWidth / 2, a = -st.h * Math.PI / 180;
      handle.style.left = (R + Math.cos(a) * st.s * R) + 'px';
      handle.style.top  = (R + Math.sin(a) * st.s * R) + 'px';
      handle.style.background = hx;
      handle.setAttribute('aria-valuetext', 'hue ' + Math.round(st.h) + '°, saturation ' + Math.round(st.s * 100) + '%');
      dim.style.opacity = String(1 - st.v);
      range.value = String(Math.round(st.v * 100));
      pop.style.setProperty('--cpick-full', cpRgbToHex(cpHsvToRgb(st.h, st.s, 1)));
      chip.style.background = hx;
      if (!skipHex) hex.value = hx;
      return hx;
    }

    function commit(skipHex) {
      var hx = render(skipHex);
      if (st.input && st.input.value.toUpperCase() !== hx) {
        st.input.value = hx.toLowerCase();
        st.input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    function fromPoint(e) {
      var b = wheel.getBoundingClientRect(), R = b.width / 2;
      var dx = e.clientX - b.left - R, dy = e.clientY - b.top - R;
      st.s = Math.min(1, Math.sqrt(dx * dx + dy * dy) / R);
      st.h = (360 - Math.atan2(dy, dx) * 180 / Math.PI) % 360;
      if (st.v === 0) st.v = 1;   // picking a color off a black wheel should show the color
      commit();
    }
    wheel.addEventListener('pointerdown', function (e) {
      e.preventDefault(); wheel.setPointerCapture(e.pointerId); handle.focus(); fromPoint(e);
      var move = function (ev) { fromPoint(ev); };
      var up = function () { wheel.removeEventListener('pointermove', move); wheel.removeEventListener('pointerup', up); wheel.removeEventListener('pointercancel', up); };
      wheel.addEventListener('pointermove', move); wheel.addEventListener('pointerup', up); wheel.addEventListener('pointercancel', up);
    });
    /* Keyboard: ← → turn the hue, ↑ ↓ move toward the edge or the centre; Shift for big steps. */
    handle.addEventListener('keydown', function (e) {
      var k = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowRight') st.h = (st.h - k + 360) % 360;
      else if (e.key === 'ArrowLeft') st.h = (st.h + k) % 360;
      else if (e.key === 'ArrowUp') st.s = Math.min(1, st.s + k / 100);
      else if (e.key === 'ArrowDown') st.s = Math.max(0, st.s - k / 100);
      else return;
      e.preventDefault(); commit();
    });
    range.addEventListener('input', function () { st.v = +range.value / 100; commit(); });
    hex.addEventListener('input', function () {
      var rgb = cpHexToRgb(hex.value); if (!rgb) return;
      var hsv = cpRgbToHsv(rgb); st.h = hsv[0]; st.s = hsv[1]; st.v = hsv[2]; commit(true);
    });
    hex.addEventListener('blur', function () { render(); });
    hex.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); close(true); } });
    if ('EyeDropper' in window) {
      tool.hidden = false;
      tool.addEventListener('click', function () {
        new window.EyeDropper().open().then(function (res) {
          var hsv = cpRgbToHsv(cpHexToRgb(res.sRGBHex)); st.h = hsv[0]; st.s = hsv[1]; st.v = hsv[2]; commit();
        }, function () {});
      });
    }

    function place() {
      var a = (st.anchor || st.input).getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
      var gap = 8, vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
      var top = a.bottom + gap; if (top + h > vh - gap && a.top - gap - h >= gap) top = a.top - gap - h;
      var left = Math.max(gap, Math.min(a.left, vw - w - gap));
      pop.style.top = Math.max(gap, top) + 'px'; pop.style.left = left + 'px';
    }

    function open(input) {
      if (st.input && st.input !== input) close();
      st.input = input; st.anchor = input.closest('.swatch-btn') || input;
      var hsv = cpRgbToHsv(cpHexToRgb(input.value) || [255, 255, 255]);
      st.h = hsv[0]; st.s = hsv[1]; st.v = hsv[2];
      pop.hidden = false; paintWheel(); render(); place();
      handle.focus();
    }
    function close(refocus) {
      if (pop.hidden) return;
      pop.hidden = true;
      var input = st.input; st.input = null;
      if (input) {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        if (refocus) input.focus();
      }
    }
    function away(e) {
      if (pop.hidden) return;
      if (pop.contains(e.target) || (st.anchor && st.anchor.contains(e.target))) return;
      close();
    }
    document.addEventListener('pointerdown', away, true);
    pop.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(true); } });
    window.addEventListener('resize', function () { if (!pop.hidden) { st.drawn = 0; paintWheel(); render(); place(); } });
    window.addEventListener('scroll', function () { if (!pop.hidden) place(); }, true);

    return { open: open, close: close, isOpen: function () { return !pop.hidden; }, input: function () { return st.input; } };
  }

  Kit.colorPicker = function (input) {
    if (!cp) cp = cpBuild();
    return { open: function () { cp.open(input); }, close: function () { cp.close(); } };
  };

  /* The catch: any `input.swatch-input[type=color]` opens the kit's picker, not the native one.
     Capture phase, so it runs before anything on the input itself; a second click on the same
     input closes it, the way the native panel toggles. */
  function cpTarget(e) {
    var t = e.target;
    return t && t.matches && t.matches('input.swatch-input[type="color"]') && !t.disabled ? t : null;
  }
  document.addEventListener('click', function (e) {
    var input = cpTarget(e); if (!input) return;
    e.preventDefault();
    if (!cp) cp = cpBuild();
    if (cp.isOpen() && cp.input() === input) cp.close(); else cp.open(input);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var input = cpTarget(e); if (!input) return;
    e.preventDefault();
    if (!cp) cp = cpBuild();
    cp.open(input);
  }, true);

  root.Kit = Kit;
})(window);
