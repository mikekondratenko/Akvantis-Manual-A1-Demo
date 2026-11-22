/* ─────────────────────────────────────────────────────────────────────────────
   Waves — a sheet of water with rings running out of it, as a card's ground.

   Tuned on `A1-Landing-Page/public/water-waves.html`, which is the bench: it carries the
   same arithmetic with a panel on it (L), and «Copy settings» there writes the object this
   file's DEFAULTS is. Numbers change on the bench and travel here; nothing is tuned twice.

   ── WHAT IT DRAWS ──
   One plane and one shader — no Three.js, as everywhere else in this kit. Every ring is
   drawn rather than filmed: a drop is where it landed and when, and the height of the water
   anywhere is the sum of what the live drops are still doing there:

       front = speed · age                  how far the ring has got
       off   = r − front                    where this point sits relative to it
       h     = amp · sin(2π·off/len) · exp(−off²/2w²) · exp(−damp·age) / (1 + r)

   The slope is the derivative of that sum, so a normal costs one loop rather than three
   evaluations, and the grid can be fine enough that a crest is a curve and not a polyline.

   ── USING IT ──
     <div class="fig-card has-waves">
       <canvas class="fig-wave" data-waves></canvas>      ← mounts itself
       …the card's words…
     </div>

     Waves.mount(canvas)                    // defaults below
     Waves.mount(canvas, { amp: .04 })      // or any of them
     h.set('speed', 1.4);  h.drop();  h.stop();

   `data-waves` may carry JSON to override: `data-waves='{"amp":0.04}'`.

   Returns null when it will not run — no WebGL, or the reader has asked for less motion.
   A card whose canvas stays empty is a card with its own ground behind it, which is why
   the canvas is transparent and the card paints `--tile` underneath: nothing looks broken.

   ⚠ IT STOPS WHEN IT IS NOT SEEN. A background that animates off-screen is a phone's
   battery spent on nothing: an IntersectionObserver pauses every mounted sheet that leaves
   the window, and `document.hidden` pauses the lot.
   ───────────────────────────────────────────────────────────────────────────── */

