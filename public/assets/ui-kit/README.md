# Tools UI Kit — Akvantis

Cloned from the **Shokobox Card Generator** (`card-generator.michaelkondratenko.com`),
which is the reference implementation of the kit. The donor repository is read-only
for this project — nothing here writes back to it.

Specimen page: **`A1/public/ui-kit.html`**. In use: **`A1/public/box.html`** and
**`Stick-Maker/public/index.html`**.

## Where this is edited

**Here — `Akvantis/ui-kit/kit/` — and nowhere else.**

Every project ships its own committed copy under `public/assets/ui-kit/`, because the
projects deploy separately and none of them has a build step. Those copies are output:

```bash
node ui-kit/sync.mjs            # write them
node ui-kit/sync.mjs --check    # exit 1 if any has drifted
```

Edit a copy instead of this folder and `--check` will catch it, but only if somebody
runs it — so the habit is: change lands here, sync, commit both. See
`README.md` for why the duplication is kept rather than solved.

The fonts travel with the kit for the same reason: `tokens.css` declares `@font-face`
against `../fonts/`, so a project that gets the stylesheets without the face renders
the whole rail in a fallback. `sync-kit` lays down both.

## Files

```
ui-kit/kit/           →  <project>/public/assets/ui-kit/
├── tokens.css   CSS custom properties — colour, type, numbers, space, radius
├── panel.css    the plate title and the collapsible plate; requires tokens.css
├── number.css   the step number in a circle (Figma «Number»); requires tokens.css
├── hotspot.css  the "+" in a black disc on a picture — a button that opens more; requires tokens.css
├── kit.css      components; requires tokens.css and panel.css, in that order
└── kit.js       the two controls that are built rather than written (window.Kit)

ui-kit/fonts/            →  <project>/public/assets/fonts/
└── CyGrotesk-Key*         the licensed face tokens.css reaches for
```

```html
<link rel="stylesheet" href="assets/ui-kit/tokens.css">
<link rel="stylesheet" href="assets/ui-kit/panel.css">
<link rel="stylesheet" href="assets/ui-kit/kit.css">
<script src="assets/ui-kit/kit.js"></script>
```

**`panel.css` is separate because one consumer cannot take `kit.css`.** A reading
document — the passport page a scanned carton opens — needs the collapsible plate and
cannot have a stylesheet that starts `html, body { height: 100dvh; overflow: hidden }`.
While the control lived in `kit.css` that page carried a hand-lifted copy, the Stick
Maker had redeclared the sign locally as a chevron, and `kit.css` held a reduced-motion
rule for `.panel-chevron` — a class it never defined. One file, four surfaces, no copies.
The sign is the chevron; `.panel-sign`, the plus that became a minus, is gone.

Sora comes from Google Fonts; the kit assumes it is loaded.

## The scale

One primitive list, and everything dimensional aliases it.

```
--number-*   0 2 4 8 12, then 8 to 288      the only place a pixel is written down
--space-*    var(--number-*), step for step  gaps, padding, insets
--radius-*   4 8 12 16, off the same steps   corners
```

`--space-16` and `--radius-16` are provably the same 16 rather than two numbers that
happen to agree. That is the whole reason for the indirection: two independent lists of
the same values drift the first time one of them is edited.

**The head is finer than the tail on purpose.** 2 and 4 are hairlines and icon insets,
where one step is the difference between two states of the same control. Past 16 nothing
on a 300 px rail or a 1440 px stage needs to land between 24 and 32 — **20 and 28 are
absent by decision, not oversight.** A scale that can express every even number decides
nothing, and a token nobody had to choose is a token that does not hold a layout together.

**288 is the ceiling** because it is the widest measurement the shell has: the rail is 300
and its content is 288 once the plate takes its inset. Anything above that is a layout
rather than a gap.

`--rail` and `--rail-collapsed` stay off the scale deliberately — 300 is the rail's own
measurement, and rounding it to 288 to tidy the list would change what the number is for.

## Heading levels

Three, and they are the whole hierarchy of a rail:

| class | | names |
|---|---|---|
| `.sidebar-title` | 16 / 600 | the tool |
| `.panel-title` | 14 / 600 | a plate |
| `.field-label` | 11 / 400 | one field |
| `.group-label` | 10 / 700 caps | a group of controls inside a plate |

