---
title: "【Vite+Vike】i18nで多言語対応したサイトのSSGが無理だった話"
category: "Tech"
date: "2025-05-04T18:30:00+09:00"
desc: "駅名標ジェネレーターを作っているのですが、言語別SSGをしようとしたら詰んでしまい、大人しくNext.jsで実装する方向に切り替えることにしたのでその顛末を振り返ります。"
tags:
  - Next.js
  - Vite
  - Vike
---

react-i18nnextを使用したViteプロジェクトで、パスを分けてSSGをすることでheadを事前に生成（SSG）しよう…と思っていたのですが、全然できませんでした。以下は失敗の記録です。

## 重要

この記事は失敗記録です。成功法は何も書いていません。なお、公式によれば「できる」らしいですが、その具体的な方法も、それに成功している公開リポジトリも何一つ見つかりませんでした。

## やりたかったこと

- サイト（Webアプリ）のHeadの生成を言語別に行う

簡単に言えば、サイト共有時のリンクカードの画像、タイトルの言語を変更しようとしたのが発端です。ただそれだけだったのですが、時間を食われた割に成功しませんでした。

## 失敗の内容

### リポジトリ

コードが読める人はこれを読んだほうが早いかもしれません。

https://github.com/AoSankaku/station_sign_generator

### 実装要件

- SSGをするため、URLパラメーターやサブドメインよりはパス（例：`https://ekimeihyogenerator.net/en`）のほうが好ましい
- HEAD（リンクカードに載る内容）と現在の言語の状態は一致させる必要がある（英語のタイトルのリンクを踏んだのに日本語のサイトに飛んだら面倒でしょ）
- 多言語対応には`react-i18next`を使用する

Viteでこれを満たせるのはVikeだけでした。

https://vike.dev/

かつては違う名前で存在していたらしく、色々その時の記事も残っています。

単にSSGするだけならおそらく簡単です。しかし、**Vike+i18n**の情報が絶望的に不足しており、かなりしんどい状況に陥りました。

### pathを正常に認識しない？

`/en`の内容を取得することで現在の言語を取得するため、これができるようになるのは絶対条件でした。しかし、できませんでした。

```tsx
const { locale } = data
console.dir(data)
useEffect(() => {
  const urlLocale = location.pathname.split("/");
  console.info("Current passed locale:")
  console.dir(urlLocale)
  // Force apply language and head.title by path on direct access by URL
  // Vike destroys head elements on locale change, and won't pass me locale from useData ...for some reason... nobody but he knows why
  // Furthermore these bugs won't happen neither on development environment nor production build local serve(vite preview)... this sxxxs
  if (locale === "") {
    // When passed locale is blank, there are two scenarios:
    // 1. The locale is Japanese, so the locale is intentionally ""
    // 2. The locale is not passed by useData(Vike's fault)
    location.pathname[2] ? changeLanguage(location.pathname[2]) : changeLanguage("ja");
  } else {
    // When passed locale is not blank, it is ok to set locale as the data says because the locale has already been filtered
    changeLanguage(locale)
  }
  // The code below was used when language is changed manually
  // locale === "" ? changeLanguage("ja") : changeLanguage(locale)
}, [data])
```

なんとなく英語でコメントしているのですが、VikeはHEAD要素を言語変更時に**破壊**してしまいます。これで何が困るかというと、

- タブのタイトル名が破損する
- 共有時に「headから情報を取ってくる」ができない

という大問題が発生します。

しかも、`useData`を使用して取得できるようにしたはずのlocaleが取得できません。**常に空白になります**。そのため、`App.tsx`にこのコードを埋め込む必要が生じます。

### +data.tsx の中身

それでは、その言語を渡すための`+data.tsx`とやらがどうなっているかをお見せします。

```tsx title=+data.tsx
import { useConfig } from "vike-react/useConfig";
import i18n from "../../i18n/configs";
import ogp from "../../assets/images/ogp.png"
import favicon from "/favicon.ico"
import base from "../../../vite.config"

export interface Data {
  locale: string;
}

export const data = (pageContext: { locale: string }) => {

  const locale = pageContext.locale;

  const baseUrl = "https://aosankaku.github.io"
  const baseName = base.base
  const ogUrl = baseUrl + baseName + locale
  console.dir(baseName)

  const config = useConfig()

  console.log(`locale: ${typeof (locale)}: ${locale}`)
  locale === "" ? i18n.changeLanguage("ja") : i18n.changeLanguage(locale as string)
  config({
    title: i18n.t("meta.title"),
    description: i18n.t("meta.description"),
    lang: i18n.language,
    image: baseUrl + ogp,
    favicon: favicon,
    Head: <>
      <meta name="og:type" content="website" />
      <meta name="og:url" content={ogUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@Ao_Sankaku" />
    </>
  })

  const data: Data = {
    locale: locale
  }
  return data;
}
```

