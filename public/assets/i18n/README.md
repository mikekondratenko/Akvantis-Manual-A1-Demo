# ui-kit/i18n — the interface in every language

The fixed words every Akvantis page says, in every language the range ships in.
**Source of truth.** Edited here, copied into projects by `node ui-kit/sync.mjs`.

```
regions.json   the markets: code, file, how the region names itself, its language, icon
en.json        the default language — every key starts here
de.json        Deutsch
uk.json        Українська   (⚠ `uk` = Ukrainian language, ISO 639; `ua` is the country)
i18n.js        GENERATED from the above — never edit; pages load it with a <script>
```

Consumers: `Digital-Passport-Builder`, `Digital-Passport-Landing-Page`, `Manual`
(`assets/i18n/`).

## Keys

Flat, dotted, named by **where the string lives**, not by what it says:

| prefix | what | example |
|---|---|---|
| `popup.*` | location popup | `popup.title` |
| `head.*` | header | `head.top` (aria label of the logo) |
| `row.*` | seeded page rows and their buttons | `row.warranty`, `row.guide.button` |
| `intro.*`, `foot.*`, `meta.*` | intro line, footer, `<meta>` | `foot.note` |
| `colour.<id>` | finish names, `id` from `devices.js` | `colour.whitegrey` |
| `kind.<slug>` | product kind from the catalogue, slugged | `kind.direct-flow-drinking-system` |

Placeholders in braces are filled by the page: `{year}`, `{model}`. Keep them in every
language.

## Rules

1. **English first.** A new string is a new key in `en.json`, then in every other file.
2. **No holes.** `sync.mjs` exits 1 if any language lacks a key English has — the page
   would otherwise switch to English mid-sentence.
3. **Fallback** at runtime: language → English → the key. The last should never be seen.
4. **Editable fields** (row titles, intro, footer) are seeded from a key. While the field
   still equals the English default it is translated; once someone types their own words
   they pass through untouched. (`TK()` in the builder's `app.js`.)
5. **Not here:** legal text (warranty, terms) and manuals. Those are written per market —
   see `docs/localization/LOCALIZATION.md`.
6. **Terms** follow `docs/localization/glossary.md`.

## Adding a language

1. Add the region to `regions.json` (`code`, `file`, `name` in its own language,
   `language`, `short`, `icon: "pin"`).
2. Copy `en.json` to `<code>.json` and translate every value.
3. `node ui-kit/sync.mjs` — it fails until nothing is missing.
4. Turn it on in the builder: **Localization** in the sidebar.
