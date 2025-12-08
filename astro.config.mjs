// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import icon from 'astro-icon';
import yaml from '@rollup/plugin-yaml'

// https://astro.build/config
export default defineConfig({
  integrations: [react(), icon()],
  i18n: {
    locales: ["ja", "en"],
    defaultLocale: "ja",
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