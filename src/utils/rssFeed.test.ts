import { describe, expect, test } from "bun:test";
import {
  getRssFeedPath,
  getRssLanguageCode,
  getRssPostsForLocale,
} from "./rssFeed";

describe("rssFeed", () => {
  test("uses the root RSS path for the default locale", () => {
    expect(getRssFeedPath("ja")).toBe("/rss.xml");
  });

  test("uses a localized RSS path for non-default locales", () => {
    expect(getRssFeedPath("en")).toBe("/en/rss.xml");
  });

  test("uses RSS language codes from locale settings", () => {
    expect(getRssLanguageCode("ja")).toBe("ja-jp");
    expect(getRssLanguageCode("en")).toBe("en-us");
  });

  test("filters posts by locale and sorts by last updated date", () => {
    const posts = [
      {
        id: "older_en/indexen",
        data: { date: new Date("2024-01-01T00:00:00+09:00") },
      },
      {
        id: "latest_en/index.en",
        data: {
          date: new Date("2024-01-01T00:00:00+09:00"),
          lastUpdate: new Date("2024-03-01T00:00:00+09:00"),
        },
      },
      {
        id: "ja_post/index",
        data: { date: new Date("2024-04-01T00:00:00+09:00") },
      },
    ];

    expect(getRssPostsForLocale(posts, "en").map((post) => post.id)).toEqual([
      "latest_en/index.en",
      "older_en/indexen",
    ]);
  });
});