`.panel-title` was 12 / 700 in caps with .08em of tracking. Caps is what a heading reaches for
when it has no size to spend, and a plate's name at 12 beside a group's at 10 is two points of
difference — not a hierarchy anyone reads, so the caps were carrying it. Four more points and a
lighter weight say the same thing without shouting, and they leave the group label its own job:
caps at 10 now reads as the smaller, tighter thing inside the larger one rather than as the
same thing two pixels down.

**It lands on both tools.** Every plate in the Box Maker and the Stick Maker wears this class,
which is the point of the kit — a heading that is one size in one tool and another size in the
other is the drift the folder exists to prevent.

## What changed from the donor

Only the accent. The grey scale, the type ramp, the radii and the 4 px spacing grid
are byte-identical, because those are what make the two tools read as the same object.

| Role | Shokobox | Akvantis A1 |
|---|---|---|
| Brand accent — toggles, slider thumb, active button | Peach `#FE8455` | Blue `#4EA1FF` |
| UI accent — CTA hover / active only | Orange `#FF7446` | Blue-1000 `#3D93FF` |

The families keep their step names, so a rule written against the donor works here
unedited once `--peach` is read as `--blue`. Prefer the semantic aliases in new code:
`--accent`, `--accent-deep`, `--accent-ink`.

## Shell

`.app` → `.sidebar` + `.main`. Composition B: the sidebar is a transparent 300 px
scroll column and each section is its own `.sidebar-tile`, with the 12 px seam coming
from the column's flex gap rather than from borders. The logo opens the first content
plate instead of sitting in a tile of its own.

`.is-frosted` on `.app` swaps every surface for a translucent one and blurs what is
behind it. It is for tools whose canvas runs the full width of the window underneath
the rail — the Box Maker is one. The edge is an inset shadow, so switching the variant
on cannot move anything by a pixel.

## Components

**CSS-only** — `.sidebar-tile`, `.sidebar-panel`, `.panel-title`, `.group-label`,
`.group-note`, `.sidebar-divider`, `.toggle-row` + `.toggle-switch`, `.dark-input`,
`.select`, `.file-in`, `.swatch-input`, `.swatch-btn`, `.slider` + `.value-row` +
`.ends`, `.btn` / `.btn-ghost` / `.print-btn`, `.toast`, `.stage`, `.stage-hint`,
`.view-tab`, `.camera-tab`, `.bottom-bar`, `.topbar` + `.topbar-mark` + `.topbar-nav` +
`.topbar-ink` + `.topbar-aside`, `.preview-caption`, `.section-disabled`,
`.popup` + `.popup-overlay`.

**`.topbar` is a shell, and the row inside it is the consumer's.** Brand mark left,
section links centre, one control right, floating as a frosted pill over a fixed page. It
came out of `product-matrix`, where it was written first — that page now carries only what
is genuinely local to it: the family lockups that go inside a link, the greyed state for a
reserved code, and the square corners the bar takes when a panel opens under it.

**888 px, fixed, and the row is what gives.** A bar that sized itself to its contents
would be a different width in every mode the consumer offers, and a fixed element that
changes width when you toggle something is a fixed element that moves. So when a row stops
fitting, the link padding comes down rather than the pill going out: from 768 it is 4
either side, which holds sixteen sections inside 888 with about 100 px to spare. Past that
the row scrolls, which is the phone behaviour and was always the intent there.

**The ink is positioned by script, and the kit only dresses it.** `.topbar-ink` is one
element on the bar's bottom edge that travels; the consumer sets `width`, `transform` and
`.is-on`. An `::after` on the active link cannot animate — a pseudo-element belongs to its
element, so moving the class destroys one marker and creates another.

**`.topbar-aside` holds one control.** The bar is a line, not a toolbar, and the second
thing put in that slot is the thing that starts the row scrolling on a laptop. Its label
lights when a `.toggle-switch` inside it is on, so the pair reads as one control.

**`button.panel-title` is the whole strip, not the words.** It was `width: 100%; padding: 0`,
which sounds like the full row and is not — the plate holds a 16 px inset, so a click one pixel
above the title, or level with the chevron on the far right, landed on the plate and did
nothing. On a closed plate, where the title is the only thing in it, most of the visible object
was inert. A negative margin takes the box out to the tile's edges and the padding puts the
content back where it was, so the change is transparent to layout: the bottom margin cancels the
bottom padding and the panel's 24 px gap still measures from the same line. Expanded, the strip
stays the only target — a body full of inputs that also collapses the plate is a body where
every miss closes the panel. **The hover plate is on the closed state only** — closed, the strip
*is* the tile and the wash says the whole object is the button; open, the strip is the top edge
of a panel already showing everything it has, and lighting it offers to reveal something that is
not hidden. The colour lift answers the cursor in both states; only the plate is conditional.

