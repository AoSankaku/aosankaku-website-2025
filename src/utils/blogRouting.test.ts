import { describe, expect, test } from "bun:test";
import {
  filterBlogEntriesByLocale,
  getBlogIndexHref,
  getBlogIndexTagFilterHref,
  getLanguageSwitchHref,
  getBlogRouteInfo,
  getLocaleHomeHref,
  isDefaultLocaleBlogEntry,
} from "./blogRouting";

describe("blogRouting", () => {
  test("routes default index.md entries under /blog", () => {
    expect(getBlogRouteInfo("about_gatsby_image_sharp/index")).toEqual({
      id: "about_gatsby_image_sharp/index",
      locale: "ja",
      slug: "about_gatsby_image_sharp",
      href: "/blog/about_gatsby_image_sharp/",
    });
  });

  test("routes index.en.md entries under /en/blog without index.en", () => {
    expect(getBlogRouteInfo("about_gatsby_image_sharp/index.en")).toEqual({
      id: "about_gatsby_image_sharp/index.en",
      locale: "en",
      slug: "about_gatsby_image_sharp",
      href: "/en/blog/about_gatsby_image_sharp/",
    });
  });

  test("routes Astro-normalized index.en.md ids under /en/blog", () => {
    expect(getBlogRouteInfo("about_gatsby_image_sharp/indexen")).toEqual({
      id: "about_gatsby_image_sharp/indexen",
      locale: "en",
      slug: "about_gatsby_image_sharp",
      href: "/en/blog/about_gatsby_image_sharp/",
    });
  });

  test("keeps nested non-index entries on the default blog route", () => {
    expect(getBlogRouteInfo("civ6_newbie/0-concepts")).toEqual({
      id: "civ6_newbie/0-concepts",
      locale: "ja",
      slug: "civ6_newbie/0-concepts",
      href: "/blog/civ6_newbie/0-concepts/",
    });
  });

  test("detects localized entries as non-default", () => {
    expect(isDefaultLocaleBlogEntry("about_gatsby_image_sharp/index")).toBe(
      true,
    );
    expect(isDefaultLocaleBlogEntry("about_gatsby_image_sharp/index.en")).toBe(
      false,
    );
    expect(isDefaultLocaleBlogEntry("about_gatsby_image_sharp/indexen")).toBe(
      false,
    );
  });

  test("filters entries by locale", () => {
    const posts = [
      { id: "about_gatsby_image_sharp/index" },
      { id: "about_gatsby_image_sharp/indexen" },
      { id: "civ6_newbie/0-concepts" },
    ];

    expect(filterBlogEntriesByLocale(posts, "ja").map((post) => post.id)).toEqual(
      ["about_gatsby_image_sharp/index", "civ6_newbie/0-concepts"],
    );
    expect(filterBlogEntriesByLocale(posts, "en").map((post) => post.id)).toEqual(
      ["about_gatsby_image_sharp/indexen"],
    );
  });

  test("gets the blog index href for a locale", () => {
    expect(getBlogIndexHref("ja")).toBe("/blog/");
    expect(getBlogIndexHref("en")).toBe("/en/blog/");
  });

  test("gets the home href for a locale", () => {
    expect(getLocaleHomeHref("ja")).toBe("/");
    expect(getLocaleHomeHref("en")).toBe("/en/");
  });

  test("gets a blog index href with a tag filter query", () => {
    expect(getBlogIndexTagFilterHref("Astro", "ja")).toBe("/blog/?tag=Astro");
    expect(getBlogIndexTagFilterHref("Cloudflare Pages", "en")).toBe(
      "/en/blog/?tag=Cloudflare+Pages",
    );
  });

  test("switches home paths to the target locale home", () => {
    expect(
      getLanguageSwitchHref({
        pathname: "/",
        targetLocale: "en",
        blogEntries: [],
      }),
    ).toBe("/en/");
    expect(
      getLanguageSwitchHref({
        pathname: "/en/",
        targetLocale: "ja",
        blogEntries: [],
      }),
    ).toBe("/");
  });

  test("switches blog index paths and preserves search params", () => {
    expect(
      getLanguageSwitchHref({
        pathname: "/blog/",
        search: "?tag=Astro",
        targetLocale: "en",
        blogEntries: [],
      }),
    ).toBe("/en/blog/?tag=Astro");
    expect(
      getLanguageSwitchHref({
        pathname: "/en/blog/",
        targetLocale: "ja",
        blogEntries: [],
      }),
    ).toBe("/blog/");
  });

  test("switches blog article paths when the target locale article exists", () => {
    const blogEntries = [
      { id: "about_gatsby_image_sharp/index" },
      { id: "about_gatsby_image_sharp/indexen" },
      { id: "civ6_newbie/0-concepts" },
    ];

    expect(
      getLanguageSwitchHref({
        pathname: "/blog/about_gatsby_image_sharp/",
        targetLocale: "en",
        blogEntries,
      }),
    ).toBe("/en/blog/about_gatsby_image_sharp/");
    expect(
      getLanguageSwitchHref({
        pathname: "/en/blog/about_gatsby_image_sharp/",
        targetLocale: "ja",
        blogEntries,
      }),
    ).toBe("/blog/about_gatsby_image_sharp/");
  });

  test("falls back to the target locale home when a translated article is missing", () => {
    expect(
      getLanguageSwitchHref({
        pathname: "/blog/civ6_newbie/0-concepts/",
        targetLocale: "en",
        blogEntries: [{ id: "civ6_newbie/0-concepts" }],
      }),
    ).toBe("/en/");
  });
});
