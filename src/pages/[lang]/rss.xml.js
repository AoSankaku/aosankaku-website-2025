import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/consts";
import { DEFAULT_LOCALE_SETTING, LOCALES_SETTING } from "@/i18n/locales";
import { getBlogRouteInfo } from "@/utils/blogRouting";
import {
  getLocalizedRssText,
  getRssLanguageCode,
  getRssPostsForLocale,
} from "@/utils/rssFeed";

export function getStaticPaths() {
  return Object.keys(LOCALES_SETTING)
    .filter((locale) => locale !== DEFAULT_LOCALE_SETTING)
    .map((locale) => ({ params: { lang: locale } }));
}

export async function GET(context) {
  const locale = context.params.lang;
  const sortedBlog = getRssPostsForLocale(
    await getCollection("blog"),
    locale,
    import.meta.env.DEV,
  );

  return rss({
    title: getLocalizedRssText(SITE_TITLE, locale),
    description: getLocalizedRssText(SITE_DESCRIPTION, locale),
    site: context.site,
    items: sortedBlog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.lastUpdate || post.data.date,
      description: post.data.desc,
      link: getBlogRouteInfo(post.id).href,
    })),
    customData: `<language>${getRssLanguageCode(locale)}</language>`,
  });
}
