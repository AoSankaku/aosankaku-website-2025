// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '@/consts';
import { getCollection } from "astro:content";

export async function GET(context) {
  const blog = await getCollection("blog");

  // Sort items by date so the feed is chronological
  const sortedBlog = blog.sort((a, b) => {
    const dateA = new Date(a.data.lastUpdate || a.data.date).getTime();
    const dateB = new Date(b.data.lastUpdate || b.data.date).getTime();
    return dateB - dateA;
  });

  return rss({
    title: SITE_TITLE.ja,
    description: SITE_DESCRIPTION.ja,
    site: context.site,
    items: sortedBlog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.lastUpdate || post.data.date,
      description: post.data.desc,
      link: `/blog/${post.id.replace(/\/index$/, "")}/`,
    })),
    // REMOVED SPACES: Changed < language > to <language>
    customData: `<language>ja-jp</language>`,
  });
}