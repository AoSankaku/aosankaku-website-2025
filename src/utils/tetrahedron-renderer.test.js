import { describe, expect, test } from "bun:test";
import { createTetrahedronRenderer } from "./tetrahedron-renderer.js";

class FakeWebGLContext {
  constructor({ failShader = false } = {}) {
    Object.assign(this, {
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      COMPILE_STATUS: 3,
      LINK_STATUS: 4,
      ARRAY_BUFFER: 5,
      STATIC_DRAW: 6,
      FLOAT: 7,
      DEPTH_TEST: 8,
      COLOR_BUFFER_BIT: 16,
      DEPTH_BUFFER_BIT: 32,
    });
    this.failShader = failShader;
    this.drawCalls = [];
    this.modelMatrices = [];
    this.deletedBuffers = [];
    this.deletedPrograms = [];
    this.deletedShaders = [];
    this.contextLost = false;
    this.currentModel = null;
    this.viewports = [];
  }

  createShader(type) { return { type }; }
  shaderSource() {}
  compileShader() {}
  getShaderParameter(shader) { return !this.failShader || shader.type !== this.VERTEX_SHADER; }
  getShaderInfoLog() { return "mock shader failure"; }
  deleteShader(shader) { this.deletedShaders.push(shader); }
  createProgram() { return {}; }
  attachShader() {}
  linkProgram() {}
  getProgramParameter() { return true; }
  getProgramInfoLog() { return "mock link failure"; }
  deleteProgram(program) { this.deletedPrograms.push(program); }
  useProgram() {}
  createBuffer() { return {}; }
  bindBuffer() {}
  bufferData() {}
  getAttribLocation(_program, name) { return name === "aPos" ? 0 : 1; }
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  getUniformLocation(_program, name) { return name; }
  uniformMatrix4fv(location, _transpose, matrix) {
    if (location === "uModel") this.currentModel = matrix;
    this.modelMatrices.push({ location, matrix });
  }
  uniform1f() {}
  enable() {}
  clearColor() {}
  viewport(x, y, width, height) { this.viewports.push([x, y, width, height]); }
  clear() {}
  drawArrays(mode, first, count) {
    this.drawCalls.push({ mode, first, count, model: this.currentModel });
  }
  deleteBuffer(buffer) { this.deletedBuffers.push(buffer); }
  getExtension(name) {
    return name === "WEBGL_lose_context"
      ? { loseContext: () => { this.contextLost = true; } }
      : null;
  }
}

