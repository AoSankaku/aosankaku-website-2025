---
title: 【Gatsby】GitHub PagesでBuildを自動化したら、ビルド結果がおかしくなった
category: Tech
date: "2024-03-14T16:00:00+09:00"
desc: GitHub Actionsを使ってGatsbyのビルドを自動化したら、返って来る結果がおかしくなったので解決していきました。
tags:
  - Gatsby
  - フロントエンド
  - GitHub
  - GitHub Actions
---

タイトルの通り、GitHub Actionsを使ったら最初うまくいきませんでした。

解決方法も、はっきり言ってかなりしょーもないものでした。他の人も同じ壁にぶつかることがあるかもしれないしないかもしれないので、事例を書き残しておきます。

## 発端（目標）

Gatsby0年生だった頃（今も初心者ですが…）、こんなサイト構築をしていました。

1. Gatsbyでサイトをつくる
2. ローカルでビルドする
3. docsフォルダにコピーする
4. Pushして公開！

Github Pages経由で公開していたのですが、公開するためにはリポジトリのルートにhtmlファイルをベタ置きするか、`docs`フォルダに突っ込んでやる必要がありました。

しかし、これを手動でやるのってエンジニアらしくない。あまりに泥臭いですよね。

しかも、当時はGitもろくに理解していませんでした。そのため、`git push`などが省略コマンドに埋め込んでありました。

これらの時代遅れな構造を解体して、再構築しようというのがこの記事の主題です。

## 具体的にしたこと

### yarnへの一本化

どういうわけか、弊プロジェクトにはyarnとnpmが**共存**していました。初心者だったからね、しょうがないね。

`node-modules`をフォルダごと抹消し、`package-lock.json`と`yarn.lock`を吹き飛ばしたあとに

- npmで揃えたい場合は`npm install`
- yarnで揃えたい場合は`yarn install`

をすればOK。

#### node-moduleが消せない？

Windowsって、大量の細かいファイルを消そうとすると「これは使用中っすねぇ〜」とか、意味不明なことをほざきます。

GitHubからダウンロードしたと思うのですが、Windowで`rm`や`mv`などのunix系OS専用コマンドなどが使えるようにするexeがあります。これを用いて`rm -r node-modules`とすれば、素早く問題なく消し飛ばせます。通常削除だとものすごい時間がかかるのに。Windowsはよくわかりませんね。

### ディレクトリの整理

上でも述べましたが、以下のようなディレクトリ構造をしていました。

- (root)
  - docs
    - （ビルドしたファイルが入ってる）
  - gatsby-starter-apple（Gatsbyプロジェクトが入ってる）
    - srcとか諸々

これはなんとも気持ち悪い。ちなみに、この`docs`に入っているのは`gatsby-starter-apple`でビルドした`public`フォルダの完全なコピーです。つまりデータ二重構造。

まずはこれを解体し、`gatsby-starter-apple`の中身をrootに持ってきました。これでプロジェクト全体が見やすくなります。

### Github Pagesの設定

いつからかはわかりませんが、Github Pagesの公開（デプロイ）がGithub Actionsからできるようになっていました。

そのため、docsフォルダから公開する設定を消去し、Github Actionsから公開作業をするように設定を行いました。



### 自動公開

**Github Actions**も、最近になって知ったものです。まだまだ未熟者です。

簡単に見た限りだと、Githubが持っているマシンパワーを借りて、サイトのビルドなどの作業を代わりにさせることができるようです。ベースになっているものはDockerなのかな？と思います。🧨

ymlファイルをカキカキすることで、Github上のパソコンにさせたい命令を作ることができます。つまるところ、書き方に従ってこの中に`gatsby build`を書けば良い、ということですね。


というわけで、できたymlファイル（ワークフロー）がこちらです。自作してません。


