---
title: "【Gatsby】GraphQLから返ってくるクエリを強制的に上書きする方法"
category: "Tech"
date: "2025-04-27T14:31:00+09:00"
desc: "このサイトはブログなので、「関連記事」があると理想的です。これを「GraphQL経由で適当に取得できたらいいな～」と思い、カスタムリゾルバに手を出したら沼にハマりました。動くコードをお教えします。"
tags:
  - Gatsby
  - フロントエンド
  - GraphQL
---

## 実現したいこと

- ブログにタグ機能をつける
- カテゴリ（これはもとからあった）及びタグからすべての「関連記事候補」を持ってくる
- ビルドするたびに関連記事が大きくランダムに変わっては困るので、記事の内容に基づきUUIDを生成し、それを乱数のシードとして使用し、「関連記事候補」からいくつかの記事をセレクトする

## コード本体

勝手にコピペしたり参考にしてもらってOKです。

### gatsby-node.js

gatsby-nodeです。

```js title=gatsby-node.js
const path = require(`path`)
const _ = require("lodash")
const normalizeTagName = require("./src/functions/normalizeTagName")
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `posts` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const mainTemplate = path.resolve(`./src/pages/index.tsx`)
  const blogPostTemplate = path.resolve(`./src/templates/blogPost.tsx`)
  const tagPageTemplate = path.resolve(`./src/templates/tag.tsx`)

  const result = await graphql(`
    {
      postsRemark: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/(posts/blog)/" } }
        sort: { frontmatter: { date: DESC } }
        limit: 2000
      ) {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
      categoriesGroup: allMarkdownRemark(limit: 2000) {
        group(field: { frontmatter: { category: SELECT } }) {
          fieldValue
          totalCount
        }
      }
      tags: allMarkdownRemark {
        group(field: { frontmatter: { tags: SELECT } }) {
          fieldValue
          totalCount
        }
      }
    }
  `)

  const posts = result.data.postsRemark.edges

  posts.forEach(({ node }, index) => {
    console.log(index)
    //古い記事のほうが番号が多い仕様があるらしい、ふざけるな
    const next = index == posts.length - 1 ? null : posts[index + 1].node;
    const prev = index == 0 ? null : posts[index - 1].node;

    createPage({
      path: node.fields.slug,
      component: blogPostTemplate,
      context: {
        slug: node.fields.slug,
        index: index,
        //ひっくり返しておく
        previous: index == posts.length - 1 ? "" : next.fields.slug,
        next: index == 0 ? "" : prev.fields.slug,
      },
    })
  })

  const categories = result.data.categoriesGroup.group

  categories.forEach(category => {
    createPage({
      path: `/category/${_.kebabCase(category.fieldValue)}/`,
      component: mainTemplate,
      context: {
        category: category.fieldValue,
      },
    })
  })

  const tags = result.data.tags.group
  tags.forEach(e => {
    createPage({
      path: `/tags/${normalizeTagName(e.fieldValue)}`,
      component: tagPageTemplate,
      context: {
        tag: normalizeTagName(e.fieldValue),
        rawTag: e.fieldValue
      },
    })
  })
}

exports.createResolvers = ({ createResolvers }) => {
  const resolvers = {
    MarkdownRemark: {
      relatedPostsByCategory: {
        type: ['MarkdownRemark'],
        resolve: async (source, args, context, info) => {
          const { entries } = await context.nodeModel.findAll({
            query: {
              filter: {
                id: {
                  ne: source.id,
                },
                frontmatter: {
                  category: {
                    eq: source.frontmatter.category,
                  },
                },
              },
            },
            type: 'MarkdownRemark',
          })
          return entries
        },
      },
      relatedPostsByTag: {
        type: ['MarkdownRemark'],
        resolve: async (source, args, context, info) => {
          if (typeof source.frontmatter.tags === undefined) return [];
          if (!Array.isArray(source.frontmatter.tags)) return [];
          console.log(source.frontmatter.tags)
          const { entries } = await context.nodeModel.findAll({
            query: {
              filter: {
                id: {
                  ne: source.id,
                },
                frontmatter: {
                  tags: {
                    in: source.frontmatter.tags,
                  },
                },
              },
            },
            type: 'MarkdownRemark',
          })
          return entries
        },
      },
    },
  }

  createResolvers(resolvers)
}
```

