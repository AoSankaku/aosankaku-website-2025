---
title: "【Misskey/Mastodon】共有ボタンをブログに実装してみた【コピペOK】"
category: "Tech"
date: "2025-04-27T02:20:00+09:00"
desc: "今をときめくSNSであるMisskeyですが、共有ボタンの設置はなかなか進んでいません。そこで、シェアボタンのHTMLコードおよびReactコンポーネントを配布しようと思います。"
tags:
  - SNS
  - フロントエンド
  - Fediverse
  - Twitter
---

以下のコードは、Reactを使ってるナウでヤングなフロントエンドエンジニアの方でも、平HTMLを使っている方でも使用可能です。

## Misskeyの共有ボタンがほしい！

ほしくないですか？ほしいですよね。じゃあ実装しましょう。

以下、Misskeyの共有ボタンを配布します。ロゴの画像は[Misskey Hub アセット集](https://misskey-hub.net/ja/brand-assets/)から拝借しています。各自ダウンロードを行ってください。CC-BY-SAライセンスです。

以下の共有ボタンスクリプトは、**CC0**（パブリックドメイン）として配布します。好き勝手に使ってください。

### Reactコンポーネント

propsに`shareText`、`url`を入れることができます。

- `title` が未入力の場合、現在いるページのタイトルを自動的に検出します。
- `url` が未入力の場合、現在いるページを自動的に検出します。

このファイルに`MisskeyShareButton.jsx`または`.js`という名前をつけ、どっか適当に保存してください。大抵はcomponentsフォルダの中にいれるものだと思います。

```jsx
import React, { useEffect, useState } from 'react';

const logoImage = "ここに画像の文字列（相対パスでも絶対パスでもURLでも）を挿入"

const MisskeyShareButton = ({ shareText: propShareText, url: propUrl }) => {
  const [shareText, setShareText] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const defaultShareText = document.title || '';
    const defaultUrl = location.href || '';

    setShareText(propShareText !== undefined ? propShareText : defaultShareText);
    setUrl(propUrl !== undefined ? propUrl : defaultUrl);
  }, [propShareText, propUrl]);

  const encodedShareText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  return (
    <a
      href={`https://misskey-hub.net/share/?text=${encodedShareText}&url=${encodedUrl}&visibility=public&localOnly=0`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={logoImage} alt="Misskey Logo" style={{ width: '50px', backgroundColor: 'white', borderRadius: '25px' }} />
    </a>
  );
};

export default MisskeyShareButton
```

使用するときは、importして以下のように使ってください。

```jsx
import MisskeyShareButton from "コンポーネントをおいた場所の相対パス"

<MisskeyShareButton />
```

基本的にタイトルとURLは全自動で取得してくれるはずです。propsを渡す必要はありません。

### （TypeScript）Reactコンポーネント

使い方は上と一緒です。`MisskeyShareButton.tsx`または`.ts`として保存してください。

```tsx
import React, { useEffect, useState } from 'react';

const logoImage = "ここに画像の文字列（相対パスでも絶対パスでもURLでも）を挿入"

interface MisskeyShareButtonProps {
  shareText?: string;
  url?: string;
}

const MisskeyShareButton: React.FC<MisskeyShareButtonProps> = ({ shareText: propShareText, url: propUrl }) => {
  const [shareText, setShareText] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const defaultShareText = document.title || '';
    const defaultUrl = location.href || '';

    setShareText(propShareText !== undefined ? propShareText : defaultShareText);
    setUrl(propUrl !== undefined ? propUrl : defaultUrl);
  }, [propShareText, propUrl]);

  const encodedShareText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  return (
    <a
      href={`https://misskey-hub.net/share/?text=${encodedShareText}&url=${encodedUrl}&visibility=public&localOnly=0`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={logoImage} alt="Misskey Logo" style={{ width: '50px', backgroundColor: 'white', borderRadius: '25px' }} />
    </a>
  );
};

export default MisskeyShareButton
```

### Next.jsやGatsbyをお使いの方へ

`<img>`を`<Image>`に書き換えてもいいかもしれません。画像サイズが小さいので、特にこれで動作が軽くなったりはしないと思いますが。お好みでどうぞ。

### 平HTML

このボタンは、React的な挙動（div要素を置換）をします。JavaScriptが有効じゃないと動きませんが、今更JavaScriptを有効にしていない思想の強い人なんて気にしなくていいと思います。

```html
<!--どっかにstyleを入れる（CSSファイルでも可）-->
<style>
  .misskey-share-button {
    display: inline-block;
  }

  .misskey-share-button img {
    width: 50px;
    background-color: white;
    border-radius: 25px;
    cursor: pointer;
    border: none;
  }
</style>


<!--どこかにこのdivを入れてください（これがボタンに変身します）-->
<div id="misskey-share-container"></div>


<script>
  document.addEventListener('DOMContentLoaded', function() {
    const shareContainer = document.getElementById('misskey-share-container');
    const logoImage = 'ここに Misskey のロゴ画像の URL を入れてください';
    // 例: 'https://example.com/misskey_logo.png'
    const defaultShareText = document.title || '';
    const defaultUrl = window.location.href || '';

    // data属性から shareText と url を取得（任意）
    const propShareText = shareContainer.dataset.shareText;
    const propUrl = shareContainer.dataset.url;

    const shareText = propShareText !== undefined ? propShareText : defaultShareText;
    const url = propUrl !== undefined ? propUrl : defaultUrl;

    const encodedShareText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(url);

    const shareLink = `https://misskey-hub.net/share/?text=${encodedShareText}&url=${encodedUrl}&visibility=public&localOnly=0`;

    const linkElement = document.createElement('a');
    linkElement.href = shareLink;
    linkElement.target = '_blank';
    linkElement.rel = 'noopener noreferrer';
    linkElement.className = 'misskey-share-button';

    const imageElement = document.createElement('img');
    imageElement.src = logoImage;
    imageElement.alt = 'Misskey Logo';

    linkElement.appendChild(imageElement);
    shareContainer.appendChild(linkElement);
  });
</script>
```

## 余談：Twitterの共有ボタンからMisskeyへの共有をする方法

ここまでの内容は、開発者向け（サイトをつくる人向け）でした。とはいえ、現状、Misskeyの共有ボタンを備えているサイトはまだまだ少ないです。

https://alpaca-honke.github.io/twishare-to-misskey/

こんなブラウザ拡張機能を見つけてしまいました。おーまいが。

どうやらこれ、「Twitterの共有ボタン」を「TwitterかMisskeyか共有先を選べるボタン」に変えてしまう代物らしい。すごい人もいるもんですね。