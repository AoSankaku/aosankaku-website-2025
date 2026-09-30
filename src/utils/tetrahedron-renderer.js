import {
  VERT_SRC,
  FRAG_SRC,
  buildGeometry,
  mat4TetrahedronProjection,
  mat4LookAt,
  mat4RotateY,
} from "./tetrahedron-webgl.js";

const ROTATION_RATE = 0.144;
const MIN_FRAME_INTERVAL = 1000 / 30;
const FRAME_INTERVAL_TOLERANCE = 0.5;
const MAX_ROTATION_STEP = 0.1;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate tetrahedron shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compile error";
    gl.deleteShader(shader);
    throw new Error(`Unable to compile tetrahedron shader: ${message}`);
  }

  return shader;
}

/**
 * Create one low-power WebGL1 renderer for the spinning tetrahedron.
 * The caller owns visibility and reduced-motion state so the same renderer can
 * be driven from either the page or an OffscreenCanvas worker.
 */
export function createTetrahedronRenderer(
  canvas,
  { width, height, dpr, isDark, reducedMotion, visible },
) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("WebGL1 is unavailable for the tetrahedron");

  let program = null;
  let vertexBuffer = null;
  let normalBuffer = null;
  let frameRequest = 0;
  let disposed = false;
  let currentWidth = width;
  let currentHeight = height;
  let currentDpr = dpr;
  let currentDark = isDark;
  let currentReducedMotion = reducedMotion;
  let currentVisible = visible;
  let angle = 0.35;
  let lastDrawTime = 0;
  const modelMatrix = new Float32Array(16);

  let uModel = null;
  let uAmbient = null;
  let uProjection = null;
  let vertexCount = 0;

  const releaseResources = () => {
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
    if (normalBuffer) gl.deleteBuffer(normalBuffer);
    if (program) gl.deleteProgram(program);
    vertexBuffer = null;
    normalBuffer = null;
    program = null;
  };

  try {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    let fragmentShader;
    try {
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    } catch (error) {
      gl.deleteShader(vertexShader);
      throw error;
    }

    program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error("Unable to allocate tetrahedron WebGL program");
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `Unable to link tetrahedron WebGL program: ${gl.getProgramInfoLog(program) || "Unknown program link error"}`,
      );
    }
    gl.useProgram(program);

    const geometry = buildGeometry();
    vertexCount = geometry.count;

    vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) throw new Error("Unable to allocate tetrahedron vertex buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "aPos");
    if (positionLocation < 0) throw new Error("Tetrahedron vertex shader has no aPos attribute");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    normalBuffer = gl.createBuffer();
    if (!normalBuffer) throw new Error("Unable to allocate tetrahedron normal buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
    const normalLocation = gl.getAttribLocation(program, "aNorm");
    if (normalLocation < 0) throw new Error("Tetrahedron vertex shader has no aNorm attribute");
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    uModel = gl.getUniformLocation(program, "uModel");
    uAmbient = gl.getUniformLocation(program, "uAmbient");
    uProjection = gl.getUniformLocation(program, "uProj");
    const uView = gl.getUniformLocation(program, "uView");
    if (!uModel || !uAmbient || !uProjection || !uView) {
      throw new Error("Tetrahedron WebGL shader is missing a required uniform");
    }

    gl.uniformMatrix4fv(uView, false, mat4LookAt(0, 0.5, 5.2, 0, 0, 0));
    gl.uniform1f(uAmbient, currentDark ? 0 : 1);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    const resizeBuffer = () => {
      const pixelRatio = Math.max(0.1, currentDpr || 1);
      const pixelWidth = Math.max(1, Math.round(currentWidth * pixelRatio));
      const pixelHeight = Math.max(1, Math.round(currentHeight * pixelRatio));
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.uniformMatrix4fv(
        uProjection,
        false,
        mat4TetrahedronProjection(currentWidth, currentHeight),
      );
    };

    const draw = () => {
      if (disposed) return;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uModel, false, mat4RotateY(angle, modelMatrix));
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    };

    const redraw = () => {
      if (!disposed && currentVisible) {
        draw();
        lastDrawTime = performance.now();
      }
    };

    const stopAnimation = () => {
      if (frameRequest) cancelAnimationFrame(frameRequest);
      frameRequest = 0;
      lastDrawTime = 0;
    };

    const animate = (time) => {
      frameRequest = 0;
      if (disposed || !currentVisible || currentReducedMotion) return;

      const elapsedMilliseconds = time - lastDrawTime;
      if (elapsedMilliseconds >= MIN_FRAME_INTERVAL - FRAME_INTERVAL_TOLERANCE) {
        const elapsedSeconds = Math.min(elapsedMilliseconds / 1000, MAX_ROTATION_STEP);
        angle += ROTATION_RATE * elapsedSeconds;
        draw();
        lastDrawTime = time;
      }
      frameRequest = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (disposed || !currentVisible || currentReducedMotion || frameRequest) return;
      lastDrawTime = performance.now();
      frameRequest = requestAnimationFrame(animate);
    };

    resizeBuffer();
    if (currentVisible) {
      draw();
      lastDrawTime = performance.now();
      startAnimation();
    }

    return {
      resize(nextWidth, nextHeight, nextDpr) {
        if (disposed) return;
        currentWidth = nextWidth;
        currentHeight = nextHeight;
        currentDpr = nextDpr;
        resizeBuffer();
        redraw();
      },
      setTheme(nextIsDark) {
        if (disposed || currentDark === nextIsDark) return;
        currentDark = nextIsDark;
        gl.uniform1f(uAmbient, currentDark ? 0 : 1);
        redraw();
      },
      setVisible(nextVisible) {
        if (disposed || currentVisible === nextVisible) return;
        currentVisible = nextVisible;
        if (!currentVisible) {
          stopAnimation();
          return;
        }
        redraw();
        if (!currentReducedMotion) startAnimation();
      },
      setReducedMotion(nextReducedMotion) {
        if (disposed || currentReducedMotion === nextReducedMotion) return;
        currentReducedMotion = nextReducedMotion;
        if (currentReducedMotion) {
          stopAnimation();
          redraw();
        } else if (currentVisible) {
          redraw();
          startAnimation();
        }
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        releaseResources();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      },
    };
  } catch (error) {
    disposed = true;
    releaseResources();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
}
