// @/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Helper function to force JST if no timezone is provided
const jstDateSchema = z.preprocess((arg) => {
  if (typeof arg === "string") {
    // If the string doesn't contain 'Z' or a +/- offset, append JST (+09:00)
    if (!arg.match(/Z|[+-]\d{2}:?\d{2}$/)) {
      return `${arg} +09:00`;
    }
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