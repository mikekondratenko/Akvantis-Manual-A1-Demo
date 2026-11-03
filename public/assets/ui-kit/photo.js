/* photo.js — PHOTO DROP, the kit's «import photo» (2026-11-03: the trade-in's old system on the A1 landing).

   A place to drop pictures on, or to press for the file dialog; what was taken shows above it as
   thumbnails, each with its own × to take it out again.

     <div class="photo-drop" data-name="tradein_photos" data-max="5" data-max-mb="20" data-required
          data-say="Add a photo of your system">
       <div class="photo-drop-list" role="list"></div>
       <label class="photo-drop-zone">
         <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif">
         <i data-icon="image-up" data-size="24"></i>
         <span class="photo-drop-title"><span class="photo-drop-touch">Add photos</span><span class="photo-drop-drag">Drop photos here or</span>
           <span class="photo-drop-link photo-drop-drag">choose files</span></span>   (the touch words on a phone, the drag words with a mouse)
         <span class="photo-drop-note">JPG, PNG or HEIC · up to 5 photos, 20 MB each</span>
       </label>
       <p class="photo-drop-msg" role="alert" hidden></p>
       <input type="hidden" name="tradein_photos">
     </div>

   SMALL   every picture is made small here — its long side to 1280 px, JPEG 0.82 — so a phone's 12 MB photo
           travels as ~200 KB. The hidden input holds them as one JSON list of data: URLs: one field, so a
           form sent as JSON (order.js PAY) keeps them all.
   HEIC    an iPhone's photo. Safari draws it itself; where the browser cannot (Chrome, Firefox),
           heic2any.min.js (next to this file, MIT) is loaded — only then, it is 1.3 MB — and turns it into
           a JPEG first. A thumbnail turns while that runs.
   LIMITS  data-max pictures (5), data-max-mb each (20); a wrong type, too big, unreadable — a line in
           .photo-drop-msg says so, the rest are taken. At the limit the place to drop hides.
   NEED    data-required: none taken (or one still being read) → the file input carries data-say as its
           error (setCustomValidity) — order.js SEND shows it under the field. A change fires `input`
           on the file input and `change` on the box (both bubble): a form recounts, the error clears. */
