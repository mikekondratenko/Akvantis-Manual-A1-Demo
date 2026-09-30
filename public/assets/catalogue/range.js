/* ─────────────────────────────────────────────────────────────────────────────
   The range. `window.RANGE`.

   ── The one place the range is typed ──
   Every code, every name, every finish, every flag on every position of both
   ranges is here and nowhere else. The matrix page used to carry these tables
   inline — ALL_SERIES, NEXT_SERIES, DISPLAY, LOADING, FIN — and `devices.js`
   beside this file carried a second, smaller copy for the tools that print.
   The two agreed by discipline. Now the page reads this, the tools' catalogue
   keys into it by `code`, and `docs/product-matrix.csv` is generated from it.
   A correction is made once, here, and `ui-kit/sync.mjs` carries it.

   ── Shape ──
     fin       finish code → [name, SKU suffix, swatch hex]
     finOrder  darkest first — the order a card's swatches are laid out in
     tiers     last digit of a code → tier name
     storage   the one handling line every loading prints
     current   the range shipping now, one entry per series
     next      NextGen — Akvantis's own machines, replacing the sourced ones

   A series:  letter · title · optional mark/name/sheetIs/proposed/consumable/planned/off
   A position:
     code        the model code — §4 of docs/PRODUCT-MATRIX.md
     name        the Akvantis name, where the sheet does not give one
     display     the display name — §5a, the only name a customer reads
     sheet       what the equipment sheet calls it (a code, a name or a spec — see sheetIs)
     fins        finishes it ships in, as fin codes; absent = one finish or none
     hRel        height relative to its series, for true-scale cards
     proposed    a code that is drafted, not settled
     spare       a part with a parent — lotted, not serialised
     finProposed finishes that are drafted on a settled code
     fill · compat · fn · comp   the sticker's bands, on loadings only

   Seeded from docs/PRODUCT-MATRIX.md and the equipment sheet of 2026-08-14.
   Where the record is silent this file is silent too.
   ───────────────────────────────────────────────────────────────────────────── */
