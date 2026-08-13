import {
  getPublishedApps,
  getPublishedServices,
  type ProjectImage,
  type PublishedProject,
} from "@/data/projects";
import { t } from "@/i18n/utils";

const PROJECTS_SCHEMA_VERSION = 1 as const;

interface LocalizedProject {
  readonly name: string;
  readonly url: string;
  readonly icon: string;
}

interface PublishedManifestProject {
  readonly id: string;
  readonly locales: {
    readonly ja: LocalizedProject;
    readonly en: LocalizedProject;
  };
}

export interface ProjectsManifest {
  readonly schemaVersion: typeof PROJECTS_SCHEMA_VERSION;
  readonly apps: readonly PublishedManifestProject[];
  readonly services: readonly PublishedManifestProject[];
}

function localizeProjects(
  projects: readonly PublishedProject[],
  resolveIconUrl: (image: ProjectImage) => string,
): readonly PublishedManifestProject[] {
  return projects.map((project) => {
    const icon = resolveIconUrl(project.image);

    return {
      id: project.id,
      locales: {
        ja: {
          name: t("ja", `${project.translationKey}.title`),
          url: project.urls.ja,
          icon,
        },
        en: {
          name: t("en", `${project.translationKey}.title`),
          url: project.urls.en,
          icon,
        },
      },
    };
  });
}

export function createProjectsManifest(
  resolveIconUrl: (image: ProjectImage) => string,
): ProjectsManifest {
  return {
    schemaVersion: PROJECTS_SCHEMA_VERSION,
    apps: localizeProjects(getPublishedApps(), resolveIconUrl),
    services: localizeProjects(getPublishedServices(), resolveIconUrl),
  };
}
