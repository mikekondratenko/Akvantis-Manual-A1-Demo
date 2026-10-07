# Akvantis — A1 Manual Guide Demo

The Manual constructor with the controls taken out, for showing a client. Static, no build
step: `public/` is the site.

```
public/
  index.html            the page — the booklet in 2D / 3D and the three screen views; no rail, no guides
  a1-manual.html        ⚠ copy of ../Manual/public/a1-manual.html — edit there, copy here
  manual.json           ⚠ copy of the constructor's data (…/Manual/public/manual.json)
  assets/
    manual-data.js      ⚠ the same data as a script — what index.html feeds the booklet
    manual-kit.css  manual-render.js  manual-texts.js  sheet3d.js  art/  brand/  …   ⚠ copies from ../Manual/public/assets
    ui-kit/ fonts/      synced from ../ui-kit — do not edit here
```

## What it shows

The printed A1 booklet, opening on the closed cover — and, since 2026-10-07, the manual's
screen version too.

- **2D / 3D** — two bare icons above the booklet (a flat square, an isometric cube). Both are
  the WebGL booklet of the constructor (`assets/sheet3d.js`, three.js r128 from cdnjs): 2D is
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

Not here, on purpose: the sidebar and the constructor, the grid guides.

## Updating

The content is made in `../Manual` (the constructor, `a1-manual-prototype.html`) and saved
there. To bring it here, copy `manual.json`, `assets/manual-data.js`, `a1-manual.html`,
`assets/manual-render.js`, `assets/manual-kit.css` and any new pictures under `assets/art`
and `assets/uploads` from `../Manual/public`.

Here `manual.json` / `manual-data.js` point at light copies instead of the print PNGs: the
pages are `assets/screen/page-NN.webp` (one file per page, `imageL` + `imageR` of a spread —
page 2 … page 17 for the 8 spreads). After a new export, convert each
`../Manual/public/assets/art/pages/page-NN.webp` to `assets/screen/page-NN.webp` under the same
number; the data does not change. Page numbers are off unless the booklet is asked for with
`?pn=1`, and the page art is exported without the folio.

The phone / tablet / desktop version (`?media=screen`) is built from cards, not page images:
`assets/art/cards/pNN-k.webp` (same files and paths as in `../Manual/public`), with numbers and
captions set in HTML. See "Screen version from cards" in `../Manual/README.md`.

Languages: `assets/manual-texts.js` (en · de · uk) is a copy of the one in `../Manual/public/assets`
— edit it there and copy it here. `?media=screen&lang=de` opens German, `&lang=uk` Ukrainian.

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