### normalizeTagName.js

タグ名をノーマライズ（gatsbyが処理できる正しいパスの形式）にします。

```js title=normalizeTagName.js
//import tagAliases from "./tagAliases"
const tagAliases = require("./tagAliases")
const _ = require("lodash")

const normalizeTagName = (name) => {
  //const passReg = /[0-9a-z\-]+/
  const semiPassReg = /[0-9a-zA-Z\-\s]+/

  const target = tagAliases.names.find(e => e.original === name)

  if (typeof target !== "undefined") return _.kebabCase(target.normalized)

  //if (name.match(passReg)?.join('') === name) return name

  if (name.match(semiPassReg)?.join('') === name) return _.kebabCase(name)

  throw new SyntaxError(
    `The tag name "${name}" is neither be able to be transformed nor defined in tagAliases.js`
  )
}

//export default normalizeTagName

module.exports = normalizeTagName
```

### tagAliases.js

そのままケバブケースを適用すると奇妙な見た目になるものや、日本語（そもそもケバブケースを適用できない）場合に使用します。すべて手動で定義する必要があります。

```js title=tagAliases.js

const tagAliases = {
  names: [
    {
      original: "GitHub",
      normalized: "github"
    },
    {
      original: "GitHub Actions",
      normalized: "github-actions"
    },
    {
      original: "ウディタ",
      normalized: "woditor"
    },
    {
      original: "サーバー",
      normalized: "server"
    },
    {
      original: "パソコン",
      normalized: "pc"
    },
    {
      original: "コンパス（ソシャゲ）",
      normalized: "compass"
    },
    {
      original: "Google+",
      normalized: "google-plus",
    },
  ]
}

//export default tagAliases　…だと読み込めないため注意
module.exports = tagAliases
```

### RelatedArticlesList.tsx

記事のIDと「関連記事候補」を渡すと関連記事を順位付けし、その順番で返します。

```tsx title=RelatedArticlesList.tsx
import React from "react"
import xorShiftArray from "Functions/xorShiftArray"
import { Link } from "gatsby"

type Props = {
  articleId: string;
  //そのうち直す（）
  relatedPosts: {
    frontmatter: {
      date: string;
      title: string;
    }
    fields: {
      slug: string
    }
  }[];
}

//同じタグ（実装予定）から2、同じカテゴリから1、他にランダムに2を取り出す
//…とかそんな複雑な処理作れるわけ無いやん！ｗ

const RelatedArticlesList: React.FC<Props> = ({ articleId, relatedPosts }) => {

  //定数定義
  const relatedArticlesCount = 5

  console.dir(typeof (relatedPosts))

  //どうやらcreateResolversで作ったやつはsortできないらしい…ポンコツかよ…
  //しょうがないので、dateを取得することを前提としてsortを進める
  const sortedRelatedPosts = relatedPosts.sort(
    (a, b) =>
      (new Date(a.frontmatter.date)).getTime() - (new Date(b.frontmatter.date).getTime())
  )

  //sort完了後、articleId（UUID）を基に関連記事の番号を（ランダムだけど一意に）決定する
  //アルゴリズムはXorShift
  const articleIdHex = (articleId).replace(/-/g, "")
  const slicedArticleIdHex = articleIdHex.slice(0, 8)
  const slicedArticleIdDec = parseInt(slicedArticleIdHex, 16)

  const relatedArticleIds = xorShiftArray(slicedArticleIdDec, relatedArticlesCount, 0, relatedPosts.length - 1, false)
    .sort((a, b) => b - a)

  console.log(relatedArticleIds)

  const RelatedArticlesListItems = () => {
    const list = relatedArticleIds.map(id => {
      console.log(relatedPosts[id].frontmatter.title)
      return (
        <li key={relatedPosts[id].fields.slug}><Link to={relatedPosts[id].fields.slug}>{relatedPosts[id].frontmatter.title}</Link></li>
      )
    })
    return list
  }


  return (
    <ul>
      <RelatedArticlesListItems />
    </ul>
  )
}

export default RelatedArticlesList
```

