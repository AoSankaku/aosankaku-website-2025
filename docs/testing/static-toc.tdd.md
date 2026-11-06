# Static table of contents verification

The Markdown `toc` fence previously produced an empty div. The article layout
filled it in on `astro:page-load`, changing the article's height after display.
The Markdown pipeline now generates the full TOC during SSG; the layout no longer
serializes headings or creates TOC elements in the browser.

Heading IDs are resolved after Twemoji as before, followed by raw HTML parsing
and TOC generation. This preserves existing URLs and formatted labels while
avoiding nested anchors and duplicate IDs in copied heading content. The TOC title
is added after heading collection so it does not include itself.

Reference: [Astro's heading IDs and plugin ordering](https://docs.astro.build/en/guides/markdown-content/#heading-ids-and-plugins).

## Automated checks

- RED: `bun test src/plugins/table-of-contents.test.ts`: 1 pass, 4 failures;
  rendered Markdown contained only an empty placeholder.
- GREEN: `bun test src/plugins/table-of-contents.test.ts src/layouts/clientRouting.test.ts`:
  11 pass, 0 failures, 52 assertions. Covers h2/h3 selection, duplicate/Japanese
  anchors, marker placement, formatting/emoji/linked labels, copied IDs, absent
  markers, empty TOCs and independent page rendering.
- `bun run build`: 117 pages built successfully. External link-card metadata
  fetches reported network errors, but did not prevent the build.
- Inspected all generated TOC pages: 9 pages, 186 links, no missing targets.
- Independent review found no actionable issues.

## Headless Chrome checks

Used the production preview and blocked external requests.

- With JavaScript disabled, `/about/` displayed 24 TOC links and 7 emoji images;
  every link targeted an existing heading.
- Held 8 script requests on initial load. All 24 links were already present;
  releasing scripts left TOC HTML and height unchanged, with zero content mutations.
- Navigated `/about/` → `/blog/moved_to_astro/` → `/` → `/about/` using Astro's
  client router. Before and immediately after each swap, the incoming TOC was
  complete (15/0/24 links), with no duplicate or stale TOC.
- A TOC anchor click updated the fragment successfully. No page JavaScript errors.

These checks establish that TOC insertion no longer causes a delayed layout
change. They do not measure unrelated causes of flashing or layout shifts.