window.RANGE = {
  fin: {
    "wh": [
      "White",
      "WH",
      "#E9E9E7"
    ],
    "bk": [
      "Black",
      "BK",
      "#191A1C"
    ],
    "nb": [
      "Blue",
      "NB",
      "#1F2B3C"
    ],
    "aw": [
      "Arctic White",
      "AW",
      "#F1F3F4"
    ],
    "sb": [
      "Slate Black",
      "SB",
      "#2E3338"
    ],
    "cr": [
      "Chrome",
      "CR",
      "#C9CED2"
    ],
    "st": [
      "Brushed steel",
      "ST",
      "#9BA1A5"
    ],
    "wg": [
      "White & Grey",
      "WG",
      "#E4E7E9"
    ],
    "ni": [
      "Nickel",
      "NI",
      "#BFC4C8"
    ]
  },
  finOrder: ["bk","nb","sb","st","ni","cr","wg","wh","aw"],
  tiers: {"1":"entry","2":"variant","3":"plus","4":"variant","5":"pro","7":"max"},
  storage: "Keep in a dry place",

  current: [
    { letter: "A", mark: "series-a", title: "Drinking systems", items: [
      { code: "A1", name: "AKVANTIS A1", display: "AKVANTIS A1 Direct Flow Drinking System", fins: ["bk","wg"] },
      { code: "A2", name: "AKVANTIS A2", display: "AKVANTIS A2 Direct Flow Drinking System", fins: ["bk","wg"] },
      { code: "A3", name: "AKVANTIS A3", display: "AKVANTIS A3 Direct Flow Drinking System" },
      { code: "A5", name: "AKVANTIS A5", display: "AKVANTIS A5 Direct Flow Drinking System" },
      { code: "A7", name: "AKVANTIS A7", display: "AKVANTIS A7 Direct Flow Drinking System" }
    ] },
    { letter: "K", mark: "series-k", title: "Drinking faucets", sheetIs: "code", items: [
      { code: "K1", name: "AKVANTIS K1", display: "AKVANTIS K1 Drinking Water Faucet", sheet: "X1", fins: ["bk","cr","st","ni"], finProposed: ["ni"] },
      { code: "K3", name: "AKVANTIS K3", display: "AKVANTIS K3 Drinking Water Faucet", sheet: "X3", fins: ["st","cr","bk"], finProposed: ["cr","bk"] }
    ] },
    { letter: "F", title: "Mechanical filters", items: [
      { code: "F1", name: "AKVANTIS F1", display: "AKVANTIS F1 Backwash Sediment Filter" },
      { code: "F3", name: "AKVANTIS F3", display: "AKVANTIS F3 Backwash Sediment Filter" },
      { code: "F5", name: "AKVANTIS F5", display: "AKVANTIS F5 Cartridge Sediment Filter" },
      { code: "F7", name: "AKVANTIS F7", display: "AKVANTIS F7 Cartridge Sediment Filter" }
    ] },
    { letter: "U", title: "Softening — compact", items: [
      { code: "U1", name: "AKVANTIS U1", display: "AKVANTIS U1 Ion Exchange Water Softener (1035)", fins: ["wh","bk"] },
      { code: "U3", name: "AKVANTIS U3", display: "AKVANTIS U3 Ion Exchange Water Softener (1054)", fins: ["wh","bk"] },
      { code: "U5", name: "AKVANTIS U5", display: "AKVANTIS U5 Ion Exchange Water Softener (1354)", fins: ["wh","bk"] }
    ] },
    { letter: "S", title: "Softening — cabinet", items: [
      { code: "S1", name: "AKVANTIS S1", display: "AKVANTIS S1 Cabinet Water Softener" },
      { code: "S2", name: "AKVANTIS S2", display: "AKVANTIS S2 Cabinet Water Softener (CAB 350)", sheet: "CAB 350", fins: ["bk","wh"], proposed: true },
      { code: "S3", name: "AKVANTIS S3", display: "AKVANTIS S3 Cabinet Water Softener" },
      { code: "S5", name: "AKVANTIS S5", display: "AKVANTIS S5 Cabinet Water Softener" }
    ] },
    { letter: "V", title: "Softening — Comfort", sheetIs: "name", items: [
      { code: "V1", display: "AKVANTIS V1 Cabinet Water Softener · Comfort 300", sheet: "Comfort 300" },
      { code: "V3", display: "AKVANTIS V3 Cabinet Water Softener · Comfort 400", sheet: "Comfort 400" },
      { code: "V5", display: "AKVANTIS V5 Cabinet Water Softener · Comfort 500", sheet: "Comfort 500" }
    ] },
    { letter: "W", title: "Softening — eV", sheetIs: "name", items: [
      { code: "W1", display: "AKVANTIS W1 Compact Water Softener · eV300", sheet: "eV300" },
      { code: "W2", display: "AKVANTIS W2 Softener & Carbon Filter · eV Refiner Boost", sheet: "eV Refiner Boost" },
      { code: "W3", display: "AKVANTIS W3 Compact Water Softener · eV400", sheet: "eV400" },
      { code: "W4", display: "AKVANTIS W4 Softener & Carbon Filter · eV Refiner Power", sheet: "eV Refiner Power" },
      { code: "W5", display: "AKVANTIS W5 Compact Water Softener · eV500", sheet: "eV500" },
      { code: "W7", display: "AKVANTIS W7 Compact Water Softener · eV600", sheet: "eV600" }
    ] },
    { letter: "C", title: "Carbon systems", items: [
      { code: "C1", name: "AKVANTIS C1", display: "AKVANTIS C1 Activated Carbon Filter", fins: ["wh","nb"] },
      { code: "C3", name: "AKVANTIS C3", display: "AKVANTIS C3 Activated Carbon Filter", fins: ["wh","bk"] },
      { code: "C5", name: "AKVANTIS C5", display: "AKVANTIS C5 Activated Carbon Filter", fins: ["wh","bk"] },
      { code: "C7", name: "AKVANTIS C7", display: "AKVANTIS C7 Activated Carbon Filter", fins: ["wh","bk"] }
    ] },
    { letter: "E", title: "Carbon — eK", sheetIs: "name", items: [
      { code: "E1", display: "AKVANTIS E1 Activated Carbon Filter · eK500", sheet: "eK500" },
      { code: "E3", display: "AKVANTIS E3 Iron Removal Filter · eK Iron700", sheet: "eK Iron700" },
      { code: "E5", display: "AKVANTIS E5 Iron & Manganese Removal Filter · eK OXY700", sheet: "eK OXY700" },
      { code: "E7", display: "AKVANTIS E7 Iron & Manganese Removal Filter · eK OXY700+", sheet: "eK OXY700+" }
    ] },
    { letter: "RO", mark: "series-ro", name: "Osmo", title: "Reverse osmosis, membrane technology", items: [
      { code: "RO1", name: "Osmo", display: "AKVANTIS OSMO RO Drinking System", fins: ["aw"] },
      { code: "RO2", name: "Osmo+", display: "AKVANTIS OSMO+ RO Drinking System", proposed: true },
      { code: "RO3", name: "Osmo Pro", display: "AKVANTIS OSMO PRO RO Drinking System", fins: ["sb","aw","nb"], finProposed: ["nb"] },
      { code: "RO4", name: "Osmo+ 500", display: "AKVANTIS OSMO+ 500 RO Drinking System", proposed: true },
      { code: "RO5", name: "Osmo Max", display: "AKVANTIS OSMO MAX RO Drinking System", fins: ["sb","aw"] }
    ] },
    { letter: "RC", title: "Reverse osmosis — commercial", proposed: true, sheetIs: "name", items: [
      { code: "RC1", display: "AKVANTIS RC1 Commercial RO System · SILVER PRO RO 0,25 EM", sheet: "SILVER PRO RO 0,25 EM" },
      { code: "RC3", display: "AKVANTIS RC3 Commercial RO System · SILVER PRO RO 0,5 EM", sheet: "SILVER PRO RO 0,5 EM" },
      { code: "RC5", display: "AKVANTIS RC5 Commercial RO System · OSMO A 40", sheet: "OSMO A 40" },
      { code: "RC7", display: "AKVANTIS RC7 Commercial RO System · OSMO A 50", sheet: "OSMO A 50" }
    ] },
    { letter: "WT", title: "Water tanks", items: [
      { code: "WT1", name: "AKVANTIS WT1", display: "AKVANTIS WT1 Pressure Storage Tank" },
      { code: "WT3", name: "AKVANTIS WT3", display: "AKVANTIS WT3 Pressure Storage Tank" },
      { code: "WT5", name: "AKVANTIS WT5", display: "AKVANTIS WT5 Pressure Storage Tank" }
    ] },
    { letter: "O", mark: "series-o", name: "Ozone", title: "Ozonation systems", items: [
      { code: "O1", name: "AKVANTIS O1", display: "AKVANTIS O1 Water Ozonation System" },
      { code: "O3", name: "AKVANTIS O3", display: "AKVANTIS O3 Water Ozonation System" }
    ] },
    { letter: "UV", title: "UV lamps", items: [
      { code: "UV1", name: "AKVANTIS UV1", display: "AKVANTIS UV1 Ultraviolet Disinfection System" },
      { code: "UV3", name: "AKVANTIS UV3", display: "AKVANTIS UV3 Ultraviolet Disinfection System" },
      { code: "UV5", name: "AKVANTIS UV5", display: "AKVANTIS UV5 Ultraviolet Disinfection System" },
      { code: "UV7", name: "AKVANTIS UV7", display: "AKVANTIS UV7 Ultraviolet Disinfection System" }
    ] },
    { letter: "R", mark: "series-r", name: "Rill", title: "Fountain", items: [
      { code: "R1", name: "Rill", display: "AKVANTIS RILL Drinking Water Fountain" }
    ] },
    { letter: "P", title: "Spare parts", items: [
      { code: "P-A1-PRE", name: "A1 pre-filter", display: "AKVANTIS A1 Pre-Filter Cartridge", sheet: "PCB composite cartridge — sediment and chlorine, 6–12 months", proposed: true, spare: true },
      { code: "P-A1-RO", name: "A1 membrane", display: "AKVANTIS A1 RO Membrane", sheet: "RO membrane — 24–36 months", proposed: true, spare: true },
      { code: "P-UV1-LMP", name: "UV1 emitter", display: "AKVANTIS UV1 Replacement Emitter", sheet: "Replacement emitter", proposed: true, spare: true },
      { code: "P-UV3-LMP", name: "UV3 emitter", display: "AKVANTIS UV3 Replacement Emitter", sheet: "Replacement emitter", proposed: true, spare: true },
      { code: "P-UV5-LMP", name: "UV5 emitter", display: "AKVANTIS UV5 Replacement Emitter", sheet: "Replacement emitter", proposed: true, spare: true }
    ] },
    { letter: "AF", mark: "series-af", name: "AquaFlow", title: "Loadings", consumable: true, sheetIs: "spec", items: [
      { code: "CBN", name: "Carbon", display: "AQUAFLOW Activated Carbon 20 L", sheet: "Activated Carbon · 20 L", fill: "20 L", compat: "C1 · C3 · C5 · C7", fn: "Removes chlorine and chemical odors. Improves taste and water clarity.", comp: "Activated granular carbon. Coal-based. Standard grade." },
      { code: "CBN-P", name: "Carbon+", display: "AQUAFLOW Coconut Carbon 20 L", sheet: "Activated Coconut Carbon · 20 L", fill: "20 L", compat: "C1 · C3 · C5 · C7", fn: "Removes chlorine and chemical odors. Adsorbs organic compounds. Improves taste and water clarity.", comp: "Activated coconut shell carbon. Hydraffin CC 12×35 Supra. Donau Carbon, Germany." },
      { code: "SLT-5", name: "Salt", display: "AQUAFLOW Tablet Salt 5 kg", sheet: "Tablet Salt · 5 kg", fill: "5 kg", compat: "U1 · U3 · U5 · S1 · S2 · S3 · S5", fn: "Regenerates ion exchange resin. Restores softening capacity. Safe for all softener systems.", comp: "Sodium chloride (NaCl) ≥99.5%. Vacuum evaporated tablet salt. Food-grade quality." },
      { code: "SLT-15", name: "Salt", display: "AQUAFLOW Tablet Salt 15 kg", sheet: "Tablet Salt · 15 kg", fill: "15 kg", compat: "U1 · U3 · U5 · S1 · S2 · S3 · S5", fn: "Regenerates ion exchange resin. Restores softening capacity. Safe for all softener systems.", comp: "Sodium chloride (NaCl) ≥99.5%. Vacuum evaporated tablet salt. Food-grade quality." },
      { code: "ION", name: "Ion", display: "AQUAFLOW Ion Exchange Resin 20 L", sheet: "Ion Exchange Resin · 20 L", fill: "20 L", compat: "U1 · U3 · U5 · S1 · S2 · S3 · S5", fn: "Removes calcium and magnesium. Softens water. Reduces scale buildup.", comp: "Sulfonated polystyrene cation exchange resin. Food grade." },
      { code: "MIN", name: "Mineral", display: "AQUAFLOW Natural Volcanic Mineral 20 L", sheet: "Natural Volcanic Mineral · 20 L", fill: "20 L", compat: "F1 · F3", fn: "Removes suspended particles, rust and sediment. Protects downstream filters.", comp: "Natural volcanic mineral. No chemical regeneration required." }
    ] },
    { letter: "X", title: "Valves", planned: true, off: true, items: [
      { code: "X1", display: "AKVANTIS X1 Smart Water Valve" }
    ] }
  ],

  next: [
    { letter: "A", use: "drink", mark: "series-a", title: "Drinking systems", items: [
      { code: "A1G2", name: "AKVANTIS A1", display: "AKVANTIS A1 Direct Flow Drinking System", hRel: 129 },
      { code: "A3G2", name: "AKVANTIS A3", display: "AKVANTIS A3 Direct Flow Drinking System", hRel: 141 },
      { code: "A5G2", name: "AKVANTIS A5", display: "AKVANTIS A5 Direct Flow Drinking System", hRel: 139 },
      { code: "A7G2", name: "AKVANTIS A7", display: "AKVANTIS A7 Direct Flow Drinking System", hRel: 140 }
    ] },
    { letter: "K", use: "drink", mark: "series-k", title: "Drinking faucets", items: [
      { code: "K1", name: "AKVANTIS K1", display: "AKVANTIS K1 Drinking Water Faucet", fins: ["bk","cr","st"] },
      { code: "K3", name: "AKVANTIS K3", display: "AKVANTIS K3 Drinking Water Faucet" },
      { code: "K5", name: "AKVANTIS K5", display: "AKVANTIS K5 Electronic Drinking Water Faucet", fins: ["st","bk"] },
      { code: "K7", name: "AKVANTIS K7", display: "AKVANTIS K7 Electronic Drinking Water Faucet" }
    ] },
    { letter: "R", use: "drink", mark: "series-r", name: "Rill", title: "Fountain", items: [
      { code: "R1", name: "Rill", display: "AKVANTIS RILL Drinking Water Fountain" }
    ] },
    { letter: "M", use: "home", mark: "series-m", title: "Modular home treatment", items: [
      { code: "M1", name: "AKVANTIS M1", display: "AKVANTIS M1 Modular Home Treatment System" },
      { code: "M3", name: "AKVANTIS M3", display: "AKVANTIS M3 Modular Home Treatment System" },
      { code: "M5", name: "AKVANTIS M5", display: "AKVANTIS M5 Modular Home Treatment System" }
    ] },
    { letter: "X", use: "home", mark: "series-x", title: "Valves", items: [
      { code: "X1", display: "AKVANTIS X1 Smart Water Valve", hRel: 211 }
    ] },
    { letter: "RO", use: "home", mark: "series-ro", name: "Osmo", title: "Reverse osmosis", items: [
      { code: "RO1", name: "Osmo", display: "AKVANTIS OSMO RO Drinking System", fins: ["aw"], hRel: 294 },
      { code: "RO3", name: "Osmo Pro", display: "AKVANTIS OSMO PRO RO Drinking System", fins: ["sb","aw"], hRel: 294 },
      { code: "RO5", name: "Osmo Max", display: "AKVANTIS OSMO MAX RO Drinking System", fins: ["sb","aw"], hRel: 294 }
    ] },
    { letter: "WT", use: "home", mark: "series-wt", name: "Smartank", title: "Stacked modular tank", items: [
      { code: "WT7", name: "Smartank", display: "AKVANTIS SMARTANK Stacked Modular Tank", hRel: 294, proposed: true }
    ] },
    { letter: "AF", mark: "series-af", name: "AquaFlow", title: "Loadings", consumable: true, sheetIs: "spec", items: [
      { code: "CBN", name: "Carbon", display: "AQUAFLOW Activated Carbon 20 L", sheet: "Activated Carbon · 20 L", fill: "20 L", compat: "C1 · C3 · C5 · C7", fn: "Removes chlorine and chemical odors. Improves taste and water clarity.", comp: "Activated granular carbon. Coal-based. Standard grade." },
      { code: "CBN-P", name: "Carbon+", display: "AQUAFLOW Coconut Carbon 20 L", sheet: "Activated Coconut Carbon · 20 L", fill: "20 L", compat: "C1 · C3 · C5 · C7", fn: "Removes chlorine and chemical odors. Adsorbs organic compounds. Improves taste and water clarity.", comp: "Activated coconut shell carbon. Hydraffin CC 12×35 Supra. Donau Carbon, Germany." },
      { code: "SLT-5", name: "Salt", display: "AQUAFLOW Tablet Salt 5 kg", sheet: "Tablet Salt · 5 kg", fill: "5 kg", compat: "U1 · U3 · U5 · S1 · S2 · S3 · S5", fn: "Regenerates ion exchange resin. Restores softening capacity. Safe for all softener systems.", comp: "Sodium chloride (NaCl) ≥99.5%. Vacuum evaporated tablet salt. Food-grade quality." },
      { code: "SLT-15", name: "Salt", display: "AQUAFLOW Tablet Salt 15 kg", sheet: "Tablet Salt · 15 kg", fill: "15 kg", compat: "U1 · U3 · U5 · S1 · S2 · S3 · S5", fn: "Regenerates ion exchange resin. Restores softening capacity. Safe for all softener systems.", comp: "Sodium chloride (NaCl) ≥99.5%. Vacuum evaporated tablet salt. Food-grade quality." },
      { code: "ION", name: "Ion", display: "AQUAFLOW Ion Exchange Resin 20 L", sheet: "Ion Exchange Resin · 20 L", fill: "20 L", compat: "U1 · U3 · U5 · S1 · S2 · S3 · S5", fn: "Removes calcium and magnesium. Softens water. Reduces scale buildup.", comp: "Sulfonated polystyrene cation exchange resin. Food grade." },
      { code: "MIN", name: "Mineral", display: "AQUAFLOW Natural Volcanic Mineral 20 L", sheet: "Natural Volcanic Mineral · 20 L", fill: "20 L", compat: "F1 · F3", fn: "Removes suspended particles, rust and sediment. Protects downstream filters.", comp: "Natural volcanic mineral. No chemical regeneration required." }
    ] }
  ]
};

