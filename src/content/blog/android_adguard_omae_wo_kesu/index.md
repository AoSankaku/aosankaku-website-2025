---
title: "【スマホ・PC対応】Adguardでうざいサイトへのアクセスを禁止する方法"
category: "Tech"
date: "2024-08-29T22:00:00+09:00"
desc: "Adguardの機能を使って、特定のサイトへのアクセスをブロックする方法を説明しています。間違ってサイトにアクセスすることを防ぐ効果があるから、ネットサーフィンが快適になるぞ！"
tags:
  - Adblock
---

Adguardを使ってサイトのアクセスをブロックしたい！というシチュエーション、あると思います。間違ってアクセスしたら嫌な気持ちになるサイトは前もってブロックしてしまいましょう。

## 結論
ブロックするには
```regex
||blockshitai-saito.com^$document
```
と入れるとよろしいです。

![AdguardでSejuku.netをブロックした画面](Screenshot_20240802-034520.png)

ブロックに成功するとこんな画面になります。お疲れさまでした。

## 解説

- `||`…「http://」または「https://」で始まることを示しています。
- `^`…その文字から右がURLではないことを示します（分割文字/separator character）。ちなみに、`^`や`_`など、URLに含めてはいけない文字は結構色々あります。
- `$`…その右にある要素に対してフィルターを適用します。例えば、`$img`と書くと、すべてのimg要素を対象にします（全てブロックします）。
https://www.ipentec.com/document/web-url-invalid-char

つまり、

```regex
||blockshitai-saito.com^$document
```

は「`http://`又は`https://`から始まるblockshitai-saito.comのdocument要素を全てブロックする」という命令になるわけです。

「document要素」というのは、超ざっくり言えば「そのサイトのページ全部」という意味です。

もう少し詳しく言えば、JavaScriptを書いたことのある人は
```js
document.getElementById("hoge")
```
みたいなコードを書いた、あるいは見たことがあるんじゃないかと思います。この`document`のことです。これは要素（htmlとかpとかdivとか）ではなく、オブジェクトというもので最上位のものです。

https://atmarkit.itmedia.co.jp/ait/spv/1804/06/news031.html

これを丸ごとブロックすることで、ページへのアクセスを禁止できるというわけです。面白いですね。

`$document`を`$html`に書き換えたらどうなるんでしょうか。試していませんが、真っ白になるのかもしれませんね。
## おまけ
上記スクショのルール

```regex
||www.sejuku.net^$document
```

ですが、この書き方だといつの間にか生えていた`terakoya.sejuku.net`をブロックできないことに記事を書いていて気が付きました。

```regex
||*.sejuku.net^$document
```

でもいいかなと思ったのですが、これだとよくよく考えればサブドメインしかブロックできないため、最終的に

```regex
||sejuku.net^$document
```

に落ち着きました。これで、すべてのサブドメインをブロックしてくれます。めでたしめでたし。
## おまけ2
一応ブロックしたサイトも、下にある「Proceed Anyway（無視して進む）」を押せば、ブロック無視してページを見ることはできます。そのため、コレは「子どもがムフフサイトを見るのを防止したい」みたいな使い方ではまるで役に立ちません。DNSブロッキングでもしてください。もっとも私はフィルタリング反対派なので、これ以上のことは言いませんが。
## 参考文献（英語）
### AdGuard公式ガイド
https://adguard.com/kb/ja/general/ad-filtering/create-own-filters/