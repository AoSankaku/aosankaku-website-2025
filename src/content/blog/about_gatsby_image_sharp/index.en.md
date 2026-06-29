---

title: "[Gatsby] What Even Is gatsby-plugin-sharp, Anyway?"
category: "Tech"
date: "2025-04-26T23:06:00+09:00"
desc: "Gatsby has a plugin called gatsby-plugin-sharp that does nice things to images. But what exactly is this \"sharp\" thing? I looked into it a bit."
tags:
- Frontend
- Gatsby

---

> [!NOTE]
> This article was initially translated with GPT-5.5 and then reviewed and edited by the author.

When working with images in Gatsby projects, I often use a plugin called `gatsby-plugin-sharp`. Apparently, it automatically handles things like image optimization and responsive images. Or maybe it does. Probably.

But then I had a thought.

**What is this “sharp” in the name, anyway?**

That whole “wait, what?” thing was happening.

I was vaguely curious, so I decided to look it up. With some help from AI.

## What `sharp` actually is

To get straight to the point, `sharp` is the name of an image processing library for Node.js. `gatsby-plugin-sharp` seems to be a plugin that integrates this powerful `sharp` library with Gatsby’s GraphQL layer and makes it easier to use.

## What `sharp` can do

`sharp` can do various kinds of image processing. And it is fast.

* **Resize:** You can freely change the size of an image.
* **Format conversion:** You can convert images into various formats such as JPEG, PNG, WebP, and AVIF.
* **Optimization:** You can reduce file size while maintaining image quality.
* **Cropping:** You can crop out part of an image.
* **Rotation and flipping:** You can rotate images or flip them horizontally or vertically.
* **Color adjustment:** You can adjust brightness, contrast, saturation, and so on.
* **Blur and sharpening:** You can blur an image or, conversely, sharpen it.

By running these kinds of processing steps automatically during Gatsby’s build process, it can apparently embed **fast and optimized images** into your website. Huh.

## Official website

https://sharp.pixelplumbing.com

Sharp has an official website. It is not only useful with Gatsby, but also when doing various image-related things in Node.js, so it may be worth trying out. You can even do something like “generate a bunch of images by rotating every image in a specific folder by 6 degrees.”

```js
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Folder path containing the images you want to rotate
const inputFolderPath = './input_images';
// Folder path where the rotated images will be saved
const outputFolderPath = './rotated_images';
// Rotation angle in degrees
const rotateAngle = 6;

async function processImages() {
  try {
    // Create the output folder if it does not exist
    await fs.mkdir(outputFolderPath, { recursive: true });

    // Get the list of files in the input folder
    const files = await fs.readdir(inputFolderPath);

    for (const file of files) {
      const inputFile = path.join(inputFolderPath, file);
      const outputFile = path.join(outputFolderPath, `rotated_${file}`);

      try {
        // Check the file extension to determine whether it is an image file
        // This is only a simple check
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff'].includes(ext)) {
          // Load the image with sharp, rotate it, and save it
          await sharp(inputFile)
            .rotate(rotateAngle)
            .toFile(outputFile);

          console.log(`Rotated and saved: ${outputFile}`);
        } else {
          console.log(`Skipping non-image file: ${inputFile}`);
        }
      } catch (error) {
        console.error(`Error processing ${inputFile}:`, error);
      }
    }

    console.log('All images processed!');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

processImages();
```

I have no idea what you would use this for.

At a quick glance, I do not think it will go completely out of control, but I had AI write it fairly casually, so use it at your own risk.

Naturally, before running it, you will need to run something like `npm i sharp` or `yarn add sharp` inside your project directory. Be careful.

## Afterword

This article was made by having Bing AI write it and then pointlessly editing it a lot.

However, it wrote about a plugin called `gatsby-image-sharp`, which does not exist — or maybe it exists but is extremely minor — and that properly alarmed me. You really cannot take AI output at face value. Editing is mandatory.

...or so I thought, but it turned out that I was simply misremembering `gatsby-plugin-sharp` as `gatsby-image-sharp`.

The AI was not at fault, though it also did not point out my mistake. I would like to build the habit of at least checking the title before publishing.