/* ═════════════════════════════════════════════════════════════════════════════
   DECISIONS

   Everything below was written beside the data while it lived in the matrix page,
   and moved here with it on 2026-09-11. It is the reasoning the codes and names
   above stand on — why nickel is its own finish, why the Refiners sit on even
   rungs, why SFT became ION. docs/PRODUCT-MATRIX.md carries the same arguments at
   length; these are the short forms that were next to the rows they explain.
   ═════════════════════════════════════════════════════════════════════════════

/* Added 2026-08-20 with the OSMO answer: PRO and MAX are Slate Black and
   Arctic White, not the plain white and black the photographs were filed as. */

/* ── One finish, two colours in it ──
   A1's second finish is not a white and not a grey: the housing is white and the
   dials and base are grey, and it is sold as one thing. So it is one entry with
   the name it is sold under, and the disc shows the body colour because that is
   what a person matching a swatch to a box is looking at. A pair of entries
   would put two SKUs on a shelf where there is one machine. */

/* ── Nickel, and it may not exist ──
   The shop lists the LED faucet in Chrome, Nickel and Black matte; §6 lists
   K1 in Black, Chrome and Brushed steel. Three finishes either way, and the
   middle one is named differently in the two documents. Either nickel is a
   fourth surface nobody wrote down, or it is what the shop calls brushed
   steel — and the two answers give K1 four SKUs or three.
   Entered as its own code rather than folded into `st`, because merging them
   on a guess is the harder mistake to undo: a SKU that shipped under `K1-NI`
   cannot be told later that it was always `K1-ST`. Marked proposed. */

