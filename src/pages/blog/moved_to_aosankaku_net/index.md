---
title: "【GitHub Pages + CF Registerer】独自ドメインを実装しました"
category: "Misc"
date: "2025-02-16T01:30:00+09:00"
desc: "CloudFlare Registererで独自ドメインを取ったので、GitHub Pagesに適用してみました。ネットに書いてある情報と違うことがあり焦ったものの、なんとか実装できました。canonicalとかもうまいこと設定できました。"
tags:
  - お気持ち表明
  - CloudFlare
  - GitHub
  - GitHub Actions
---

というわけで（何が）、このサイトのドメインが

**aosankaku.github.io**

から

**aosankaku.net**

になりました。

なお、`aosankaku.com`と`aosankaku.jp`は取られてました。許せん。

## CloudFlareでドメイン、実際どう？

実際のところ、不満点はないです。ただ、円安のせいで普通に国内でドメイン買ったほうが安いです（CF Domainはドル建て）。

お前.comは[宗教上の理由](https://x.com/tea_tapiocamilk/status/1879483269475107269)で使っていないのですが、営業メールが気にならない人はいいんじゃないでしょうか。あとゴンベエとかもいいと思います。

## ドメインをGitHub Pagesに適用する

このサイトは、かつて`aosankaku.github.io`というURLで運用していました。そのため、

1. canonicalとか301を使ったSEOの引き継ぎとかそのへん
1. `aosankaku.github.io`から`aosankaku.net`へのリダイレクト

などを考える必要がありました。

### canonicalの設定どうすればいいん？

かつては、

**GitHubにPush　→　Actionsでビルド　→　Pagesにデデドン**

という方法を取っていました。ところが、ここでGitHub Pagesのドメインだけを変更すると、当然旧サイトと新サイトの中身は完全に同じになります。つまり、旧サイトの方だけ「canonicalを設定する」ということができません。

結論から言えば、これは考える必要のない問題でした。なぜかといえば、**GitHubのほうでなんかいい感じに301リダイレクトが勝手に組まれていたから**です。

インターネッツ界の情報では「独自ドメインをセットすると`/docs/CNAME`に勝手にファイルができて、リダイレクトが有効になるﾖ」みたいな情報が多かったのですが、わざわざそれを作ったり、自動でできるのを待たなくても301リダイレクトを組んでくれていました。やったー。

ただ、Gatsbyのキャッシュが強力なのかDNSがあれそれしているのかはわかりませんが、私のブラウザだと`aosankaku.github.io`から`aosankaku.net`に自動リダイレクトはしてくれませんでした。プライベートウィンドウだと普通にやってくれたので、気にしないことにします。泣けるぜ。

### DNS設定

https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

https://aruma256.dev/blog/2023/11/13/github-pages-custom-domain.html

これ見てください。以上。特筆することもありません。

## さっくり移動できた

想像よりさっくりと移動できました。HTTPSもwwwの排除も301リダイレクトも、順調にうまく行ってニコニコしています。みんなも独自ドメイン、取ろう！

## おまけ：GatsbyとCloudFlare Pagesは相性が悪いらしい

最初は「めんどくせーしCFにページも移管するべ」と思っていたのですが、なんかビルドが通りません。

どうやら、Node.jsのバージョンがどーちゃらこーちゃらで、相当面倒な手順を踏まないとGatsbyのサイトは設置できないみたいです。うんち。