### xorShiftArray.ts

「シード値を指定して乱数を生成する」アルゴリズムを実現するための関数です。

```ts title=xorShiftArray.ts
//Thanks to https://sbfl.net/blog/2017/06/01/javascript-reproducible-random/
//and people on みすてむず
/*

- @NakaKoma@misskey.systems
- @renoa_ts@misskey.systems
- @tarosan5924@misskey.systems
- @nakano@misskey.systems
- @tanakanira@misskey.systems
- @poc_popoyama@misskey.systems
- @leino@misskey.systems

on Misskey

*/

class Random {
  x: number;
  y: number;
  z: number;
  w: number;
  constructor(seed = 88779784379) {
    this.x = 8517089798;
    this.y = 1236314524;
    this.z = 8972134563;
    this.w = seed;
  }
  next() {
    let t;
    t = this.x ^ (this.x << 11);
    this.x = this.y; this.y = this.z; this.z = this.w;
    return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
  }
  nextInt(min: number, max: number) {
    const r = Math.abs(this.next())
    return min + (r % (max + 1 - min))
  }
}

type XorShiftArray = {
  (seed: number, count: number, min?: number, max?: number, canDuplicate?: boolean): number[];
}

const xorShiftArray: XorShiftArray = (seed, count, min, max, canDuplicate) => {

  //countが0未満なら強制停止
  if (count !== undefined && count < 0) {
    throw new RangeError(
      `Argument "count" can't be a negative number as useXorShift will run infinitely with such value (your current value is: ${count})`
    )
  }

  if (min !== undefined && max === undefined) {
    console.warn(`Only min is defined and max is undefined. Ignoring min value...`)
  }

  if (min !== undefined && max !== undefined && min > max) {
    console.warn(`Argument min (${min}) is larger than max (${max}). Swapping the two...`);
    [min, max] = [max, min]
  }

  //countで実現可能な個数がmax-min+1（整数範囲）より大きいなら、無限ループに入るので強制的に数値減少
  if (count !== undefined && min !== undefined && max !== undefined && count > Math.abs(max - min) + 1) {
    const size = Math.abs(max - min) + 1
    console.warn(
      `useXorShift will run infinitely because ${count} (count) is larger than ${size} (the number of integers in the specified range ${min} to ${max}). Reducing 'count' to ${size} automatically.`
    )
    count = max - min + 1
  }

  const gen = () => {
    return (min === undefined || max === undefined) ? random.next() : random.nextInt(min, max)
  }

  const random = new Random(seed)

  const result: number[] = []
  for (let i = 0; i < count; i++) {
    let n = gen()
    canDuplicate !== undefined && !canDuplicate && result.includes(n) ? i-- : result.push(n)
  }
  return result
}

export default xorShiftArray
```

## 備考

この記事は、実は下書きしてから1年以上寝かせていたものです。なので、もともとのコードがどんなのだったか1ミリも覚えていません。

しかし、GitHub様が過去のファイルを残してくれているため、Diffの併記は可能です。一応おいておきます。

```diff lang="js"
 const path = require(`path`)
 const _ = require("lodash")