/* Which finish a card opens on — and, since the swatch row is sorted by the same list,
   the order the discs are laid out in. Black first, by instruction; the navy C1 is the
   same decision one shade over, and it is the dark unit in its pair. After that it is
   simply darkest to lightest, so every card's row runs the same direction and the black
   is always the disc on the left.
   Every finish in `FIN` is listed. One that is missing sorts to the back rather than to
   the front, which is survivable, but it also puts that card's row out of step with its
   neighbours' — so a new finish belongs here as well as there. A product with one finish
   never reaches this list. */

/* ── The display name, §5a of the matrix ──
   Brand, model, technology, category — AKVANTIS A1 Direct Flow Drinking System. What a
   customer reads, and the only one of the four names allowed to change without anything
   else changing.
   Kept here rather than in `shop.js` because it is ours: the shop holds the Ukrainian
   title it publishes, this holds the English name the range decided on, and neither is
   derived from the other. Generated from the register in §5a — a code missing here shows
   its short name alone rather than a guess.
   The NextGen A codes share their predecessors' names on purpose. A generation lives in
   the code and, if marketing wants it, in a numeral after the model; it is not a thing a
   customer looks for in a product title. */

/* Spares carry the parent's name and say what part they are — §5a: the fourth name is
   what a customer types into a search box, and a person looking for this is looking
   for *A1 filter*, not for a part number. */

