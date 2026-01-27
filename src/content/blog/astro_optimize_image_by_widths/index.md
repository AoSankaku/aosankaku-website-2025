---
title: "【Astro】画面サイズに応じて画像サイズを最適化するための方法"
category: "Tech"
date: "2026-01-28T00:30:00+09:00"
desc: "Astroで画面の幅に応じたサイズの画像を複数用意する超簡単な方法について説明します。最適化できる上に数文字書くだけで効果抜群です。"
thumbnail: thumbnail.jpg
tags:
  - Astro
  - フロントエンド
---

## 結論

```astro
---
import { Image } from "astro:assets";
---

<Image
  src={imageSrc}
  alt={title}
  style="color: var(--color-background);"
  widths={[280, 350, imageSrc.width]}
  sizes="(max-width: 768px) 280px, 350px"
/>
```

こんなふうに入れると良いらしい。たったこれだけです。

## widthsってなんだ！？！？！？

どうやらこれを使うと複数の画像のバリエーションを生成できるらしい。すげえ。それ以上でもそれ以下でもないんですけど。

`sizes`にCSSっぽく値を入れることで調整もできるらしい。すげえ。

## 公式ドキュメント

2026/01/27時点では英語のみです。

https://docs.astro.build/en/reference/modules/astro-assets/