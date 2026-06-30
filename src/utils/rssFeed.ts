import { DEFAULT_LOCALE_SETTING, LOCALES_SETTING } from "../i18n/locales";
import { isBlogEntryLocale } from "./blogRouting";
import type { Multilingual } from "../types/i18n";

interface RssPostLike {
  id: string;
  data: {
    date: Date;
    lastUpdate?: Date;
  };
}

export function getRssFeedPath(locale: string): string {
  return locale === DEFAULT_LOCALE_SETTING ? "/rss.xml" : `/${locale}/rss.xml`;
}

export function getRssLanguageCode(locale: string): string {
  return (LOCALES_SETTING[locale]?.lang ?? locale).toLowerCase();
}

export function getLocalizedRssText(
  value: string | Multilingual,
  locale: string,
): string {
  if (typeof value === "string") return value;

  return value[locale] ?? value[DEFAULT_LOCALE_SETTING] ?? "";
}

export function getRssPostsForLocale<T extends RssPostLike>(
  posts: T[],
  locale: string,
): T[] {
  return posts
    .filter((post) => isBlogEntryLocale(post.id, locale))
    .sort((a, b) => {
      const dateA = new Date(a.data.lastUpdate || a.data.date).getTime();
      const dateB = new Date(b.data.lastUpdate || b.data.date).getTime();

      return dateB - dateA;
    });
}
