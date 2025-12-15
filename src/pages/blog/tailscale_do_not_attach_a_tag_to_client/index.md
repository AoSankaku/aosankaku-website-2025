---
title: "TailscaleでクライアントマシンにTagをつけるな"
category: "Tech"
date: "2025-08-02T14:30:00+09:00"
desc: "Tailscaleでクライアントマシンにtagをつけたところ、Shared inのマシンが見えないわtagを消すには再起動が必要になるわで散々な目に遭いました。周知のために記事を書きます。"
tags:
  - Tailscale
  - パソコン
  - ネットワーク
---

## TL;DR

**Tailscaleでクライアントマシン（自分のWindows機）にタグを付けてはいけません！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！メッ！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！**

以上です。お読みいただきありがとうございました。

## 発端

適当にTailscaleを使っていたら、クライアントマシン（Windows機）から`tailscale status`を打ってもShared in状態のデバイスが1つも見えなくて大困惑しました。いくつか思いつく原因を潰しました。

### Windowsが23H2なのが原因では？

24H2にしましたが解決しません。

### Tailscaleがバグっているのでは？

Tailscaleのデータを全部消して再インストールしても全く解決しません。

### ACLでは？

ACLと端末の発見状態には相関はないはずです。

### FWでは？

気分により見えたり見えなかったりするのでFWでもないはずです。

## 発生条件の特定

色々と操作をしていたところ、**Tailscaleのタグをつけた直後に他のデバイスが認識できなくなる**事がわかりました。Geminiに丸投げをしてみたところ、こういう回答が返ってきました。

> This is a known behavior with Tailscale. When you apply a tag to a device, it loses its user-based identity. Since shared-in devices are shared with a specific user, and your tagged device no longer has a user identity, it can no longer see or connect to those shared machines.

英語で質問したので返答も英語です。イキってるわけではなくたまに英語じゃないとまともな回答を返さないことがあるので、1つのテクです。

つまるところ、

- タグを付けるとユーザー管理下である状態を失う
- ゆえに、他にタグが付いていないデバイスがすべて見えなくなる
- Shared inデバイスにはACLタグを付けられないので、自動的にすべて見えなくなるし、解決不能になる

ということです。

もっと詳しく見てみましょう。

> Here's a breakdown of why this happens and what you can do:
> 
> **Why This Is Happening**
> 
> Tags vs. Users: Tailscale treats tags and user accounts as two different types of identities. Tags are intended for non-human, service-based devices (like servers or automated systems), while user accounts are for people and their devices.
> 
> Shared Devices are User-Based: When a machine is shared with you, it's shared with your user account (e.g., your email address).
> 
> ACLs and Tags: Your ACL (Access Control List) rules are designed to work with either user-based identities or tag-based identities. When you tag your client, you're essentially changing its identity from user:your-email-address to tag:your-tag-name.
> 
> The Disconnect: Because the shared-in device is expecting a connection from a specific user, and your tagged device no longer has that user identity, the connection is blocked.

つまり、

- タグを付けると「タグがそのマシンを所有している」状態になり、ユーザー管理下から外れる
- Shared inなデバイスはユーザー所有のため、タグ所有のデバイスは一切表示不可になる
- ちなみに、ACLはタグベースでもユーザーベースでも使用できる

ということです。あとの回答は省略しますが、どうやら一度つけたtagを消す方法は該当端末の再認証（ログアウト）しかないようです。

```
tailscale logout
```

を実行する必要があります。なお、`tailscale down`では認証解除にならないため駄目です。

## ACLの書き換え

タグが外れたのでACLを書き換える必要があります。クライアントデバイスなんて大して多くないので、タグではなく所有者ベースかマシンベースでやればいいと思います。

```json5
"acls": [
  {
  "action": "accept",
  // 目的に応じて設定、IPベースでもユーザーベースでもいい
  "src":    ["tag:target_server_kocchiha_tag_tsuitetemo_ii"],
  // IPベースかユーザーベースでdstかsrcをいじる
  "dst":    ["100.114.5.14:8080", "oretachino_user_mail@example.com:8080"],
  }, // ←実はこのコロンは残っててもエラーにならない
]
```

以上です。というわけで、クライアントデバイス（Tailscle管理用デバイス）として使いたい機械にACLタグを付けるのは教えに反するという話でした。見落としがちなのでお気をつけください。私はこれで7時間ぐらい無駄にしました。