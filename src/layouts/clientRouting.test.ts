import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "../..");

const readProjectFile = (path: string) =>
  Bun.file(resolve(projectRoot, path)).text();

describe("Astro client-side routing", () => {
  test("the shared layout enables the Astro client router", async () => {
    const layout = await readProjectFile("src/layouts/Layout.astro");

    expect(layout).toContain(
      'import { ClientRouter } from "astro:transitions";',
    );
    expect(layout).toContain("<ClientRouter />");
  });

  test("the shared layout disables the root crossfade that causes page flashes", async () => {
    const layout = await readProjectFile("src/layouts/Layout.astro");

    expect(layout).toContain(
      '<html lang={langFull} transition:name="root" transition:animate="none">',
    );
  });

  test("blog filter URL updates preserve Astro router history state", async () => {
    const blogIndex = await readProjectFile("src/pages/blog/index.astro");

    expect(blogIndex).toContain(
      'window.history.replaceState(window.history.state, "", nextUrl);',
    );
    expect(blogIndex).not.toContain(
      'window.history.replaceState(null, "", nextUrl);',
    );
  });

  test("interactive bundled scripts initialize after every page navigation", async () => {
    const interactiveFiles = [
      "src/components/Footer.astro",
      "src/components/Header.astro",
      "src/components/SocialIcons.astro",
      "src/components/SpinningTetrahedron.astro",
      "src/components/Works.astro",
      "src/components/atoms/ShareIconButton.astro",
      "src/layouts/BlogArticleLayout.astro",
      "src/pages/blog/index.astro",
    ];

    const sources = await Promise.all(interactiveFiles.map(readProjectFile));

    for (const source of sources) {
      expect(source).toMatch(
        /document\.addEventListener\([\s\S]*?["']astro:page-load["']/,
      );
    }
  });

  test("article TOC setup reads the current page data on every navigation", async () => {
    const articleLayout = await readProjectFile(
      "src/layouts/BlogArticleLayout.astro",
    );

    expect(articleLayout).toContain("data-toc={JSON.stringify(toc)}");
    expect(articleLayout).toContain('container.dataset.toc');
    expect(articleLayout).toMatch(
      /document\.addEventListener\([\s\S]*?["']astro:page-load["'][\s\S]*?setupTableOfContents/,
    );
  });

  test("analytics records client-routed page views without duplicating the initial view", async () => {
    const analytics = await readProjectFile(
      "src/components/GoogleAnalytics.astro",
    );

    expect(analytics).toContain("send_page_view: false");
    expect(analytics).toContain('document.addEventListener("astro:page-load"');
    expect(analytics).toContain("gtag(\"event\", \"page_view\"");
  });
});
