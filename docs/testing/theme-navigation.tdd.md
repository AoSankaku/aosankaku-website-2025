# Theme navigation TDD evidence

## Source and intended behavior

Derived from the reported white flash during dark-theme page navigation.

- Keep the selected theme on the incoming document before Astro swaps root
  attributes, including back/forward and language navigation.
- Preserve saved light/dark preferences and the system-theme fallback.
- Keep browser canvas/controls consistent with the theme while retaining the
  existing light print palette.

## Diagnosis and change

The inline bootstrap previously restored `.dark` in `astro:after-swap`.
Astro replaces the root attributes using the incoming document, which has no
theme class in static HTML. This temporarily removes the selected theme during
the swap. The layout also omitted `color-scheme`, leaving browser-native colors
independent of the selected theme.

The bootstrap now prepares `event.newDocument.documentElement` in
`astro:before-swap`. Initial-load preference resolution stays synchronous.
The light and dark CSS palettes now declare their matching `color-scheme`.

Reference: [Astro's before-swap lifecycle documentation](https://docs.astro.build/en/guides/view-transitions/#astrobefore-swap).

## RED and GREEN

- RED: `bun test src/layouts/themeNavigation.test.ts` executed the actual inline
  script in an isolated VM: **4 pass, 4 fail**. Initial resolution passed;
  preparing the incoming document and following later selections failed.
- RED checkpoint: `cdb6a86` (`test: reproduce theme loss before page swaps`).
- GREEN: `bun test src/layouts/themeNavigation.test.ts src/layouts/clientRouting.test.ts src/layouts/printStyles.test.ts`:
  **17 pass, 0 fail, 40 assertions**.
- `bun run build`: **117 pages built successfully**. Link-card metadata fetching
  reported an RSS content-type error; the build completed successfully.
- `git diff --check`: passed.

## Browser verification

Tested the production build with headless Chrome on a local Astro preview.
External requests were blocked to isolate local rendering and routing.

| Scenario | Checks | Result |
|---|---|---|
| Saved dark, system light, native view transitions | Language navigation, back, forward, theme toggle, subsequent navigation | PASS |
| No saved preference, system dark, view-transition API disabled | Same navigation sequence with Astro's fallback | PASS |
| Saved light, system dark | Saved preference wins; theme toggle survives navigation | PASS |
| Print media in all three scenarios | Computed `color-scheme` remains light | PASS |

Across **12 swaps and 1,167 sampled animation frames**, the incoming and swapped
root kept the expected theme, background colors and native color schemes matched,
and no page JavaScript errors occurred.

## Limits and coverage

The pre-change browser probes confirmed missing incoming theme state, but did
not reproduce a visible white frame in this Chrome environment. Browser sampling
checks computed styles; it does not prove compositor behavior in every browser.
Firefox and Safari were not tested.

No global coverage run was needed for this focused layout change. The behavioral
tests execute the inline script through a VM; regular file coverage would not
meaningfully describe the embedded script. No broader suite was run.

## Follow-up: initial load and reload

The follow-up checks found a separate initial-canvas gap. Before external CSS
loaded, `.dark` was already present but the root background was transparent and
`color-scheme` was `normal`. The browser therefore had no explicit dark canvas
while waiting for the stylesheets.

Moved the background/text variables, canvas colors, and color schemes into a
small inline style at the start of the head. Moved the existing synchronous
bootstrap before head slots and external resources. Added the early
`color-scheme` meta hint recommended by
[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme#declaring_color_scheme_preferences).
The remaining palette stays in the stylesheet; no theme values are duplicated.

### Reproducible browser check

`src/layouts/themeFirstPaint.browser.mjs` exports a verification function. Invoke
it with a Playwright Page and a local production-preview origin (default
`http://127.0.0.1:24322`). It launches and closes its own headless Chrome browser.
For the connected Playwright tool, its source can also be evaluated after
removing `export default`.

The check disables caching and holds external CSS responses until after it
inspects the root background and color scheme. It verifies both first navigation
and reload for saved dark/system light, first visit/system dark, and saved
light/system dark. Each scenario also checks the theme toggle, light print
colors, and absence of JavaScript page errors.

- RED: all **6 initial/reload checks failed**, with transparent root background,
  `normal` color scheme, and two pending stylesheets. After CSS loaded, the
  expected colors were present.
- RED checkpoint: `b4b1311` (`test: reproduce initial theme canvas before CSS loads`).
- GREEN: the same **6 checks passed**. With both stylesheets still pending, dark
  cases already used `rgb(26, 26, 26)` / `dark`; light cases used
  `rgb(255, 255, 255)` / `light`. Those values stayed unchanged after CSS loaded.
- Theme toggles and print colors passed in all three scenarios, with no page
  JavaScript errors.
- `node --check src/layouts/themeFirstPaint.browser.mjs`: passed.
- The targeted Bun command above still passed: **17 tests, 40 assertions**.
- `bun run build`: **117 pages built successfully**.
- Repeated the production navigation checks after moving the CSS: **12 swaps,
  1,171 sampled frames**, no theme loss or incorrect background/color scheme.
- `git diff --check`: passed.

These checks cover the document after HTML arrives, including the period before
external CSS. Browser UI and the blank tab before receiving HTML are outside
the document's control. Firefox and Safari were not tested.
