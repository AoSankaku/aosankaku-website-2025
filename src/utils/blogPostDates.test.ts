import { describe, expect, test } from "bun:test";
import {
  compareBlogPostsByNewestDate,
  getNewestBlogPostTimestamp,
} from "./blogPostDates";

describe("blogPostDates", () => {
  test("uses the newest date from lastUpdate, originalDate, and date", () => {
    expect(
      getNewestBlogPostTimestamp({
        date: new Date("2024-01-01T00:00:00+09:00"),
        originalDate: new Date("2024-04-01T00:00:00+09:00"),
        lastUpdate: new Date("2024-03-01T00:00:00+09:00"),
      }),
    ).toBe(new Date("2024-04-01T00:00:00+09:00").getTime());
  });

  test("sorts posts by the newest relevant date descending", () => {
    const posts = [
      {
        id: "newer-by-date",
        data: { date: new Date("2024-03-01T00:00:00+09:00") },
      },
      {
        id: "newer-by-original-date",
        data: {
          date: new Date("2024-01-01T00:00:00+09:00"),
          originalDate: new Date("2024-04-01T00:00:00+09:00"),
        },
      },
      {
        id: "newer-by-last-update",
        data: {
          date: new Date("2024-01-01T00:00:00+09:00"),
          originalDate: new Date("2024-02-01T00:00:00+09:00"),
          lastUpdate: new Date("2024-05-01T00:00:00+09:00"),
        },
      },
    ];

    expect(posts.toSorted(compareBlogPostsByNewestDate).map((post) => post.id))
      .toEqual([
        "newer-by-last-update",
        "newer-by-original-date",
        "newer-by-date",
      ]);
  });
});