/* The drawn lockups and their aspect ratios. The ratio is the drawing's own
   viewBox, written here because a mask has no intrinsic size to lay itself out
   from — `height` plus `aspect-ratio` is what gives it one.
   K5 and K7 are drawn too and are not here: reserved codes with no product on
   the current sheet, and a mark on the page would say otherwise. */

/* Generated by tools/build-marks.mjs from the SVGs in assets/marks — the ratio is each
   drawing's own viewBox, written here because a `<symbol>` has no intrinsic size and the
   page has to lay the mark out from something.
   The set grew from nine product lockups to twenty-six drawings, and the new half of it
   is the interesting half: `series-*` are **family marks**, which did not exist before.
   A category head could only ever be typed words; now A, K, M, X, OSMO, OZONE, RILL,
   SMARTANK and AquaFlow each have one. */

/* Keyed by the mark's own id, and the id is named on the series that uses it rather than
   derived from its letter. That was a bug worth the extra field: `series-wt` is the
   SMARTANK wordmark, `WT` in today's range is three water tanks, and a lookup by letter
   put SMARTANK in the current line's bar — a NextGen product name advertising a category
   that does not contain it.
   Separate from MARKS because a family is not a product: `RO1` is one machine and
   `series-ro` is the range it opens. They are the same drawing for Osmo, Rill and
   Smartank — a one-product family is its own wordmark — and the sprite carries both ids
   rather than sharing one, so neither depends on the other. */

