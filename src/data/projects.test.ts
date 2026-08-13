import { describe, expect, test } from "bun:test";
import { createProjectsManifest } from "@/utils/projectsManifest";
import {
  getPublishedApps,
  getPublishedServices,
  getShowcaseProjects,
  projects,
} from "./projects";

describe("project catalog", () => {
  test("keeps the current showcase order", () => {
    expect(getShowcaseProjects().map((project) => project.id)).toEqual([
      "mirinkuyan",
      "craftsky",
      "station-sign",
      "passphrase-generator-japanese",
      "ultitype",
      "cpsresume",
      "cpu-partyparrot",
      "moremobility",
      "create-cities-server",
    ]);
  });

  test("publishes apps and services separately", () => {
    const publishedApps = getPublishedApps();
    const publishedServices = getPublishedServices();

    expect(publishedApps.map((project) => project.id)).toEqual([
      "station-sign",
      "passphrase-generator-japanese",
      "ultitype",
      "cpsresume",
      "cpu-partyparrot",
    ]);
    expect(publishedServices.map((project) => project.id)).toEqual([
      "craftsky",
    ]);
    expect(
      [...publishedApps, ...publishedServices].every(
        (project) =>
          project.authorship === "owner" &&
          project.urls.ja &&
          project.urls.en,
      ),
    ).toBe(true);
  });

  test("uses unique stable IDs and HTTPS URLs", () => {
    const ids = projects.map((project) => project.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const project of projects) {
      if (project.urls) {
        expect(new URL(project.urls.ja).protocol).toBe("https:");
        expect(new URL(project.urls.en).protocol).toBe("https:");
      }
    }
  });
});

describe("apps manifest", () => {
  const createTestManifest = () =>
    createProjectsManifest(
      (image) => `https://aosankaku.net/icons/${image}.png`,
    );

  test("groups names, links, and icons into locale-specific sets", () => {
    const manifest = createTestManifest();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.apps).toHaveLength(5);
    expect(manifest.services).toHaveLength(1);
    expect(manifest.apps[0]).toEqual({
      id: "station-sign",
      locales: {
        ja: {
          name: "駅名標ジェネレーター",
          url: "https://stationsigngen.aosankaku.net",
          icon: "https://aosankaku.net/icons/station-sign.png",
        },
        en: {
          name: "Station Sign Generator",
          url: "https://stationsigngen.aosankaku.net",
          icon: "https://aosankaku.net/icons/station-sign.png",
        },
      },
    });
    expect(manifest.services[0].id).toBe("craftsky");
    expect(Object.keys(manifest)).toEqual([
      "schemaVersion",
      "apps",
      "services",
    ]);
  });

  test("does not leak translation keys into the public response", () => {
    const manifest = createTestManifest();

    for (const app of [...manifest.apps, ...manifest.services]) {
      for (const locale of ["ja", "en"] as const) {
        const localizedApp = app.locales[locale];

        expect(localizedApp.name).not.toStartWith("homepage.works.");
        expect(new URL(localizedApp.url).protocol).toBe("https:");
        expect(new URL(localizedApp.icon).protocol).toBe("https:");
        expect(Object.keys(localizedApp).sort()).toEqual([
          "icon",
          "name",
          "url",
        ]);
      }
      expect(Object.keys(app).sort()).toEqual(["id", "locales"]);
    }
  });
});
