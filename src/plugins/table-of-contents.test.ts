import { beforeAll, describe, expect, test } from "bun:test";
import { createMarkdownProcessor, isUnifiedProcessor } from "@astrojs/markdown-remark";
import config from "../../astro.config.mjs";

let render: Awaited<ReturnType<typeof createMarkdownProcessor>>["render"];

beforeAll(async () => {
  const markdown = config.markdown?.processor;
  if (!markdown || !isUnifiedProcessor(markdown)) {
    throw new Error("Expected the configured unified Markdown processor");
  }
  const processor = await createMarkdownProcessor({
    ...markdown.options,
    syntaxHighlight: false,
  });
  render = processor.render;
});

const marker = "```toc\n```";
const getToc = (html: string) =>
  html.match(/<div id="article-toc-trigger">([\s\S]*?)<\/div>/)?.[1] ?? "";

describe("static table of contents", () => {
  test("renders h2/h3 links at the marker before any browser JavaScript runs", async () => {
    const { code, metadata } = await render([
      "# Article",
      "## Before the marker",
      marker,
      "## 日本語の見出し",
      "### Subsection",
      "#### Excluded detail",
      "## 日本語の見出し",
    ].join("\n\n"));
    const toc = getToc(code);

    expect(toc).toContain("<h2>Table of Contents</h2>");
    expect(toc).toContain('<a href="#before-the-marker">Before the marker</a>');
    expect(toc).toContain('<a href="#日本語の見出し">日本語の見出し</a>');
    expect(toc).toContain('<a href="#日本語の見出し-1">日本語の見出し</a>');
    expect(toc).toContain('<li style="margin-left:20px"><a href="#subsection">');
    expect(toc.match(/<li\b/g)).toHaveLength(4);
    expect(toc).not.toContain("Excluded detail");
    expect(toc).not.toContain('href="#article"');
    expect(code.indexOf(toc)).toBeLessThan(code.indexOf('<h2 id="日本語の見出し">'));
    expect(metadata.headings.map(({ text }) => text)).not.toContain("Table of Contents");
  });

  test("preserves emoji, inline formatting and linked text without copying anchors or IDs", async () => {
    const { code, metadata } = await render([
      marker,
      '## ❓ **Bold** *emphasis* `code` [link](https://example.com) & <span id="inline-id">HTML</span> <a href="https://example.org">raw link</a>',
    ].join("\n\n"));
    const toc = getToc(code);

    expect(toc).toContain(`href="#${metadata.headings[0].slug}"`);
    expect(toc).toContain("data-twemoji");
    expect(toc).toContain('alt="❓"');
    expect(toc).toContain("<strong>Bold</strong>");
    expect(toc).toContain("<em>emphasis</em>");
    expect(toc).toContain("<code>code</code>");
    expect(toc).toMatch(/link &(?:amp|#x26);/);
    expect(toc).toContain("<span>HTML</span> raw link");
    expect(toc.match(/<a\b/g)).toHaveLength(1);
    expect(toc).not.toContain('id="inline-id"');
    expect(code.match(/id="inline-id"/g)).toHaveLength(1);
  });

  test("keeps existing heading anchors unchanged", async () => {
    const markdown = "## ❓ Heading\n\n### Duplicate\n\n### Duplicate";
    const withoutToc = await render(markdown);
    const withToc = await render(`${marker}\n\n${markdown}`);

    expect(withoutToc.metadata.headings.map(({ slug }) => slug)).toEqual([
      "-heading", "duplicate", "duplicate-1",
    ]);
    expect(withToc.metadata.headings).toEqual(withoutToc.metadata.headings);
    for (const { slug } of withoutToc.metadata.headings) {
      expect(getToc(withToc.code)).toContain(`href="#${slug}"`);
    }
  });

  test("does not add a TOC without a marker or with no eligible headings", async () => {
    expect((await render("## Heading")).code).not.toContain("article-toc-trigger");
    const { code } = await render(`${marker}\n\n# Title\n\n#### Detail`);
    expect(getToc(code)).toBe("");
    expect(code).not.toContain("Table of Contents");
  });

  test("builds each page from its own headings", async () => {
    await render(`${marker}\n\n## First page`);
    const { code } = await render(`${marker}\n\n## Second page`);

    expect(getToc(code)).toContain('href="#second-page"');
    expect(getToc(code)).not.toContain("First page");
  });
});