/* ── No explanatory notes under the heads ──
   Each category used to carry a paragraph: why the faucets moved back to K, why the
   supplier-branded groups have their own letters, why the two Refiners sit on even
   rungs. They are the arguments this scheme stands on and they are still written
   down — in `docs/PRODUCT-MATRIX.md`, which is where an argument belongs. On a page whose
   job is to show the range they were a wall of grey text between a heading and the
   products it names. */

/* A2 is the first even digit in service, and it arrived the way §4 said it would: a
   variant of the entry unit rather than a rung of its own. It is current-line only —
   NextGen has no A2 — which is the answer to §7.3. */

/* K1 ships in three finishes in both ranges, and both read the same three files.
   `K1` is a current code, so the carry-over rule sends the NextGen card to
   `current/k/` as well — one set of photographs, not two to keep in step. */

/* ── The code is settled and the colours are not ──
   Both faucets are confirmed in §6, so neither carries a proposed badge on its code.
   What is drafted is narrower and sits in the eighth slot: which finishes they ship
   in. The shop shows the LED tap in Chrome, Nickel and Black matte and the mixer in
   Chrome and Black; §6 has brushed steel in both places and no nickel anywhere. The
   union is listed, and the entries only one of the two documents supports are badged
   rather than the whole card — a badge on `K1` would say the faucet's number is in
   doubt, which it is not. */

/* ── S2, the rung below the entry rung ──
   CAB 350 is a cabinet softener the shop sells under the Akvantis mark and cheaper than
   S1, and §4 is explicit about where it goes: a model below the current entry does not
   become `S0` and does not push `S1` up, it takes the next free digit. That is `2`,
   which the grid reserves for *a variant of the entry unit* — near enough, and the tier
   names do the explaining the number is not allowed to do.
   Two rows in the shop, Black and unlabelled, so one model with two finishes. The
   unlabelled one is entered as White on the assumption that a cabinet named only by its
   black sibling is the default colour; nobody has said so. */

/* The base OSMO is Arctic White and nothing else — one finish, so one photograph and
   no suffix on the file. PRO and MAX are the two that ship in a pair. */

/* ── OSMO+ takes the even digits ──
   Two positions the shop sells and §6 never had: `OSMO+` at 495 and `OSMO+ 500` at
   780, both well under the base OSMO. Same rule as S2 — free digits, no renumbering —
   and the even ones are what variants are for. They may also turn out to be one
   machine in two capacities rather than two machines, in which case they collapse to
   one code and two SKUs. Nobody has looked inside them yet.
   ── PRO ships in three finishes, not two ──
   The shop lists Arctic White, Night Blue and Slate Black. `aw` and `sb` are what the
   shop calls the two this page already draws as `wh` and `bk`, so only the navy is
   genuinely new — added here, with no photograph yet. */

/* ── Commercial osmosis is a category the grid does not have ──
   Four machines in the shop — SILVER PRO RO 0,25 EM and 0,5 EM, OSMO A 40 and A 50 —
   all Akvantis-marked, all reverse osmosis, none of them domestic. §4 lists fifteen
   series letters and commercial RO is not among them, so this is a new one rather than
   four more digits on `RO`: a house system and a plant differ in service, in warranty
   and in who buys them, and a ladder that mixed them would make the tier digit mean two
   things at once.
   `RC` is proposed and unconfirmed — the letter, the category and all four rungs. */

/* ── P: the spare parts, as a series of their own ──
   The emitters used to sit inside `UV` as `UV1-LMP`, on the argument that keeping the
   parent in the first slot is what makes a spare findable beside its machine — and with
   a note that the alternative, a series of its own, had not been argued. The A1's
   cartridges argued it. `A1-RO` in the UV grammar reads as *A1 in finish RO* next to
   `A1-BK` and `A1-WG`; the emitters never had that problem only because lamps have no
   finishes.
   So the first slot says *this is a part* and the second says *whose*: `P-A1-PRE`,
   `P-A1-RO`, `P-UV1-LMP`. The parent is still in the code and still one dash from
   the front, so a price list sorted by code puts every A1 part together. What the
   letter buys is that a spare can never be mistaken for a finish, a tier or a size —
   the three things the second slot means everywhere else in §5.
   A spare has a parent and no serial: it is one of a box, counted by batch like a
   loading (`spare` in slot 7). Decided 2026-09-11; the section in the matrix is §6 · P. */

