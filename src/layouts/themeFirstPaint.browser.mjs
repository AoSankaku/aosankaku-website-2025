// Invoke from a Playwright harness with a page and the local production preview.
// CSS responses are held until the pre-stylesheet canvas has been inspected.
export default async function verifyThemeFirstPaint(page, baseURL = "http://127.0.0.1:24322") {
  const browser = await page.context().browser().browserType().launch({
    headless: true,
    channel: "chrome",
  });
  const results = [];
  try {
    for (const scenario of [
      { name: "saved dark, system light", saved: "dark", system: "light", expected: "dark" },
      { name: "first visit, system dark", saved: null, system: "dark", expected: "dark" },
      { name: "saved light, system dark", saved: "light", system: "dark", expected: "light" },
    ]) {
      const context = await browser.newContext({
        colorScheme: scenario.system,
        storageState: {
          cookies: [],
          origins: [{
            origin: baseURL,
            localStorage: scenario.saved ? [{ name: "theme", value: scenario.saved }] : [],
          }],
        },
      });
      let cssWaiters = [];
      const releaseCSS = () => {
        for (const resolve of cssWaiters) resolve();
        cssWaiters = [];
      };
      await context.route("**/*", async route => {
        if (new URL(route.request().url()).origin !== baseURL) return route.abort();
        if (route.request().resourceType() === "stylesheet") {
          await new Promise(resolve => cssWaiters.push(resolve));
        }
        return route.continue();
      });
      const tab = await context.newPage();
      const errors = [];
      tab.on("pageerror", error => errors.push(error.message));
      const cdp = await context.newCDPSession(tab);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      try {
        for (const kind of ["initial", "reload"]) {
          if (kind === "initial") await tab.goto(baseURL + "/blog/", { waitUntil: "commit" });
          else await tab.reload({ waitUntil: "commit" });
          await tab.waitForFunction(
            () => !!document.querySelector('link[rel="stylesheet"]'),
            null,
            { polling: 10 },
          );
          const inspect = () => {
            const root = document.documentElement;
            return {
              dark: root.classList.contains("dark"),
              background: getComputedStyle(root).backgroundColor,
              colorScheme: getComputedStyle(root).colorScheme,
              pendingStylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')]
                .filter(link => !link.sheet).length,
            };
          };
          const beforeCSS = await tab.evaluate(inspect);
          releaseCSS();
          await tab.waitForLoadState("load");
          const afterCSS = await tab.evaluate(inspect);
          const expectedBackground = scenario.expected === "dark"
            ? "rgb(26, 26, 26)"
            : "rgb(255, 255, 255)";
          results.push({
            scenario: scenario.name,
            kind,
            beforeCSS,
            afterCSS,
            passed: beforeCSS.pendingStylesheets > 0
              && [beforeCSS, afterCSS].every(sample =>
                sample.background === expectedBackground
                && sample.colorScheme === scenario.expected
                && sample.dark === (scenario.expected === "dark")),
          });
        }
        await tab.waitForFunction(() => document.getElementById("themeToggle"));
        await tab.locator("#themeToggle").click();
        await tab.waitForTimeout(550);
        const toggled = await tab.evaluate(() => ({
          dark: document.documentElement.classList.contains("dark"),
          colorScheme: getComputedStyle(document.documentElement).colorScheme,
        }));
        const expectedToggle = scenario.expected === "dark" ? "light" : "dark";
        if (toggled.colorScheme !== expectedToggle
          || toggled.dark !== (expectedToggle === "dark")) {
          throw new Error("Early styles prevent theme switching: " + JSON.stringify(toggled));
        }
        await tab.emulateMedia({ media: "print" });
        await tab.waitForFunction(() => getComputedStyle(document.documentElement).backgroundColor === "rgb(255, 255, 255)");
        const printed = await tab.evaluate(() => ({
          background: getComputedStyle(document.documentElement).backgroundColor,
          colorScheme: getComputedStyle(document.documentElement).colorScheme,
        }));
        if (printed.background !== "rgb(255, 255, 255)" || printed.colorScheme !== "light") {
          throw new Error("Early styles override print colors: " + JSON.stringify(printed));
        }
        if (errors.length) throw new Error(JSON.stringify(errors));
      } finally {
        releaseCSS();
        await context.close();
      }
    }
    const failed = results.filter(result => !result.passed);
    if (failed.length) throw new Error("Initial canvas is not ready before external CSS: " + JSON.stringify(failed));
    return results;
  } finally {
    await browser.close();
  }
}
