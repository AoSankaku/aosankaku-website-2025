---
title: 【Astro】ブログ記事にFrontmatterを使わずレイアウトを適用させようとしたら沼った
category: Tech
date: "2025-12-22 23:00"
desc: サイトの引っ越しに伴い、ブログ記事もそのまま丸ごと引っ越すことにしました。Frontmatterをいじらずにレイアウトを適用する方法がなかなか見つからなかったので、やり方を掲載します。
tags:
  - Astro
  - フロントエンド
---

[こちらの記事](../moved_to_astro/)でも触れた通り、GatsbyからAstroに引っ越しました。あー快適快適…ところが、1つ問題が。

AstroはMarkdownから生成したページにレイアウトを適用させたい場合、frontmatterに追記をする必要があります。

```astro
---
layout: '../../layouts/BlogLayout.astro'
---
```

これはブログサイトとして運用しない、かつAstroから当分引っ越す予定がない場合には、柔軟にページごとに適用するレイアウトを決定できるという点で便利です。

ところが、純粋にブログとして運用したい場合、記事のディレクトリ構造（例えば`/blog/nanka-series/1/`や`/blog/nanka-series/2/`など、固めたいものがある場合）が複雑になると途端にLayoutの指定がめんどくさくなります。ミスの原因にもなります。Astroは開発画面では無効なレイアウトを指定してもエラーを吐かないので、ビルドするまで原因がわからずめんどくさいです。

その他、「layout」というのはあくまでAstroの独自形式なのでロックインを食らう可能性もあります。今後別のものに引っ越す場合はlayoutを手動でうごうごするという手もあるっちゃありますが、めんどくさいです。引っ越し先のフレームワークがそれをサポートしているとも限りません。

というわけで、

- 今のブログ記事ディレクトリ構造を維持しつつ、
- すべてのブログ記事に、
- frontmatterをいじらずレイアウトを適用する

ための都合のいい方法を探すことになりました。

## 結論（実装方法）

### コレクション作成

まず、ブログ`/src/content/`を作り（contentの部分は適当でもいいです）、`config.ts`を設置します。JSの人は気合で書き換え…なくてもTypeScript要素はないのでそのまま`config.js`にしてください。

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 「defineCollection」とある通り、コレクションを定義する
// ブログ記事に対してここに規定していない属性をつけたり、必須のものが欠けたりすると
// 開発・ビルド時にエラーになる
const blog = defineCollection({
  // スキャンするディレクトリを指定
  // 「_」で始まるファイルを弾くように指定しているわよ！（ただの正規表現なので好きに変更してOK）
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
  schema: z.object({
  // 「.catch」をつけると中身がエラー（例えばタイトルなのに配列が入っているとか）だったときに上書き
  // 「.optional」をつけると設定しなくても未設定可になる
  // 「.default」をつけると初期値がそれになる＆未設定可になる
    title: z.string().catch("---untitled---"),
    desc: z.string().optional(),
    date: z.coerce.date().catch(new Date(100000)),
    lastUpdate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    alt: z.string().default("Blog Article Image"),
    category: z.string().default("Uncategorized")
  })
});

// collectionsという名前でExportすると、この場合「blog」という名前のコレクションができる
// 関係ない別のファイルで、別の物体を同様にexportしてもOK
export const collections = { blog };
```

何をしているかというと、コメント通り「blog」という名前のコレクションを出しています。どこでも使えるようになります。

慣れている方はお察しの通り、他の方法で手動でコレクションを作ったり、ただのJSONファイルからページを作ったりもできます。恐ろしいほどの柔軟性。

### カスタムルーティング

ところで、Astroには、ルーティングをいじれる機能があります。

https://docs.astro.build/ja/guides/routing/

これを使い、`/src/pages/blog/[...slug].astro`なるファイルを作成します。あ、`[]`はプレースホルダーじゃありません。文字通りこのまま入力してね。ちなみに、実際に表示するパスを`https://oreno-saito.gov/blog/nantoka/`ではなく`https://oreno-saito.gov/articles/nantoka/`にしたい場合は、`/src/pages/articles/[...slug].astro`に作るといいよ。

