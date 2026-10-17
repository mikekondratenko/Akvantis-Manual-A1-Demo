# Akvantis — A1 Manual Guide Demo

The A1 manual shown to the client: the printed booklet in 2D / 3D and the guide on a
desktop, a tablet and a phone. Static, no build step: `public/` is the site.

**The content is not edited here.** The manual's one source is `../A1-Manual-Page/src/`;
`node ../A1-Manual-Page/tools/build.mjs` writes this demo's data, texts, renderer and
pictures every time it builds the guide (2026-10-17 — the Manual constructor is gone).

```
public/
  index.html            the page — the booklet in 2D / 3D and the three screen views
  a1-manual.html        the booklet document (the demo's own; turns its pages, draws the screen views)
  manual.json           ┐
  assets/manual-data.js │ WRITTEN by ../A1-Manual-Page/tools/build.mjs from its src/ —
  assets/manual-texts.js│ do not edit here
  assets/manual-render.js
  assets/art/ photos/   ┘
  assets/screen/        the booklet's page pictures, page-01 … page-20 (Figma page exports, WebP q85)
  assets/manual-kit.css sheet3d.js   the booklet's own styles and 3D
  assets/ui-kit/ fonts/ synced from ../ui-kit — do not edit here
```

## What it shows

The printed A1 booklet, opening on the closed cover — and, since 2026-10-07, the manual's
screen version too.

- **2D / 3D** — two bare icons above the booklet (a flat square, an isometric cube). Both are
  the WebGL booklet (`assets/sheet3d.js`, three.js r128 from cdnjs): 2D is
  that booklet strictly face-on, 3D is the same booklet at an angle, turned by dragging.
  Its pages are the page pictures of `manual-data.js` (`imageL` / `imageR`), two to a
  texture — no capture frames. Without WebGL, three.js or a page picture (and from `file://`)
  the page falls back to the flat booklet, `a1-manual?turn=1`, and the icons are hidden.
- **Views** — a small vertical bar on the right (along the bottom on a phone), icons only:
  print · desktop · tablet · mobile. The last three show `a1-manual?media=screen` in a frame
  of 1440 × 900, 768 × 1024, 390 × 844.
- Pages turn over the spine: click the outer half of a page, the ← → keys, or swipe (in 3D a
  swipe turns the booklet itself, a tap turns the page). Back from the first spread closes
  the booklet on the cover, forward from the last closes it on the back cover.

Run locally with `./serve.sh` (http://localhost:8091/) — the page asks for `/a1-manual`
without the extension, as Cloudflare serves it.

Not here, on purpose: the grid guides.

## Updating

- **Text, cards, captions, translations** — change `../A1-Manual-Page/src/` and run
  `node ../A1-Manual-Page/tools/build.mjs`; this folder follows.
- **The booklet's pages** — export the page frames from Figma (Akvantis-A1 → A1 Manual →
  section «A1-Manual · Screen assets», `page-01 … page-20`, PNG 2x), convert to WebP (q85)
  and put them in `assets/screen/` under the same names. page-01 is the front cover,
  page-20 the back cover.

## Deploy

Its own Cloudflare worker, `akvantis-manual-a1-demo` (see `wrangler.jsonc` and the
root `DEPLOY.md`).

## Zoom and page numbers (2026-10-07)

- **Zoom** (the printed booklet, 2D and 3D): the mouse wheel, a pinch on a touch screen and a
  pinch on a trackpad (Chrome: wheel + ctrl; Safari: gesture events) scale the booklet 1× … 4×
  about the point under the cursor / between the fingers. Zoomed in 2D, a drag moves it (and a
  swipe no longer turns the page — tap the page's outer half); in 3D a drag still turns the
  booklet, two fingers move it. Back at 1× it returns to the middle. `zoom` in `index.html`.
- **Page numbers** are drawn onto the page pictures when the textures are composed («/ 02»,
  Cy Grotesk Key 500, the document's own `.page-no` metrics); the covers carry none. The flat
  fallback asks the document for them with `pn=1`.
- **Pictures are WebP** everywhere (`assets/art`, `assets/photos`); the PNG sources are in git history.
