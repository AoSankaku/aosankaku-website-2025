---
title: "【Gatsby】remark系プラグインが効かないときの対処法"
category: "Tech"
date: "2024-03-23T15:30:00+09:00"
desc: "Gatsbyでremark系プラグインの順番を適当にしていたら、gatsby-remark-embed-youtubeが機能しなくなりました。解決方法を見つけるのは簡単だったので、以下で紹介します。"
tags:
  - Gatsby
  - フロントエンド
---


`gatsby-remark-table-of-contents`や`gatsby-remark-embed-youtube`が効かない人、いると思います。

この記事に、その原因の可能性があるものを書いてみます。

## gatsby-config.jsは適当に書いてはいけない

`gatsby-config.js`というファイルがあります。

これの順番は、プラグインの読み込み順に関わります。そのため、適当な順番で並べてはいけません。

私の場合、コードブロックを整形するプラグインを`gatsby-remark-embed-youtube`の前に配置してしまったことが原因で、youtubeのリンクがすべて無効になる事象が発生していました。

そのため、おすすめの順番は以下になります。

- 先に処理をしても、他の部分に干渉しないやつ
  - `gatsby-remark-table-of-contents`や`gatsby-remark-embed-youtube`のように、呼び出し方が独特で、他のコードブロックなどに影響を与えないもの
- 汎用的な処理で、他の部分に鑑賞する可能性があるやつ
  - `gatsby-remark-prismjs`など、コードブロック全体に影響を与えてしまうもの

### 例

ただ説明文だけ載せて終わるのもぷよぐらまーらしくないので、例も載せておこうと思います。

```js:title=gatsby-config.js
  const markdownPlugins = [
  {
    resolve: "gatsby-transformer-remark",
    options: {
      plugins: [
        "gatsby-remark-copy-linked-files",
        "gatsby-remark-autolink-headers",
        {
          resolve: `gatsby-remark-table-of-contents`,
          options: {
            exclude: "目次",
            tight: true,
            ordered: false,
            fromHeading: 2,
            toHeading: 6,
            className: "table-of-contents"
          },
        },
        {
          resolve: "gatsby-remark-embed-youtube",
          options: {
            width: 800,
            height: 400
          }
        },
        {
          resolve: 'gatsby-remark-prismjs-title',
          options: {
            className: 'code-title-prismjs',
          }
        },
        "gatsby-remark-prismjs-copy-button",
        {
          resolve: `gatsby-remark-prismjs`,
          options: {
            classPrefix: "language-",
            inlineCodeMarker: null,
            aliases: {},
            showLineNumbers: true,
            noInlineHighlight: false,
          },
        },
        {
          resolve: "gatsby-remark-images",
          options: {
            linkImagesToOriginal: false,
          },
        },
        "gatsby-remark-responsive-iframe",
      ],
    },
  },
]
```

このサイトのプラグインの一部です。

`gatsby-remark-responsive-iframe`が一番下にあるのは、iframeタグにしか影響を及ぼさないからです。これの設置場所は、他にiframeを適用したいものがなければ別にどこでもいいと思います。