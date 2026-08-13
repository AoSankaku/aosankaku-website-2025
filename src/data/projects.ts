import type { Lang } from "@/types/i18n";

export type ProjectImage =
  | "mirinkuyan"
  | "craftsky"
  | "station-sign"
  | "passphrase-generator-japanese"
  | "ultitype"
  | "cpsresume"
  | "cpu-partyparrot"
  | "moremobility"
  | "create-cities-server";

type ProjectKind =
  | "community"
  | "mod"
  | "plugin"
  | "server"
  | "tribute"
  | "web-app";
type ProjectAuthorship = "owner" | "third-party";
type ProjectStatus = "active" | "beta" | "private";
type ProjectSurface = "showcase";
type PublicationCategory = "app" | "service";

export interface Project {
  readonly id: string;
  readonly translationKey: `homepage.works.${string}`;
  readonly image: ProjectImage;
  readonly urls?: Readonly<Record<Lang, string>>;
  readonly kind: ProjectKind;
  readonly authorship: ProjectAuthorship;
  readonly status: ProjectStatus;
  readonly surfaces: readonly ProjectSurface[];
  readonly publication?: {
    readonly category: PublicationCategory;
    readonly order: number;
  };
}

export type PublishedProject = Project & {
  readonly urls: Readonly<Record<Lang, string>>;
  readonly publication: {
    readonly category: PublicationCategory;
    readonly order: number;
  };
};

export const projects: readonly Project[] = [
  {
    id: "mirinkuyan",
    translationKey: "homepage.works.mirinkuyan",
    image: "mirinkuyan",
    urls: {
      ja: "https://twitter.com/intent/follow?region=follow_link&screen_name=ymag_h",
      en: "https://twitter.com/intent/follow?region=follow_link&screen_name=ymag_h",
    },
    kind: "tribute",
    authorship: "third-party",
    status: "active",
    surfaces: ["showcase"],
  },
  {
    id: "craftsky",
    translationKey: "homepage.works.craftsky",
    image: "craftsky",
    urls: {
      ja: "https://crafters.aosankaku.net",
      en: "https://crafters.aosankaku.net",
    },
    kind: "community",
    authorship: "owner",
    status: "active",
    surfaces: ["showcase"],
    publication: { category: "service", order: 10 },
  },
  {
    id: "station-sign",
    translationKey: "homepage.works.station-sign",
    image: "station-sign",
    urls: {
      ja: "https://stationsigngen.aosankaku.net",
      en: "https://stationsigngen.aosankaku.net",
    },
    kind: "web-app",
    authorship: "owner",
    status: "beta",
    surfaces: ["showcase"],
    publication: { category: "app", order: 10 },
  },
  {
    id: "passphrase-generator-japanese",
    translationKey: "homepage.works.passphrase-generator-japanese",
    image: "passphrase-generator-japanese",
    urls: {
      ja: "https://pasufure-zu.aosankaku.net",
      en: "https://pasufure-zu.aosankaku.net",
    },
    kind: "web-app",
    authorship: "owner",
    status: "active",
    surfaces: ["showcase"],
    publication: { category: "app", order: 20 },
  },
  {
    id: "ultitype",
    translationKey: "homepage.works.ultitype",
    image: "ultitype",
    urls: {
      ja: "https://ultitype.aosankaku.net",
      en: "https://ultitype.aosankaku.net",
    },
    kind: "web-app",
    authorship: "owner",
    status: "active",
    surfaces: ["showcase"],
    publication: { category: "app", order: 30 },
  },
  {
    id: "cpsresume",
    translationKey: "homepage.works.cpsresume",
    image: "cpsresume",
    urls: {
      ja: "https://cpsresume.aosankaku.net",
      en: "https://cpsresume.aosankaku.net",
    },
    kind: "web-app",
    authorship: "owner",
    status: "active",
    surfaces: ["showcase"],
    publication: { category: "app", order: 40 },
  },
  {
    id: "cpu-partyparrot",
    translationKey: "homepage.works.cpu",
    image: "cpu-partyparrot",
    urls: {
      ja: "https://github.com/AoSankaku/cpu-partyparrot/releases",
      en: "https://github.com/AoSankaku/cpu-partyparrot/releases",
    },
    kind: "plugin",
    authorship: "owner",
    status: "active",
    surfaces: ["showcase"],
    publication: { category: "app", order: 50 },
  },
  {
    id: "moremobility",
    translationKey: "homepage.works.moremobility",
    image: "moremobility",
    urls: {
      ja: "https://modrinth.com/mod/moremobility",
      en: "https://modrinth.com/mod/moremobility",
    },
    kind: "mod",
    authorship: "third-party",
    status: "active",
    surfaces: ["showcase"],
  },
  {
    id: "create-cities-server",
    translationKey: "homepage.works.server",
    image: "create-cities-server",
    kind: "server",
    authorship: "owner",
    status: "private",
    surfaces: ["showcase"],
  },
] as const;

export function getShowcaseProjects(): readonly Project[] {
  return projects.filter((project) => project.surfaces.includes("showcase"));
}

function getPublishedProjects(
  category: PublicationCategory,
): readonly PublishedProject[] {
  return projects
    .filter(
      (project): project is PublishedProject =>
        project.authorship === "owner" &&
        project.publication?.category === category &&
        typeof project.urls?.ja === "string" &&
        typeof project.urls.en === "string" &&
        typeof project.publication.order === "number",
    )
    .toSorted(
      (left, right) => left.publication.order - right.publication.order,
    );
}

export function getPublishedApps(): readonly PublishedProject[] {
  return getPublishedProjects("app");
}

export function getPublishedServices(): readonly PublishedProject[] {
  return getPublishedProjects("service");
}
