---
title: "【Vite】viteでreact-helmetは絶対に使うな（react-helmet-asyncも）"
category: "Tech"
date: "2024-09-10T02:00:00+09:00"
desc: "Viteでreact-helmetを使うと、クライアントサイドではちゃんと動いているように見えるのですが、実際は動いていません。危険なので使うのをやめましょう。"
thumbnail: "thumbnail.jpg"
tags:
  - Vite
  - フロントエンド
  - SEO
---

## 結論

Viteのheadは、`index.html`にベタ書きしましょう。カッコつけて`react-helmet`なんて使ってたら痛い目見ますよ。

`react-helmet-async`も同じだと思います。

## react-helmetって、なんかかっこいいじゃん？

react-helmetやreact-helmet-asyncは、Reactコンポーネント内で<head>タグの内容を動的に変更するためのライブラリです。まあ素敵。

```jsx
import React from 'react';
import { Helmet } from 'react-helmet';

const MyComponent = () => (
  <div>
    <Helmet>
      <title>俺様の神がかった素晴らしいサイトのタイトル</title>
      <meta name="description" content="神サイト。ところで、この部分って短すぎないほうがいいらしいね" />
    </Helmet>
    <h1>Hello, world!</h1>
  </div>
);

export default MyComponent;
```

これにより、ページごとに異なるメタタグやタイトルを設定することができます。開発者にとっては非常に便利で、コードもシンプルに保つことができます。

しかもしかも、なんとこれは文字列の部分に関数などを入れれば動的に変更もできちゃいます。やったぁ！

## ちゃんとできたように見えた…が

しかし、そんなうまい話はありません。

テスト環境（`vite dev`で出したやつ）や実際にブラウザでアクセスした際（`vite build`で出した完成品を`vite preview`した時）には、react-helmetやreact-helmet-asyncで設定した<head>タグの内容が正しく表示されます。

しかし、**TwitterやFacebookなどのSNSは、ページのメタタグを取得する際にJavaScriptを実行しません**。そのため、これらのSNSでは動的に設定されたメタタグが認識されず、シェア時に正しい情報が表示されません。まあなんてこと。

この挙動を確認するためには、`vite preview`している状態でJavaScriptを一時的に無効化するとわかります。headにtitleなどがないか、または`index.html`のものが入りっぱなしになっているはずです。

## 結論：headは普通にベタ書きしよう

Viteを使う場合、<head>タグの内容はindex.htmlにベタ書きするのが最も確実！ということです。これにより、SNSがページをクロールする際に正しいメタタグが認識され、SNSでのシェア時に正しい情報が表示されます。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="神サイト。ところで、この部分って短すぎないほうがいいらしいのはベタ書きでも変わらない">
  <title>react-helmetは使えないけど、俺様の神がかった素晴らしいサイトのタイトルは決して曇ることはない</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

皆さんは、サイトに長過ぎるタイトルを付けないようにしましょう。大体30文字ぐらいがいいらしいですよ。

## 付記

「あれ！？！？react-helmetで作ったhead全く反映しないんだけど！？」と最初に思ったとき、検証に使ったSEOツールがいくつかありました。その中でほとんどは「OGP設定一切なし」という判定だったのに対し、ラッコツールズのOGP確認だけが「正常」と返してきました。

https://rakko.tools/tools/9/

どうやらラッコツールズはJavaScriptを読んでから、動的に生成したheadを読み込むことができるようです。逆に困るのでやめてほしいですね…

報告しようかとも思ったのですが、viteとreact-helmetの同時使用でもしなければこんなことには普通ならないため、放っておくことにします。

## 付記2

この記事はAI（Bing）に本文とサムネ画像生成を手伝ってもらいました。でもほとんど添削しました。†卍人間様の温かみ卍†が足りなかったのでね。

それにしても、この画像確かに悪くないですが、なんだか安っぽいですね。Bingがむちゃリアル画像を生成する日は遠いかもしれません。