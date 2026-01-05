// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import yaml from '@rollup/plugin-yaml'
import { DEFAULT_LOCALE_SETTING, LOCALES_SETTING } from './src/i18n/locales';
import { remarkTocTrigger } from './src/plugins/remark-toc-trigger.mjs';
import { remarkYoutube } from './src/plugins/remark-youtube.mjs';
import gemoji from 'remark-gemoji';
import { rehypeTwemoji } from 'rehype-twemoji';
import remarkGithubAlerts from 'remark-github-alerts';
import partytown from '@astrojs/partytown'

import expressiveCode from 'astro-expressive-code';
import remarkLinkCard from 'remark-link-card-plus';

// https://astro.build/config
export default defineConfig({

  // Sitemap
  site: 'https://aosankaku.net',

  prefetch: {
    prefetchAll: true,
  },

  redirects: {
    '/rss': '/rss.xml',
    '/sitemap.xml': '/sitemap-index.xml',
    '/links': '/',
    '/profile': '/',
    '/tags': '/blog/',
  },

  image: {
    domains: ["i.ytimg.com"]
  },

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
    themes: ['one-light', 'one-dark-pro'],
    useDarkModeMediaQuery: false,
    themeCssSelector: (theme, { styleVariants }) => {
      // If the theme is 'one-dark-pro', trigger it when .dark class is on <html>
      if (theme.name === 'one-dark-pro') return '.dark';
      // Otherwise, it's the default theme (one-light)
      return false;
    },
    shiki: {
      langAlias: {
        'cfg': 'ini',
        'zs': 'java',
      }
    }
  }),
  partytown({
    config: {
      forward: ['dataLayer.push', 'gtag'],
    }
  })
  ],

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
    remarkPlugins: [
      remarkTocTrigger,
      gemoji,
      remarkGithubAlerts,
      remarkYoutube,
      [remarkLinkCard, {
        cache: true,
        shortenUrl: true,
        thumbnailPosition: "right",
        noThumbnail: false,
        noFavicon: false,
        ignoreExtensions: ['.mp4', '.pdf'],
        ogTransformer: (/** @type {any} */og, /** @type {URL} */url) => {
          if (url.hostname === 'github.com') {
            return { ...og, title: `GitHub: ${og.title}` };
          }
          if (og.title === og.description) {
            return { ...og, description: 'custom description' };
          }
          return og;
        }
      }],
    ],
    rehypePlugins: [
      [rehypeTwemoji, {
        format: 'svg',
        // This ensures the images have a specific class for CSS styling
        className: 'twemoji'
      }]
    ],
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
    build: {
      assetsInlineLimit: 4096,
    }
  },
});