**`.panel-fold` animates the opening.** `hidden` cannot be animated — the element is gone on the
first frame, so the plate jumps and the chevron turns against nothing. The fold is a grid whose
single row goes `0fr → 1fr`, which is the one way to animate to a height nobody has measured:
`height: auto` is not interpolable and a JS `scrollHeight` is a number that goes stale the moment
a field wraps. The child clips, and `min-height: 0` is what lets it — a grid item's automatic
minimum size is its content, so without that the row refuses to go below what is in it.

**The fold carries its own gap, and it carries it inside the clip.** `hidden` took the element
out of the flow and the panel's 24 px gap went with it; a fold is still a flex item at zero
height, so a closed plate was left carrying 24 px of nothing under its title. A panel containing
a fold now applies no gap at all — `.sidebar-panel:has(> .panel-fold) { gap: 0 }` — and the
separation lives on the first item *inside* the clipping child, where it is content and collapses
with everything else.

**Inside, not on it.** The obvious version is `padding-top` on the clipping child, and it leaves
24 px of plate under every closed title — visible, and outside the button's hover area, so the
tile is taller than the thing you can click. `overflow: hidden` clips content; it does not clip
padding. At `0fr` the row gives the child a content height of zero and its border box is still
its padding, so the fold is 24 tall while reporting nothing. A margin on the child's first item
gets clipped like anything else, and a closed plate comes out exactly its title strip — the same
box the hover plate draws.

A third version cancelled the gap with a negative margin on the fold. It leans on a flex item
with a negative outer size collapsing the gap the way the arithmetic says it should, and it
writes the panel's 24 down in a second place where the two can disagree. `:has()` asks the
question directly and leaves nothing to keep in step.

Closed, the subtree takes **`inert`**, set by script rather than CSS: a fold with no height still
holds focusable inputs, and a Tab that lands inside a collapsed plate is a cursor that has left
the screen. `prefers-reduced-motion` drops both the fold and the chevron's rotation.

```html
<button class="panel-title" aria-expanded="false" aria-controls="x">Title <svg class="panel-chevron">…</svg></button>
<div class="panel-fold" id="x" data-open="false" inert>
  <div class="panel-body">…</div>
</div>
```

`.popup-overlay` is new. The kit had a popup and no way to show one — `.popup` is a plate, and
a plate on its own is a panel that happens to float. The overlay is what makes it modal: a
scrim that dims what is behind, centres the plate and swallows clicks aimed past it. It takes
`hidden` rather than a class, so the subtree leaves the accessibility tree instead of merely
going invisible.

**Built by `kit.js`** — the segmented tabs, the icon toggle and the stepper. The first
two carry a sliding thumb whose geometry is derived from the option count, and a
hand-written copy of that maths is a copy that will eventually disagree with the
stylesheet; the stepper needs timers.

```js
Kit.segmented(el, [{label, value, icon?}, …], activeIndex, onChange)
Kit.iconToggle(el, [{label, value, icon?}, …], activeIndex, onChange)
Kit.toggle(switchEl, onChange)      // → { get(), set(v) }
Kit.stepper(numberInput, {holdMs?, repeatMs?})   // wraps it in a .stepper plate
Kit.steppers(root)                  // every input[type=number].dark-input in a subtree
Kit.slider(label, {min, max, step, value, ends?, format?}, onInput)  // → el, el.input
Kit.field(label, value, onInput, {type?, multiline?, placeholder?, id?, …})
Kit.divider()
Kit.toast(msg, {chip?, invert?, ms?})
Kit.icons                            // shared SVG set, currentColor
```

`Kit.stepper` takes an existing `<input type="number" class="dark-input">` rather than
building one, so `min` / `max` / `step` keep living on the input where the browser and
everything else expects them. Holding − or + steps once, pauses **1000 ms**, then
repeats every **70 ms** — the pause is what keeps a click a click. Repeating stops on
pointerup, pointercancel, pointerleave and window blur.

