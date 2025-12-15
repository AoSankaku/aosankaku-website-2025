---
title: "【React/Gatsby】Ko-Fiの寄付ボタンを表示する方法"
category: "Tech"
date: "2025-04-27T15:50:00+09:00"
desc: "Githubには、リポジトリにサムネイルのような画像をつけることができます。厳密にはSNS共有時に表示するOGP画像です。これの作り方を紹介します。Twitter（旧X）などのSNSに載せるときにも目立つようになります。"
tags:
  - フロントエンド
  - Gatsby
---

## やり方

まず、kofi-buttonを入れます。

https://www.npmjs.com/package/kofi-button

```
npm i kofi-button
```

または

```
yarn add kofi-button
```

そうしたら、あとは

```jsx
import KofiButton from "kofi-button";

// 何かしらのコンポーネントに含める
<KofiButton color="#0a9396" kofiID={"kofiのidをここに突っ込む"} title="ボタンの名前を適当にいれる" />
```

だけです。簡単ですね。Next.jsなどでも全く同じ手順でできるはずです。

## 他にも色々ある

https://www.npmjs.com/search?q=ko-fi%20react%20button

いろいろあります。このKofiButtonはかなり楽に使えるので気に入っていますが、他に色々探してみるのも面白いかもしれません。