/* ── AquaFlow, the loading line ──
   Read out of `Akvantis Filters Branding/AquaFlow Spec.md` v1.1, which is where the
   mnemonic product codes come from. The article used to wrap them in `AKVNTS-PCR-`;
   both segments came off on 2026-08-15 and the line now uses the same grammar as
   everything else, `CBN-20` beside `A1-BK`.
   `consumable` marks the one way these still differ: a bag of salt has a lot number,
   not a serial, and it has no next generation to switch to. The lot is built on the
   same three slots as a serial — `CBN-2604-03`.
   ── The code is a contraction of the name, with no exceptions left ──
   Carbon `CBN`, Carbon+ `CBN-P`, Salt `SLT`, Ion `ION`, Mineral `MIN`. Two of those
   used to disagree: the resin was coded `SFT` and sold as ION, the mineral was coded
   `GRD` and sold as Mineral, and the codes were kept on the argument that an article
   number is worth more as a constant than as a mnemonic.
   That argument protects a code somebody is already holding, and nobody was: nothing
   had shipped under either. What it actually bought was a warehouse where the bag
   labelled `Ion` lives in the bin marked `SFT` — so the codes moved to the names while
   moving them was still free. `Soft` was never a candidate for the name: four
   categories on this page are called Softening, so a loading named Soft collides with
   the machines it is poured into, and in Russian `софт` reads as software. */

/* One valve, not a ladder of four. Four rows claim a range is coming; one row says a
   product is coming and the letter is taken, which is the true statement. X3, X5 and X7
   are what the free digits are for and cost nothing to leave unwritten. */

/* Hidden for now, not deleted. The valve is real enough to have taken the letter and
   not real enough to stand in a catalogue of things that ship — `off` keeps the claim
   on `X` in this file without putting an empty promise on the page. */

/* One place decides what the page shows, and everything downstream — cards, counts,
   anchors, the category select — reads the filtered list rather than each remembering
   to skip the hidden ones. */

/* ── The NextGen range is a second list, not a flag on the first ──
   The investor deck's second slide is visibly shorter than its first, and that is the whole
   argument: one Akvantis-designed machine covers what four sourced ones covered. Today's
   mechanical filters, cabinet softeners, carbon columns, tanks, UV and ozone are bought in
   and badged; NextGen absorbs them rather than replacing them one for one.
   This used to be a switch that appended `G2` to every code and greyed every photograph,
   which described a range nobody is building — the same sixty positions, redrawn. Two lists
   is the honest shape.
   `G2` appears only where an Akvantis machine takes a position a sourced machine already
   holds, because §3's no-reuse rule applies to that position. M, X, K5 and K7 carry no
   suffix: there is nothing for them to be the second generation of. */

/* The fifth slot is relative height, read off the lineup in Figma — node 1361:27463,
   where the products stand on one baseline and are drawn to scale against each other.
   **Provisional.** Four of them come back exactly 294 and three exactly 302, which is
   what a row aligned to a guide looks like rather than one measured off drawings. Good
   enough to stop a faucet rendering the height of a cabinet; to be replaced with real
   heights in millimetres when the range is dimensioned. K is not in that lineup, so the
   faucets carry no measurement yet and fill their box as before. */

/* K1's finishes are named for the surface, not the colour: `bk` black, `cr` polished
   chrome, `st` brushed steel. Two letters each, the same shape as `bk`/`wh`/`nb`
   elsewhere — `chr` and `brshd` were the working names on the renders and they are
   longer than the thing they describe. Chrome and steel are both silver at a glance
   and the difference is the finish, so abbreviating the finish is the one
   abbreviation that carries the information.
   The same three finishes ship in the current range, so this entry and the K1 in
   ALL_SERIES resolve to the same three files under `current/k/`. */

/* ── RILL is carried over, not replaced ──
   It appears in both ranges and it is the only position that does. Written out again
   rather than pointing at the object in ALL_SERIES, because `use` would then apply to
   both lists and draw a lone band across today's otherwise unbanded range.
   **The code stays `R1` and carries no `G2`.** Akvantis says RILL in NextGen is the
   RILL that ships now, and a suffix on an unchanged machine would claim a second
   generation that does not exist — the opposite mistake to reusing a code. If the
   fountain is redesigned it becomes `R1G2` on the same rule as A, K and RO.
   Filed under *for drink* on the strength of what it is; it is on neither the app's
   supported-devices slide nor the NextGen grid, so the placement is inference. */

/* No `name`, so it falls through to `M-Series` the way A, K and F do. `Magic Water` is
   the deck's grouping for this row and it is a customer-facing word, not a category in
   the matrix — the same reason `Drink Water` and `Home Water` are recorded in §3 and
   kept out of the codes. */

/* M is a modular line — one cabinet width, three heights — and it reads that way with
   no help from the page: the three renders are exported at one scale inside their
   squares, so M3 is simply the tall picture. This used to need a per-series ratio and a
   locked width because the files were normalised by height, which turned a taller
   machine into a narrower image. */

/* Graduated from `planned` on the strength of a finished render — the letter was taken
   before there was a product, and now there is one. */

