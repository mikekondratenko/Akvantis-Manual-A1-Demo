/* ─────────────────────────────────────────────────────────────────────────────
   SHEET 3D — буклет на скрепке, как предмет в руках. `window.Sheet3D`.

   Почему WebGL, а не CSS. В CSS грань всегда плоская: мягкую бумагу там можно
   только наломать полосами, и излом остаётся изломом — ломаный контур, ступеньки
   тона, швы между полосами. Страница журнала гнётся непрерывно, и показать это
   можно только сеткой из сотен вершин с гладкими нормалями. Тот же three.js r128,
   что у Box Maker, — второй движок в одном репозитории был бы вторым набором
   ошибок.

   ── ИЗ ЧЕГО СОБРАН БУКЛЕТ ──
   Обложка и N внутренних разворотов — это N+1 ЛИСТКОВ (половинок листа или
   вклейка), и все они держатся на одной оси — корешке. Листок j (0 — обложка)
   несёт две страницы: нечётную 2j+1 с одной стороны и чётную 2j+2 с другой.
   Страниц 2N+2: разворот k — это страницы 2k слева и 2k+1 справа.

   Листок повёрнут вокруг корешка на угол θ: 0° — лежит слева, чётной страницей
   вверх (перевёрнут); 180° — лежит справа, нечётной вверх (ещё не перевёрнут).
   Раскрыть буклет на развороте k — перевернуть листки 0…k−1 налево.

   Что это знает о мире:
   • буклет лежит в плоскости XY лицом к +Z, корешок — ось Y, миллиметры;
   • «сгиб» F — угол левой стопки: 0° — разворот лежит плоско, 180° — буклет
     закрыт (левая стопка легла на правую, наружу — обложка);
   • свет — комнаты, а не предмета: вращается буклет, лампа стоит.

   Документ приходит сюда картинками (см. setTexture), по одной на разворот:
   'front' — наружная сторона (задняя сторонка | обложка), 'inner-k' — k-й
   внутренний разворот. Страница — половина картинки своего разворота.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
  var THREE = window.THREE;
  var W = 420, H = 297, HALF = W / 2;
  var COLS = 64, ROWS = 16;             /* сетка листка */
  var D2R = Math.PI / 180;
  /* Толщина листка в стопке. Настоящая бумага тоньше (~0,1 мм), но на экране
     её надо видеть: иначе листки одной стопки спорят за одну плоскость. */
  var GAP = .35;

  /* ── ФОРМА БУМАГИ ──
     Угол касательной вдоль листка φ(s, v), s — от корешка (0) к свободному краю
     (1), v — от нижнего края (0) к верхнему (1). Положение точки — интеграл
     касательной по s, поэтому длина страницы не меняется, как бы она ни гнулась:
     бумага мягкая, но не резиновая.

     φ = θ                                  — угол листка;
       + SHAPE·sin θ·(s^1.5 − 0.4)          — мягкость: у корешка страница отстаёт,
                                              к краю забегает вперёд, как у журнала,
                                              который открывают за край; лёжа
                                              (sin θ = 0) — плоско;
       + b·s²                               — инерция: край отстаёт, когда листок
                                              ведут, и догоняет пружиной;
       + CORNER·sin θ·s²·(1 − v)²           — нижний свободный уголок отворачивается
                                              сильнее остального края.
     φ зажат в [0°, 180°]: бумага не уходит под стол. */
  var SHAPE = 30, CORNER = 22;
  /* ── ЖЁЛОБ У КОРЕШКА ──
     Раскрытый буклет на скрепке не лежит плоско у фальца: сгиб пружинит, и
     страница выходит из корешка вверх, делает невысокий горб и ложится.
     g(u) = GUT·(1 − u)(1 − 3u), u = s / GUT_W: у корешка +GUT, к трети ширины
     жёлоба ноль, дальше чуть вниз, и интеграл по жёлобу — ноль, то есть за
     жёлобом страница снова на столе. Горб ≈ 3 мм. Знак — по cos θ: у левой
     стопки вверх, у правой зеркально, у стоящего листка (90°) жёлоба нет. */
  var GUT = 20, GUT_W = .25;
  var SPRING = { LAG:1.8, K:.12, C:.26, MAX:30 };
  /* Перелистывание: один листок — 0,9 с, следующий трогается через 0,09 с. */
  var TURN_MS = 900, STAGGER_MS = 90;

  var S = {
    ready:false, fold:0, yaw:-24, pitch:14, fit:.78, panX:0, panY:0,
    spreads:1, open:1, foldR:180, raf:0, dirty:true
  };

  var renderer, scene, camera, group, table, light, canvas;
  var leaves = [];
  var tex = {};
  var box = new THREE.Box3(), tmp = new THREE.Vector3();

  function reduced(){ return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ── БУМАГА — УМНОЖЕНИЕ ──
     Печать на бумаге — это краска × свет, и больше ничего: Ламберт, без блика и
     без собственного свечения. Раньше здесь стоял PBR-материал с `emissive`
     0x0b0c0c — он ПРИБАВЛЯЛ к каждому пикселю постоянный тон, и после перевода в
     sRGB чёрный печати становился серым на 23 %: графика выглядела блёклой. Блик
     полуматовой бумаги добавлял ещё белёсую вуаль. Теперь чёрное остаётся
     чёрным, а свет только затемняет — ровно как умножение в слоях. */
  function material(side){
    return new THREE.MeshLambertMaterial({ color:0xffffff, side:side });
  }

  /* Листок — две сетки на одних вершинах: лицо (чётная страница, видна, когда
     листок лежит слева) и оборот (нечётная). Столбцы идут справа налево: s
     растёт от корешка влево, и без разворота треугольники легли бы изнанкой. */
  function makeLeaf(j){
    var cols = COLS, rows = ROWS;
    var gF = new THREE.PlaneGeometry(1, 1, cols, rows);
    var gB = new THREE.BufferGeometry();
    gB.setAttribute('position', gF.attributes.position);
    gB.setIndex(gF.index);
    var n = gF.attributes.position.count, uf = new Float32Array(n * 2), ub = new Float32Array(n * 2);
    for (var r = 0; r <= rows; r++) for (var i = 0; i <= cols; i++){
      var k = r * (cols + 1) + i, s = (cols - i) / cols, v = 1 - r / rows;
      /* чётная — левая половина своего разворота, корешок у её правого края;
         нечётная — правая половина, корешок у левого */
      uf[k * 2] = .5 - .5 * s; uf[k * 2 + 1] = v;
      ub[k * 2] = .5 + .5 * s; ub[k * 2 + 1] = v;
    }
    gF.setAttribute('uv', new THREE.BufferAttribute(uf, 2));
    gB.setAttribute('uv', new THREE.BufferAttribute(ub, 2));
    var mF = new THREE.Mesh(gF, material(THREE.FrontSide));
    var mB = new THREE.Mesh(gB, material(THREE.BackSide));
    [mF, mB].forEach(function(m){ m.castShadow = true; m.receiveShadow = true; group.add(m); });
    return {
      j:j, gF:gF, gB:gB, mF:mF, mB:mB, cols:cols, rows:rows,
      th:null, last:null, anim:null, b:0, v:0, w:0
    };
  }
  function dropLeaf(L){
    [L.mF, L.mB].forEach(function(m){ group.remove(m); m.material.dispose(); });
    L.gF.dispose(); L.gB.dispose();
  }

  /* Какая картинка на какой странице. Чётная 2j+2: внутренний разворот j+1, а у
     последнего листка — задняя сторонка (левая половина наружной стороны).
     Нечётная 2j+1: обложка у первого листка, дальше — разворот j. */
  function texFront(j){ return j + 1 <= S.spreads ? tex['inner-' + (j + 1)] : tex.front; }
  function texBack(j){ return j === 0 ? tex.front : tex['inner-' + j]; }

  function build(){
    var want = S.spreads + 1;
    if (leaves.length === want) return;
    leaves.forEach(dropLeaf);
    leaves = [];
    for (var j = 0; j < want; j++){
      var L = makeLeaf(j);
      L.th = target(j);
      leaves.push(L);
    }
    applyTextures();
  }

  function init(el){
    canvas = el;
    renderer = new THREE.WebGLRenderer({ canvas:el, antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(26, 1, 10, 20000);

    /* Лампа сверху-слева-спереди и мягкий рассеянный свет комнаты, чтобы
       отвернувшаяся страница серела, а не проваливалась в черноту. */
    /* Сумма подобрана так, чтобы страница лицом к зрителю давала ровно ~1,0 —
       белая бумага белая, но свет её не пережигает и светлые серые не
       сливаются с белым. */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3d40, .56));
    light = new THREE.DirectionalLight(0xffffff, .76);
    light.position.set(-240, 300, 900);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    var sc = light.shadow.camera;
    sc.left = -380; sc.right = 380; sc.top = 380; sc.bottom = -380; sc.near = 10; sc.far = 2000;
    light.shadow.bias = -.0006;
    light.shadow.normalBias = .6;
    light.shadow.radius = 7;
    scene.add(light);

    group = new THREE.Group();
    group.rotation.order = 'XYZ';
    scene.add(group);

    /* Стол — невидим, кроме тени на нём. Он поворачивается вместе с буклетом:
       буклет лежит на столе, а не висит перед лампой. */
    table = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity:.3 }));
    table.position.z = -.6;
    table.receiveShadow = true;
    group.add(table);

    S.ready = true;
    build();
    resize();
  }

  /* Куда стремится листок: перевёрнутые лежат в левой стопке и идут за её
     сгибом `fold`, остальные — в правой и идут за `foldR` (180° — лежат;
     0° — правая стопка закрыта налево, наружу задняя обложка). */
  function clampA(a){ return Math.max(0, Math.min(180, a)); }
  function target(j){ return j < S.open ? clampA(S.fold) : clampA(S.foldR); }

  /* Форма листка на этот кадр. */
  function shape(L){
    var n = leaves.length;
    var TH = L.th, sT = Math.sin(TH * D2R), t = TH / 180;
    /* Уровень в стопке: слева сверху последний перевёрнутый, справа — первый
       неперевёрнутый. Между стопками уровень переходит плавно, и сдвиг идёт по
       нормали бумаги — так листки, которые складываются вместе, не сливаются в
       одну плоскость и на ходу. */
    var off = GAP * (L.j * (1 - t) - (n - 1 - L.j) * t);
    var p = L.gF.attributes.position, c = L.cols, r = L.rows;
    var ds = HALF / c;
    for (var row = 0; row <= r; row++){
      var y = H / 2 - H * row / r, v = 1 - row / r;
      var x = 0, z = 0, base = row * (c + 1);
      p.setXYZ(base + c, 0, y, 0);                 /* корешок — общий у всех листков */
      for (var i = 1; i <= c; i++){
        var s = (i - .5) / c;
        var u = s / GUT_W, gut = u < 1 ? GUT * (1 - u) * (1 - 3 * u) * Math.cos(TH * D2R) : 0;
        var ph = TH + SHAPE * sT * (Math.pow(s, 1.5) - .4) + L.b * s * s
                    + CORNER * sT * s * s * (1 - v) * (1 - v) + gut;
        ph = Math.max(-GUT, Math.min(180 + GUT, ph)) * D2R;
        x -= ds * Math.cos(ph);
        z += ds * Math.sin(ph);
        var k = off * Math.min(1, i / 3);
        p.setXYZ(base + c - i, x + Math.sin(ph) * k, y, z + Math.cos(ph) * k);
      }
    }
    p.needsUpdate = true;
    L.gF.computeVertexNormals();
    L.gB.setAttribute('normal', L.gF.attributes.normal);
    L.gF.computeBoundingSphere(); L.gB.boundingSphere = L.gF.boundingSphere;
  }

  function applyTextures(){
    function put(mesh, t){ mesh.material.map = t || null; mesh.material.needsUpdate = true; }
    leaves.forEach(function(L){ put(L.mF, texFront(L.j)); put(L.mB, texBack(L.j)); });
    S.dirty = true; kick();
  }

  /* Картинка разворота документа → текстура. Принимает canvas или ImageBitmap.
     'inner' — прежнее имя первого разворота. */
  function setTexture(key, img){
    if (key === 'inner') key = 'inner-1';
    var t = new THREE.Texture(img);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.flipY = img instanceof HTMLCanvasElement || img instanceof HTMLImageElement;
    t.needsUpdate = true;
    if (tex[key]) tex[key].dispose();
    tex[key] = t;
    if (S.ready) applyTextures();
  }

  function resize(){
    if (!S.ready) return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    S.dirty = true; kick();
  }

  /* ── ПОЛОЖЕНИЕ В КАДРЕ ──
     Буклет всегда в середине своей рабочей зоны: центр рамки видимого предмета
     совмещается с осью камеры, как бы он ни был раскрыт. Расстояние до камеры —
     чтобы раскрытый разворот занимал долю `fit` кадра; `fit` приходит от
     инструмента и уже включает колесо мыши. */
  function frame(){
    group.rotation.set(-S.pitch * D2R, S.yaw * D2R, 0);
    group.position.set(0, 0, 0);
    group.updateMatrixWorld(true);
    box.makeEmpty();
    /* Листок, который сейчас перелистывают, в рамку не входит: он поднимается
       над буклетом и опускается, и рамка вместе с ним гоняла бы весь буклет по
       кадру. Лёгший в стопку листок снова в ней — и лежит там же, где лежал. */
    leaves.forEach(function(L){
      if (L.anim) return;
      var m = L.mF.matrixWorld, p = L.gF.attributes.position;
      for (var k = 0; k < p.count; k += 3){ tmp.fromBufferAttribute(p, k).applyMatrix4(m); box.expandByPoint(tmp); }
    });
    box.getCenter(tmp);
    group.position.set(-tmp.x, -tmp.y, -tmp.z);

    var t = Math.tan(camera.fov / 2 * D2R);
    var dist = Math.max(W / (S.fit * camera.aspect), H / S.fit) / (2 * t);
    /* повёрнутый к камере край ближе и крупнее — отодвигаемся, чтобы он не
       вылезал за кадр */
    box.getSize(tmp);
    dist = Math.max(dist, tmp.z / 2 + Math.max(tmp.x / camera.aspect, tmp.y) / (2 * S.fit * t));
    /* панорама — в пикселях экрана, переводится в миллиметры на плоскости листа */
    var mmPerPx = 2 * dist * t / Math.max(1, canvas.clientHeight);
    /* Depth range hugged to the booklet (2026-09-30): leaves in a stack lie
       GAP = 0.35 mm apart, and with near 10 / far 20000 the depth buffer could
       not tell them apart — seen face-on (2D) a closed booklet showed page 3
       through the cover. A tight near/far gives the buffer the precision. */
    var reach = Math.max(W, H) * 1.5;
    camera.near = Math.max(1, dist - reach); camera.far = dist + reach;
    camera.updateProjectionMatrix();
    camera.position.set(-S.panX * mmPerPx, S.panY * mmPerPx, dist);
    camera.lookAt(camera.position.x, camera.position.y, 0);
  }

  /* ── ХОД ЛИСТКА ──
     Листок, который перелистывают, идёт к своей цели по кривой; цель читается
     каждый кадр заново, поэтому перелистывание и ползунок сгиба не спорят.
     Изгиб от инерции — пружина на каждом листке: край отстаёт, когда листок
     ведут, догоняет, чуть перелетает и успокаивается. */
  function step(L, now){
    var goal = target(L.j);
    if (L.anim){
      var a = L.anim, u = (now - a.t0) / a.dur;
      if (u >= 1){ L.anim = null; L.th = goal; }
      else L.th = a.from + (goal - a.from) * ease(Math.max(0, u));
    } else L.th = goal;

    var d = L.last === null ? 0 : L.th - L.last;
    L.last = L.th;
    L.w = L.w * .6 + d * .4;
    var aim = -SPRING.LAG * L.w;
    if (reduced()){ L.b = 0; L.v = 0; }
    else { L.v += SPRING.K * (aim - L.b) - SPRING.C * L.v; L.b += L.v; }
    L.b = Math.max(-SPRING.MAX, Math.min(SPRING.MAX, L.b));
    return !!L.anim || Math.abs(L.v) > .01 || Math.abs(aim - L.b) > .02 || Math.abs(L.w) > .01;
  }

  function tick(now){
    S.raf = 0;
    now = now || performance.now();
    var moving = false;
    leaves.forEach(function(L){ if (step(L, now)) moving = true; });
    if (moving || S.dirty){
      leaves.forEach(shape);
      frame();
      renderer.render(scene, camera);
      S.dirty = false;
    }
    if (moving) kick();
  }
  function kick(){ if (S.ready && !S.raf) S.raf = requestAnimationFrame(tick); }

  /* Раскрыть на развороте `open` (0 — обложка). Листки, которым надо сменить
     стопку, трогаются по очереди: вперёд — от ближнего к дальнему, назад —
     наоборот, как их и переворачивает рука. */
  function turn(open){
    var was = S.open;
    S.open = open;
    if (!S.ready || was === open) return;
    var now = performance.now(), dur = reduced() ? 0 : TURN_MS;
    var lo = Math.min(was, open), hi = Math.max(was, open);
    for (var j = lo; j < hi && j < leaves.length; j++){
      var order = open > was ? j - lo : hi - 1 - j;
      /* пока листок ждёт своей очереди, он стоит, где стоял (см. step) */
      leaves[j].anim = { from:leaves[j].th, t0:now + (dur ? order * STAGGER_MS : 0), dur:dur || 1 };
    }
  }

  function set(o){
    var open = o.open, spreads = o.spreads;
    for (var k in o) if (o.hasOwnProperty(k) && o[k] !== undefined && k !== 'open' && k !== 'spreads') S[k] = o[k];
    if (spreads !== undefined && spreads !== S.spreads){
      S.spreads = spreads;
      if (S.open > spreads) S.open = spreads;
      if (S.ready) build();
    }
    if (open !== undefined) turn(Math.max(0, Math.min(S.spreads, open)));
    else if (S.open > S.spreads) S.open = S.spreads;
    S.dirty = true; kick();
  }

  /* ── ПОПАДАНИЕ ──
     Какая страница под точкой экрана и как далеко от корешка (s: 0 — корешок,
     1 — свободный край). Чётная — левая страница разворота (или задняя
     обложка), нечётная — правая (или обложка). x, y — в пикселях холста. */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(x, y){
    if (!S.ready || !canvas.clientWidth) return null;
    ndc.set(x / canvas.clientWidth * 2 - 1, -(y / canvas.clientHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var meshes = [];
    leaves.forEach(function(L){ meshes.push(L.mF, L.mB); });
    var h = ray.intersectObjects(meshes, false)[0];
    if (!h || !h.uv) return null;
    for (var i = 0; i < leaves.length; i++){
      var L = leaves[i];
      if (h.object === L.mF) return { leaf:i, page:2 * i + 2, even:true,  s:1 - 2 * h.uv.x };
      if (h.object === L.mB) return { leaf:i, page:2 * i + 1, even:false, s:2 * h.uv.x - 1 };
    }
    return null;
  }

  window.Sheet3D = { init:init, set:set, setTexture:setTexture, resize:resize, hit:hit };
}());
