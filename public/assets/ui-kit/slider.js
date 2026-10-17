/* ─────────────────────────────────────────────────────────────────────────────
   Slider — the behaviour of .sec-slides, .sec-gallery and .sec-reviews (2026-10-12)

   The track is a CSS scroll-snap row (section.css) and works by finger with no script.
   This adds the controls, after the track, in a `.slider-ctrl` row:
     data-autoplay="5000" on .slider → dots that fill over that many ms, and a pause button;
                                       plays only while the slider is on screen, and never
                                       under prefers-reduced-motion
     otherwise                       → prev / next arrows, disabled at the ends
   Markup:  <div class="slider" [data-autoplay="5000"]><ul class="slider-track">
              <li class="slide">…</li> … </ul></div>
   Runs on every .slider once the page is parsed; `Slider.init(el)` for one added later.
   Requires button.css. No kit.js.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var ICON = {
    prev: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><rect x="3" y="2" width="3" height="10" rx="1"/><rect x="8" y="2" width="3" height="10" rx="1"/></svg>',
    play: '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M4 2.5v9l7.5-4.5z"/></svg>'
  };
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(root) {
    if (root.dataset.sliderBound) return; root.dataset.sliderBound = '1';
    var track = root.querySelector('.slider-track'); if (!track) return;
    var slides = [].slice.call(track.children);
    var ctrl = document.createElement('div'); ctrl.className = 'slider-ctrl';
    var pad = function () { return parseFloat(getComputedStyle(track).paddingLeft) || 0; };
    var current = function () {
      var x = track.scrollLeft + pad(), best = 0, d = Infinity;
      slides.forEach(function (s, i) { var e = Math.abs(s.offsetLeft - x); if (e < d) { d = e; best = i; } });
      return best;
    };
    var go = function (i) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[i].offsetLeft - pad() });
    };
    var auto = +root.dataset.autoplay;

    if (auto) {
      root.style.setProperty('--slide-ms', auto + 'ms');
      var dots = document.createElement('div'); dots.className = 'slider-dots';
      slides.forEach(function (s, i) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'slider-dot';
        b.setAttribute('aria-label', 'Slide ' + (i + 1)); b.addEventListener('click', function () { go(i); restart(); });
        dots.appendChild(b);
      });
      var pp = document.createElement('button'); pp.type = 'button'; pp.className = 'btn btn-frost btn-round';
      ctrl.append(dots, pp);
      var timer = null, visible = false, paused = still;
      var mark = function () {
        var c = current();
        [].forEach.call(dots.children, function (d, i) {
          var on = i === c;
          if (on && !d.classList.contains('is-on')) { d.classList.remove('is-on'); void d.offsetWidth; }
          d.classList.toggle('is-on', on); d.setAttribute('aria-current', on ? 'true' : 'false');
        });
      };
      var playing = function () { return visible && !paused; };
      var restart = function () {
        clearTimeout(timer);
        root.classList.toggle('is-playing', playing()); root.classList.toggle('is-paused', paused);
        pp.innerHTML = paused ? ICON.play : ICON.pause; pp.setAttribute('aria-label', paused ? 'Play' : 'Pause');
        var on = dots.querySelector('.is-on'); if (on) { on.classList.remove('is-on'); void on.offsetWidth; on.classList.add('is-on'); }
        if (playing()) timer = setTimeout(function () { go(current() + 1); restart(); }, auto);
      };
      pp.addEventListener('click', function () { paused = !paused; restart(); });
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; restart(); }, { threshold: .5 }).observe(root);
      var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(mark, 80); }, { passive: true });
      mark(); restart();
    } else {
      var prev = document.createElement('button'), next = document.createElement('button');
      prev.type = next.type = 'button'; prev.className = next.className = 'btn btn-neutral btn-round';
      prev.innerHTML = ICON.prev; next.innerHTML = ICON.next;
      prev.setAttribute('aria-label', 'Previous'); next.setAttribute('aria-label', 'Next');
      var step = function (dir) { var i = current() + dir; if (i >= 0 && i < slides.length) go(i); };
      prev.addEventListener('click', function () { step(-1); }); next.addEventListener('click', function () { step(1); });
      var ends = function () {
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      };
      track.addEventListener('scroll', ends, { passive: true }); addEventListener('resize', ends);
      ctrl.append(prev, next); ends();
    }
    root.appendChild(ctrl);
  }
  window.Slider = { init: init };
  var all = function () { document.querySelectorAll('.slider').forEach(init); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
})();
