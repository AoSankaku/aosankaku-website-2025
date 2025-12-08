// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import icon from 'astro-icon';
import yaml from '@rollup/plugin-yaml'
import { DEFAULT_LOCALE_SETTING, LOCALES_SETTING } from './src/i18n/locales';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), icon()],
  i18n: {
    defaultLocale: DEFAULT_LOCALE_SETTING,
    locales: Object.keys(LOCALES_SETTING),
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
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
  }
});