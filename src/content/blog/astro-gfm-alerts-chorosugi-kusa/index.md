---
title: 【Astro】記事にGitHubみたいなアラートブロックつけるのちょろすぎて草
category: Tech
date: "2025-12-23 01:00"
desc: GFM（GitHub Flavored Markdown）みたいなヒントとか警告とかだすブロック、読みやすさを考えるならほしいですよね。Astroでこれを実装するのはあまりにチョロいです。
tags:
  - Astro
  - フロントエンド
---

Astroで、こんなの↓を実装したいとします。

> [!NOTE] 情報
> じょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほうじょうほう

> [!TIP] ヒント
> ちなみにこの↑の「ヒント」は書き換えられるわよ

> [!IMPORTANT] なんでも指定できる
> なんでも指定できてしまいます。

> [!WARNING] あまりに簡単
> あまりに簡単すぎて、この記事を読み進めるときっと腰を抜かします。

> [!CAUTION] 共通文法
> 独自文法ではなくGitHubのやつと全く同じ書き方で通用します。

かつてGatsbyでも頑張って実装しようとしたものの、ろくなものがなく挫折しました。Gatsbyは`gatsby-`がついてるremarkプラグインじゃないとまともに動かないのでヤンスね。Astroだとあっさり実装できて笑いが止まりません。

## やり方

まず、`remark-github-alerts`を入れます。

```sh
bun i remark-github-alerts
```

別にnpmやyarnでもできますが、未だにBunを使ったことがないという人は、今すぐ改宗してください。世界が変わります。

https://bun.com

その後、`astro.config.mjs`にプラグインをインポートしてぶち込み（追記し）ます。

```mjs title="astro.config.mjs"
import remarkGithubAlerts from 'remark-github-alerts';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkGithubAlerts]
  }
});
```

なお、Geminiに聞いたところ「`remarkAlert`を入れるのじゃ」と言われましたが、罠です。従わないように。ℹ️とかのアイコンが欲しくない場合はそれでいいかもしれません。

最後に（もう最後のステップです）、CSSをいじいじします。FrontmatterでCSSをインポートしちゃいます。間違って`<style>`内でインポートしないように。

```astro title="NankaSukinaLayout.astro"
---
import remarkGithubAlerts from 'remark-github-alerts';
---
```

その後、色変数を指定します。`:root`に指定するので、できるだけ根元のLayoutに指定するほうがいいかもしれません。お好きな色をどうぞ。

```css
  /* Light theme */
  :root {
    --color-note: #0969da;
    --color-tip: #1a7f37;
    --color-important: #8250df;
    --color-warning: #9a6700;
    --color-caution: #d1242f;
  }
```

私はダークテーマと背景を設定したかったので、こうなりました。ダークテーマ自体の実装方法は、流石に他の記事で学んでください。

```css title="Layout.astro"
  /* Light theme */
  :root {
    /* ... */

    --color-note: #0969da;
    --color-note-bg: rgba(9, 105, 218, 0.1);
    --color-tip: #1a7f37;
    --color-tip-bg: rgba(26, 127, 55, 0.1);
    --color-important: #8250df;
    --color-important-bg: rgba(130, 80, 223, 0.1);
    --color-warning: #9a6700;
    --color-warning-bg: rgba(154, 103, 0, 0.1);
    --color-caution: #d1242f;
    --color-caution-bg: rgba(209, 36, 47, 0.1);
  }

  /* Dark theme */
  .dark {
    /* ... */

    --color-note: #4493f8;
    --color-tip: #3fb950;
    --color-important: #a371f7;
    --color-warning: #d29922;
    --color-caution: #f85149;
  }
```

やることは以上です。これだけで、このレイアウトを適用できるようにしたMarkdownファイルに

```md
> [!NOTE] タイトルはここに書く
> 情報だよん
```

と書くだけで、ブロックを召喚できるはずです。

### 背景を付ける場合

このブログは、独自レイアウトとしてヒントに背景を付けています。

```css title="NankaSukinaLayout.astro"
    /* Note */
    .markdown-alert-note {
      background-color: var(--color-note-bg);
    }

    /* Tip */
    .markdown-alert-tip {
      background-color: var(--color-tip-bg);
    }

    /* Important */
    .markdown-alert-important {
      background-color: var(--color-important-bg);
    }
    /* Warning */
    .markdown-alert-warning {
      background-color: var(--color-warning-bg);
    }

    /* Caution */
    .markdown-alert-caution {
      background-color: var(--color-caution-bg);
    }
```

こうするだけです。うっすら背景色がつくと思います。

## Astro簡単すぎ

Astro、ありとあらゆる改造がスムーズに終わるので感動しています😭

> [!TIP] 
> 😭←この絵文字をTwemojiにするのも超簡単だった😭調べると出てくるよ😭

あらゆるRemarkプラグインがつけると噂なので、ぜひ活用してみてください。

## 参考文献

https://vojtechstruhar.com/blog/028-gfm-callouts-in-astro/

https://github.com/hyoban/remark-github-alerts