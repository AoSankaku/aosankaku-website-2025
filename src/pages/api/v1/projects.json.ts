import type { APIRoute } from "astro";
import { projectImages } from "@/data/projectImages";
import { createProjectsManifest } from "@/utils/projectsManifest";

export const prerender = true;

export const GET: APIRoute = () => {
  const manifest = createProjectsManifest((image) =>
    new URL(projectImages[image].src, "https://aosankaku.net").href,
  );

  return new Response(`${JSON.stringify(manifest, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
