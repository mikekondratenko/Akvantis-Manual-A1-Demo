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
  Kit.segmented = function (container, options, activeIndex, onChange) {
    container.className = 'segmented';
    container.innerHTML = '';

    var thumb = document.createElement('div');
    thumb.className = 'segmented-thumb';
    thumb.style.width = 'calc((100% - 8px) / ' + options.length + ')';
    container.appendChild(thumb);

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
        thumb.style.transform = 'translateX(' + (i * 100) + '%)';
        if (onChange) onChange(opt.value, i);
      });
      container.appendChild(btn);
      return btn;
    });

    thumb.style.transform = 'translateX(' + (activeIndex * 100) + '%)';
    return btns;
  };

  /* ══════════════ ICON TOGGLE ══════════════
     Same mechanism and the same curve as the segmented tabs — the two controls
     must not animate differently — but full-bleed: the thumb runs to the group's
     own edges rather than sitting inset on a track.

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
    thumb.style.width = 'calc(100% / ' + options.length + ')';
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
    var value = opts.value || (items[0] && items[0].id);
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
        '<svg class="dd-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" ' +
          'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
          'stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5L8 10.5L12 6.5"/></svg>' +
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
      return items.filter(function (d) { return d.id === id; })[0] || items[0];
    }

    function paint() {
      var d = itemOf(value);
      if (!d) return;
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
     A small shared set, so two tools never draw the same idea two ways. Feather
     geometry, 1.8 stroke, currentColor — they inherit the control's own colour and
     therefore its states. */
  Kit.icons = {
    /* ── THE FOUR FORMATTING GLYPHS ──
       Set as `<text>`, not drawn as paths, and that is the right call for exactly these
       four: `H1`, `H2`, `B` and `I` are *letters* in every editor anybody has used, and a
       letter drawn as a path is a letter that stops matching the interface's own face the
       day the face changes. `font-family: inherit` hands them the kit's type, so the
       toolbar is set in the same voice as everything around it.

       It is also why there is no icon here for "paragraph" or "normal": the way back to
       body text is pressing the heading button again, and a toolbar of four is one a
       person reads rather than scans. */
    h1: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><text x="8" y="12" text-anchor="middle" font-family="inherit" font-size="11" font-weight="700" letter-spacing="-0.4">H1</text></svg>',
    h2: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><text x="8" y="12" text-anchor="middle" font-family="inherit" font-size="11" font-weight="700" letter-spacing="-0.4">H2</text></svg>',
    bold: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><text x="8" y="12.5" text-anchor="middle" font-family="inherit" font-size="13" font-weight="800">B</text></svg>',
    italic: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><text x="8" y="12.5" text-anchor="middle" font-family="inherit" font-size="13" font-weight="500" font-style="italic">I</text></svg>',

    /* One plus and one minus for the whole kit — the stepper's ends, the collapsible
       plate's sign, any icon button that adds something. Drawn on a 16 box at 1.6, the
       weight every other glyph here uses, so they sit at the same optical density as
       their neighbours instead of one control's plus looking heavier than another's. */
    plus:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10"/><path d="M3 8h10"/></svg>',
    minus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 8h10"/></svg>',
    box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
    cube: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z"/><path d="M3 7.5 12 12l9-4.5"/></svg>',
    flat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="1.6"/><path d="M7 6v12M12 6v12M17 6v12"/></svg>',
    /* Tray with an arrow coming down into it — the one icon everybody already reads as
       "put a file here", which is the point of putting it on a drop zone. */
    drop: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v10"/><path d="M8.5 9.5 12 13l3.5-3.5"/><path d="M3 15v3.5A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5V15"/></svg>',
    download: '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v9"/><path d="M6.5 8.5 10 12l3.5-3.5"/><path d="M3 14v2.5h14V14"/></svg>',
    print: '<svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M5 8V3H15V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 14H3.5C2.67157 14 2 13.3284 2 12.5V9.5C2 8.67157 2.67157 8 3.5 8H16.5C17.3284 8 18 8.67157 18 9.5V12.5C18 13.3284 17.3284 14 16.5 14H15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="11" width="10" height="6" stroke="currentColor" stroke-width="1.6"/></svg>',
    back: '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 6 10l6 6"/></svg>',
    /* A trapezoid for perspective — edges converging toward a vanishing point — against
       a plain rectangle for orthographic, where they stay parallel. The two icons say
       the difference between the projections rather than naming them. */
    perspective: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5h10l4 14H3L7 5z"/></svg>',
    orthographic: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="1.5"/></svg>',
    /* A solid triangle, optically centred rather than geometrically: a triangle centred on
       its bounding box reads as sitting left of centre inside a circle, because its mass is
       all on the left edge. The 0.6 nudge right is the correction, and it is the whole
       reason this is drawn here once instead of in each tool. */
    play: '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><path d="M6.2 3.6v10.8a.7.7 0 0 0 1.07.6l8.5-5.4a.7.7 0 0 0 0-1.2l-8.5-5.4a.7.7 0 0 0-1.07.6Z"/></svg>',

    /* ── TWO WAYS TO LAY A LIST OUT ──
       Three lines against four squares, and that is the whole drawing. The pair only has
       to say which of two arrangements you are choosing, so they *are* the arrangement —
       nothing representational, no frame around them, no rounded corners standing in for
       a card. A row is a line and a tile is a square; anything added past that is a
       detail the eye has to resolve before it gets the answer it already had.

       20 on a 24 box, the size the icon toggle's glyphs are drawn at. */
    rows:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
    tiles: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg>',
    endPanels: '<svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="24" height="12" rx="1.5"/><rect x="4.5" y="8" width="4" height="4" rx="2"/><rect x="19.5" y="8" width="4" height="4" rx="2"/></svg>',
    longPanels: '<svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="24" height="12" rx="1.5"/><rect x="10" y="8" width="8" height="4" rx="2"/></svg>'
  };

  /* ══════════════ BRAND MARKS ══════════════
     Markup rather than files, for the reason the icons are: a <use> into a same-document
     sprite needs no fetch, inherits `currentColor`, and survives being opened over
     file://, which is how half of these pages get looked at. `viewBox` and no width or
     height, so the CSS decides the size — `.brand-wave` pins one, `.plate-empty` scales
     one, and the mark itself has no opinion. */
  Kit.marks = {
    wave: '<svg class="wave-mark" viewBox="0 0 176 176" fill="none" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M88 0C39.4812 0 0 39.4812 0 88C0 136.519 39.4812 176 88 176C136.519 176 ' +
      '176 136.519 176 88C176 39.4812 136.536 0 88 0ZM164.921 88C164.921 130.41 130.41 ' +
      '164.921 88 164.921C45.59 164.921 11.0795 130.41 11.0795 88C11.0795 45.59 45.59 ' +
      '11.0795 88 11.0795C130.41 11.0795 164.921 45.59 164.921 88Z" fill="currentColor"/>' +
      '<path d="M128.821 57.5738L134.411 78.7453C122.227 85.9085 106.963 87.8165 91.683 ' +
      '82.3437C83.2813 79.3646 76.0345 78.4776 68.5031 79.2809C60.3859 80.1512 54.1265 ' +
      '82.578 47.1809 86.9295L41.5742 65.7746C49.3064 60.2014 57.7416 57.1721 67.0638 ' +
      '56.4023C72.6202 55.9504 77.7918 56.3018 82.9299 57.6073C90.2437 59.465 95.75 ' +
      '62.3771 104.604 62.6617C112.804 62.9295 120.754 61.3562 128.804 57.5905" ' +
      'fill="currentColor"/>' +
      '<path d="M128.837 90.4761L134.427 111.648C122.243 118.811 106.979 120.719 91.6986 ' +
      '115.246C83.297 112.267 76.0501 111.38 68.5187 112.183C60.4016 113.054 54.1421 ' +
      '115.48 47.1965 119.832L41.5898 98.677C49.3221 93.1038 57.7572 90.0745 67.0794 ' +
      '89.3046C72.6359 88.8527 77.8074 89.2042 82.9455 90.5096C90.2593 92.3674 95.7656 ' +
      '95.2795 104.619 95.564C112.82 95.8318 120.77 94.2586 128.82 90.4929" ' +
      'fill="currentColor"/></svg>'
  };

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
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
              'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M10 3.5L6 8l4 4.5"/></svg>' +
          '</button>' +
          '<div class="cal-title">' + CAL_MONTH[view.getMonth()] + ' ' + view.getFullYear() + '</div>' +
          '<button type="button" class="cal-nav" data-cal-step="1" aria-label="Next month">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
              'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M6 3.5L10 8l-4 4.5"/></svg>' +
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

  root.Kit = Kit;
})(window);
