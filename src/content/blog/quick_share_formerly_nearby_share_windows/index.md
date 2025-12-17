---
title: "【LocalSend】PCとスマホでファイルを簡単に移動させる方法【Android、iPhone、Windows対応】"
category: "Tech"
date: "2025-04-27T00:08:00+09:00"
desc: "パソコンやスマホの間でいちいちファイルを移動させるの、結構面倒だと思います。個人的に最強だと思う方法を見つけたので、書き残しておきます。"
tags:
  - パソコン
  - 生活
  - Windows
---

お知らせ：この記事はアフィリエイト広告による収入を得て…**いません**！記事が役に立ったら、お友達に拡散してくれたら嬉しいです。

## 結論：Localsendが最強

https://localsend.org

LocalSendはFLOSS（Free/Libre Open Source Software：無料でオープンソースな神ソフトウェア）の1つであり、完全無料でつかえます。しかも、

- アプリが安全であることが、コードを読んで確認できる
- 気に食わなければ改造したりバグ報告をする

こともできます。

しかし、LocalSendが最強なのは、上に加えて当然のように**クロスプラットフォーム対応**なところです。つまり、

- Windows
- Mac
- Linux
- Android
- iOS（iPhone）

の全てで使用できることです。**無料**でです。開発者の人に足向けて寝れません。

### 簡単な使い方

写真での解説がいらないぐらい、直感的で優れたUIです。気合いでなんとかしてください。

一応不安な方のために、日本語の公式ガイドもあります。「手動でビルド」はしなくてもOKです。

https://github.com/localsend/localsend/blob/main/readme_i18n/README_JA.md


### 注意

LocalSendはデータ転送している間、スマホ側でアプリを起動しておく必要があります。スマホ側では特に開く画面が拘束されてしまうのが玉に瑕です。別のアプリに切り替えても動き続けるQuick Shareとは、この点でだけ劣ります。

https://github.com/localsend/localsend/issues/2153

## LocalSendを知る前に使ってたやつ

LocalSendを知る前は、Googleの**Quick Share**（旧ニアバイシェア）を使ってました。

https://www.android.com/better-together/quick-share-app/

当然iOS非対応なのですが、とりあえずWindowsとAndroidの間でデータ転送したい場合はオススメです。

なお、Microsoftストアにある方は**Samsung専用**です。騙されないように。

https://apps.microsoft.com/detail/9pctgdfxvzlj?hl=ja-jp&gl=KR

## 後記

LocalSendは[sysnoteくゃん](https://github.com/sysnote8main)に教えてもらいました。どっから見つけてくるんだろう。

最近個人的にFLOSSを探すのにハマっています。世の中にはこんなにいろいろなFLOSSがあるんですね。私がもしも億万長者だったら月額寄付したいぐらいです。適当な慈善団体に寄付するより理にかなっているように思います（もちろん、素晴らしい慈善団体もたくさんありますが）。