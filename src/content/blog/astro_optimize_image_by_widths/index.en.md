---

title: "[Astro] How to Optimize Image Sizes Based on Screen Size"
category: "Tech"
date: "2026-06-30T13:15:00+09:00"
originalDate: "2026-01-28T00:30:00+09:00"
desc: "This article explains a super simple way to prepare multiple image sizes in Astro based on the screen width. You can optimize images effectively with just a few extra characters."
thumbnail: thumbnail.jpg
tags:
- Astro
- Frontend

---

> [!NOTE]
> This article was initially translated with GPT-5.5 and then reviewed and edited by the author.

## Conclusion

```astro
---
import { Image } from "astro:assets";
---

<Image
  src={imageSrc}
  alt={title}
  style="color: var(--color-background);"
  widths={[280, 350, imageSrc.width]}
  sizes="(max-width: 768px) 280px, 350px"
/>
```

Apparently, you can put it in like this. That is all it takes.

## What the heck is `widths`!?!?!?

Apparently, using this lets you generate multiple image variations. Amazing. That is really all there is to it, though.

It also seems that you can adjust the behavior by putting CSS-like values into `sizes`. Amazing.

## Official documentation

As of January 27, 2026, it is only available in English.

https://docs.astro.build/en/reference/modules/astro-assets/
