/* ─────────────────────────────────────────────────────────────────────────────
   Akvantis — the ripple background.

   A sheet of water seen at a shallow angle with drops falling in the middle of it,
   drawn behind the passport page. It is the A1's own advertising image and the ground
   the frosted bar was built to blur.

   ── WHY THIS IS NOT THREE.JS ──
   The scene is one plane and one shader. Three.js is 600KB to draw it, and this page is
   what a person gets after scanning a carton — quite possibly on a phone, on mobile
   data, in a kitchen. Every other page this project ships is a folder that opens with no
   build and no network beyond itself; a background effect is not the thing to break that
   for. So: raw WebGL1, about two hundred lines, no dependency at all.

   ── THE ARITHMETIC ──
   Every ring is drawn, not filmed. A drop is three numbers — where it landed and when —
   and the height of the water anywhere is the sum of what the live drops are still doing
   there:

       front = speed · age          how far the ring has got
       d     = r − front            where this point sits relative to it
       h     = amp · sin(2π·d/len) · exp(−d²/2w²) · exp(−damp·age) / (1 + r)

   `sin(2π·d/len)` is the corrugation, `len` crest to crest. The first `exp` is the
   packet — rings exist only in a band around the front, and `w` widens with age because
   a real ring smears as it runs. The second is the drop dying. `1/(1+r)` is the energy
   spreading around an ever-longer circle, which is what makes the middle lively and the
   distance calm with no extra control. No simulation grid, no history, no texture:
   twelve lines of arithmetic per vertex and it starts correct on the first frame.

   ── USING IT ──
     var h = Ripple.mount(canvasEl);          // defaults below
     var h = Ripple.mount(canvasEl, { amp: 0.06, tint: 'deep' });
     h.set('speed', 0.8);  h.drop();  h.stop();

   Returns null when it will not run — no WebGL, or the reader has asked for less
   motion. Callers must cope with null and let the flat background colour stand; that
   colour and this water are the same ink, so nothing looks broken when it is absent.

   ⚠ REDUCED MOTION IS NOT AN EDGE CASE. A full-screen animation behind text is exactly
   what `prefers-reduced-motion` is for. It is checked before anything is allocated, and
   it is checked again if the reader changes it while the page is open.
   ───────────────────────────────────────────────────────────────────────────── */

