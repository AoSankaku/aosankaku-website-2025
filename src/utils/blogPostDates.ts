type BlogPostDateValue = Date | string | number | undefined | null;

interface BlogPostDateData {
  date: BlogPostDateValue;
  originalDate?: BlogPostDateValue;
  lastUpdate?: BlogPostDateValue;
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

export const compareBlogPostsByNewestDate = (
  a: BlogPostDateLike,
  b: BlogPostDateLike,
) => getNewestBlogPostTimestamp(b.data) - getNewestBlogPostTimestamp(a.data);
