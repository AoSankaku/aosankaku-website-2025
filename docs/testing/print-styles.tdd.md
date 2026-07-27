# Print styles TDD evidence

## Source

No implementation plan was provided. The journeys and guarantees below were
derived from the reported production printing bug.

## User journeys

- As a reader, I want a long article to flow across every printed page so that
  content outside the current viewport is not omitted.
- As a reader using dark mode, I want printed content to use an opaque white
  background and dark text so that the text remains legible.

## Task report

### Long-page pagination

- Added a source contract test for the shared print layout.
- RED: `bun test src/layouts/printStyles.test.ts` failed because the shared
  layout had no `@media print` rule resetting `height` and `overflow`.
- GREEN: the same command passed after adding `height: auto`,
  `max-width: none`, and `overflow: visible` for `html` and `body`.

### Print color scheme

- Added a source contract test for print-specific theme variables and explicit
  foreground/background colors.
- RED: `bun test src/layouts/printStyles.test.ts` failed because dark-mode
  colors were not overridden for printing.
- GREEN: the same command passed after forcing the light theme palette and
  explicit white background/dark text inside `@media print`.

## Test specification

| # | What is guaranteed | Test or command | Type | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Long content is not kept inside the viewport-height scroll container when printing | `src/layouts/printStyles.test.ts` | Integration/source contract | PASS | `bun test src/layouts/printStyles.test.ts`: 2 pass, 0 fail |
| 2 | Dark mode is replaced with print-safe light colors | `src/layouts/printStyles.test.ts` | Integration/source contract | PASS | `bun test src/layouts/printStyles.test.ts`: 2 pass, 0 fail |
| 3 | Existing project behavior remains green | `bun test --coverage` | Regression | PASS | 36 pass, 0 fail |
| 4 | The static site, including `/crafters/rules/`, builds successfully | `bun run build` | Build | PASS | 115 pages built |
| 5 | The built page contains the compiled print rule and loads without console errors | Local browser inspection of `/crafters/rules/` | Browser smoke test | PASS | 0 console errors |

## Coverage and known gaps

- `bun test --coverage`: 97.04% line coverage and 97.47% function coverage.
- `astro check` could not run because `@astrojs/check` is not installed; no
  dependency was added automatically.
- A fallback `tsc --noEmit` run reports pre-existing project/configuration
  errors, including missing Bun ambient types in existing test files. The
  production build and all Bun tests pass.

## Merge evidence

No checkpoint commits were created because repository instructions reserve
committing and GPG authentication for the user. RED and GREEN evidence is
preserved in this document.