`Kit.iconToggle` reuses its DOM when the option shape is unchanged. This is
deliberate: a freshly inserted element has no previous position to transition from,
so a rebuilt thumb arrives instead of travelling and the animation never plays.

### Rule — surfaces on frost

Anything placed **on a frosted surface** (bar, popup, sheet) is **white at low alpha**, never
the grey `--tile`: `--on-frost` (`--white-10`), hover `--on-frost-hover` (`--white-14`).
A frosted container re-points `--tile` / `--tile-hover` to these, so its children need no
changes. Grey on frost reads as a second opaque layer and kills the blur.

### Location picker — `passport/passport.css`

Added 2026-09-28, pattern taken from Shokobox. Two parts:

- **Trigger** `a.lang-mark.locale` — region in ink · `• En/De/Ua` muted, same on phone and desktop; **nothing chosen → globe only** · globe (20), no chevron, **globe always at the far right**. Sits in the right corner of `.head`.
- **Sheet** `.regions` — on a phone drops from the top, full viewport width; from 768 a
  centred popup 480 wide, radius 24, fade + rise 8; over `--scrim-50`. Title
  `Select your location` + round × (40). Rows `.region` 72 tall, `--tile`, radius 16: icon
  (globe for Global, a round 20 px flag for a country — `FLAGS` in app.js; pin as fallback), region in its own language, language
  under it. No row is chosen by default. Chosen row `aria-current="true"`: `--btn` fill, `--btn-ink` text,
  check on the right; pressing it again un-chooses it. The choice is kept in the reader's
  browser (`localStorage` `akv-region`).
- Opens on `.is-open` (script) or `:target` (no script); closes on ×, scrim, Esc.

Regions today: Global / English (`index.html`), Germany / Deutsch (`de.html`),
Україна / Українська (`uk.html`). Lives in `passport.css` because the passport cannot link
`kit.css`; lift it into its own `kit/locale.css` the day a second tool needs it.

## Rules carried over from the donor

- **Only one thing ever fills a segment or a panel: the thumb.** Inactive segments have
  no hover fill — two lit panels at once, one of which is not the selection, reads wrong.
- **The accent is a state, not a decoration.** Inside a panel it appears on the toggle
  when on and on the slider thumb; the filled CTA is white at rest and takes the accent
  only on hover and active.
- **Selected swatch: the fill pulls in, the ring takes the edge** (`background-clip:
  content-box` + 3 px padding), so a row does not grow when one of them is chosen.
- **Every control is 48 px** on a `--black-700` ground at `--radius-8`, except the
  icon toggle (64 px) and the switch.
- **Buttons are fully rounded** — `.btn`, `.btn-ghost`, `.print-btn`, `.file-in` and the
  stepper ends are pills, not `--radius-8` plates. This is the one deliberate departure
  from the donor's geometry: in Akvantis the radius separates the things you *press*
  from the surfaces you put things *on*. Tabs (`.segmented`, `.iconseg`) keep the plate
  radius — they are a track with a selection, not a button.
- **A stepper puts its value in the middle**, − and + on either side. A number pushed
  against the left edge with its controls bunched at the right reads as a text field
  that happens to have buttons.
- **Stage chrome is anchored to `.main`, never to the window.** Pinning to `left: 300px`
  is short by the page padding and the flex gap, and does not survive a scroll.


## Number — `number.css`

The step number of the A1 manual, from the Figma component «Number» (A1 Packaging, 985:462).
Its own file for the same reason `panel.css` is: the manual is a reading document and cannot
take `kit.css`.

```html
<span class="num">9</span>                    <!-- fill = on, the default -->
<span class="num" data-fill="off">9</span>    <!-- hairline outline -->
<span class="num" data-fill="white">9</span>  <!-- white disc, over a dark picture -->
<span class="num" data-fill="simple">9</span> <!-- no disc, larger figure -->
```

`data-fill` takes the Figma property's own values, so markup and mock-up are compared without
translating names. One size, `--num-size` (default 24): the figure is 2/3 of it (5/6 for
`simple`), the `off` outline 1/24 — the two sizes in the mock-up, 24/16 and 36/24, are that
ratio. The colours are the print library's (#010006 / #FDFEFF), not the rail's `--black`,
because the number lives on paper; override `--num-ink` / `--num-paper` on any ancestor.
