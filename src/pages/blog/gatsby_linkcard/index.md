---
title: "【Gatsby】URLからリンクカードを作る、最高の方法"
category: "Tech"
date: "2024-04-04T14:50:00+09:00"
desc: "Gatsbyでリンクカードを作る方法はいくつかありますが、その中で「これが最高である」というものを見つけたので、使い方も含めてご紹介します。"
thumbnail: thumbnail.png
alt: "Gatsbyでいい感じのリンクカード"
tags:
  - Gatsby
  - フロントエンド
---

## 結論

https://blog.okaryo.io/20240102-released-gatsby-remark-link-card

これが最強です。

## 検討経緯

### その1「gatsby-remark-link-unfurl」

こちらは動きませんでした。無念。

### その2「gatsby-remark-link-beautify」

こちらでも実装は可能でした。ただし、気に入らないところが3点ありました。

#### 1：\[$card](URL)と書くのがだるい

だるいです。独自構文ですし。

#### 2：スタイルが自動適用じゃない

手動で全て作成する必要があります。面倒です。

#### 3：リンク先から情報取得をブロックされると「Blocked」表示になる

これが最大の不満点です。簡単に言えば、例えばCloudflareなどを導入していることが原因でOGP画像を正常に読み込むことができなかった場合に、リンク名が「Blocked」になってしまいます。

ユーザーエージェント偽装や認証のアレコレをすれば行けるのかもしれませんが、やり方が分からず面倒で諦めました。

### その3「@okaryo/gatsby-remark-link-card」

**@okaryo**がないと別物です。気をつけましょう。

こちらは手軽でした。

- リンクを貼るだけで勝手にカードになり、
- CSSはデフォルトのスタイルがあるので、不満がなければ何もしなくていい
- URLはホスト名だけ表示してくれる（溢れにくい）

というのが最高です。

ということで、みなさんこれを使いましょう。GitHubにStarも忘れずに。

https://blog.okaryo.io/20240102-released-gatsby-remark-link-card

https://github.com/okaryo/gatsby-remark-link-card

しかも作者は**日本人の方**です（貴重！）。今後のさらなる活躍に期待できます。「いや自分（筆者：Blue Triangle）で作れよ」という話ではありますが。

## おまけ：カスタムCSS

スタイリングで気に入らないところがあったので、少し書き換えました。

```css
.gatsby-remark-link-card__container {
  background: transparent;
  border: 1px solid var(--color-gray-2);
  :hover {
    background: rgba(55, 53, 47, 0.08);
  }
}

.gatsby-remark-link-card__link {}

.gatsby-remark-link-card__main {
  flex: 1;
}

.gatsby-remark-link-card__content {}

.gatsby-remark-link-card__title {}

.gatsby-remark-link-card__description {}

.gatsby-remark-link-card__meta {}

.gatsby-remark-link-card__favicon {
  margin-right: 6px !important;
}

.gatsby-remark-link-card__url {}

.gatsby-remark-link-card__thumbnail {
  max-width: 40%;
}

.gatsby-remark-link-card__image {}
```

以下の点で改良しています。

- 背景を透明にした
  - このサイトはダークテーマとライトテーマで切り替えができるので、背景がデフォルトの色だとダークテーマに合いません。
- リンクカードの画像が、横幅に余裕があるときは伸びるようにした
  - デスクトップで見ているときに画像が見切れるのが不満だったので、勝手に直しました。
  - ちなみに、OGP画像の幅はブログカードの40％を超えることはありません。これにより、「画像しか見えねェ」を防いでいます。
- faviconはURLのすぐ左にくるようにした
  - faviconというのは、URLに強く関係するものです。カード全体の左下に設置することは、ユーザーからみて不親切であると判断しました。

上記CSSの著作権は放棄しますので、ご自由にお使いください。そもそもこんな微妙な改造に著作権なんてなさそうですが…