---
title: "【Minecraft】Fabric+Sodiumで鉱石を光らせる方法"
category: "Minecraft"
date: "2023-03-29T21:00:00+09:00"
desc: "マイクラでFabricとSodiumを使った状態で、鉱石が光るリソースパックを導入して動作させる方法について解説しています。Optifineなしでも導入可能です。"
thumbnail: "thumbnail.png"
alt: "Thumbnail"
tags:
  - Fabric
  - Sodium
  - Mod
---

ここは別にMinecraftのブログではないのですが、英語の情報すらほとんど出てこないので書いてみることにしました。

タイトル通り、Fabricで、Sodiumを使用して鉱石を光らせることを目的とした記事です。

## 前提：Sodiumとは？
![Sodiumのロゴ](sodium.png)

### Sodiumの特徴
Sodiumは、Optifineよりも性能がいい軽量化MODです。Forge版はなく、Fabricのみで動作します。

バニラの状態と比較しても**3～5倍**程度FPSが向上し、Optifineと比べても優れた性能を発揮することで有名です。

かの有名なOptifineでももとの2～3倍FPSが上がるのに、それを上回る性能という恐ろしいMODです。
なお、Optifineは専用サイトからしか入手できませんが、Sodiumは普通にCurseForgeや[Modrinthから入手できる](https://modrinth.com/mod/sodium/versions)のも良い点です。

https://modrinth.com/mod/sodium/versions

### Sodiumの難点
しかし、いくつか難点はあります。

- Forge版がない
おそらく[今後の開発予定もありません](https://github.com/CaffeineMC/caffeine-meta/wiki/FAQ#where-are-the-forge-versions-of-your-mods)。

https://github.com/CaffeineMC/caffeine-meta/wiki/FAQ#where-are-the-forge-versions-of-your-mods

- 1.16.1以降しか対応していない
CurseForge上では1.16.1向けが最古となっています。なお、そもそもFabricは1.14～の対応なので、古いForge向けMODはもちろん使えません。
- Optifine標準機能がない
Optifineでは、それ単体を導入すると以下の機能が使用できます。
1. シェーダーパック（影MOD）の導入
1. ガラスなどの見た目をつなげる機能
1. **鉱石を光らせる機能**
Sodiumは軽量化の機能**のみ**を保持しており、Sodiumを導入するだけでは上記のいずれも使用できません。

### Optifineと同時には入らない

[OptifineとSodiumは互換性がありません](https://www.reddit.com/r/Optifine/comments/hzk9yd/is_sodium_a_performance_enhancing_mod_compatible/)。同時に入れないように気をつけてください。

https://www.reddit.com/r/Optifine/comments/hzk9yd/is_sodium_a_performance_enhancing_mod_compatible/

https://www.reddit.com/r/Optifine/comments/hzk9yd/is_sodium_a_performance_enhancing_mod_compatible/

## 鉱石を光らせる方法

結論から言うと、以下のMODが全て必要になります。

1. Fabric
1. Fabric API
1. Sodium
1. Indium
1. Continuity
1. Modmenu（任意）
1. 鉱石を光らせるリソースパック

順に見ていきます。

### Fabric、Fabric API、Sodiumの導入
ググってください。この記事を見ている人でFabric APIとSodium入らない人いないと思います。

### Indiumの導入
Sodiumのアドオン（拡張）です。Sodiumが直接サポートしていない機能をサポートしています。

なお、あくまで拡張であるため**Sodiumの導入は前提**です。入っていないと動かないので気をつけてください。

[IndiumのModrinthページ](https://modrinth.com/mod/indium/versions)からダウンロードできます。

https://modrinth.com/mod/indium/versions

### Continuityの導入
先程、Sodiumは「ガラスなどの見た目をつなげる機能」を持っていないと書きました。Continuityはその機能を持っているMODです。

そしてここが重要なのですが、このMODはガラスをつなげる機能だけでなく、**鉱石を光らせる機能もサポートしています**。

[SodiumのGithubのIssue](https://github.com/CaffeineMC/sodium-fabric/issues/1370)を読んでいて気が付きました。

https://github.com/CaffeineMC/sodium-fabric/issues/1370

そして、このMODは**Indiumが前提**です。Sodiumは前提の前提ということになります。

[ContinuityのModrinthページ](https://modrinth.com/mod/continuity/versions)からダウンロードできます。

https://modrinth.com/mod/continuity/versions

### Modmenuの導入（任意）
導入しなくても特に問題ありませんが、入れておくと「ガラスのつなぎ目は別に繋がなくていい」とか設定できます。

デフォルトでは「ガラス・本棚のつなぎ目」「光るテクスチャ」「カスタムブロックレイヤー（効果不明）」が全てオンになっています。

![設定画面](settings.png)

### 鉱石を光らせるリソースパック
Optifineであれば導入直後に入れればいいのですが、Sodiumの場合modmenu以外上にあるMODをすべて導入して、ようやくリソースパックを入れる準備が整います。

「Optifine Required」と書いてあるものでもOptifineを入れなくて大丈夫ですので、そのまま入れましょう。私はこれを使っています。

[New Emissive Ores（Curseforge）](https://www.curseforge.com/minecraft/texture-packs/emissive-ores-1-17)

他のテクスチャでも、問題なく動作します。いろいろ試してみてください。適用を忘れずに。

https://modrinth.com/resourcepack/emissive-ores

#### 「互換性がない」と出たら？

古いリソースパックを新しいバージョンに、またはその逆をするとこういった警告が出ることがあります。結論から言えば、**無視して大丈夫**です。

## 完了！
ここまでやればしっかり鉱石が光っているはずです。実際にゲームを動かして確認してみてください。

ロードに時間がかかるかもしれませんが、正常な挙動です。スマホゲーでもやりながら待つのをおすすめします。個人的な印象としては割りと動作が重いな、という感じです。

お疲れ様でした！それではよいマイクラライフを！

## 追記（2024/04/03）

この記事の閲覧数がこのブログでダントツで多いので、ちょっと内容を付け足したりリンクを立派にするなどして改良しました。

### CurseForge派の皆さんへ

この記事ではCurseForgeではなく、基本的にModrinthのリンクを貼りました。その理由については[この記事](../sodium_got_back/)で説明しています。