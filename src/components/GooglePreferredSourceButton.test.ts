import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "../..");

const readProjectFile = (path: string) =>
  Bun.file(resolve(projectRoot, path)).text();

describe("Google preferred source button", () => {
  test("links to the preferred-source settings for aosankaku.net", async () => {
    const component = await readProjectFile(
      "src/components/GooglePreferredSourceButton.astro",
    );

    expect(component).toContain(
      "https://google.com/preferences/source?q=aosankaku.net",
    );
    expect(component).toContain('target="_blank"');
    expect(component).toContain('rel="noopener noreferrer"');
  });

  test("offers localized, accessible button copy", async () => {
    const component = await readProjectFile(
      "src/components/GooglePreferredSourceButton.astro",
    );

    expect(component).toContain("Google検索でこのブログを優先する");
    expect(component).toContain("Prioritize this blog on Google Search");
    expect(component).toContain("aria-label={label}");
  });

  test("matches the blog's simple bordered-button design", async () => {
    const component = await readProjectFile(
      "src/components/GooglePreferredSourceButton.astro",
    );

    expect(component).toContain("border: 1px solid var(--color-text-sub)");
    expect(component).toContain("background: var(--color-background)");
    expect(component).not.toContain("box-shadow");
    expect(component).toContain("preferred-source__button::before");
    expect(component).toContain("#4285f4 0 25%");
    expect(component).toContain("#34a853 75%");
  });

  test("adds breathing room below the share buttons on mobile", async () => {
    const component = await readProjectFile(
      "src/components/GooglePreferredSourceButton.astro",
    );

    expect(component).toMatch(
      /@media \(max-width: 420px\)[\s\S]*?\.preferred-source\s*\{[\s\S]*?padding: 12px 16px 0;/,
    );
  });

  test("appears immediately below the article-end share buttons", async () => {
    const layout = await readProjectFile(
      "src/layouts/BlogArticleLayout.astro",
    );
    const articleEnd = layout.slice(layout.lastIndexOf("<ShareButtons"));

    expect(articleEnd).toMatch(
      /<ShareButtons[^>]*\/>\s*<GooglePreferredSourceButton[^>]*\/>/,
    );
  });
});
