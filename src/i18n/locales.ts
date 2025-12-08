export const DEFAULT_LOCALE_SETTING: string = "ja";

interface LocaleSetting {
  [key: Lowercase<string>]: {
    label: string;
    lang?: string;
    dir?: "rtl" | "ltr";
  };
}

export const LOCALES_SETTING: LocaleSetting = {
  ja: {
    label: "日本語",
    lang: "ja-JP",
  },
  en: {
    label: "English",
    lang: "en-US",
  },
};
