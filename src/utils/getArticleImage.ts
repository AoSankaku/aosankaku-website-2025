import type { ImageMetadata } from "astro";
import ogDefaultImage from "@/assets/og-default.png";

const images = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/blog/**/*.{jpeg,jpg,png,gif}",
  { eager: true }
);

export default function getArticleImage(entryId: string, thumbnail: string | undefined) {
  if (!entryId) { return ogDefaultImage }
  const normalizedEntryId = entryId
    .replace(/^\/(?:[a-z][a-z0-9-]*\/)?blog\//i, "")
    .replace(/^\/+|\/+$/g, "");
  const parentDirectory = normalizedEntryId.split("/").slice(0, -1).join("/");
  const candidateDirectories = [normalizedEntryId, parentDirectory];

  for (const directory of candidateDirectories) {
    const relativeImagePath = `${directory}/${thumbnail ?? "null"}`;
    const normalizedImagePath = relativeImagePath.split("/").reduce<string[]>(
      (segments, segment) => {
        if (!segment || segment === ".") return segments;
        if (segment === "..") {
          segments.pop();
          return segments;
        }

        segments.push(segment);
        return segments;
      },
      [],
    ).join("/");
    const image = images[`/src/content/blog/${normalizedImagePath}`]?.default;

    if (image) return image;
  }

  return ogDefaultImage;
}

export const getDefaultArticleImage = () => {
  return ogDefaultImage
}