```yml
name: Release

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc

      - name: Install Dependencies
        run: |
          yarn config set network-timeout 450000
          yarn install --frozen-lockfile

      - name: Build
        run: yarn build --verbose --log-pages

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          name: github-pages
          path: public

  deploy:
    needs: build
    permissions:
      id-token: write
      pages: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

このワークフローは、`main`ブランチにPushまたはPRがあった時に動きます。`Checkout`や`Build`が仕事名です。`uses:`のところは、他人が作ってくれたワークフローを使う時に書く指示です。もちろん`run`姉ちゃんがコマンドです。

ビルドするだけだと単に成果物ができるだけで、公開までできません。そのため、`actions/deploy-pages@v4`を用いてデプロイまで行います。

注意：紛らわしいものに`actions/deploy-pages@v4`がありますが、これは**完全に別物**です。使うとエラーを吐きます。気をつけましょう。

このワークフローを動かすにあたって色々調べたのですが、あらかじめトークンを発行したりする必要は特にないようです。このファイルを黙って然るべきところに置けば、いい感じに動いてくれます。Github Actionsを有効化するための手順やボタンなども、特にありませんでした。

詳しい解説は…面倒なので勘で読むか、自力で調べてください😩

`.github/workflows/`下に、`適当な名前.yml`と名前をつけて保存します。これだけ。

#### できたファイルがおかしい

というわけで、自動ビルド機構ができました。あとはPushをして動かすだけです。ワクワク。

GitHub Actionsを使って、自動で実行！…したはずが、何かがおかしい。**Homeに`about.md`の内容がなぜだか載っている…**

`index.tsx`は以下のようになっていて、GraphQLの応答も正常です。そんなことになるのは絶対におかしい。一体どうして…

```tsx
  //index.tsxの一部
  return (
    <Layout>
      <Seo title="Home" />
      <Main>
        <Content>
          {!currentCategory ? <HomeDescription /> : null}
          <CategoryFilter categoryList={data.allMarkdownRemark.group} />
          <PostTitle>{postTitle}</PostTitle>
          <PostGrid posts={posts} />
        </Content>
      </Main>
    </Layout>
  )
```

```tsx
  //home.tsxの一部
  const HomeDescription = () => {
  const data = useStaticQuery<Queries.Query>(graphql`
    query HomeDescription {
      allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/home/" } }) {
        edges {
          node {
            html
          }
        }
      }
    }
  `)

  const markdown = data.allMarkdownRemark.edges[0].node.html

  return (
    <Container
      dangerouslySetInnerHTML={{ __html: markdown ?? "" }}
      rhythm={rhythm}
    ></Container>
  )
}
```

意を決してstackoverflowなどで質問をしてみるも、全く返ってきません（1日しか待ってないけど）。

しばらく待ったらちょっとコメントが付きましたが、「forkして見たけど再現できなかった」という回答でした。

#### 天啓

ここで閃きました。上のymlファイルには、OSを指定する行`runs-on: ubuntu-latest`があります。これを、例えば`windows-latest`や`windows-2022`に書き換えれば直るかもしれません。

ところが、これを書き換えると`yarn install`にあまりに長い時間がかかるようで（なんで？）、

```yml
run: yarn install --frozen-lockfile
```

を、

```yml
run: |
  yarn config set network-timeout 450000
  yarn install --frozen-lockfile
```

に書き換える必要がありました。ubuntuだとここはスムーズなので、かなり謎です。

ちなみに、この`--frozen-lockfile`は`yarn.lock`に入れたやつを読み込んでくれるようです。

私の環境で、1回のビルドのためのインストールに大体4〜6分ぐらいかかります。

そして、無事にビルドが完了しました。[このサイトのHome](/)に戻ればちゃんと動いているのがわかると思います。何を隠そう、このサイトはGithub Actionsから自動で作ったものです。えへん。

というわけで、無事に完了しました。やったぜ。

## まあまあ大事な余談：Github Actionsの利用可能時間について

Github Actionsは、Githubに処理を押し付けます。無限に押しつけられるわけもなく、制限があります。

制限はおよそ**月に2000分**です。今回作ったものでビルド時間を長めに見積もって20分/回とすると、月に100回ビルドができる計算になります。

…普通に使っていたら大丈夫そうですね！

### ローカルで本番環境をテストする方法

本番環境（プロダクションビルド）で動くか心配な方は、普通にローカルで`gatsby build`をし、完成したら`gatsby serve`をして動作を確認しましょう。それで問題なく検証できると思います。