(function () {
  var T = function (s, v) { var d = (window.KitLang && KitLang.t && KitLang.t(s)) || s;
    return v ? d.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }) : d; };
  var HERE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/?#]*([?#].*)?$/, '');
  var lib = null;
  var heicLib = function () { return lib || (lib = new Promise(function (ok, no) {
    if (window.heic2any) return ok(window.heic2any);
    var s = document.createElement('script'); s.src = HERE + 'heic2any.min.js';
    s.onload = function () { if (window.heic2any) ok(window.heic2any); else no(new Error('heic2any')); };
    s.onerror = function () { lib = null; no(new Error('heic2any')); }; document.head.appendChild(s); })); };
  var isHeic = function (f) { return /hei[cf]$/i.test(f.type || '') || /\.hei[cf]$/i.test(f.name || ''); };
  var TYPE = /^image\/(jpeg|png|webp|hei[cf])$/i, EXT = /\.(jpe?g|png|webp|hei[cf])$/i;
  var draw = function (blob) { return new Promise(function (ok, no) {
    var url = URL.createObjectURL(blob), img = new Image();
    img.onload = function () {
      var k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);   /* a PNG's transparency on white, as a JPEG must */
      g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.82)); };
    img.onerror = function () { URL.revokeObjectURL(url); no(new Error('decode')); };
    img.src = url; }); };
  var small = function (f) { return draw(f).catch(function (e) { if (!isHeic(f)) throw e;
    return heicLib().then(function (h) { return h({ blob: f, toType: 'image/jpeg', quality: 0.9 }); })
      .then(function (b) { return draw(Array.isArray(b) ? b[0] : b); }); }); };

  function init(box) {
    if (box.__photo) return; box.__photo = true;
    var input = box.querySelector('input[type=file]'), out = box.querySelector('input[type=hidden]');
    var list = box.querySelector('.photo-drop-list'), zone = box.querySelector('.photo-drop-zone'), msg = box.querySelector('.photo-drop-msg');
    if (!input) return;
    if (out && box.dataset.name && !out.name) out.name = box.dataset.name;
    var max = +box.dataset.max || 5, mb = +box.dataset.maxMb || 20, items = [], seq = 0;
    var say = function (t) { if (!msg) return; msg.textContent = t || ''; msg.hidden = !t; };
    var render = function () {
      list.innerHTML = '';
      items.forEach(function (it, n) {
        var fig = document.createElement('figure'); fig.className = 'photo-drop-item' + (it.url ? '' : ' is-busy'); fig.setAttribute('role', 'listitem');
        if (it.url) { var img = document.createElement('img'); img.src = it.url; img.alt = T('Photo {n}', { n: n + 1 }); fig.appendChild(img); }
        var x = document.createElement('button'); x.type = 'button'; x.className = 'photo-drop-remove';
        x.setAttribute('aria-label', T('Remove photo {n}', { n: n + 1 }));
        x.innerHTML = window.KitIcons ? KitIcons.svg('x', { size: 14 }) : '×';
        x.addEventListener('click', function () { items = items.filter(function (i) { return i !== it; }); say(''); update();
          var next = list.querySelectorAll('.photo-drop-remove')[Math.min(n, items.length - 1)]; (next || input).focus(); });
        fig.appendChild(x); list.appendChild(fig);
      });
      list.hidden = !items.length;
      zone.hidden = items.length >= max;
      box.classList.toggle('has-photos', items.length > 0);
    };
    var update = function () {
      render();
      var done = items.filter(function (i) { return i.url; });
      if (out) out.value = done.length ? JSON.stringify(done.map(function (i) { return i.url; })) : '';
      var busy = items.length > done.length;
      input.setCustomValidity(busy ? T('Wait — the photo is being prepared') : ('required' in box.dataset && !done.length) ? T(box.dataset.say || 'Add a photo') : '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      box.dispatchEvent(new Event('change', { bubbles: true }));
    };
    var take = function (files) {
      var bad = [], room = max - items.length;
      [].slice.call(files || []).forEach(function (f) {
        if (!(TYPE.test(f.type || '') || EXT.test(f.name || ''))) return bad.push(T('{name}: not a JPG, PNG or HEIC', { name: f.name }));
        if (f.size > mb * 1048576) return bad.push(T('{name}: larger than {mb} MB', { name: f.name, mb: mb }));
        if (room <= 0) return bad.push(T('Up to {max} photos', { max: max }));
        room--; var it = { id: ++seq, url: null }; items.push(it);
        small(f).then(function (u) { it.url = u; update(); }, function () {
          items = items.filter(function (i) { return i !== it; }); say(T('{name}: could not be read', { name: f.name })); update(); });
      });
      say(bad.filter(function (b, i) { return bad.indexOf(b) === i; }).join(' · ')); update();
    };
    input.addEventListener('change', function () { take(input.files); input.value = ''; });
    /* drag and drop: the whole box takes it, the place to drop lights up */
    var depth = 0, over = function (on) { zone.classList.toggle('is-over', on); };
    box.addEventListener('dragenter', function (e) { if (!e.dataTransfer || [].indexOf.call(e.dataTransfer.types, 'Files') < 0) return; e.preventDefault(); depth++; over(true); });
    box.addEventListener('dragover', function (e) { if (!e.dataTransfer || [].indexOf.call(e.dataTransfer.types, 'Files') < 0) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    box.addEventListener('dragleave', function () { if (--depth <= 0) { depth = 0; over(false); } });
    box.addEventListener('drop', function (e) { e.preventDefault(); depth = 0; over(false); if (!input.disabled) take(e.dataTransfer && e.dataTransfer.files); });
    update();
  }
  var go = function () { [].forEach.call(document.querySelectorAll('.photo-drop'), init); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  window.PhotoDrop = { init: init };
})();