(function (global) {
  'use strict';

  /* Tuned 2026-11-21 on the bench. Light water on a white page: the landing's cards. */
  var DEFAULTS = {
    speed   : 1.17,   /* units a second the ring front travels */
    len     : 0.50,   /* crest to crest */
    amp     : 0.085,  /* height of a fresh ring */
    damp    : 0.80,   /* how fast a drop dies, a second */
    every   : 1.30,   /* seconds between drops */
    spread  : 0.00,   /* radius the drops land in; 0 = one point, concentric rings */
    /* Where the drops fall on the sheet. Screen-wise with the default camera: +x is right,
       +z is towards the viewer — so the pair below puts the rings in the bottom-right corner
       of the card and lets them run up and across it (2026-11-21, Michael). */
    originX : 0.60,
    originZ : 0.30,
    orbit   : 0,      /* around the centre, degrees */
    /* Half the camera's distances is twice the size on screen: the rings read as water seen
       close up rather than a pond seen from a window (2026-11-21, «twice as large»). */
    height  : 1.60,   /* the lens above the surface */
    dist    : 0.20,   /* and back from the centre */
    fov     : 43,
    look    : 0.25,   /* where it aims — the horizon's height in frame */
    shift   : 0.00,
    roll    : 0,
    azim    : 175,    /* the light, around */
    elev    : 38,     /* and above */
    key     : 0.55,
    sheen   : 0.45,
    gloss   : 110,
    fresnel : 0.35,
    fog     : 0.60,
    expo    : 1.00,
    water   : '#ecf4f9',
    sky     : '#ffffff',
    lightCol: '#ffffff',
    dpr     : 1.5     /* the kit's ceiling: a background is not judged at retina */
  };

  var SHEET = 10, HALF = SHEET / 2, MAXD = 6;

  var VERT = [
    'precision highp float;',
    'attribute vec2 aPos;',
    'const int MAXD = ' + MAXD + ';',
    'uniform vec3 uDrops[MAXD];',
    'uniform float uTime, uSpeed, uLen, uAmp, uDamp;',
    'uniform mat4 uMVP;',
    'varying vec3 vNormal;',
    'varying vec3 vWorld;',
    'float surface(vec2 p, out vec2 grad) {',
    '  float h = 0.0; grad = vec2(0.0);',
    '  float k = 6.28318530718 / uLen;',
    '  for (int i = 0; i < MAXD; i++) {',
    '    vec3 d = uDrops[i];',
    '    float age = uTime - d.z;',
    '    if (age <= 0.0 || age > 30.0) continue;',
    '    vec2  v = p - d.xy;',
    '    float r = length(v);',
    '    float front = age * uSpeed;',
    '    float off = r - front;',
    '    float w = uLen * (0.9 + 0.35 * front);',
    '    float g = exp(-(off * off) / (2.0 * w * w));',
    '    float q = uAmp * exp(-uDamp * age);',
    '    float s = 1.0 / (1.0 + r);',
    '    float sn = sin(k * off), cs = cos(k * off);',
    '    h += q * sn * g * s;',
    '    float dhdr = q * g * (k * cs * s - sn * (off * s / (w * w) + s * s));',
    '    grad += dhdr * (r > 1e-4 ? v / r : vec2(0.0));',
    '  }',
    '  return h;',
    '}',
    'void main() {',
    '  vec2 grad;',
    '  float y = surface(aPos, grad);',
    '  vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));',
    '  vWorld = vec3(aPos.x, y, aPos.y);',
    '  gl_Position = uMVP * vec4(vWorld, 1.0);',
    '}'
  ].join('\n');

  /* A studio, not a sea: the key is split from the ambient so white water stays white, and
     the Fresnel has a dial because on light water it is the first thing to turn a card muddy. */
  var FRAG = [
    'precision highp float;',
    'const float HALF = ' + HALF.toFixed(1) + ';',
    'uniform vec3 uLight, uWater, uSky, uLightCol, uEye;',
    'uniform float uGloss, uFog, uKey, uSheen, uFres, uExpo;',
    'varying vec3 vNormal;',
    'varying vec3 vWorld;',
    'void main() {',
    '  vec3 n = normalize(vNormal);',
    '  vec3 v = normalize(uEye - vWorld);',
    '  vec3 l = normalize(uLight);',
    '  float ndl  = max(dot(n, l), 0.0);',
    '  float spec = pow(max(dot(n, normalize(l + v)), 0.0), uGloss) * uSheen;',
    '  float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0) * uFres;',
    '  float lift = (ndl - max(l.y, 0.0)) * uKey;',
    '  vec3  col  = mix(uWater, uSky, fres) * (1.0 + lift) + uLightCol * spec;',
    '  float d    = length(vWorld.xz - uEye.xz);',
    '  float f    = 1.0 - exp(-uFog * uFog * d * 0.50);',
    '  float edge = smoothstep(HALF * 0.50, HALF * 0.94, length(vWorld.xz));',
    '  col = mix(col, uSky, clamp(max(f, edge), 0.0, 1.0));',
    '  gl_FragColor = vec4(clamp(col * uExpo, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  function hex (s) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(s).trim());
    if (!m) return [1, 1, 1];
    return [parseInt(m[1].slice(0, 2), 16) / 255, parseInt(m[1].slice(2, 4), 16) / 255, parseInt(m[1].slice(4, 6), 16) / 255];
  }
  function lessMotion () {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function perspective (out, fovDeg, aspect, near, far) {
    var f = 1 / Math.tan(fovDeg * Math.PI / 360);
    out[0] = f / aspect; out[1] = out[2] = out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = out[7] = 0;
    out[8] = out[9] = 0; out[10] = (far + near) / (near - far); out[11] = -1;
    out[12] = out[13] = 0; out[14] = 2 * far * near / (near - far); out[15] = 0;
    return out;
  }
  function lookAt (out, eye, at, up) {
    var zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
    var zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
    var xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    var xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1; return out;
  }
  function multiply (out, a, b) {
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return out;
  }

  var live = [];          /* every mounted sheet, for the one observer below */

  function mount (canvas, opts) {
    if (!canvas || lessMotion()) return null;
    var S = {};
    for (var k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k)) S[k] = DEFAULTS[k];
    if (opts) for (var j in opts) if (opts.hasOwnProperty(j) && opts[j] != null) S[j] = opts[j];

    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true })
          || canvas.getContext('experimental-webgl', { antialias: true, alpha: false, depth: true });
    if (!gl) return null;

    function compile (type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        if (global.console) console.warn('Waves: ' + gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var uint32 = !!gl.getExtension('OES_element_index_uint');
    var N = uint32 ? 256 : 255, side = N + 1;
    var pos = new Float32Array(side * side * 2), p = 0;
    for (var iz = 0; iz <= N; iz++) for (var ix = 0; ix <= N; ix++) {
      pos[p++] = (ix / N - 0.5) * SHEET; pos[p++] = (iz / N - 0.5) * SHEET;
    }
    var IndexArray = uint32 ? Uint32Array : Uint16Array;
    var idx = new IndexArray(N * N * 6), q = 0;
    for (var z = 0; z < N; z++) for (var x = 0; x < N; x++) {
      var a = z * side + x, b = a + 1, c = a + side, d2 = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b;
      idx[q++] = b; idx[q++] = c; idx[q++] = d2;
    }
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    var idxType = uint32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;

    var U = {};
    ['uDrops','uTime','uSpeed','uLen','uAmp','uDamp','uMVP','uLight','uWater','uSky',
     'uLightCol','uEye','uGloss','uFog','uKey','uSheen','uFres','uExpo'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    gl.enable(gl.DEPTH_TEST);

    var drops = new Float32Array(MAXD * 3), dropAt = 0;
    for (var i = 0; i < MAXD; i++) drops[i * 3 + 2] = -1e3;
    var proj = new Float32Array(16), view = new Float32Array(16), mvp = new Float32Array(16);
    var eye = [0, 0, 0], at = [0, 0, 0], up = [0, 1, 0];

    function applyCamera () {
      var a = S.orbit * Math.PI / 180, sa = Math.sin(a), ca = Math.cos(a);
      eye[0] = sa * S.dist + ca * S.shift;
      eye[1] = S.height;
      eye[2] = ca * S.dist - sa * S.shift;
      at[0] = sa * -S.look + ca * S.shift;
      at[1] = 0;
      at[2] = ca * -S.look - sa * S.shift;
      var r = S.roll * Math.PI / 180;
      up[0] = Math.sin(r) * ca; up[1] = Math.cos(r); up[2] = -Math.sin(r) * sa;
      gl.uniform3fv(U.uEye, eye);
    }
    function applyLight () {
      var a = S.azim * Math.PI / 180, e = S.elev * Math.PI / 180;
      var lx = Math.cos(a) * Math.cos(e), ly = Math.sin(e), lz = Math.sin(a) * Math.cos(e);
      var l = Math.hypot(lx, ly, lz) || 1;
      gl.uniform3f(U.uLight, lx / l, ly / l, lz / l);
      gl.uniform3fv(U.uLightCol, hex(S.lightCol));
    }
    function applyInk () {
      var w = hex(S.water), s = hex(S.sky);
      gl.uniform3fv(U.uWater, w); gl.uniform3fv(U.uSky, s);
      gl.clearColor(s[0], s[1], s[2], 1);
    }
    function applyWater () {
      gl.uniform1f(U.uSpeed, S.speed); gl.uniform1f(U.uLen, S.len);
      gl.uniform1f(U.uAmp, S.amp);     gl.uniform1f(U.uDamp, S.damp);
      gl.uniform1f(U.uGloss, S.gloss); gl.uniform1f(U.uFog, S.fog);
      gl.uniform1f(U.uKey, S.key);     gl.uniform1f(U.uSheen, S.sheen);
      gl.uniform1f(U.uFres, S.fresnel); gl.uniform1f(U.uExpo, S.expo);
    }

    var lastW = 0, lastH = 0;
    function resize () {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return false;
      var r = Math.min(global.devicePixelRatio || 1, S.dpr);
      var bw = Math.round(w * r), bh = Math.round(h * r);
      if (bw === lastW && bh === lastH) return true;
      lastW = bw; lastH = bh;
      canvas.width = bw; canvas.height = bh;
      gl.viewport(0, 0, bw, bh);
      perspective(proj, S.fov, w / h, 0.01, 60);
      return true;
    }

    var t = 0, last = 0, next = 0.3, raf = 0, running = true, seen = true;
    function dropNow () {
      var r = S.spread * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
      var o = dropAt * 3;
      drops[o] = S.originX + Math.cos(a) * r; drops[o + 1] = S.originZ + Math.sin(a) * r; drops[o + 2] = t;
      dropAt = (dropAt + 1) % MAXD;
    }
    function frame (now) {
      raf = global.requestAnimationFrame(frame);
      if (!last) last = now;
      var dt = Math.min((now - last) / 1000, 0.1); last = now;
      if (!running || !seen || (global.document && global.document.hidden)) return;
      if (!resize()) return;
      t += dt;
      if (S.every > 0 && t >= next) { dropNow(); next = t + S.every; }
      gl.uniform1f(U.uTime, t);
      gl.uniform3fv(U.uDrops, drops);
      lookAt(view, eye, at, up);
      multiply(mvp, proj, view);
      gl.uniformMatrix4fv(U.uMVP, false, mvp);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, idx.length, idxType, 0);
    }

    applyCamera(); applyLight(); applyInk(); applyWater(); resize();
    raf = global.requestAnimationFrame(frame);

    var handle = {
      el: canvas,
      set: function (key, value) {
        if (!(key in S)) return;
        S[key] = value;
        if (key === 'fov') { lastW = lastH = 0; resize(); }
        else if (key === 'height' || key === 'dist' || key === 'orbit' || key === 'look' || key === 'shift' || key === 'roll') applyCamera();
        else if (key === 'azim' || key === 'elev' || key === 'lightCol') applyLight();
        else if (key === 'water' || key === 'sky') applyInk();
        else applyWater();
      },
      get: function (key) { return S[key]; },
      settings: function () { var o = {}; for (var key in S) if (S.hasOwnProperty(key)) o[key] = S[key]; return o; },
      drop: dropNow,
      pause: function () { running = false; },
      resume: function () { running = true; last = 0; },
      seen: function (v) { seen = !!v; if (seen) last = 0; },
      stop: function () {
        global.cancelAnimationFrame(raf);
        var at2 = live.indexOf(handle); if (at2 > -1) live.splice(at2, 1);
        gl.deleteBuffer(vbo); gl.deleteBuffer(ibo);
        gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    };
    live.push(handle);
    observe(handle);
    return handle;
  }

  /* One observer for every sheet on the page: off screen is paused. */
  var io = null;
  function observe (h) {
    if (!global.IntersectionObserver) return;
    if (!io) {
      io = new global.IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          for (var i = 0; i < live.length; i++) if (live[i].el === e.target) live[i].seen(e.isIntersecting);
        });
      }, { rootMargin: '120px' });
    }
    io.observe(h.el);
  }

  /* Every `[data-waves]` on the page, mounted once. The attribute may carry JSON. */
  function auto (root) {
    var list = (root || global.document).querySelectorAll('canvas[data-waves]:not([data-waves-on])');
    for (var i = 0; i < list.length; i++) {
      var el = list[i], opts = null;
      var raw = el.getAttribute('data-waves');
      if (raw) { try { opts = JSON.parse(raw); } catch (e) { opts = null; } }
      el.setAttribute('data-waves-on', '');
      mount(el, opts);
    }
  }

  global.Waves = { mount: mount, auto: auto, DEFAULTS: DEFAULTS, reducedMotion: lessMotion };

  if (global.document) {
    if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', function () { auto(); });
    else auto();
  }
})(typeof window !== 'undefined' ? window : this);
