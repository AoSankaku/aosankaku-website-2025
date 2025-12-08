// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import type { Multilingual } from "@/types/i18n";
import { tAll } from "@/lib/i18n";

export const SITE_TITLE: string | Multilingual = tAll("site-name");

export const SITE_DESCRIPTION: string | Multilingual = tAll("site-description");

export const NOT_TRANSLATED_CAUTION: string | Multilingual = tAll("error.untranslated");
