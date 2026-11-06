/* Edge fade (2026-11-06) — chips.css «EDGE FADE». Every `.edge-fade` on the page gets
   `.is-fade-start` / `.is-fade-end` while there is content hidden behind that end, kept current
   on scroll, on resize, and once the face has loaded (a late font changes every width).
   Standalone: needs no kit.js, so a reading page links this file alone.
     Kit.edgeFade(el)      wire one scroller (one made after load)
     Kit.edgeFade()        wire every .edge-fade not yet wired */
(function () {
  var Kit = window.Kit = window.Kit || {};
  function wire (el) {
    if (!el || el.__edgeFade) return;
    el.__edgeFade = true;
    var set = function () {
      var max = el.scrollWidth - el.clientWidth;
      el.classList.toggle('is-fade-start', el.scrollLeft > 1);
      el.classList.toggle('is-fade-end', el.scrollLeft < max - 1);
    };
    el.addEventListener('scroll', set, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(set).observe(el); else window.addEventListener('resize', set);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(set);
    set();
  }
  Kit.edgeFade = function (el) {
    if (el) return wire(el);
    var all = document.querySelectorAll('.edge-fade');
    for (var i = 0; i < all.length; i++) wire(all[i]);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { Kit.edgeFade(); });
  else Kit.edgeFade();
}());
