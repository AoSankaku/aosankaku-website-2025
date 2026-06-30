---

title: "[Astro] I Tried Applying a Layout to Blog Posts Without Using Frontmatter and Fell Into a Swamp"
category: "Tech"
date: "2026-06-30T13:10:00+09:00"
originalDate: "2025-12-22 23:00"
desc: "While moving my site, I decided to migrate all of my blog posts as they were. I could not easily find a way to apply a layout without touching the frontmatter, so I am writing down how I did it."
tags:
- Astro
- Frontend

---

> [!NOTE]
> This article was initially translated with GPT-5.5 and then reviewed and edited by the author.

As I mentioned in [this article](../moved_to_astro/), I moved from Gatsby to Astro. Ah, comfortable, comfortable... except there was one problem.

In Astro, if you want to apply a layout to a page generated from Markdown, you need to add it to the frontmatter.

```astro
---
layout: '../../layouts/BlogLayout.astro'
---
```

If you are not running the site as a blog, and you have no plans to move away from Astro for a while, this is convenient because you can flexibly decide which layout to apply on a page-by-page basis.

However, if you want to run it purely as a blog, things get annoying very quickly once the article directory structure becomes a bit complicated. For example, if you have things you want to group together, such as `/blog/some-series/1/` and `/blog/some-series/2/`, specifying the layout becomes a pain. It also becomes a source of mistakes. Astro does not throw an error on the development screen even if you specify an invalid layout, so you do not know what caused the issue until you build it. Annoying.

Also, `layout` is ultimately an Astro-specific format, so there is a possibility of getting locked in. If you move to something else in the future, you could manually wiggle the `layout` field around, but that is annoying. There is also no guarantee that the destination framework will support it.

So I ended up looking for a convenient way to:

* keep the current blog article directory structure,
* apply a layout to all blog posts,
* and do it without touching the frontmatter.

## Conclusion: Implementation

### Creating a collection

First, create `/src/content/` for the blog. The `content` part can be whatever you want, and then place `config.ts` there. If you are using JavaScript, rewrite it with determination... or rather, there is no real TypeScript-specific part here, so you can probably just make it `config.js`.

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// As the name "defineCollection" suggests, this defines a collection.
// If a blog post has a property that is not defined here,
// or if a required property is missing,
// it will throw an error during development or build.
const blog = defineCollection({
  // Specify the directory to scan.
  // This excludes files starting with "_"! Since it is just a regular expression,
  // feel free to change it however you like.
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
  schema: z.object({
  // If you add ".catch", it overwrites the value when the contents are invalid,
  // such as when an array is placed in a title field.
  // If you add ".optional", the value can be omitted.
  // If you add ".default", that becomes the default value,
  // and the field can also be omitted.
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

// If you export it with the name "collections",
// in this case a collection named "blog" will be created.
// You can also export another object in the same way from an unrelated file.
export const collections = { blog };
```

What this is doing is, as written in the comments, exporting a collection named `blog`. It becomes available from anywhere.

If you are used to this kind of thing, you have probably already realized that you can also manually create collections in other ways, or generate pages from a plain JSON file. Terrifying flexibility.

### Custom routing

By the way, Astro has a feature that lets you customize routing.

https://docs.astro.build/en/guides/routing/

Using this, create a file called `/src/pages/blog/[...slug].astro`. Ah, `[]` is not a placeholder. Type it literally as-is. Incidentally, if you want the actual displayed path to be `https://my-site.gov/articles/something/` instead of `https://my-site.gov/blog/something/`, you can create it at `/src/pages/articles/[...slug].astro`.

```astro title="/src/pages/blog/[...slug].astro"
---
// Functions for fetching articles and rendering pages
import { getCollection, render } from "astro:content";
// The layout you want to apply to everything
// Make this somewhere in advance.
import BlogArticleLayout from "@/layouts/BlogArticleLayout.astro";

// Exporting a function with this name enables page rendering.
export async function getStaticPaths() {
  // Fetch articles inside "/src/content/blog".
  // Incidentally, images and similar files are not treated as pages,
  // so if you put images in the same directory as blog posts,
  // they will no longer cause errors either.
  const posts = await getCollection("blog");

  return posts.map((post) => {
    // Remove "index" from the path just in case it is included.
    // This is not really necessary.
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

<!--Sandwich it with your preferred layout-->
<BlogArticleLayout frontmatter={post.data} headings={headings} slug={slug}>
  <Content />
</BlogArticleLayout>
```

After that, create the actual layout however you like. That is all.

## Explanation

In Astro, if you throw `.astro`, `.md`, or `.mdx` files under `pages`, they become pages as-is. This is extremely convenient, but unfortunately there is no way to batch-apply a layout to `.md` files placed there, or to all files inside a specific directory.

So this approach assumes that all blog posts are moved into `/src/content/blog/`, and that you create files such as `hogehoge.md` or `hogehoge/index.md` there, then apply the layout only to the `.md` files inside that collection.

Looking back at what it does, it is very simple. You create a group called a collection in `config.ts`, load it in `[...slug].astro`, decide the path, and render the contents. Incidentally, `/src/content/` is originally a folder that Astro does not automatically recognize as pages, so you can use any name you like.

The strangely named `[...slug].astro` file under `/src/pages/blog/` comes from the custom routing mechanism. If you place this file in `/src/pages/blog/`, then when a user accesses `https://my-site.gov/blog/hogehoge/`, Astro can route them to an article generated from the collection even if `/src/pages/blog/hogehoge.astro` or `/src/pages/blog/hogehoge.md` does not exist.

### Note

When you use this routing, the logs will be full of 404s, but if you can actually see the blog posts in the development environment, it is fine to ignore them.

## There seems to be an official implementation request too?

There seems to be an issue asking for something like “please let us batch-specify layouts for `.md` files inside a specific directory,” but at the moment there is no sign of it being implemented.

https://github.com/withastro/roadmap/discussions/172

It was considered once in 2022, but in the end, no official implementation has arrived.

## Another possible solution: Dynamically rewriting frontmatter

Apparently, this is possible.

https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically

Astro lets you create your own plugin shockingly easily. In this case, all you need to do is create one file and add about one to three lines to `astro.config.mjs`. However, the example is for `customProperty`, and I do not know whether it can be applied to `layout`.

In my case, I wanted to apply the layout only to blog articles, so I did not adopt this approach. If you are fine with applying a layout to all Markdown files, this might be easier.

## Closing

There was nothing particularly complicated, and I was able to implement it almost instantly, so I ended up laughing dryly at how easy it was. People who are touching JavaScript for the first time may still find this difficult, but it is mostly copy-and-paste friendly.

And, to be completely honest, this code was almost entirely AI-generated. Interesting. Astro is still a relatively new framework, but its structure is so simple and clear that even AI-generated code barely makes mistakes. We might as well use it heavily.

Actually, if you make the collection part fetch data from a remote source, you could build a headless CMS integration without installing any additional packages, right? Astro is terrifying. Too easy.
