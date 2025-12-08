import { LOCALES_SETTING, DEFAULT_LOCALE_SETTING } from './locales';

// Dynamically import YAML files for each locale in LOCALES_SETTING
const translations: Record<string, any> = {};

for (const locale of Object.keys(LOCALES_SETTING)) {
  try {
    translations[locale] = (await import(`../locales/${locale}.yml`)).default;
  } catch (err) {
    console.warn(`[i18n] Missing translation file for locale "${locale}"`);
    translations[locale] = {};
  }
}

type Locale = keyof typeof translations;
type Replacements = Record<string, string | number>;

/**
 * Base translator: looks up a key in the given locale and optionally replaces placeholders.
 * Placeholders are in the form {name}, {count}, etc.
 */
export function t(locale: Locale, key: string, replacements?: Replacements): string {
  const parts = key.split('.');
  let value = parts.reduce<unknown>((obj, part) => {
    if (typeof obj === 'object' && obj !== null && part in obj) {
      return (obj as Record<string, unknown>)[part];
    }
    return undefined;
  }, translations[locale]) as string;

  if (typeof value !== 'string') {
    return '';
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
export function useTranslator(locale: Locale) {
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