```astro title="/src/pages/blog/[...slug].astro"
---
// 記事取得・ページ描画用関数
import { getCollection, render } from "astro:content";
//全部に適用したいレイアウト（あらかじめどっかに作っておいてね）
import BlogArticleLayout from "@/layouts/BlogArticleLayout.astro";

// この名前の関数をexportするとページ描画ができる
export async function getStaticPaths() {
  // 「/src/content/blog」内にある記事を取得
  // ちなみに画像などはページとしてみなされないため、
  // ブログ記事と同じディレクトリに画像を入れている場合はエラーも出なくなる
  const posts = await getCollection("blog");

  return posts.map((post) => {
    // indexをパスに含む場合に一応消している（別にいらない）
    const slug = post.id.replace(/\/index$/, "");

    return {
      params: { slug },
      props: { post },
    };
  });
}

const { post } = Astro.props;
const { slug } = Astro.params;
const { Content, headings } = await render(post);
---

<!--お好みのレイアウトでサンドイッチ-->
<BlogArticleLayout frontmatter={post.data} headings={headings} slug={slug}>
  <Content />
</BlogArticleLayout>
```

あとは、適当に実際のレイアウトを作成してください。これだけです。

## 解説

Astroは、pages以下に適当に`.astro`または`.md`または`.mdx`ファイルを突っ込めばそのままページができます。アルティメット便利ですが、この中に入れた`.md`ファイルや特定ディレクトリ内のファイルすべてにレイアウトを一括適用する方法は、残念ながらありません。

そのため、これはブログの記事をすべて`/src/content/blog/`に移し、その中で`hogehoge.md`や`hogehoge/index.md`を作った上でその中にある`.md`ファイルだけにレイアウトを適用することを想定しています。

やっていることを振り返ると非常に単純で、`config.ts`でコレクションと呼ばれる塊を作り、それを`[...slug].astro`で読み込んで、パスを決めつつ内容の描画をしているだけです。ちなみに、`/src/content/`は元々Astroが自動で認識しないフォルダーなので、好きな名前でもOKです。

`/src/pages/blog/`にある`[...slug].astro`という珍妙な名前のファイルはどこから来ているかというと、カスタムルーティングをするための施策です。このファイルを`/src/pages/blog/`に設置すると、ユーザーが`https://oreno-saito.gov/blog/hogehoge/`にアクセスしたときに`/src/pages/blog/hogehoge.astro`や`/src/pages/blog/hogehoge.md`がなかったとしてもコレクションから生成した記事にルーティングを行えます。

### 注意

このルーティングをするとログが404まみれになりますが、実際に開発環境でブログ記事が見えていれば無視してOKです。

## 公式にも実装リクエストはあるっぽい？

「特定ディレクトリ内の`.md`ファイルに一括レイアウト指定させてくれ～い」というIssueはあるらしいですが、今のところ実装の気配はありません。

https://github.com/withastro/roadmap/discussions/172

2022年に1度検討されたものの、結局正式実装は来ていません。

## 他の解決策候補：frontmatterを動的に書き換える

できるらしいです。

https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically

Astroは、自作プラグインを引くほど簡単に作成できます。これの場合は1つファイルを作って、`astro.config.mjs`を1～3行増やせばいいだけです。ただし、あくまで`customProperty`の例であって`layout`に適用できるかは知りません。

私の場合は、ブログの記事**のみ**にレイアウトを適用したかったのでこれは採用しませんでした。全MarkdownにLayoutを適用してもいいならこっちのほうが簡単かも。

## おわりに

特に複雑なこともなく一瞬で実装できたので、あまりの簡単さに失笑してしまいました。初めてJavaScriptをいじったりする人の中にはまだこれを難しく感じる人もいるかも知れませんが、だいたいコピペでいけます。何を隠そう、このコードはほぼAI生成。面白いね。Astroはまだまだ新しいフレームワークですが、AI生成させてもほとんどミスが起こらないぐらい単純明快な構造をしています。使い倒しちゃいましょう。

というかこれ、collectionの部分をリモートからの取得にすれば、追加のパッケージインストールなしでヘッドレスCMS連携組めますよね。Astro恐ろしい。簡単すぎる。