(function (global) {
  'use strict';

  /* ── THE SETTINGS ──
     Tuned on the bench (`Digital-Passport-Builder/public/ripples.html`), which drives this same
     file. If these change, they change here — the bench reads them from this object, so
     there is no second set of numbers to keep in step. */
  var DEFAULTS = {
    speed : 0.60,   // units per second the ring front travels
    len   : 0.46,   // crest to crest
    amp   : 0.106,  // height of a fresh ring
    damp  : 1.05,   // how fast a drop dies, per second
    every : 1.30,   // seconds between drops
    spread: 0.00,   // radius of the area drops land in; 0 = one point, concentric rings
    height: 0.80,   // camera above the surface
    dist  : 1.30,   // camera back from the centre
    fov   : 36,
    azim  : 175,    // light direction, degrees around
    gloss : 78,     // specular exponent
    fog   : 0.60,
    tint  : 'ink',
    /* Grid and drop slots. 256 segments over a 10-unit sheet is 0.039 per quad — about
       twelve samples on a default crest, which is where a crest stops reading as a chain
       of straight lines. It was 128, and it showed: five samples per crest is a polyline
       with a specular highlight running along it.

       66k vertices, and they are affordable because the slope is differentiated rather
       than sampled — see `vertexSource`. The old three-evaluations-per-vertex normal is
       what made a grid this size unthinkable. */
    grid  : 256,
    drops : 6,
    /* Retina costs four times the fragments to render water that is deliberately low in
       contrast. 1.5 is where the crests stop looking stepped and stops being worth it. */
    dpr   : 1.5
  };

  /* Four decided pairs. Each is a water colour and the sky behind it, and the pair is
     what makes the horizon work: the fog carries the first into the second, so a sky
     picked independently of its water would put a visible seam where they meet. */
  var TINTS = {
    ink   : { name: 'Ink',      water: [0x14, 0x1a, 0x1f], sky: [0x11, 0x12, 0x11] },
    deep  : { name: 'Deep',     water: [0x0d, 0x22, 0x33], sky: [0x0b, 0x12, 0x18] },
    brand : { name: 'Akvantis', water: [0x12, 0x30, 0x49], sky: [0x0d, 0x1a, 0x26] },
    steel : { name: 'Steel',    water: [0x1c, 0x22, 0x26], sky: [0x15, 0x19, 0x1b] }
  };

  /* ── A COLOUR THAT IS NOT ONE OF THE FOUR ──
     `tint` also takes a hex string, and then the sky is derived rather than asked for.
     One picker, not two: a person choosing a water colour is choosing a mood, and making
     them also pick the haze behind it is handing them a way to get it wrong — a sky
     lighter than its water reads as fog lit from nowhere, and one too far off in hue puts
     a band across the horizon.

     The rule is read off the four pairs above: pull the colour a quarter of the way to
     its own luminance, then take it to 60%. Checked against Akvantis — 18,48,73 gives
     15,28,39 where the hand-picked sky is 13,26,38 — which is close enough that the four
     named pairs and a picked one behave the same way. */
  function skyFor (rgb) {
    var lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return rgb.map(function (c) {
      return Math.max(0, Math.min(255, Math.round((c * 0.75 + lum * 0.25) * 0.6)));
    });
  }

  /* Accepts `'ink'`, `'#0d2233'`, `'0d2233'` and `[13, 34, 51]`. Anything else falls back
     to Ink rather than throwing: this runs behind a page a customer is reading, and a
     background is never worth a blank screen. */
  function resolveTint (t) {
    if (TINTS[t]) return TINTS[t];
    var rgb = null;
    if (Array.isArray(t) && t.length === 3) rgb = t.map(Number);
    else if (typeof t === 'string') {
      var m = /^#?([0-9a-f]{6})$/i.exec(t.trim());
      if (m) rgb = [
        parseInt(m[1].slice(0, 2), 16),
        parseInt(m[1].slice(2, 4), 16),
        parseInt(m[1].slice(4, 6), 16)
      ];
    }
    if (!rgb || rgb.some(function (c) { return !isFinite(c); })) return TINTS.ink;
    return { name: 'Custom', water: rgb, sky: skyFor(rgb), custom: true };
  }

  /* ── HOW MUCH WATER TO DRAW ──
     10 units, down from 12, and the two units are worth more as resolution than as
     distance: at the far settings the fog and the edge fade have taken the surface to
     sky long before it runs out, so the outer ring of the old sheet was vertices spent on
     water nobody ever saw. Every unit removed here is quads made smaller everywhere else.

     ⚠ It is also the ceiling on the camera's `dist` — the lens must stay inside the
     sheet, or it looks out from beyond the rim at a floating slab. `ripple-rail.js` caps
     the slider at 4.00 against this 5.00; keep the two in step. */
  var SHEET = 10;
  var HALF  = SHEET / 2;

  /* ══════════════ SHADERS ══════════════ */

  /* ── WHY THE SLOPE IS DIFFERENTIATED AND NOT SAMPLED ──
     This used to find the normal by evaluating the surface at two neighbouring points and
     taking the difference. It worked, and it cost three evaluations per vertex where one
     would do — which is the reason the grid had to stay coarse, and the coarse grid is
     what put visible facets on the crests. Five vertices across a wave is a polyline.

     The height is a closed-form sum, so its slope is too. One loop now returns both, at
     roughly the cost the height alone used to be, and the vertices that buys go into the
     grid: 256 segments over a 10-unit sheet is 0.039 per quad, about twelve samples on a
     default crest, which is where a crest stops being a chain of straight lines.

     The derivative, written out once so nobody has to re-derive it from the shader:

       h    = A·sin(k·off)·g·q·s        k = 2π/len, off = r − front,
                                        g = exp(−off²/2w²), q = exp(−damp·age), s = 1/(1+r)
       dh   = A·q·g·[ k·cos(k·off)·s − sin(k·off)·( off·s/w² + s² ) ]
       dr

     `w` and `q` fall out of it because both depend on age, not on r. The gradient is that
     scalar pointed along the ray from the drop, and the normal is the usual
     (−∂h/∂x, 1, −∂h/∂z). */
  function vertexSource (maxDrops) {
    return [
      'precision highp float;',
      'attribute vec2 aPos;',
      'const int MAXD = ' + maxDrops + ';',
      'uniform vec3 uDrops[MAXD];',
      'uniform float uTime, uSpeed, uLen, uAmp, uDamp;',
      'uniform mat4 uMVP;',
      'varying vec3 vNormal;',
      'varying vec3 vWorld;',
      '',
      'float surface(vec2 p, out vec2 grad) {',
      '  float h = 0.0;',
      '  grad = vec2(0.0);',
      '  float k = 6.28318530718 / uLen;',
      '  for (int i = 0; i < MAXD; i++) {',
      '    vec3 d = uDrops[i];',
      '    float age = uTime - d.z;',
      '    if (age <= 0.0 || age > 30.0) continue;',
      '    vec2  v     = p - d.xy;',
      '    float r     = length(v);',
      '    float front = age * uSpeed;',
      '    float off   = r - front;',
      /* The packet widens as it runs. A ring that kept its original width for ten
         seconds reads as a hoop sliding across the water, not as a wave. */
      '    float w     = uLen * (0.9 + 0.35 * front);',
      '    float g     = exp(-(off * off) / (2.0 * w * w));',
      '    float q     = uAmp * exp(-uDamp * age);',
      '    float s     = 1.0 / (1.0 + r);',
      '    float sn    = sin(k * off), cs = cos(k * off);',
      '    h += q * sn * g * s;',
      '    float dhdr = q * g * (k * cs * s - sn * (off * s / (w * w) + s * s));',
      /* Guarded at the drop point itself, where the ray has no direction. The height
         there is finite; only the direction is undefined. */
      '    grad += dhdr * (r > 1e-4 ? v / r : vec2(0.0));',
      '  }',
      '  return h;',
      '}',
      '',
      'void main() {',
      '  vec2 grad;',
      '  float y = surface(aPos, grad);',
      '  vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));',
      '  vWorld = vec3(aPos.x, y, aPos.y);',
      '  gl_Position = uMVP * vec4(vWorld, 1.0);',
      '}'
    ].join('\n');
  }

  /* Not a physical water shader: one directional highlight, a Fresnel rim, and fog. The
     page in front of this is read, not admired, so the surface has to say "water" with
     as little contrast as will carry. Anything more competes with the text on top. */
  var FRAG = [
    'precision highp float;',
    'const float HALF = ' + HALF.toFixed(1) + ';',
    'uniform vec3 uLight, uWater, uSky, uEye;',
    'uniform float uGloss, uFog;',
    'varying vec3 vNormal;',
    'varying vec3 vWorld;',
    'void main() {',
    '  vec3 n = normalize(vNormal);',
    '  vec3 v = normalize(uEye - vWorld);',
    '  vec3 l = normalize(uLight);',
    '  float spec = pow(max(dot(n, normalize(l + v)), 0.0), uGloss);',
    /* Grazing angles go pale. It is most of what makes a dark plane read as a liquid
       rather than as a dark plane. */
    '  float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);',
    '  vec3 col = uWater + uSky * fres * 1.6 + vec3(1.0) * spec * 0.55;',
    /* Two fades, answering different questions. The first is the horizon — distance
       along the ground, so it follows the eye line rather than a sphere around the lens
       — and that one is taste. The second is not: the sheet is finite, and its edge is
       the one thing that would give away that this is a plane and not a body of water,
       so the last stretch always goes to sky whatever the first says. */
    '  float d = length(vWorld.xz - uEye.xz);',
    '  float f = 1.0 - exp(-uFog * uFog * d * 0.50);',
    '  float edge = smoothstep(HALF * 0.50, HALF * 0.94, length(vWorld.xz));',
    '  gl_FragColor = vec4(mix(col, uSky, clamp(max(f, edge), 0.0, 1.0)), 1.0);',
    '}'
  ].join('\n');

  /* ══════════════ MATRICES ══════════════
     Four functions, because pulling in a maths library to write two matrices would put
     back most of the weight this file exists to avoid. Column-major, the way GL wants
     them. */

  function perspective (out, fovDeg, aspect, near, far) {
    var f = 1 / Math.tan(fovDeg * Math.PI / 360);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) / (near - far); out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near / (near - far); out[15] = 0;
    return out;
  }

  function lookAt (out, eye, at) {
    var zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
    var zl = Math.hypot(zx, zy, zz) || 1;
    zx /= zl; zy /= zl; zz /= zl;
    /* up × z, with up = (0,1,0) — written out rather than crossed generally. */
    var xx = zz, xy = 0, xz = -zx;
    var xl = Math.hypot(xx, xy, xz) || 1;
    xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1;
    return out;
  }

  function multiply (out, a, b) {
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
                         a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }

  /* ══════════════ MOUNT ══════════════ */

  function compile (gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      /* Logged rather than thrown: a background that fails to compile should leave a
         readable page behind it, not a broken one. */
      if (global.console) console.warn('Ripple: shader failed\n' + gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function prefersLessMotion () {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount (canvas, opts) {
    if (!canvas) return null;

    var S = {};
    for (var k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k)) S[k] = DEFAULTS[k];
    if (opts) for (var j in opts) if (opts.hasOwnProperty(j) && opts[j] != null) S[j] = opts[j];

    if (prefersLessMotion()) return null;

    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true })
          || canvas.getContext('experimental-webgl', { antialias: true, alpha: false, depth: true });
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, vertexSource(S.drops));
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (global.console) console.warn('Ripple: link failed\n' + gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);

    /* ── THE GRID ──
       Positions are (x, z) in world units; the height comes from the shader, so the
       buffer is uploaded once and never touched again. */
    /* Uint16 indices cap the grid at 255 segments — 256² is exactly 65,536 vertices and
       the last one is unaddressable. `OES_element_index_uint` lifts that, and it is
       present on essentially every WebGL1 implementation still in use, mobile included;
       where it is not, the grid clamps and the water is coarser rather than broken.

       Clamped before the buffers are built, never after: the vertex grid and its index
       list have to be two views of one number. */
    var uint32 = !!gl.getExtension('OES_element_index_uint');
    var N = Math.max(8, Math.min(uint32 ? 511 : 255, S.grid | 0)), side = N + 1;
    var pos = new Float32Array(side * side * 2);
    var p = 0;
    for (var iz = 0; iz <= N; iz++) {
      for (var ix = 0; ix <= N; ix++) {
        pos[p++] = (ix / N - 0.5) * SHEET;
        pos[p++] = (iz / N - 0.5) * SHEET;
      }
    }
    var IndexArray = uint32 ? Uint32Array : Uint16Array;
    var idx = new IndexArray(N * N * 6);
    var q = 0;
    for (var z = 0; z < N; z++) {
      for (var x = 0; x < N; x++) {
        var a = z * side + x, b = a + 1, c = a + side, d2 = c + 1;
        idx[q++] = a; idx[q++] = c; idx[q++] = b;
        idx[q++] = b; idx[q++] = c; idx[q++] = d2;
      }
    }

    var idxType = uint32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;

    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    var U = {};
    ['uDrops', 'uTime', 'uSpeed', 'uLen', 'uAmp', 'uDamp', 'uMVP',
     'uLight', 'uWater', 'uSky', 'uEye', 'uGloss', 'uFog'].forEach(function (name) {
      U[name] = gl.getUniformLocation(prog, name);
    });

    gl.enable(gl.DEPTH_TEST);

    /* ── THE DROPS ──
       A fixed ring buffer, because the shader takes a fixed-size array and a page that
       allocates while it animates is a page that stutters. The oldest slot is simply
       overwritten; at the default rate a drop is invisible long before its slot comes
       round again. A t0 far in the past is how an empty slot says so. */
    var drops = new Float32Array(S.drops * 3), dropAt = 0;
    for (var i = 0; i < S.drops; i++) drops[i * 3 + 2] = -1e3;

    var proj = new Float32Array(16), view = new Float32Array(16), mvp = new Float32Array(16);
    var eye = [0, S.height, S.dist];
    var light = [0, 0, 0];

    function applyCamera () {
      eye[1] = S.height; eye[2] = S.dist;
      gl.uniform3fv(U.uEye, eye);
    }
    function applyLight () {
      var a = S.azim * Math.PI / 180;
      var lx = Math.cos(a), ly = 0.75, lz = Math.sin(a);
      var l = Math.hypot(lx, ly, lz);
      light[0] = lx / l; light[1] = ly / l; light[2] = lz / l;
      gl.uniform3fv(U.uLight, light);
    }
    function applyTint () {
      var t = resolveTint(S.tint);
      gl.uniform3f(U.uWater, t.water[0] / 255, t.water[1] / 255, t.water[2] / 255);
      gl.uniform3f(U.uSky, t.sky[0] / 255, t.sky[1] / 255, t.sky[2] / 255);
      gl.clearColor(t.sky[0] / 255, t.sky[1] / 255, t.sky[2] / 255, 1);
    }
    function applyWater () {
      gl.uniform1f(U.uSpeed, S.speed);
      gl.uniform1f(U.uLen, S.len);
      gl.uniform1f(U.uAmp, S.amp);
      gl.uniform1f(U.uDamp, S.damp);
      gl.uniform1f(U.uGloss, S.gloss);
      gl.uniform1f(U.uFog, S.fog);
    }

    /* Measured every frame, because a rail collapsing and a phone rotating both change
       the box without firing anything this file listens to — but compared first, because
       resizing the drawing buffer sixty times a second is how a smooth scene becomes a
       slideshow. */
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
      /* Vertical field of view is held and the horizontal follows, so a portrait phone
         sees a narrower slice of the same water rather than a squashed copy of a
         landscape composition. */
      perspective(proj, S.fov, w / h, 0.01, 60);
      return true;
    }

    var t = 0, last = 0, next = 0.4, raf = 0, live = true;

    function dropNow () {
      var r = S.spread * Math.sqrt(Math.random());
      var a = Math.random() * Math.PI * 2;
      var o = dropAt * 3;
      drops[o] = Math.cos(a) * r; drops[o + 1] = Math.sin(a) * r; drops[o + 2] = t;
      dropAt = (dropAt + 1) % S.drops;
    }

    function frame (now) {
      raf = global.requestAnimationFrame(frame);
      if (!last) last = now;
      var dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      /* A hidden tab still gets frames in some browsers, and a background nobody is
         looking at should not be spending a phone's battery on rings. */
      if (!live || (global.document && global.document.hidden)) return;
      if (!resize()) return;

      t += dt;
      if (t >= next) { dropNow(); next = t + S.every; }

      gl.uniform1f(U.uTime, t);
      gl.uniform3fv(U.uDrops, drops);
      lookAt(view, eye, [0, 0, -0.35]);
      multiply(mvp, proj, view);
      gl.uniformMatrix4fv(U.uMVP, false, mvp);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, idx.length, idxType, 0);
    }

    applyCamera(); applyLight(); applyTint(); applyWater(); resize();
    raf = global.requestAnimationFrame(frame);

    /* Asked for less motion mid-visit — a system setting, changed in another window.
       The page has to answer that without being reloaded. */
    var mq = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
    function onMotionPref () { if (mq.matches) handle.stop(); }
    if (mq && mq.addEventListener) mq.addEventListener('change', onMotionPref);
    else if (mq && mq.addListener) mq.addListener(onMotionPref);

    var handle = {
      /* One setter for every number, so a caller wiring twelve sliders writes one line
         rather than twelve branches. Camera, light and tint need work beyond the
         uniform, and that is the whole of the branching. */
      set: function (key, value) {
        if (!(key in S)) return;
        S[key] = value;
        if (key === 'fov') { lastW = lastH = 0; resize(); }
        else if (key === 'height' || key === 'dist') applyCamera();
        else if (key === 'azim') applyLight();
        else if (key === 'tint') applyTint();
        else applyWater();
      },
      get: function (key) { return S[key]; },
      settings: function () {
        var out = {};
        for (var key in S) if (S.hasOwnProperty(key)) out[key] = S[key];
        return out;
      },
      drop: dropNow,
      pause: function () { live = false; },
      resume: function () { live = true; last = 0; },
      running: function () { return live; },
      time: function () { return t; },
      stop: function () {
        global.cancelAnimationFrame(raf);
        if (mq && mq.removeEventListener) mq.removeEventListener('change', onMotionPref);
        else if (mq && mq.removeListener) mq.removeListener(onMotionPref);
        gl.deleteBuffer(vbo); gl.deleteBuffer(ibo);
        gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    };
    return handle;
  }

  global.Ripple = {
    mount: mount,
    DEFAULTS: DEFAULTS,
    TINTS: TINTS,
    /* Exposed so a rail can show the pair it is about to set — and so the page behind the
       water can match its flat fallback colour to the sky, which is the whole reason
       turning the effect off does not look like a failure. */
    resolveTint: resolveTint,
    skyFor: skyFor,
    SHEET: SHEET,
    reducedMotion: prefersLessMotion
  };
})(typeof window !== 'undefined' ? window : this);
