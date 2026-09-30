# Akvantis — A1 Manual Guide Demo

The Manual constructor with the controls taken out, for showing a client. Static, no build
step: `public/` is the site.

```
public/
  index.html            the page — the booklet alone: no rail, no guides, no 3D
  a1-manual.html        ⚠ copy of ../Manual/public/a1-manual.html — edit there, copy here
  manual.json           ⚠ copy of the constructor's data (…/Manual/public/manual.json)
  assets/
    manual-data.js      ⚠ the same data as a script — what index.html feeds the booklet
    manual-kit.css  manual-render.js  art/  brand/  …   ⚠ copies from ../Manual/public/assets
    ui-kit/ fonts/      synced from ../ui-kit — do not edit here
```

## What it shows

The printed A1 booklet in 2D, opening on the closed cover. Pages turn over the spine:
click the outer half of a page, the arrows at the bottom, the ← → keys, or swipe. Back from
the first spread closes the booklet on the cover, forward from the last closes it on the
back cover. The A1 mark stands top right and does nothing.

Not here, on purpose: the sidebar and constructor, the Desktop / Tablet / Mobile views, the
grid guides, 3D.

## Updating

The content is made in `../Manual` (the constructor, `a1-manual-prototype.html`) and saved
there. To bring it here, copy `manual.json`, `assets/manual-data.js`, `a1-manual.html`,
`assets/manual-render.js`, `assets/manual-kit.css` and any new pictures under `assets/art`
and `assets/uploads` from `../Manual/public`.

## Deploy

Its own Cloudflare worker, `akvantis-a1-manual-guide-demo` (see `wrangler.jsonc` and the
root `DEPLOY.md`).
