import { describe, expect, test } from "bun:test";
import {
  compareBlogPostsByNewestDate,
  getVisibleBlogPosts,
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

  test("keeps draft posts at the top when sorting by newest date", () => {
    const posts = [
      {
        id: "newest-published",
        data: { date: new Date("2026-01-01T00:00:00+09:00") },
      },
      {
        id: "old-draft",
        data: {
          draft: true,
          date: new Date("2024-01-01T00:00:00+09:00"),
        },
      },
      {
        id: "older-published",
        data: { date: new Date("2025-01-01T00:00:00+09:00") },
      },
    ];

    expect(posts.toSorted(compareBlogPostsByNewestDate).map((post) => post.id))
      .toEqual(["old-draft", "newest-published", "older-published"]);
  });

  test("shows draft posts only in development", () => {
    const posts = [
      {
        id: "published",
        data: { date: new Date("2024-01-01T00:00:00+09:00") },
      },
      {
        id: "draft",
        data: {
          draft: true,
          date: new Date("2024-01-02T00:00:00+09:00"),
        },
      },
    ];

    expect(getVisibleBlogPosts(posts, true).map((post) => post.id)).toEqual([
      "published",
      "draft",
    ]);
    expect(getVisibleBlogPosts(posts, false).map((post) => post.id)).toEqual([
      "published",
    ]);
  });
});