/* ── OSMO is carried over, and it lost its `G2` ──
   It was written here as `RO1G2`/`RO3G2`/`RO5G2` on the assumption that the next range
   replaces this one throughout, the way it does for A. Then the renders arrived and they
   are the same three machines already on the equipment sheet — the base unit with its
   plumbing exposed under the cabinet, the narrow PRO, the wide MAX with the round port.
   A `G2` on an unchanged machine claims a generation that does not exist, which is the
   mistake RILL is written up to avoid two entries above.
   Dropping the suffix does more than correct a name: `RO1` is a current code, so the
   carry-over rule now files both ranges' photographs under `current/ro/`. One set of six
   rather than two sets to keep in step.
   PRO and MAX ship white and black. The base OSMO does not — it is Arctic White only,
   confirmed by Akvantis, and the two cabinets standing together in the sheet's OSMO
   photograph are a lighting difference rather than two products. Two finishes are two
   SKUs and two GTINs, and one serial sequence shared by both: the counter is per model,
   so a black and a white unit never carry the same number and the finish stays off the
   plate, where it would be three characters restating what the eye can see. */

/* ── SMARTANK is a free rung, not a second generation ──
   It was `WT1G2` on the reading that a NextGen tank must be the redesign of the tank
   already in the range. Akvantis has since said it is not: SMARTANK is a new position,
   and WT1 continues to be WT1.
   That makes the suffix a false statement rather than a naming preference. `G2` claims
   a predecessor, and a claim of a predecessor is what a service department reads five
   years from now when it asks which machine a part fits. A position nobody has held has
   nothing to be the second generation of — the same rule that keeps M, K5 and K7
   unsuffixed, applied one row later.
   `WT7` because a stacked tank is still a tank, and §4 sends a new position to the next
   free digit on the ladder it belongs to rather than to a new letter. 1, 3 and 5 are
   taken; 7 is the free named rung. **Proposed** — the alternative is that a modular
   stack is a different category from a pressure vessel and wants its own letter, which
   is §7.3a and is still open. The digit is the cheaper guess: it costs one character to
   change and it does not claim a relationship that does not exist.
   Not `planned`. The code is open, the photograph is not — an unsettled name is no
   reason to hide a product that has been rendered. */

/* The loadings belong to both ranges. A bag of carbon is not redesigned when the machine
   it feeds is, and AquaFlow is the consumable line for either. */

/* ── Where the photographs live ──
   `assets/products/<range>/<series>/<code>.png`. One folder per range, one per series
   inside it, so a person replacing a render opens two folders and finds one file rather
   than scrolling eighty-three names in a flat directory.
   The range comes from which list the series is in, and it is stamped here rather than
   typed twenty-two times.
   **A carried-over product keeps one photograph, and which those are is derivable.** RILL,
   the two faucets and every loading appear in NextGen under the code they already have,
   because they are the machine that ships now rather than a redesign of it — `K1`, not
   `K1G2`. So the rule is the same sentence as the code rule: a code that exists in the
   current range points at `current`, whatever list it is being rendered from. This used to
   be two hardcoded exceptions and it stopped being true the moment a third product carried
   over; derived, it cannot fall behind the data. */

/* Only what actually ships gets registered. `X1` is in the current list as a reserved
   ladder with no machine on it — `off` and `planned` — and a reserved code is not a
   product whose photograph exists. Registering it sent the NextGen valve looking for
   a picture of a placeholder. */

/* The range on screen. A function rather than a constant now that there are two of them,
   and every reader of it re-reads on each render — a cached copy is how the cards and the
   table end up describing different generations. */

/* ══════════════ WHAT IS IN THE BAG ══════════════
   The shop sells machines, so `SHOP` has nothing for a loading and the two folding blocks
   opened onto nothing — the one part of the range where the *content* is the product was
   the one part with no content on it.
   The words are not invented here. They are the sticker's, read off `Akvantis Softener —
   Packaging — 2026` and recorded in docs/PRODUCT-MATRIX.md §5a: `FUNCTION` and `COMPOSITION`
   are two of the sticker's eight bands, and this is those two bands plus the two facts the
   bands above them carry — the fill and what the bag goes into.
   COMPATIBILITY IS THE MATRIX'S, NOT THE CONCEPT'S. The drawn sticker points its chips at
   `B1 B3 B5 B7`, which is a series that does not exist, and points the mineral media at the
   carbon housings. §5a rebuilds both from the code range: resin and salt go into the ion
   exchange and cabinet softeners, mineral into the backwash sediment filters — `F5`/`F7`
   are cartridge and cannot take loose media at all. The page prints the corrected set,
   which is the whole reason it is written down twice.
   The same six strings are in the Stick Maker, which prints them. Two copies, and they are
   kept in step by both being copies of §5a rather than of each other — the day they
   disagree, that section is the tie-break. */

/* A handling instruction rather than a shelf life, and the same one on all six: a sack of
   salt has no pictogram for *dry*, so the sticker says it in words. Shared rather than
   repeated six times, because it is one statement about how bags are stored. */
