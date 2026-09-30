/* ─────────────────────────────────────────────────────────────────────────────
   MANUAL RENDER — builds the A1 manual from its data. `window.ManualRender`.

   The manual is data (manual.json) and this file is the only thing that turns
   it into markup. The document (a1-manual.html) calls it for every medium it
   has — the printed sheet and the screen ribbon — and the constructor
   (a1-manual-prototype.html) feeds it the data it is editing, so what the
   constructor shows and what ships are one renderer's output, not two.

   ── THE DATA ──
     cover     mode "blocks" — free blocks on the back page and the front page,
               placed in mock-up units (a page is 832 × 1180 u);
               mode "image" — one picture for the whole outer side.
     spreads   the inner spreads in reading order. Each is either
               mode "image" — one picture for the whole spread (made by hand in
               Figma), or
               mode "blocks" — its two pages laid out from the sections
               assigned to them.
     sections  the content, in reading order: a title or a group frame, the
               print page it sits on (0 — screen only), its width on the page
               in columns of 12, and its blocks.
     blocks    step · image · items · specs · text.

   ── LAYOUT IS AUTOMATIC ──
   A page in blocks mode is a 12-column flow inside the page's margins: a
   section takes `span` columns, its blocks take `span` columns of the section,
   and rows form themselves — auto layout, not coordinates. The cover is the
   one exception: it is a composition, and its blocks are placed.

   ── STEP NUMBERS ARE COUNTED, NOT TYPED ──
   Every step block gets the next number in reading order; a section set to
   `numbering: "restart"` starts again at 1. A block may still pin its own
   `n`. Inserting a step renumbers the rest — which is the point of a
   constructor.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  var PAGE_W = 832, PAGE_H = 1180;

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function lines(s){ return esc(s).replace(/\n/g, '<br>'); }
  function h(tag, attrs, inner){
    var a = '';
    for (var k in attrs) if (attrs[k] != null && attrs[k] !== false) a += ' ' + k + '="' + esc(attrs[k]) + '"';
    return '<' + tag + a + '>' + (inner || '') + '</' + tag + '>';
  }
  function u(n){ return 'calc(' + (+n || 0) + ' * var(--u))'; }

  /* ── NUMBERING ── one pass over the whole manual, so print and screen agree */
  function number(data){
    var n = 0, map = {};
    (data.sections || []).forEach(function(sec){
      if (sec.numbering === 'restart') n = 0;
      (sec.blocks || []).forEach(function(b){
        if (b.type !== 'step') return;
        n = b.n ? +b.n : n + 1;
        map[b.id] = n;
      });
    });
    return map;
  }

  /* ── BLOCKS ──
     One function per block type, and each writes the same markup for print
     and screen: the medium decides the layout around it, not its insides. */
  function img(src, resolve, cls){
    if (!src) return '';
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + esc(resolve(src)) + '" alt="" onerror="this.remove()">';
  }
  /* On the sheet a frame takes `span` of the section's columns; on screen the
     ribbon's own grid decides, so only the proportion travels. */
  function figStyle(b, ctx){
    return (ctx.medium === 'print' ? 'grid-column:span ' + Math.max(1, Math.min(+b.span || 6, ctx.secSpan || 12)) + ';'
                                   : (+b.span >= 12 ? 'grid-column:1 / -1;' : '')) +
           'aspect-ratio:' + (b.ratio || '4 / 3');
  }
  var BLOCK = {
    step: function(b, ctx){
      var fig = '<span class="num">' + ctx.nums[b.id] + '</span>' +
                (b.label ? '<span class="m-label">' + esc(b.label) + '</span>' : '') +
                img(b.art, ctx.resolve, b.fit === 'contain' ? 'is-fit' : '');
      return h('figure', { 'class':'m-fig', style:figStyle(b, ctx), 'data-block':b.id }, fig);
    },
    image: function(b, ctx){
      var inner = img(b.art, ctx.resolve, b.fit === 'contain' ? 'is-fit' : '') +
                  (b.caption ? '<span class="m-ph">' + esc(b.caption) + '</span>' : '');
      return h('figure', { 'class':'m-fig', style:figStyle(b, ctx), 'data-block':b.id }, inner);
    },
    items: function(b, ctx){
      var it = (b.items || []).map(function(i){
        return '<figure class="m-item"><div class="m-item-art">' +
               img(i.art, ctx.resolve) +
               (i.name ? '<span class="m-ph">' + esc(i.name) + '</span>' : '') +
               '</div><figcaption class="m-label">' + esc(i.count || '') +
               (i.desc && ctx.medium === 'screen' ? '<span class="m-desc">' + esc(i.desc) + '</span>' : '') +
               '</figcaption></figure>';
      }).join('');
      return h('div', { 'class':'m-items r-row', role:'group', 'aria-label':b.label || null, 'data-block':b.id }, it);
    },
    specs: function(b, ctx){
      var it = (b.items || []).map(function(i){
        return '<div class="m-spec"><span class="m-spec-icon">' + img(i.icon, ctx.resolve) + '</span>' +
               '<span class="m-spec-value">' + esc(i.value || '') + '</span>' +
               '<span class="m-spec-what">' + esc(i.what || '') + '</span></div>';
      }).join('');
      return h('div', { 'class':'m-specs', 'data-block':b.id, style:'--n:' + Math.max(1, (b.items || []).length) }, it);
    },
    /* Troubleshooting: one card per issue, its causes and solutions listed
       inside. The cards sit in the ribbon's column grid — two across on a
       phone, three from 1024 (see a1-manual.html). */
    table: function(b){
      var cols = b.cols || ['Issue', 'Possible cause', 'Solution'];
      var cards = (b.rows || []).map(function(r){
        var its = (r.items || []).map(function(it){
          return '<li><span class="m-issue-k">' + esc(cols[1]) + '</span><p>' + esc(it.cause || '') + '</p>' +
                 '<span class="m-issue-k">' + esc(cols[2]) + '</span><p>' + esc(it.solution || '') + '</p></li>';
        }).join('');
        return '<article class="m-issue"><h3 class="m-issue-h">' + esc(r.problem || '') + '</h3><ul>' + its + '</ul></article>';
      }).join('');
      return h('div', { 'class':'m-issues', 'data-block':b.id }, cards);
    },
    text: function(b){
      return h('p', { 'class':'m-text', 'data-block':b.id }, lines(b.text || ''));
    }
  };
  function block(b, ctx){ return (BLOCK[b.type] || function(){ return ''; })(b, ctx); }

  /* ── A SECTION ──
     Title style: the .m-title over the blocks. Group style: an .m-group frame
     with its .m-legend on the rule. Consecutive steps and images share one
     grid; items rows and specs stand on their own. */
  function sectionBody(sec, ctx, medium){
    ctx.medium = medium;
    ctx.secSpan = Math.min(+sec.span || 12, 12);
    var blocks = sec.blocks || [];
    var out = '', run = [], runKind = null;
    function flush(){
      if (!run.length) return;
      if (runKind === 'grid') out += '<div class="m-grid">' + run.join('') + '</div>';
      else if (runKind === 'rows') out += '<div class="m-rows">' + run.join('') + '</div>';
      else out += run.join('');
      run = []; runKind = null;
    }
    blocks.forEach(function(b){
      var kind = (b.type === 'step' || b.type === 'image') ? 'grid' : b.type === 'items' ? 'rows' : 'solo';
      if (kind !== runKind || kind === 'solo') flush();
      runKind = kind;
      run.push(block(b, ctx));
    });
    flush();
    return out;
  }

  function sectionHtml(sec, ctx, medium){
    var out = sectionBody(sec, ctx, medium);
    var id = sec.id, span = Math.min(+sec.span || 12, 12);
    var titled = sec.title && String(sec.title).trim();
    if (sec.style === 'group'){
      return h('section', { 'class':'m-sec is-group' + (span <= 4 ? ' is-narrow' : ''), id:medium === 'screen' ? id : null, 'data-section':id, style:'--span:' + span },
        '<div class="m-group">' + (titled ? '<h2 class="m-legend">' + esc(sec.title) + '</h2>' : '') +
        '<div class="m-sec-body">' + out + '</div></div>');
    }
    return h('section', { 'class':'m-sec' + (titled ? '' : ' is-cont') + (span <= 4 ? ' is-narrow' : ''), id:medium === 'screen' ? id : null, 'data-section':id, style:'--span:' + span },
      (titled ? '<h2 class="m-title">' + lines(sec.title) + '</h2>' : '') + '<div class="m-sec-body">' + out + '</div>');
  }

  /* ── COVER BLOCKS ── placed, in mock-up units */
  var COVER = {
    text: function(b){
      var st = 'left:' + u(b.x) + ';top:' + u(b.y) + ';width:' + u(b.w || 300) +
               ';font-size:' + u(b.size || 24) + ';line-height:' + (b.lh || 1.12) +
               ';color:' + (b.color || 'var(--m-ink)') + ';text-align:' + (b.align || 'left');
      return h('p', { 'class':'cv-text', style:st, 'data-block':b.id }, lines(b.text || ''));
    },
    img: function(b, ctx){
      if (!b.src) return '';
      var st = 'left:' + u(b.x) + ';top:' + u(b.y) + ';width:' + u(b.w || 100) + (b.h ? ';height:' + u(b.h) : '');
      return '<img class="cv-img" style="' + st + '" src="' + esc(ctx.resolve(b.src)) + '" alt="" data-block="' + esc(b.id) + '" onerror="this.remove()">';
    },
    /* The photo is the page's picture: as wide as the page at scale 1, moved by
       x/y and scaled around its own top-left corner, clipped by the trim. */
    photo: function(b, ctx){
      if (!b.src) return '';
      var st = 'left:' + u(b.x) + ';top:' + u(b.y) + ';width:' + u(PAGE_W * (+b.scale || 1));
      return '<img class="cv-photo" style="' + st + '" src="' + esc(ctx.resolve(b.src)) + '" alt="" data-block="' + esc(b.id) + '" onerror="this.remove()">';
    },
    rule: function(b){
      var v = b.dir === 'v';
      var st = 'left:' + u(b.x) + ';top:' + u(b.y) + ';' + (v ? 'height:' : 'width:') + u(b.len || 100) +
               ';border-' + (v ? 'left' : 'top') + ':' + u(b.weight || 1) + ' solid ' + (b.color || '#ABB9DD');
      return '<div class="cv-rule" style="' + st + '" data-block="' + esc(b.id) + '"></div>';
    }
  };

  /* ── THE SHEET ── */
  function renderSheet(doc, data, ctx){
    var sheet = doc.querySelector('.sheet'), flip = sheet.querySelector('.flip');
    var front = flip.querySelector('.side-front');

    /* cover */
    var cov = data.cover || {};
    front.querySelectorAll('.spread-art').forEach(function(e){ e.remove(); });
    ['back', 'front'].forEach(function(p){
      var layer = front.querySelector(p === 'back' ? '.panel-l .cover' : '.panel-r .cover');
      layer.innerHTML = cov.mode === 'image' ? '' :
        (cov.blocks || []).filter(function(b){ return (b.page || 'front') === p; })
          .map(function(b){ return (COVER[b.type] || function(){ return ''; })(b, ctx); }).join('');
    });
    if (cov.mode === 'image' && cov.image)
      front.insertAdjacentHTML('beforeend', '<img class="spread-art" src="' + esc(ctx.resolve(cov.image)) + '" alt="Cover">');

    /* inner spreads */
    flip.querySelectorAll('.side-inner').forEach(function(e){ e.remove(); });
    var spreads = data.spreads || [];
    spreads.forEach(function(sp, i){
      var k = i + 1, pl = 2 * k, pr = 2 * k + 1;
      var side = doc.createElement('div');
      side.className = 'side side-inner';
      side.dataset.spread = k;
      side.dataset.mode = sp.mode || 'blocks';
      var page = function(n, cls){
        var flow = '';
        if (sp.mode !== 'image'){
          flow = (data.sections || []).filter(function(s){ return +s.page === n; })
            .map(function(s){ return sectionHtml(s, ctx, 'print'); }).join('');
        }
        return '<div class="panel ' + cls + '" data-page="' + n + '">' +
               '<div class="page-grid"><div class="grid-overlay" aria-hidden="true"></div></div>' +
               '<div class="page-flow">' + flow + '</div></div>';
      };
      side.innerHTML = page(pl, 'panel-l') + page(pr, 'panel-r') +
        (sp.mode === 'image' && sp.image ? '<img class="spread-art" src="' + esc(ctx.resolve(sp.image)) + '" alt="Pages ' + pl + '–' + pr + '">' : '');
      flip.insertBefore(side, front);
    });
  }

  /* ── THE RIBBON (screen) ── all sections in reading order */
  function renderRibbon(doc, data, ctx){
    var main = doc.querySelector('.ribbon');
    if (!main) return;
    var meta = data.meta || {};
    var head = '<header class="r-head"><h1 class="m-title">' + esc(String(meta.screenTitle || 'Manual Guide').replace(/\n/g, ' ')) + '</h1>' +
               (meta.screenLogo ? '<img class="r-logo" src="' + esc(ctx.resolve(meta.screenLogo)) + '" alt="A1">' : '') + '</header>';
    /* Screen: every section is one accordion with one kind of heading (the
       group frames of the sheet are not used here). A section without a title
       continues the previous one, so its blocks go into that one's body and
       fold away with it. */
    var accs = [];
    (data.sections || []).forEach(function(s){
      var titled = s.title && String(s.title).trim();
      var inner = sectionBody(s, ctx, 'screen');
      if (!titled && accs.length){ accs[accs.length - 1].inner += inner; return; }
      accs.push({ sec:s, titled:titled, inner:inner });
    });
    var body = accs.map(function(a, idx){
      var s = a.sec, span = Math.min(+s.span || 12, 12);
      return h('section', { 'class':'m-sec is-acc' + (idx < accs.length - 3 ? ' is-open' : ''), id:s.id, 'data-section':s.id, style:'--span:' + span },
        '<details class="acc"' + (idx < accs.length - 3 ? ' open' : '') + '><summary class="acc-head"><h2 class="m-title">' + lines(a.titled ? s.title : '') + '</h2>' +
        '<span class="acc-chev" aria-hidden="true"></span></summary>' +
        '<div class="m-sec-body">' + a.inner + '</div></details>');
    }).join('');
    var bar = main.querySelector('.r-bar');
    main.querySelectorAll(':scope > :not(.r-bar)').forEach(function(e){ e.remove(); });
    main.insertAdjacentHTML('beforeend', head + '<div class="r-flow">' + body + '</div>');
    if (bar){
      var nav = bar.querySelector('.topbar-nav');
      nav.querySelectorAll('a').forEach(function(a){ a.remove(); });
      var n = 0;
      (data.sections || []).forEach(function(s){
        if (!s.title || s.nav === false) return;
        var a = doc.createElement('a');
        a.href = '#' + s.id;
        a.innerHTML = '<span class="topbar-num" aria-hidden="true">' + (++n) + '</span><span class="topbar-label">' +
                      esc(String(s.title).replace(/\n/g, ' ')) + '</span>';
        nav.appendChild(a);
      });
    }
  }

  function render(doc, data, opts){
    opts = opts || {};
    var ctx = { nums:number(data), resolve:opts.resolve || function(p){ return p; } };
    renderSheet(doc, data, ctx);
    renderRibbon(doc, data, ctx);
  }

  /* Pages whose flow runs past the bottom margin — the constructor shows them. */
  function overflow(doc){
    var out = [];
    doc.querySelectorAll('.side-inner').forEach(function(side){
      /* a closed spread is display:none and measures nothing — open it for the
         length of the measurement */
      var was = side.style.display;
      side.style.display = 'grid';
      side.querySelectorAll('.page-flow').forEach(function(f){
        var over = side.dataset.mode !== 'image' && f.scrollHeight > f.clientHeight + 1;
        f.classList.toggle('is-over', over);
        if (over) out.push(+f.parentNode.dataset.page);
      });
      side.style.display = was;
    });
    return out;
  }

  window.ManualRender = { render:render, overflow:overflow, number:number, PAGE_W:PAGE_W, PAGE_H:PAGE_H };
}());
