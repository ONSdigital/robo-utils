# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@onsvisual/robo-utils` is a plain-JavaScript ESM library (no build step, no TypeScript) of Natural Language Generation helpers for ONS semi-automated "robo-journalism" area reports. It is consumed by Pug templates in downstream projects ([robo-article](https://github.com/ONSvisual/robo-article), [robo-embed](https://github.com/ONSvisual/robo-embed), [robo-editor](https://onsdigital.github.io/robo-editor/)) and must work in both browsers and Node. Runtime dependencies are declared as `peerDependencies`, not `dependencies`.

## Commands

```bash
npm test                          # vitest in watch mode
npx vitest run                    # run all tests once
npx vitest run tests/magic-array.test.js   # run one test file
npx vitest run -t "Birmingham"    # run tests whose name matches a pattern
npm run lint                      # prettier --check
npm run format                    # prettier --write
```

Formatting (`.prettierrc`): tabs (width 4), print width 100, no trailing commas.

Test files mirror the source: tests for `src/<module>.js` go in `tests/<module>.test.js`, with one `describe` block per function or method. Data-driven tests use `places` from `tests/setup.js`: the 2011 census CSV in `tests/data.js`, parsed into a `MagicArray` and filtered to local authorities (code prefixes `E06/E07/E08/E09/W06`), sorted by name. `setup.js` also exports `names()`, which maps a result to its `areanm` values for readable assertions.

## Architecture

The public API is whatever `index.mjs` re-exports — a new function in `src/functions.js` is not public until it is added there.

**The "magic" type system.** The core idea is that parsed data carries chainable NLG methods:

- `csvParse` (wraps d3-dsv) uses a custom `autoType` (adapted from `d3.autoType`) that turns each row into a `MagicObject`, numeric cells into `MagicNumber`, ISO-ish strings into `Date`, and cells containing `|` (or columns ending `_array`) into arrays. Because `MagicNumber` is an object, `cell === 5` is always false and a zero cell is truthy; compare with `.valueOf()` (as `filterBy` does).
- `MagicArray` (extends `Array`) wraps a list of rows. `codeKey`, `nameKey`, `parentKey` (detected from the **first item**) and `lookup` (rows keyed by both code and name, used by `.get("Hartlepool")` / `.get("E06000001")`) are getters backed by a `WeakMap`, computed on first use and rebuilt when the length changes. This is so they work on arrays that built-in methods (`.filter()`, `.slice()`) create through `Symbol.species`, which bypass the constructor's setup. Don't store state as own properties on the array: they aren't carried over to arrays made by built-in methods.
- Column detection is heuristic (`getCodeKey`/`getNameKey`/`getParentKey` in `functions.js`): preferred names like `areacd`/`areanm`/`parentcd`, then any key ending `code`/`cd` or `name`/`nm`, else the first key (see `findKey`). robo-editor's `getColKeys` wraps these, so changes here change how the editor detects columns too. `MagicObject.getCountry()` maps the first letter of the code (E/N/S/W) to a country code.
- The class files are thin wrappers that delegate to the free functions in `src/functions.js`; `functions.js` and the class modules import each other circularly, so keep class modules free of top-level code that calls into `functions.js` at import time.

**Formatting.** `format()` extends d3-format with negative decimal places (e.g. `",.-2f"` rounds to hundreds) and replaces SI suffixes with words (`"long"`: "thousand"/"million"…, otherwise `mn`/`bn`/`tn`), using a UK `£` locale. `toWords` uses the vendored `src/number-to-words.js`; numbers above `threshold` (default 9) stay as digits.

**Template rendering.** `renderJSON` renders a Pug template (Pug is passed in, defaulting to `window.pug`) with `place`/`row`, `places`/`rows`, `lookup`, `MagicArray` and every export of `functions.js` in scope and parses the HTML output, leaving Pug's text unchanged except that `<mark>` tags with a `background-color` get a black or white text `color` for contrast. It also:

- parses the HTML with node-html-parser into `{ sections, place, region, ctry, notes, error }`, where each `<section>` becomes an object (`id`, `class`→`type`, nested `sections`, `content` HTML), `<prop class="x">` children become fields (`prop.data` is JSON-parsed; `|`-separated text becomes an array — in Pug, `prop.years #{a}|#{b}`), and top-level HTML comments (Pug `//`, not `//-`) become `notes`;
- catches Pug errors and returns them in `error` rather than throwing.

`prop.data= places.toData(...)` works because `toData()` returns an array with a non-enumerable `toString` that outputs JSON. Calling an array method on the result (eg. `.slice()`) returns a plain array that loses this, so it renders as `[object Object]` and `error` reports invalid JSON.

To check rendering changes against real templates, the robo-article, robo-embed and robo-scrolly repos (`demo-data/`) and robo-editor (`public/data/`), if checked out alongside this one, have `template.pug` + `data.csv` pairs (`robo-editor`'s `template_nlg.pug` fails on all versions because it relies on RosaeNLG mixins).

`docs/api.md` is the API reference, and the README has only an overview and a few examples. `CHANGELOG.md` records changes that affect templates (it doubles as the migration guide for the robo-article/robo-embed/robo-editor repos); add an entry under the unreleased version for any behaviour change. When changing or adding a public function, update `docs/api.md`, and generate example outputs by running the code rather than writing them by hand.
