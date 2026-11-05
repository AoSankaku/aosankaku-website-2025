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
