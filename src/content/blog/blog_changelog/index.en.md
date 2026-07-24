---
title: "[Gatsby] Blog Tweaks and Fixes"
category: "Tech"
date: "2026-07-24T00:00:00+09:00"
originalDate: "2023-01-31T12:00:00+09:00"
desc: "This article explains the parts I changed from the template used for this blog."
thumbnail: "thumbnail.png"
alt: ""
tags:
- Frontend
- Gatsby
---

> [!NOTE]
> This article was initially translated with GPT-5.5 and then reviewed and edited by the author.

## Things I improved on this blog

This blog was made by borrowing a [template](https://github.com/sungik-choi/gatsby-starter-apple#readme), but of course, I changed various parts of it.
This time, I will introduce the parts I modified. It is mostly self-satisfaction, but please enjoy.

### Improvements, or customizations to my liking

#### Added text to Home

Since this is a blog template, it does not show any introductory text at the top by default. However, I wanted to use it as a homepage, so I rewrote it.
I changed a few places so that an image and text would appear.

Because of the GIF image, [the loading became slower](https://twitter.com/Ao_Sankaku/status/1620071091258691587), but I like it quite a bit, and the original site was terrifyingly fast, so I decided it was not that big of a problem. In the actual environment, it takes about one second anyway.

It is displayed only when the category is “All.” It would have been fine to keep showing it in other categories too, but apparently category switching involves URL navigation, so the page scrolls all the way back to the top. I thought, “Wait, is that not being rewritten as a component there...?” but maybe there are some constraints.
I tried to scroll it with JS, but ultimately failed, so I settled on this behavior.

#### Added pages

I wanted to separate Profile and About, so I added another page. I copied the entire contents of the tsx file and changed only the name. Creating a template file is probably the orthodox way to do it, but it was annoying, so I did not. Honestly, choosing Gatsby without really understanding that kind of thing was probably stupid.

#### Made images centered by default in Markdown

I changed this because I care about appearance. If I want to insert an image inside a paragraph, I use `<img>`, so there is no problem. If I write something like `![imagealt](https://image.com/image.jpg)`, the image will be centered.

#### Fixed transparent PNGs getting a white background in dark theme

I did not really understand what was happening, so I forcibly fixed it by writing CSS with `!important` in `styles/markdown.ts`. This is probably not a good way to do it, so I would like to fix it properly someday.

```css {diff}
+    box-shadow: none !important;
```

Apparently, you can make the background completely white with `box-shadow`.
Also, with this method, the background remains transparent when you save the image. Clever. But it was in the way, so goodbye.

#### Added a default image when no blog article image is specified

After doing this, the data returned from GraphQL became a complete mess, and depending on the settings, it started throwing errors at mysterious timings. I want to fix it because it is buggy, but the bug itself makes no sense, so I cannot fix it. Honestly, I am out of ideas.

### Bug fixes

#### Fixed bullet points and numbers not appearing in lists

* Like
* this

1. The numbers
2. and bullets
   were not showing, so I fixed them. There was something strange in the CSS.

```css
  ol {
    list-style-type: decimal;
  }
  ul {
    list-style-type: square;
  }
```

These were simply missing. But normally, if nothing is written, I feel like they should appear by default. Strange...

#### Bugs related to `og:image`

I fixed a bug where no image appeared at all when I threw the site onto social media. While I was at it, I also fixed the behavior when no default image was set.

### Should I commit this?

That is roughly what I changed, but since I fixed some bugs, I have been thinking that contributing back might not be a bad idea.

However, this account is completely separated from my real life, so even if I make an amazing commit, my real-world fame will not increase. Sad. I have vaguely considered taking work under the name “Blue Triangle.”
The main purpose would be contributing to a template I used, so maybe that is enough. I am being indecisive.
