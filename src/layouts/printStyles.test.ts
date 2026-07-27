import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "../..");

const readSharedLayout = () =>
  Bun.file(resolve(projectRoot, "src/layouts/Layout.astro")).text();

describe("shared print styles", () => {
  test("lets long pages flow across every printed page", async () => {
    const layout = await readSharedLayout();

    expect(layout).toMatch(
      /@media print\s*\{[\s\S]*?html,\s*body\s*\{[\s\S]*?height:\s*auto;[\s\S]*?max-width:\s*none;[\s\S]*?overflow:\s*visible;/,
    );
  });

  test("uses an opaque white background and dark text when printing", async () => {
    const layout = await readSharedLayout();

    expect(layout).toMatch(
      /@media print\s*\{[\s\S]*?:root,\s*\.dark\s*\{[\s\S]*?--color-text:\s*#1a1a1a;[\s\S]*?--color-text-sub:\s*rgba\(26,\s*26,\s*26,\s*0\.75\);[\s\S]*?--color-background:\s*#ffffff;/,
    );
    expect(layout).toMatch(
      /@media print\s*\{[\s\S]*?html,\s*body\s*\{[\s\S]*?background-color:\s*#ffffff;[\s\S]*?color:\s*#1a1a1a;/,
    );
  });
});
