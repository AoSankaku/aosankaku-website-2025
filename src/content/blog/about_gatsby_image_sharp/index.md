---
title: "【Gatsby】gatsbyPluginSharpってそもそも何だよという記事"
category: "Tech"
date: "2025-04-26T23:06:00+09:00"
desc: "Gatsbyには「gatsby-plugin-sharp」という、画像をいい感じにしてくれるプラグインがありますが、この「sharp」って一体何でしょうか。ちょっと深堀りしてみました。"
tags:
  - フロントエンド
  - Gatsby
---

Gatsbyプロジェクトで画像を扱う際に、`gatsby-plugin-sharp`というプラグインをよく使っています。画像の最適化やレスポンシブ対応などを自動でやってくれているとかやってくれていないとか。

しかし、

**この名前に入っている「sharp」、何？**

というアレがアレしています。

なんとなく気になったので調べてみることにしました。AIの力を借りながら。

## `sharp` の正体

結論から言うと、この`sharp`というのは、Node.jsの画像処理ライブラリの名前です。`gatsby-plugin-sharp`は、この強力な`sharp`ライブラリをGatsbyのGraphQLレイヤーと統合し、使いやすくしたプラグインらしい。

## `sharp` ができること

`sharp` は、色々画像処理ができます。しかも速い。

* **リサイズ:** 画像のサイズを自由に変更できます。
* **フォーマット変換:** JPEG、PNG、WebP、AVIFなど、様々な画像フォーマットに変換できます。
* **最適化:** 画像の品質を保ちつつ、ファイルサイズを小さくすることができます。
* **トリミング:** 画像の一部を切り抜くことができます。
* **回転・反転:** 画像を回転させたり、水平・垂直方向に反転させたりできます。
* **色調調整:** 明るさ、コントラスト、彩度などを調整できます。
* **ぼかし・シャープ処理:** 画像にぼかしをかけたり、逆にシャープにしたりできます。

これらの機能をGatsbyのビルド中に自動的に行うことで、**高速で最適な画像**をWebサイトに組み込めるらしい。へー。

## 公式サイト

https://sharp.pixelplumbing.com

Sharpは公式サイトがあります。GatsbyだけでなくNode.jsでアレコレするときにも使えるので、つかってみるといいかも。「特定のフォルダ内にある画像をすべて6度回転させた画像を生成しまくる」なんてこともできたりします。

```js
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// 回転させたい画像の入っているフォルダパス
const inputFolderPath = './input_images';
// 回転後の画像を保存するフォルダパス
const outputFolderPath = './rotated_images';
// 回転角度（度）
const rotateAngle = 6;

async function processImages() {
  try {
    // 出力フォルダが存在しない場合は作成する
    await fs.mkdir(outputFolderPath, { recursive: true });

    // 入力フォルダ内のファイル一覧を取得
    const files = await fs.readdir(inputFolderPath);

    for (const file of files) {
      const inputFile = path.join(inputFolderPath, file);
      const outputFile = path.join(outputFolderPath, `rotated_${file}`);

      try {
        // ファイルの拡張子を確認して画像ファイルかどうかを判定 (簡易的な判定)
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff'].includes(ext)) {
          // sharpで画像を読み込み、回転させて保存
          await sharp(inputFile)
            .rotate(rotateAngle)
            .toFile(outputFile);

          console.log(`Rotated and saved: ${outputFile}`);
        } else {
          console.log(`Skipping non-image file: ${inputFile}`);
        }
      } catch (error) {
        console.error(`Error processing ${inputFile}:`, error);
      }
    }

    console.log('All images processed!');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

processImages();
```

何に使うのかは知りません。軽く見た感じ暴走はしないと思いますが、AIに適当に書かせたので使う際は自己責任で。

当然ながら、実行前にはプロジェクトディレクトリ内で`npm i sharp`とか`yarn add sharp`とかをしなければいけません。お気をつけて。

## 後記

この記事は、Bing AIに書かせて無駄添削をしまくって作りました。

しかし、`gatsby-image-sharp`なる存在しない（あるいは存在するけど超マイナー）なプラグインの記述をしてきてビビり散らかしました。やっぱ鵜呑みにできないし添削必須ですわね。

…と思っていたら、筆者が単に`gatsby-plugin-sharp`を`gatsby-image-sharp`と間違えて覚えていただけでした。AIはわるくないけど指摘もしてくれません。タイトルぐらいは見直す癖をつけたいですね。