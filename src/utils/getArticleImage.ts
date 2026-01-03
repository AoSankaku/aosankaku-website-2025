import type { ImageMetadata } from "astro";
import ogDefaultImage from "@/assets/og-default.png";

const images = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/blog/**/*.{jpeg,jpg,png,gif}",
  { eager: true }
);

export default function getArticleImage(slug: string, thumbnail: string | undefined) {
  if (!slug) { return ogDefaultImage }
  const path = `/src/content/blog/${slug
    .replace(/^\/blog\//, '')
    .replace(/\/$/, '')
    }/${thumbnail ? thumbnail.replace(/^\.\//, "") : "null"}`;
  return images[path]?.default ?? ogDefaultImage;
}

export const getDefaultArticleImage = () => {
  return ogDefaultImage
}