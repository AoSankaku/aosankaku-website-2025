import { LOCALES_SETTING, DEFAULT_LOCALE_SETTING } from './locales';

const translations: Record<string, any> = {};

for (const locale of Object.keys(LOCALES_SETTING)) {
  try {
    translations[locale] = (await import(`../i18n/${locale}.yml`)).default;
  } catch (err) {
    console.warn(`[i18n] Missing translation file for locale "${locale}"`);
    translations[locale] = {};
  }
}

type Locale = keyof typeof translations;
type Replacements = Record<string, string | number>;

function normalizeLocale(locale?: string): Locale {
  return (locale && locale in translations
    ? locale
    : DEFAULT_LOCALE_SETTING) as Locale;
}

/**
 * Base translator: looks up a key in the given locale and optionally replaces placeholders.
 * Placeholders are in the form {name}, {count}, etc.
 */
export function t(locale: string | undefined, key: string, replacements?: Replacements): string {
  const parts = key.split('.');
  const normalizedLocale = normalizeLocale(locale);
  let value = parts.reduce<unknown>((obj, part) => {
    if (typeof obj === 'object' && obj !== null && part in obj) {
      return (obj as Record<string, unknown>)[part];
    }
    return undefined;
  }, translations[normalizedLocale]) as string;

  if (typeof value !== 'string') {
    if (normalizedLocale !== DEFAULT_LOCALE_SETTING) {
      return t(DEFAULT_LOCALE_SETTING, key, replacements);
    }
    return key;
  }

  if (replacements) {
    for (const [placeholder, replacementValue] of Object.entries(replacements)) {
      value = value.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(replacementValue));
    }
  }

  return value;
}

/**
 * Creates a translator bound to a specific locale.
 */
export function useTranslator(locale?: string) {
  return (key: string, replacements?: Replacements) => t(locale, key, replacements);
}

/**
 * Get the default translator based on DEFAULT_LOCALE_SETTING
 */
export const tDefault = useTranslator(DEFAULT_LOCALE_SETTING as Locale);

/**
 * Returns an object with all locales for a given key.
 * Example:
 *   tAll("greeting") =>
 *     { en: "Hello", ja: "こんにちは", ... }
 */
export function tAll(key: string, replacements?: Replacements): Record<Locale, string> {
  const result = {} as Record<Locale, string>;
  for (const locale of Object.keys(translations) as Locale[]) {
    result[locale] = t(locale, key, replacements);
  }
  return result;
}