function installAnimationClock() {
  let now = 0;
  let nextId = 1;
  const frames = new Map();
  const original = {
    performance: Object.getOwnPropertyDescriptor(globalThis, "performance"),
    requestAnimationFrame: Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame"),
    cancelAnimationFrame: Object.getOwnPropertyDescriptor(globalThis, "cancelAnimationFrame"),
  };

  Object.defineProperty(globalThis, "performance", {
    configurable: true,
    value: { now: () => now },
  });
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: (callback) => {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
  });
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    configurable: true,
    value: (id) => frames.delete(id),
  });

  return {
    tick(time) {
      now = time;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(time));
    },
    pendingFrames: () => frames.size,
    restore() {
      for (const [key, descriptor] of Object.entries(original)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

function createCanvas(gl) {
  const contextRequests = [];
  return {
    width: 300,
    height: 150,
    contextRequests,
    getContext(type, options) {
      contextRequests.push({ type, options });
      return type === "webgl" ? gl : null;
    },
  };
}

const defaultOptions = {
  width: 320,
  height: 250,
  dpr: 1.5,
  isDark: false,
  reducedMotion: false,
  visible: true,
};

describe("tetrahedron renderer", () => {
  test("allocates a 2x backing buffer for the cropped desktop drawing area", () => {
    const clock = installAnimationClock();
    const gl = new FakeWebGLContext();
    const canvas = createCanvas(gl);
    let renderer;

    try {
      renderer = createTetrahedronRenderer(canvas, {
        ...defaultOptions,
        width: 256,
        height: 200,
        dpr: 2,
      });

      expect(canvas.width).toBe(512);
      expect(canvas.height).toBe(400);
      expect(gl.viewports).toEqual([[0, 0, 512, 400]]);
    } finally {
      renderer?.dispose();
      clock.restore();
    }
  });

  test("draws at most 30fps with one draw call and reuses its model matrix", () => {
    const clock = installAnimationClock();
    const gl = new FakeWebGLContext();
    const canvas = createCanvas(gl);
    let renderer;

    try {
      renderer = createTetrahedronRenderer(canvas, defaultOptions);
      expect(canvas.contextRequests).toEqual([{
        type: "webgl",
        options: { alpha: true, antialias: true, powerPreference: "low-power" },
      }]);
      expect(gl.drawCalls).toHaveLength(1);
      expect(gl.drawCalls[0].count).toBe(60);

      clock.tick(16.6);
      expect(gl.drawCalls).toHaveLength(1);
      clock.tick(33.2);
      expect(gl.drawCalls).toHaveLength(2);
      clock.tick(49.8);
      expect(gl.drawCalls).toHaveLength(2);
      clock.tick(66.4);
      expect(gl.drawCalls).toHaveLength(3);
      expect(gl.drawCalls[1].model).toBe(gl.drawCalls[0].model);
      expect(gl.drawCalls[2].model).toBe(gl.drawCalls[0].model);
      expect(gl.drawCalls.every((call) => call.count === 60)).toBe(true);
    } finally {
      renderer?.dispose();
      clock.restore();
    }
  });

  test("pauses while invisible and resumes without advancing through the pause", () => {
    const clock = installAnimationClock();
    const gl = new FakeWebGLContext();
    let renderer;

    try {
      renderer = createTetrahedronRenderer(createCanvas(gl), defaultOptions);
      clock.tick(34);
      const angleBeforePause = gl.drawCalls.at(-1).model[0];

      renderer.setVisible(false);
      expect(clock.pendingFrames()).toBe(0);
      clock.tick(10000);
      expect(gl.drawCalls).toHaveLength(2);

      renderer.setVisible(true);
      expect(gl.drawCalls).toHaveLength(3);
      expect(gl.drawCalls.at(-1).model[0]).toBeCloseTo(angleBeforePause, 6);
      clock.tick(10016);
      expect(gl.drawCalls).toHaveLength(3);
      clock.tick(10034);
      expect(gl.drawCalls).toHaveLength(4);
      expect(gl.drawCalls.at(-1).model[0]).not.toBeCloseTo(angleBeforePause, 6);
    } finally {
      renderer?.dispose();
      clock.restore();
    }
  });

  test("clamps rotation after a long frame stall", () => {
    const clock = installAnimationClock();
    const gl = new FakeWebGLContext();
    let renderer;

    try {
      renderer = createTetrahedronRenderer(createCanvas(gl), defaultOptions);
      clock.tick(1000);
      expect(gl.drawCalls).toHaveLength(2);
      expect(gl.drawCalls.at(-1).model[0]).toBeCloseTo(Math.cos(0.35 + 0.1 * 0.144), 6);
    } finally {
      renderer?.dispose();
      clock.restore();
    }
  });

  test("reduced motion renders static updates and dispose releases GPU resources", () => {
    const clock = installAnimationClock();
    const gl = new FakeWebGLContext();
    let renderer;

    try {
      renderer = createTetrahedronRenderer(createCanvas(gl), {
        ...defaultOptions,
        reducedMotion: true,
      });
      expect(clock.pendingFrames()).toBe(0);
      expect(gl.drawCalls).toHaveLength(1);

      renderer.resize(240, 250, 1.5);
      renderer.setTheme(true);
      expect(gl.drawCalls).toHaveLength(3);
      expect(clock.pendingFrames()).toBe(0);

      renderer.dispose();
      renderer = null;
      expect(gl.deletedBuffers).toHaveLength(2);
      expect(gl.deletedPrograms).toHaveLength(1);
      expect(gl.contextLost).toBe(true);
    } finally {
      renderer?.dispose();
      clock.restore();
    }
  });

  test("reports shader compilation failures and releases the partial context", () => {
    const clock = installAnimationClock();
    const gl = new FakeWebGLContext({ failShader: true });

    try {
      expect(() => createTetrahedronRenderer(createCanvas(gl), defaultOptions))
        .toThrow("mock shader failure");
      expect(gl.deletedShaders).toHaveLength(1);
      expect(gl.contextLost).toBe(true);
      expect(clock.pendingFrames()).toBe(0);
    } finally {
      clock.restore();
    }
  });
});
