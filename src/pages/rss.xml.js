import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '@/consts';
import { getCollection } from "astro:content";

export async function GET(context) {

  const blog = await getCollection("blog");
  return rss({
    // `<title>` field in output xml
    title: SITE_TITLE.ja,
    // `<description>` field in output xml
    description: SITE_DESCRIPTION.ja,
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#site
    site: context.site,
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.lastUpdate || post.data.date,
      description: post.data.desc,
      link: `/blog/${post.id.replace(/\/index$/, "")}/`,
    })),
    // (optional) inject custom xml
    customData: `< language > ja - jp</language> `,
  });
}