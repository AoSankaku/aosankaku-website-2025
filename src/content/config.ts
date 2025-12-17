import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().catch("---untitled---"),
    desc: z.string().optional(),
    date: z.coerce.date().catch(new Date(100000)),
    lastUpdate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
  })
});

export const collections = { blog };