import { DEFAULT_LOCALE_SETTING, LOCALES_SETTING } from "../i18n/locales";

const localizedIndexPattern = /\/index\.([a-z][a-z0-9-]*)$/i;
const plainIndexPattern = /\/index$/;
const nonDefaultLocales = Object.keys(LOCALES_SETTING)
  .filter((locale) => locale !== DEFAULT_LOCALE_SETTING)
  .sort((a, b) => b.length - a.length);

export interface BlogRouteInfo {
  id: string;
  locale: string;
  slug: string;
  href: string;
}

interface BlogEntryLike {
  id: string;
}

interface LanguageSwitchHrefOptions<T extends BlogEntryLike> {
  pathname: string;
  search?: string;
  targetLocale: string;
  blogEntries: T[];
}

export function getBlogRouteInfo(id: string): BlogRouteInfo {
  const localizedIndexInfo = getLocalizedIndexInfo(id);
  const locale = localizedIndexInfo?.locale ?? DEFAULT_LOCALE_SETTING;
  const slug = localizedIndexInfo
    ? id.slice(0, localizedIndexInfo.index)
    : id.replace(plainIndexPattern, "");

  return {
    id,
    locale,
    slug,
    href: getBlogHref(slug, locale),
  };
}

export function getBlogHref(
  slug: string,
  locale: string = DEFAULT_LOCALE_SETTING,
): string {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  const localePrefix = locale === DEFAULT_LOCALE_SETTING ? "" : `/${locale}`;

  return `${localePrefix}/blog/${normalizedSlug}/`;
}

export function getBlogIndexHref(
  locale: string = DEFAULT_LOCALE_SETTING,
): string {
  return locale === DEFAULT_LOCALE_SETTING ? "/blog/" : `/${locale}/blog/`;
}

export function getLocaleHomeHref(
  locale: string = DEFAULT_LOCALE_SETTING,
): string {
  return locale === DEFAULT_LOCALE_SETTING ? "/" : `/${locale}/`;
}

export function getBlogIndexTagFilterHref(
  tag: string,
  locale: string = DEFAULT_LOCALE_SETTING,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("tag", tag);

  return `${getBlogIndexHref(locale)}?${searchParams.toString()}`;
}

export function isDefaultLocaleBlogEntry(id: string): boolean {
  return getBlogRouteInfo(id).locale === DEFAULT_LOCALE_SETTING;
}

export function isBlogEntryLocale(id: string, locale: string): boolean {
  return getBlogRouteInfo(id).locale === locale;
}

export function filterBlogEntriesByLocale<T extends { id: string }>(
  entries: T[],
  locale: string,
): T[] {
  return entries.filter((entry) => isBlogEntryLocale(entry.id, locale));
}

export function getLanguageSwitchHref<T extends BlogEntryLike>({
  pathname,
  search = "",
  targetLocale,
  blogEntries,
}: LanguageSwitchHrefOptions<T>): string {
  const fallbackHref = getLocaleHomeHref(targetLocale);
  const normalizedPathname = normalizePathname(pathname);

  if (isHomePath(normalizedPathname)) {
    return fallbackHref;
  }

  const blogPathInfo = getBlogPathInfo(normalizedPathname);

  if (!blogPathInfo) {
    return fallbackHref;
  }

  if (!blogPathInfo.slug) {
    return `${getBlogIndexHref(targetLocale)}${search}`;
  }

  const targetPost = blogEntries.find((entry) => {
    const routeInfo = getBlogRouteInfo(entry.id);

    return (
      routeInfo.locale === targetLocale && routeInfo.slug === blogPathInfo.slug
    );
  });

  return targetPost ? getBlogRouteInfo(targetPost.id).href : fallbackHref;
}

function normalizePathname(pathname: string): string {
  if (pathname === "/") return pathname;

  return pathname.replace(/\/+$/g, "");
}

function isHomePath(pathname: string): boolean {
  if (pathname === "/") return true;

  return Object.keys(LOCALES_SETTING).some(
    (locale) =>
      locale !== DEFAULT_LOCALE_SETTING && pathname === `/${locale}`,
  );
}

function getBlogPathInfo(
  pathname: string,
): { locale: string; slug: string | null } | null {
  for (const locale of nonDefaultLocales) {
    const localizedBlogPrefix = `/${locale}/blog`;

    if (pathname === localizedBlogPrefix) {
      return { locale, slug: null };
    }

    if (pathname.startsWith(`${localizedBlogPrefix}/`)) {
      return {
        locale,
        slug: pathname.slice(localizedBlogPrefix.length + 1),
      };
    }
  }

  if (pathname === "/blog") {
    return { locale: DEFAULT_LOCALE_SETTING, slug: null };
  }

  if (pathname.startsWith("/blog/")) {
    return {
      locale: DEFAULT_LOCALE_SETTING,
      slug: pathname.slice("/blog/".length),
    };
  }

  return null;
}

function getLocalizedIndexInfo(
  id: string,
): { locale: string; index: number } | null {
  const localizedIndexMatch = id.match(localizedIndexPattern);

  if (localizedIndexMatch?.index !== undefined) {
    return {
      locale: localizedIndexMatch[1].toLowerCase(),
      index: localizedIndexMatch.index,
    };
  }

  for (const locale of nonDefaultLocales) {
    const suffix = `/index${locale}`;

    if (id.endsWith(suffix)) {
      return {
        locale,
        index: id.length - suffix.length,
      };
    }
  }

  return null;
}