このコードの嫌なところは、baseUrlを定数にしているところです。つまり、このままでは**localhost環境でデバッグができません**。しかし、+data.tsxは静的なJSファイルでもなければReactコンポーネントではないため、**useEffectフックによるパス取得もwindow.location.hrefによる取得も両方できません**。そのため、このようにバグ覚悟で手動指定するしかなく、重大なエラーを引き起こします。

### +onBeforeRoute.ts

パスの取得が関係してくるということで、`+onBeforeRoute.ts`というファイルを作成した形跡がありました。

```tsx title=+onBeforeRoute.ts
export { onBeforeRoute }

import { modifyUrl } from 'vike/modifyUrl'
import type { Url } from 'vike/types'
import { languages } from '../i18n/configs'

interface PageContext {
  urlParsed: Url;
  response?: {
    statusCode?: number;
    headers?: Record<string, string>;
  };
}

function onBeforeRoute(pageContext: PageContext) {
  const { urlWithoutLocale, locale } = extractLocale(pageContext.urlParsed)

  return {
    pageContext: {
      // Make `locale` available as `pageContext.locale`
      locale,
      // Vike's router will use pageContext.urlLogical instead of pageContext.urlOriginal
      urlLogical: urlWithoutLocale
    }
  }
}

function extractLocale(url: Url) {
  const { pathname } = url
  // On development environment, "pathname[1]" equals to locale but on production, it's "station_name_generator", a base name.
  // This seems COMPLETELY Vike's fault, isn't it?
  const locale = (pathname[1] === "station_sign_generator")
    ? languages.includes(pathname.split("/")[2]) ? pathname.split("/")[2] : ""
    : languages.includes(pathname.split("/")[1]) ? pathname.split("/")[1] : ""

  // Determine the locale, for example:
  //  /en-US/film/42 => en-US
  //  /de-DE/film/42 => de-DE
  // const locale = /* ... */

  // Remove the locale, for example:
  //  /en-US/film/42 => /film/42
  //  /de-DE/film/42 => /film/42
  const pathnameWithoutLocale = "/"

  // Reconstruct full URL
  const urlWithoutLocale = modifyUrl(url.href, { pathname: pathnameWithoutLocale })

  return { locale, urlWithoutLocale }
}
```

今回のアプリは、原則としてSPAです。しかし、言語を分けるときにパスを使わなければならない関係上、こういう処理がいります。これは、Vikeの公式ドキュメントを参考にして書き上げたものです。

https://vike.dev/onBeforeRoute

コメント部分が多くてわかりにくいですが、簡単に言えば「localeをpageContextに含める」ためのコード…だったと思います（うろ覚え）。

このとき、GitHub Pagesの仕様が災いしました。GitHub Pagesでは、通常`https://aosankaku.github.io/apuri-no-namae/`のようになるのですが、VikeはVite側で適切に設定したとしても、**これをベースディレクトリ扱いできません**。つまり、ここでも「本番環境と開発環境で挙動が異なる」という最悪の現象をまたもや引き起こします。

しかも設定をミスったのか、このままだと**言語を切り替えるたびにパスが増えていきます**。つまり、`https://aosankaku.github.io/apuri-no-namae/en/ja/en/en/en/ja`みたいなことになります。気持ち悪すぎる。

前半のものは、完全にVikeが悪いと思っています。後半のものについては、単に私の落ち度の可能性も、Vikeの可能性も、i18nextの可能性もあるため原因の特定が全く進みません。

## 無理！ｗ

こんな感じで、Vikeがデバッグ中にいろいろなデータを破壊してくる上にlocalhostと本番環境での挙動が大きく異なるため、全く使い物になりませんでした。

[sysnoteくゃん](https://github.com/sysnote8main)に相談したところ、「無難にNext.jsでやったほうが楽」という話になったので、このリポジトリは放棄してNext.js+next-intlで実装することになりました。もしかすると、i18nextが本当の現況だったのかもしれませんが、今になっては調べる気も起こりません。

https://github.com/BlueShapes/station-sign-generator

単なるSSGをするだけなら、Vikeは超強力な選択肢になり得ると思います。i18nとの相性が悪いのか、Vikeが未完成なのか、はたまた私のスキルが足りないだけなのかはまだわかりません。今後Vike+i18nのサイトを誰かが作ったとき、それが正解になるんだと思います。

ViteもVikeも、超高速で動く素晴らしい技術です。発展を願います。

ちなみに、今回紹介した私のリポジトリはMITなので勝手にフォークしてご自身で試してみてもらってもOKです。

## おまけ

https://zenn.dev/ara_ta3/articles/typescript-vike-ssg-getting-started

単にいくつかのページをSSGしたいだけであればこういった記事も参考になるかもしれません。

