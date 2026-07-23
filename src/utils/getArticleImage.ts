import type { ImageMetadata } from "astro";
import ogDefaultImage from "@/assets/og-default.png";

const imageLoaders = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/blog/**/*.{jpeg,jpg,png,gif}",
);

export default async function getArticleImage(
  entryId: string,
  thumbnail: string | undefined,
) {
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
    const loadImage = imageLoaders[`/src/content/blog/${normalizedImagePath}`];

    if (loadImage) return (await loadImage()).default;
  }

  return ogDefaultImage;
}

export const getDefaultArticleImage = () => {
  return ogDefaultImage
}
