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
               mode "image" — a picture per page: `imageL` (the back page)
               and `imageR` (the front). `image` — one picture for the
               whole outer side — is the older form and still works.
     spreads   the inner spreads in reading order. Each is either
               mode "image" — a picture per page, exported from Figma page by
               page: `imageL` (the even page) and `imageR` (the odd one), each
               832 × 1180 u. One spread = L + R (2026-10-06). `image` — one
               picture for the whole spread — is the older form and still
               works; a page picture, where there is one, lies over it. Or
               mode "blocks" — its two pages laid out from the sections
               assigned to them.
     sections  the content, in reading order: a title or a group frame, the
               print page it sits on (0 — screen only), its width on the page
               in columns of 12, and its blocks.
     blocks    step · image · items · specs · text · table,
               page — one printed page of picture cards for the screen: each
               card is its art (the frame from Figma without number and
               caption), its place on the page in mock-up units, and the
               number and caption as text (2026-10-07),
               indicators — the legend of the four lights.

   ── LANGUAGES ──
   The data is English. `localize(data, dict)` gives the same data in another
   language — see assets/manual-texts.js and the shell (a1-manual.html).

   ── LAYOUT IS AUTOMATIC ──
   A page in blocks mode is a 12-column flow inside the page's margins: a
   section takes `span` columns, its blocks take `span` columns of the section,
   and rows form themselves — auto layout, not coordinates. The cover is the
   one exception: it is a composition, and its blocks are placed.

   ── STEP NUMBERS ARE COUNTED, NOT TYPED ──
   Every section that has a title starts its steps at 1 (2026-10-02). A section
   with no title is the same chapter carried onto the next page, so it goes on
   counting; `numbering: "continue"` / `"restart"` on a section overrides either. A block may still pin its own
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
      if (sec.numbering ? sec.numbering === 'restart' : !!String(sec.title || '').trim()) n = 0;
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
  /* The kit's number (ui-kit/kit/number.css). Two figures say so, and the kit
     sets them smaller — the disc stays a circle. */
  function num(n, cls){
    var t = String(n);
    return '<span class="num' + (cls ? ' ' + cls : '') + '"' + (t.length > 1 ? ' data-digits="' + Math.min(t.length, 2) + '"' : '') +
           (cls ? ' aria-hidden="true"' : '') + '>' + esc(t) + '</span>';
  }
  var BLOCK = {
    step: function(b, ctx){
      var fig = num(ctx.nums[b.id]) +
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
               '</div><figcaption class="m-label">' + esc(ctx.medium === 'screen' && i.label && !/^\d+x/.test(i.count || '') ? '' : (i.count || '')) +
               (ctx.medium === 'screen' && (i.label || i.desc) ? '<span class="m-desc' + (/^\d+x/.test(i.count || '') ? '' : ' is-name') + '">' + esc(i.label || i.desc) + '</span>' : '') +
               (ctx.medium === 'screen' && i.sub ? '<span class="m-desc m-sub">' + esc(i.sub) + '</span>' : '') +
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
    table: function(b, ctx){
      var cols = b.cols || ['Issue', 'Possible cause', 'Solution'];
      /* Variant B — a table (2026-10-01): the symptom on the left, once, and
         every «cause — what to do» as a row on the right. Chosen per block
         (`view: "table"`) or for the whole page (`opts.tableView`, the kit). */
      if ((ctx.tableView || b.view) === 'table'){
        var body = (b.rows || []).map(function(r){
          var its = r.items || [];
          return its.map(function(it, k){
            return '<tr' + (k === 0 ? ' class="is-first"' : '') + '>' +
                   (k === 0 ? '<th scope="row" rowspan="' + its.length + '">' + esc(r.problem || '') + '</th>' : '') +
                   '<td class="m-fault-cause">' + esc(it.cause || '') + '</td>' +
                   '<td class="m-fault-fix">' + esc(it.solution || '') + '</td></tr>';
          }).join('');
        }).join('');
        /* Phone (variant C, 2026-10-01): a table does not fit 390 px. The same
           rows as a list of symptoms that open one by one — scan the list,
           tap yours, read the causes. The table is hidden there, the list
           here (manual-kit.css). */
        var list = (b.rows || []).map(function(r){
          var its = r.items || [];
          return '<details class="m-fault"><summary><span class="m-fault-t">' + esc(r.problem || '') + '</span>' +
                 '<span class="m-fault-chev" aria-hidden="true"></span></summary><ol>' +
                 its.map(function(it){
                   return '<li><p class="m-fault-cause">' + esc(it.cause || '') + '</p><p class="m-fault-fix">' + esc(it.solution || '') + '</p></li>';
                 }).join('') + '</ol></details>';
        }).join('');
        return h('div', { 'class':'m-faults-wrap', 'data-block':b.id },
          '<div class="m-faultlist">' + list + '</div>' +
          '<table class="m-faults"><thead><tr><th scope="col">' + esc(cols[0]) + '</th><th scope="col">' +
          esc(cols[1]) + '</th><th scope="col">' + esc(cols[2]) + '</th></tr></thead><tbody>' + body + '</tbody></table>');
      }
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
    },
    /* One printed page of cards (2026-10-07). The art is a picture; the
       number and the caption are kit components over it, so they keep a
       readable size on a phone and can be translated. `x y w h` are the
       card's place on the page in mock-up units: a phone stacks the cards and
       keeps each one's proportion, from 768 they stand as on the page. */
    page: function(b, ctx){
      var cards = (b.cards || []).map(function(c){
        var st = '--x:' + (+c.x || 0) + ';--y:' + (+c.y || 0) + ';--w:' + (+c.w || 1) + ';--h:' + (+c.h || 1);
        return '<figure class="m-card" style="' + st + '">' +
               '<img class="m-card-art" src="' + esc(ctx.resolve(c.art || '')) + '" alt="" loading="lazy" decoding="async">' +
               (c.n ? num(c.n) : '') +
               /* `hotspots` (2026-10-07): a "+" on a part of the picture. `x y` — its
                  place in % of the card; `ref` — the art path of an item of «In the
                  box», whose picture and name the pop-up shows; or `art` / `name` /
                  `desc` given outright (the faucets are not in the box). */
               (c.hotspots || []).map(function(hs){
                 var it = hs.ref ? (ctx.items || {})[hs.ref] : null;
                 var name = hs.name || (it && (it.label || it.name)) || '', art = hs.art || (it && it.art) || '';
                 var desc = hs.desc || (it && it.desc) || '';
                 if (!name && !art) return '';
                 return '<button type="button" class="hotspot m-hot" style="left:' + (+hs.x || 0) + '%;top:' + (+hs.y || 0) + '%" aria-haspopup="dialog" aria-label="' + esc(name) +
                        '" data-art="' + esc(ctx.resolve(art)) + '" data-name="' + esc(name) + '" data-desc="' + esc(desc) + '"' +
                        /* a part that is sold apart (the faucets): the pop-up gets a button to its page */
                        (hs.url ? ' data-url="' + esc(hs.url) + '" data-btn="' + esc(hs.button || 'Buy') + '"' : '') + '></button>';
               }).join('') +
               /* `marks` (2026-10-08): the green check / red cross over a part of the
                  picture — HTML, not drawn into the picture, so it is the same size on
                  every card whatever the card's scale. `x y`: its centre, % of the card. */
               (c.marks || []).map(function(m){
                 var t = m.type === 'error' ? 'error' : 'ok', x = +m.x || 0, y = +m.y || 0;
                 /* in the top-right corner of the mock-up = the card's verdict: pinned to
                    the corner like the step number, not to a point of the picture */
                 if (x >= 85 && y <= 20) return '<span class="m-mark" data-mark="' + t + '" data-corner aria-hidden="true"></span>';
                 return '<span class="m-mark" data-mark="' + t + '" style="left:' + x + '%;top:' + y + '%" aria-hidden="true"></span>';
               }).join('') +
               (c.caption ? '<figcaption class="m-cap"' + (c.mode ? ' data-mode="' + esc(c.mode) + '"' : '') + '>' +
                 (c.info ? CAP_INFO : '') + '<span>' + esc(c.caption) + '</span></figcaption>' : '') +
               '</figure>';
      }).join('');
      /* `product` (2026-10-07): what the printed page sells with a QR code, the
         screen sells with a block under the page — the product's photo from
         the library (ui-kit/photos), its name and kind, and a button that
         goes to its page. */
      var pr = b.product, buy = '';
      if (pr && pr.url){
        buy = '<div class="m-buy" data-buy="' + esc(b.id) + '">' +
              '<span class="m-buy-art">' + (pr.photo ? '<img src="' + esc(ctx.resolve(pr.photo)) + '" alt="" loading="lazy" decoding="async">' : '') + '</span>' +
              '<span class="m-buy-text"><strong class="m-buy-name">' + esc(pr.name || '') + '</strong>' +
              (pr.kind ? '<span class="m-buy-kind">' + esc(pr.kind) + '</span>' : '') + '</span>' +
              '<a class="btn m-buy-btn" href="' + esc(pr.url) + '" target="_blank" rel="noopener">' + esc(pr.button || 'Buy') + '</a></div>';
      }
      return h('div', { 'class':'m-page', 'data-block':b.id, 'data-page':b.page || null,
                        style:'--pw:' + (+b.w || 736) + ';--ph:' + (+b.h || 1026) }, cards) + buy;
    },
    /* The four lights: a key (on · flashing · breathing), a row per light
       with its states, and the alarms. Colours are names, the kit paints them. */
    indicators: function(b){
      function light(c, m){ return '<i class="m-light" data-c="' + esc(c || 'ink') + '" data-m="' + esc(m || 'on') + '"></i>'; }
      function states(list){
        return '<ul class="m-ind-states">' + (list || []).map(function(s){
          return '<li>' + (s.lights ? '<span class="m-ind-lights">' + s.lights.map(function(c){ return light(c, s.m || 'flashing'); }).join('') + '</span>'
                                    : light(s.c, s.m)) + '<span>' + esc(s.t || '') + '</span></li>';
        }).join('') + '</ul>';
      }
      var key = '<div class="m-ind-row is-key"><h3 class="m-ind-name">' + esc(b.label || 'Indicator') + '</h3>' +
                states([{ m:'on', t:(b.key || [])[0] || 'on' }, { m:'flashing', t:(b.key || [])[1] || 'flashing' }, { m:'breathing', t:(b.key || [])[2] || 'breathing' }]) + '</div>';
      var rows = (b.rows || []).map(function(r){
        return '<div class="m-ind-row' + (r.alarm ? ' is-alarm' : '') + '"><h3 class="m-ind-name">' + esc(r.name || '') + '</h3>' + states(r.states) + '</div>';
      }).join('');
      return h('div', { 'class':'m-ind', 'data-block':b.id }, key + rows);
    }
  };
  var CAP_INFO = '<svg class="m-cap-i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor"/>' +
                 '<circle class="m-cap-i-in" cx="10" cy="5.7" r="1.5"/><rect class="m-cap-i-in" x="8.9" y="8.5" width="2.2" height="6.8" rx=".3"/></svg>';
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
      else if (runKind === 'pages') out += '<div class="m-pages">' + run.join('') + '</div>';
      else if (runKind === 'rows') out += '<div class="m-rows">' + run.join('') + '</div>';
      else out += run.join('');
      run = []; runKind = null;
    }
    blocks.forEach(function(b){
      var kind = (b.type === 'step' || b.type === 'image') ? 'grid' : b.type === 'items' ? 'rows' : b.type === 'page' ? 'pages' : 'solo';
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

  /* One page's picture (a Figma export of that page), laid over the page to the trim. */
  function pageArt(src, alt, ctx){
    return '<img class="page-art" src="' + esc(ctx.resolve(src)) + '" alt="' + esc(alt) + '">';
  }

  /* ── THE SHEET ── */
  function renderSheet(doc, data, ctx){
    var sheet = doc.querySelector('.sheet'), flip = sheet.querySelector('.flip');
    var front = flip.querySelector('.side-front');

    /* cover */
    var cov = data.cover || {};
    front.querySelectorAll('.spread-art, .page-art').forEach(function(e){ e.remove(); });
    ['back', 'front'].forEach(function(p){
      var layer = front.querySelector(p === 'back' ? '.panel-l .cover' : '.panel-r .cover');
      layer.innerHTML = cov.mode === 'image' ? '' :
        (cov.blocks || []).filter(function(b){ return (b.page || 'front') === p; })
          .map(function(b){ return (COVER[b.type] || function(){ return ''; })(b, ctx); }).join('');
    });
    if (cov.mode === 'image'){
      if (cov.image)
        front.insertAdjacentHTML('beforeend', '<img class="spread-art" src="' + esc(ctx.resolve(cov.image)) + '" alt="Cover">');
      /* a picture per page: back on the left, front on the right */
      [['imageL', '.panel-l', 'Back cover'], ['imageR', '.panel-r', 'Cover']].forEach(function(p){
        if (cov[p[0]]) front.querySelector(p[1]).insertAdjacentHTML('beforeend', pageArt(cov[p[0]], p[2], ctx));
      });
    }

    /* inner spreads */
    flip.querySelectorAll('.side-inner').forEach(function(e){ e.remove(); });
    var spreads = data.spreads || [];
    spreads.forEach(function(sp, i){
      var k = i + 1, pl = 2 * k, pr = 2 * k + 1;
      var side = doc.createElement('div');
      side.className = 'side side-inner';
      side.dataset.spread = k;
      side.dataset.mode = sp.mode || 'blocks';
      var img = sp.mode === 'image';
      var page = function(n, cls, src){
        var flow = '';
        if (sp.mode !== 'image'){
          flow = (data.sections || []).filter(function(s){ return +s.page === n; })
            .map(function(s){ return sectionHtml(s, ctx, 'print'); }).join('');
        }
        return '<div class="panel ' + cls + '" data-page="' + n + '">' +
               '<div class="page-grid"><div class="grid-overlay" aria-hidden="true"></div></div>' +
               '<div class="page-flow">' + flow + '</div>' +
               (img && src ? pageArt(src, 'Page ' + n, ctx) : '') + '</div>';
      };
      side.innerHTML = page(pl, 'panel-l', sp.imageL) + page(pr, 'panel-r', sp.imageR) +
        (sp.mode === 'image' && sp.image ? '<img class="spread-art" src="' + esc(ctx.resolve(sp.image)) + '" alt="Pages ' + pl + '–' + pr + '">' : '');
      flip.insertBefore(side, front);
    });
  }

  /* ── THE RIBBON (screen) ── all sections in reading order */
  function renderRibbon(doc, data, ctx){
    var main = doc.querySelector('.ribbon');
    if (!main) return;
    var meta = data.meta || {};
    /* 2026-10-01: no head block — the page starts with the first section. The
       product is in the bar (photo left, A1 mark right). */
    var head = '';
    /* Screen: every section is one accordion with one kind of heading (the
       group frames of the sheet are not used here). A section without a title
       continues the previous one, so its blocks go into that one's body and
       fold away with it. */
    var accs = [];
    (data.sections || []).forEach(function(s){
      var titled = s.title && String(s.title).trim();
      var inner = sectionBody(s, ctx, 'screen');
      if (!titled && accs.length){ accs[accs.length - 1].inner += inner; return; }
      /* `group` (2026-10-07): consecutive sections of one group are ONE section
         on screen — one heading, one entry in the bar — and each of them is a
         stage inside it under its own small heading (`navTitle`). A row of
         links at the top of the section jumps to a stage. */
      if (s.group){
        var last = accs[accs.length - 1];
        var name = String(s.navTitle || s.title).replace(/\n/g, ' ');
        var stage = '<div class="m-stage" id="' + esc(s.id) + '" data-section="' + esc(s.id) + '"><h3 class="m-stage-title">' + esc(name) + '</h3>' + inner + '</div>';
        if (!last || last.group !== (s.groupId || s.group)){
          last = { sec:{ id:s.groupId || 'group-' + s.id, title:s.group, span:s.span }, titled:true, group:s.groupId || s.group, inner:'', stages:[] };
          accs.push(last);
        }
        last.stages.push('<a href="#' + esc(s.id) + '">' + esc(name) + '</a>');
        last.inner += stage;
        return;
      }
      accs.push({ sec:s, titled:titled, inner:inner });
    });
    var body = accs.map(function(a, idx){
      var s = a.sec, span = Math.min(+s.span || 12, 12);
      return h('section', { 'class':'m-sec is-acc' + (idx < accs.length - 3 ? ' is-open' : ''), id:s.id, 'data-section':s.id, style:'--span:' + span },
        '<details class="acc"' + (idx < accs.length - 3 ? ' open' : '') + '><summary class="acc-head"><h2 class="m-title">' + lines(a.titled ? s.title : '') + '</h2>' +
        '<span class="acc-chev" aria-hidden="true"></span></summary>' +
        '<div class="m-sec-body">' + (a.stages && a.stages.length > 1 ? '<nav class="m-stages">' + a.stages.join('') + '</nav>' : '') + a.inner + '</div></details>');
    }).join('');
    var bar = main.querySelector('.r-bar');
    main.querySelectorAll(':scope > :not(.r-bar)').forEach(function(e){ e.remove(); });
    /* The Akvantis mark closes the page (2026-10-01): grey, centred, after the
       last section — it left the bar. The drawing is the bar's own. */
    var markSvg = bar && bar.querySelector('.topbar-mark svg');
    /* 2026-10-07: no mark at the foot — the page ends with its last section, on a
       phone, a tablet and a desktop alike. */
    var foot = '';
    main.insertAdjacentHTML('beforeend', head + '<div class="r-flow">' + body + '</div>' + foot);
    if (bar){
      var nav = bar.querySelector('.topbar-nav');
      nav.querySelectorAll('a').forEach(function(a){ a.remove(); });
      var n = 0, seen = {};
      (data.sections || []).forEach(function(s){
        if (!s.title || s.nav === false) return;
        /* a group is one entry */
        if (s.group){
          var gid = s.groupId || 'group-' + s.id;
          if (seen[gid]) return;
          seen[gid] = 1;
          s = { id:gid, title:s.group };
        }
        var a = doc.createElement('a');
        a.href = '#' + s.id;
        a.innerHTML = num(++n, 'topbar-num') + '<span class="topbar-label">' +
                      esc(String(s.navTitle || s.title).replace(/\n/g, ' ')) + '</span>';
        nav.appendChild(a);
      });
    }
  }

  function render(doc, data, opts){
    opts = opts || {};
    /* items of the manual by their picture — what a hotspot's `ref` points at */
    var items = {};
    (data.sections || []).forEach(function(sec){ (sec.blocks || []).forEach(function(b){
      (b.items || []).forEach(function(i){ if (i.art && !items[i.art]) items[i.art] = i; });
    }); });
    var ctx = { items:items, nums:number(data), resolve:opts.resolve || function(p){ return p; }, tableView:opts.tableView || '' };
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

  /* ── LANGUAGES (2026-10-07) ──
     English is the original and stays in the data. `dict` maps an English
     string to the reader's language (built from assets/manual-texts.js); the
     result is a copy of the data with every text that has a row replaced.
     Paths, ids and settings are never looked up. A string with no row stays
     English. */
  var NOT_TEXT = { id:1, art:1, src:1, icon:1, type:1, style:1, mode:1, view:1, c:1, m:1, image:1, imageL:1, imageR:1,
                   color:1, align:1, dir:1, fit:1, ratio:1, numbering:1, lights:1, hex:1, ref:1, groupId:1, url:1, photo:1, screenLogo:1, screenHero:1 };
  function localize(data, dict){
    if (!dict) return data;
    function walk(o){
      if (typeof o === 'string') return Object.prototype.hasOwnProperty.call(dict, o) ? dict[o] : o;
      if (Array.isArray(o)) return o.map(walk);
      if (o && typeof o === 'object'){
        var out = {};
        for (var k in o) out[k] = NOT_TEXT[k] ? o[k] : walk(o[k]);
        return out;
      }
      return o;
    }
    var out = {};
    for (var k in data) out[k] = k === 'sections' ? walk(data[k]) : data[k];
    return out;
  }

  window.ManualRender = { localize:localize, render:render, overflow:overflow, number:number, PAGE_W:PAGE_W, PAGE_H:PAGE_H };
}());
