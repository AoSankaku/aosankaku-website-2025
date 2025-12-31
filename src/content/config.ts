// @/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Helper function to force JST if no timezone is provided
const jstDateSchema = z.preprocess((arg) => {
  if (typeof arg === "string") {
    // 1. Replace slashes with dashes and the space with 'T'
    // Result: "2025-12-29 00:30" -> "2025-12-29T00:30"
    let formatted = arg.replaceAll("/", "-").replace(" ", "T");

    // 2. Check if it already has a timezone (Z or +/-)
    if (!formatted.match(/Z|[+-]\d{2}:?\d{2}$/)) {
      // 3. If it's just a date (no time), add T00:00. 
      // If it already has time, just append the offset.
      const hasTime = formatted.includes("T");
      return hasTime ? `${formatted}:00+09:00` : `${formatted}T00:00:00+09:00`;
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