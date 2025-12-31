// @/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Helper function to force JST if no timezone is provided
const jstDateSchema = z.preprocess((arg) => {
  if (typeof arg === "string") {
    let formatted = arg.replaceAll("/", "-");

    if (!formatted.match(/Z|[+-]\d{2}:?\d{2}$/)) {
      return `${formatted}T00:00:00+09:00`;
    }
    return formatted;
  }
  return arg;
}, z.coerce.date());

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().catch("---untitled---"),
    desc: z.string().optional(),
    // Use the custom JST schema here
    date: jstDateSchema.catch(new Date(100000)),
    lastUpdate: jstDateSchema.optional(),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    alt: z.string().default("Blog Article Image"),
    category: z.string().default("Uncategorized")
  })
});

export const collections = { blog };