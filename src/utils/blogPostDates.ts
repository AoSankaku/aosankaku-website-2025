type BlogPostDateValue = Date | string | number | undefined | null;

interface BlogPostDateData {
  date: BlogPostDateValue;
  originalDate?: BlogPostDateValue;
  lastUpdate?: BlogPostDateValue;
  draft?: boolean;
}

interface BlogPostDateLike {
  data: BlogPostDateData;
}

const toTimestamp = (date: BlogPostDateValue) => {
  if (!date) return Number.NEGATIVE_INFINITY;

  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

export const getNewestBlogPostTimestamp = (data: BlogPostDateData) =>
  Math.max(
    toTimestamp(data.lastUpdate),
    toTimestamp(data.originalDate),
    toTimestamp(data.date),
  );

export const getVisibleBlogPosts = <T extends BlogPostDateLike>(
  posts: T[],
  isDev: boolean,
): T[] => (isDev ? posts : posts.filter((post) => post.data.draft !== true));

export const compareBlogPostsByNewestDate = (
  a: BlogPostDateLike,
  b: BlogPostDateLike,
) => {
  const draftPriority =
    Number(b.data.draft === true) - Number(a.data.draft === true);

  if (draftPriority !== 0) return draftPriority;

  return getNewestBlogPostTimestamp(b.data) - getNewestBlogPostTimestamp(a.data);
};
