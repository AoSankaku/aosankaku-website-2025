// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { SITE_TITLE, SITE_DESCRIPTION } from '@/consts';
import { getCollection } from "astro:content";
import { DEFAULT_LOCALE_SETTING } from "@/i18n/locales";
import { getBlogRouteInfo } from "@/utils/blogRouting";
import {
  getLocalizedRssText,
  getRssLanguageCode,
  getRssPostsForLocale,
} from "@/utils/rssFeed";

export async function GET(context) {
  const sortedBlog = getRssPostsForLocale(
    await getCollection("blog"),
    DEFAULT_LOCALE_SETTING,
  );

  return rss({
    title: getLocalizedRssText(SITE_TITLE, DEFAULT_LOCALE_SETTING),
    description: getLocalizedRssText(SITE_DESCRIPTION, DEFAULT_LOCALE_SETTING),
    site: context.site,
    items: sortedBlog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.lastUpdate || post.data.date,
      description: post.data.desc,
      link: getBlogRouteInfo(post.id).href,
    })),
    customData: `<language>${getRssLanguageCode(DEFAULT_LOCALE_SETTING)}</language>`,
  });
}