+const normalizeTagName = require("./src/functions/normalizeTagName")
 const { createFilePath } = require(`gatsby-source-filesystem`)

 exports.onCreateNode = ({ node, getNode, actions }) => {
   const { createNodeField } = actions
   if (node.internal.type === `MarkdownRemark`) {
     const slug = createFilePath({ node, getNode, basePath: `posts` })
     createNodeField({
       node,
       name: `slug`,
       value: slug,
     })
   }
 }

 exports.createPages = async ({ graphql, actions }) => {
   const { createPage } = actions

   const mainTemplate = path.resolve(`./src/pages/index.tsx`)
   const blogPostTemplate = path.resolve(`./src/templates/blogPost.tsx`)
+  const tagPageTemplate = path.resolve(`./src/templates/tag.tsx`)

   const result = await graphql(`
     {
       postsRemark: allMarkdownRemark(
         filter: { fileAbsolutePath: { regex: "/(posts/blog)/" } }
         sort: { frontmatter: { date: DESC } }
         limit: 2000
       ) {
         edges {
           node {
             fields {
               slug
             }
           }
         }
       }
       categoriesGroup: allMarkdownRemark(limit: 2000) {
         group(field: { frontmatter: { category: SELECT } }) {
           fieldValue
           totalCount
         }
       }
+      tags: allMarkdownRemark {
+        group(field: { frontmatter: { tags: SELECT } }) {
+          fieldValue
+          totalCount
+        }
+      }
     }
   `)

   const posts = result.data.postsRemark.edges

-  posts.forEach(({ node }) => {
+  posts.forEach(({ node }, index) => {
+    console.log(index)
+    //古い記事のほうが番号が多い仕様があるらしい、ふざけるな
+    const next = index == posts.length - 1 ? null : posts[index + 1].node;
+    const prev = index == 0 ? null : posts[index - 1].node;

     createPage({
       path: node.fields.slug,
       component: blogPostTemplate,
       context: {
         slug: node.fields.slug,
+        index: index,
+        //ひっくり返しておく
+        previous: index == posts.length - 1 ? "" : next.fields.slug,
+        next: index == 0 ? "" : prev.fields.slug,
       },
     })
   })

   const categories = result.data.categoriesGroup.group

   categories.forEach(category => {
     createPage({
       path: `/category/${_.kebabCase(category.fieldValue)}/`,
       component: mainTemplate,
       context: {
         category: category.fieldValue,
       },
     })
   })

+  const tags = result.data.tags.group
+  tags.forEach(e => {
+    createPage({
+      path: `/tags/${normalizeTagName(e.fieldValue)}`,
+      component: tagPageTemplate,
+      context: {
+        tag: normalizeTagName(e.fieldValue),
+        rawTag: e.fieldValue
+      },
+    })
+  })
 }

+exports.createResolvers = ({ createResolvers }) => {
+  const resolvers = {
+    MarkdownRemark: {
+      relatedPostsByCategory: {
+        type: ['MarkdownRemark'],
+        resolve: async (source, args, context, info) => {
+          const { entries } = await context.nodeModel.findAll({
+            query: {
+              filter: {
+                id: {
+                  ne: source.id,
+                },
+                frontmatter: {
+                  category: {
+                    eq: source.frontmatter.category,
+                  },
+                },
+              },
+            },
+            type: 'MarkdownRemark',
+          })
+          return entries
+        },
+      },
+      relatedPostsByTag: {
+        type: ['MarkdownRemark'],
+        resolve: async (source, args, context, info) => {
+          if (typeof source.frontmatter.tags === undefined) return [];
+          if (!Array.isArray(source.frontmatter.tags)) return [];
+          console.log(source.frontmatter.tags)
+          const { entries } = await context.nodeModel.findAll({
+            query: {
+              filter: {
+                id: {
+                  ne: source.id,
+                },
+                frontmatter: {
+                  tags: {
+                    in: source.frontmatter.tags,
+                  },
+                },
+              },
+            },
+            type: 'MarkdownRemark',
+          })
+          return entries
+        },
+      },
+    },
+  }
+
+  createResolvers(resolvers)
+}
```