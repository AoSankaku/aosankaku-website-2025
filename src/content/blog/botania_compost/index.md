---
title: "【配布あり】Cropariaの種をコンポスターに入れる方法【Minecraft・CraftTweaker】"
category: "Minecraft"
date: "2025-04-27T16:50:00+09:00"
desc: "Cropariaの大量に余った種を、コンポスターに入れることができるようになる方法を解説します。"
tags:
  - Mod
  - CraftTweaker
  - KubeJS
---

Croparia、使ってますか？

このMODは鉱石を農地で育てられるという、ゲームバランスを容易に破壊する威力を持ったMODです。しかし、**とんでもない量の種が余る**という致命的な問題があります。

この記事では、コンポスターにbotaniaの種を入れられるようになるCraftTweakerとKubeJSのスクリプトを紹介します。

## CraftTweaker

**CraftTweaker**は、主にレシピ追加などの改変が色々できるMODです。

https://modrinth.com/mod/crafttweaker

歴史も長く、いろいろなバージョンに対応しています。

### 使い方

マイクラの起動構成のフォルダーに入り、「scripts」というフォルダを見つけます。なければ作ってください。大文字・小文字には気をつけて。

その中に、`main.zs`とでも名前をつけたファイルを入れ、いかにあるコードをコピペして保存します。これで動作するはずです。

## スクリプト本体

大体どのバージョンでも内容は共通のはずですが、ここではForge 1.20.1を想定します（このバージョンのCroparia本家は何故かクラッシュするので、Croparia-IFというMODを使用します）。

実装方針は単純です。Botaniaの種に「これはコンポストでこれぐらいの価値を持つ」というタグを付与してやるだけです。

### CraftTweaker

このAPIを使用します。

https://docs.blamejared.com/1.20.1/en/vanilla/api/misc/Composter/

```zs
import crafttweaker.api.misc.Composter;

var cropariaSeeds = <tag:items:croparia:crop_seeds>.elements;

for e in cropariaSeeds {
  composter.setValue(e, 0.1); // 0.1 はコンポスターの効率 (例: 10%)
}
```

#### 解説

コンポスターは、「このアイテムはコンポスト可能」というタグが付いているわけではありません。「どのぐらいの確率でコンポスターを埋めるか」を定義しなければいけないので、別管理になっています。

`composter.setValue(<item:itemnonamae:name>, 0.1)`のように書けばそのアイテムをコンポスターで使えるように、CraftTweakerがいい感じ™に加工してくれます。

### KubeJS

…も同種のMODですが、かなり長くなる上にネイティブメソッドに触れる必要があり、めんどくさいです。おとなしくCraftTweakerでやるのがおすすめです。

## おまけ：コンポスターの確率について

https://ja.minecraft.wiki/w/%E3%82%B3%E3%83%B3%E3%83%9D%E3%82%B9%E3%82%BF%E3%83%BC

Minecraft Wiki（新）に載っています。大体種は30%らしいです。ただCropariaは引くほど大量に種が手に入るので、もっと確率低めでもバランスは取れるかもしれません。お試しあれ。
