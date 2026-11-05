import { describe, expect, test } from "bun:test";
import { runInNewContext } from "node:vm";

const layout = await Bun.file(new URL("./Layout.astro", import.meta.url)).text();
const themeScript = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
if (!themeScript) throw new Error("The shared layout must initialize the theme inline");

const createRoot = (initialClasses: string[] = []) => {
  const classes = new Set(initialClasses);
  return {
    classList: {
      contains: (name: string) => classes.has(name),
      toggle(name: string, enabled: boolean) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
    },
  };
};

function initializeTheme(storedTheme: string | null, prefersDark = false) {
  const listeners = new Map<string, ((event: unknown) => void)[]>();
  const document = {
    documentElement: createRoot(),
    addEventListener(name: string, listener: (event: unknown) => void) {
      const callbacks = listeners.get(name) ?? [];
      callbacks.push(listener);
      listeners.set(name, callbacks);
    },
  };
  const storage = new Map(storedTheme ? [["theme", storedTheme]] : []);

  runInNewContext(themeScript!, {
    document,
    localStorage: { getItem: (key: string) => storage.get(key) ?? null },
    window: { matchMedia: () => ({ matches: prefersDark }) },
  });

  return {
    document,
    storage,
    prepareIncomingPage(initialClasses: string[] = []) {
      const newDocument = { documentElement: createRoot(initialClasses) };
      for (const listener of listeners.get("astro:before-swap") ?? []) {
        listener({ newDocument });
      }
      return newDocument.documentElement;
    },
  };
}

describe("theme initialization", () => {
  test.each([
    ["dark", false, true],
    ["light", true, false],
    [null, true, true],
    [null, false, false],
  ] as const)("saved=%s, system dark=%s initializes dark=%s", (saved, system, dark) => {
    const { document } = initializeTheme(saved, system);
    expect(document.documentElement.classList.contains("dark")).toBe(dark);
  });
});

describe("theme continuity during navigation", () => {
  test.each(["dark", null])("prepares the incoming dark page before swapping (saved=%s)", (saved) => {
    const { document, prepareIncomingPage } = initializeTheme(saved, true);
    const incoming = prepareIncomingPage(["incoming-page"]);

    expect(incoming.classList.contains("dark")).toBe(true);
    expect(incoming.classList.contains("incoming-page")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("removes a stale dark theme when the saved preference is light", () => {
    const { prepareIncomingPage } = initializeTheme("light", true);
    expect(prepareIncomingPage(["dark"]).classList.contains("dark")).toBe(false);
  });

  test("uses the latest selection for every subsequent navigation", () => {
    const { storage, prepareIncomingPage } = initializeTheme("light");
    storage.set("theme", "dark");
    expect(prepareIncomingPage().classList.contains("dark")).toBe(true);

    storage.set("theme", "light");
    expect(prepareIncomingPage(["dark"]).classList.contains("dark")).toBe(false);
  });
});
