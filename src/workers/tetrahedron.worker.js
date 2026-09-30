import { createTetrahedronRenderer } from "../utils/tetrahedron-renderer.js";

let renderer = null;

self.onmessage = (event) => {
  const { type } = event.data;

  if (type === "init") {
    try {
      renderer = createTetrahedronRenderer(event.data.canvas, {
        width: event.data.width,
        height: event.data.height,
        dpr: event.data.dpr,
        isDark: event.data.isDark,
        reducedMotion: event.data.reducedMotion,
        visible: event.data.visible,
      });
      self.postMessage({ type: "ready" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      self.postMessage({ type: "renderer-error", message });
    }
    return;
  }

  if (!renderer) return;

  if (type === "resize") {
    renderer.resize(event.data.width, event.data.height, event.data.dpr);
  } else if (type === "theme") {
    renderer.setTheme(event.data.isDark);
  } else if (type === "visibility") {
    renderer.setVisible(event.data.visible);
  } else if (type === "motion") {
    renderer.setReducedMotion(event.data.reducedMotion);
  } else if (type === "stop") {
    renderer.dispose();
    renderer = null;
  }
};
