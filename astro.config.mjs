// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import yaml from '@rollup/plugin-yaml'
import { DEFAULT_LOCALE_SETTING, LOCALES_SETTING } from './src/i18n/locales';
import { remarkTocTrigger } from './src/plugins/remark-toc-trigger.mjs';

import expressiveCode from 'astro-expressive-code';

// https://astro.build/config
export default defineConfig({

  // Sitemap
  site: 'https://aosankaku.net',

  // Integrations
  integrations: [react(), icon(), sitemap({
    /*
    i18n: {
      defaultLocale: 'ja',
      locales: {
        ja: 'ja-JP',
        en: 'en-US',
      }
    }
    */
  }), expressiveCode({
    themes: ['one-dark-pro', 'one-light'],
  })],

  // i18n
  i18n: {
    defaultLocale: DEFAULT_LOCALE_SETTING,
    locales: Object.keys(LOCALES_SETTING),
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },

  // Path
  trailingSlash: 'always',

  markdown: {
    remarkPlugins: [remarkTocTrigger],
    gfm: true,
  },

  // Vite
  vite: {
    plugins: [yaml()],
    ssr: {
      noExternal: ['styled-components']
    },
    server: {
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**'],
      }
    },
  },
});