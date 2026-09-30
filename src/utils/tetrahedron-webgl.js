// Shared native-WebGL utilities for the spinning tetrahedron.
// Used by both the OffscreenCanvas worker and the main-thread fallback.

// The object occupies the upper half of the original 250/400px scene.
// Crop its transparent margins so 2x supersampling stays inexpensive.
export const DRAW_HEIGHT_FRACTION = 0.5;
export const DRAW_TOP_FRACTION = 0.06;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v) => {
  const length = Math.hypot(...v);
  return v.map((component) => component / length);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

function studioPanel(direction, width, height, color) {
  const normal = normalize(direction);
  const right = normalize(cross([0, 1, 0], normal));
  return { normal, right, up: cross(normal, right), width, height, color };
}

const STUDIO_PANELS = [
  studioPanel([-0.3, 1.2, 1.8], 0.30, 0.8, [3.8, 3.9, 4.0]),
  studioPanel([1.6, 0.3, 1.0], 0.13, 1.3, [2.8, 3.2, 3.8]),
  studioPanel([-0.8, 0.4, -1.8], 0.35, 1.0, [1.8, 2.4, 3.4]),
  studioPanel([-1.8, 1.2, 0.3], 0.65, 0.12, [3.4, 3.6, 3.8]),
];

// Bake only four light bases into the shader, rather than a sampled image.
// Explicit calls work in WebGL1 without dynamic uniform-array indexing.
const glslVec3 = (values) => `vec3(${values.map((value) => value.toFixed(9)).join(", ")})`;
const STUDIO_REFLECTIONS = STUDIO_PANELS.map((panel) =>
  `  color += studioPanel(direction, ${glslVec3(panel.normal)}, ${glslVec3(panel.right)}, ${glslVec3(panel.up)}, vec2(${panel.width.toFixed(3)}, ${panel.height.toFixed(3)}), ${glslVec3(panel.color)});`
).join("\n");

// ── Shaders ─────────────────────────────────────────────────────────────────

export const VERT_SRC = `
attribute vec3 aPos;
attribute vec3 aNorm;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
varying vec3 vNorm;
varying vec3 vWorldPos;
void main(){
  vec4 wp = uModel * vec4(aPos, 1.0);
  vWorldPos = wp.xyz;
  vNorm = normalize(mat3(uModel) * aNorm);
  gl_Position = uProj * uView * wp;
}`;

// Continuous studio reflections avoid magnifying a low-resolution cubemap.
// Blue-tinted conductor reflectance supplies the color without a diffuse fill.
export const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vNorm;
varying vec3 vWorldPos;
uniform float uAmbient;
const vec3 CAM = vec3(0.0, 0.5, 5.2);
const vec3 METAL_COLOR = vec3(0.075, 0.22, 0.52);
const float PANEL_FEATHER = 0.12;

vec3 studioPanel(vec3 direction, vec3 normal, vec3 right, vec3 up, vec2 extent, vec3 radiance) {
  float facing = dot(direction, normal);
  if (facing <= 0.01) return vec3(0.0);
  vec2 point = vec2(dot(direction, right), dot(direction, up)) / facing;
  vec2 mask = smoothstep(vec2(-PANEL_FEATHER), vec2(PANEL_FEATHER), extent - abs(point));
  return radiance * mask.x * mask.y;
}

vec3 sampleStudio(vec3 direction) {
  float sky = direction.y * 0.5 + 0.5;
  float horizon = 1.0 - abs(direction.y);
  vec3 color = vec3(0.023, 0.029, 0.042)
    + vec3(0.13, 0.15, 0.195) * sky
    + vec3(0.045, 0.052, 0.065) * horizon;
${STUDIO_REFLECTIONS}
  return min(vec3(4.0), color);
}

void main(){
  vec3 N = normalize(vNorm);
  vec3 V = normalize(CAM - vWorldPos);
  float grazing = 1.0 - max(dot(N, V), 0.0);
  float g2 = grazing * grazing;
  vec3 fresnel = METAL_COLOR + (1.0 - METAL_COLOR) * g2 * g2 * grazing;
  vec3 environment = sampleStudio(reflect(-V, N));
  float exposure = mix(1.2, 1.0, uAmbient);
  vec3 c = environment * fresnel * exposure;
  c = sqrt(c / (c + 0.7));
  gl_FragColor = vec4(c, 1.0);
}`;

// ── Geometry ─────────────────────────────────────────────────────────────────

/**
 * Build a subtly bevelled regular tetrahedron matching Three.js's
 * TetrahedronGeometry(1, 0) after its initial orientation transform:
 *   - rotate around (1,0,-1)/sqrt(2) by atan(sqrt(2))
 *   - translate (0, 1/3, 0)
 *
 * Four main faces, six edge strips and four corner caps (20 triangles).
 */
export function buildGeometry() {
  const s = 1.0 / Math.sqrt(3);
  // Four vertices of a regular tetrahedron inscribed in the unit sphere
  const raw = [
    [s, s, s],
    [-s, -s, s],
    [-s, s, -s],
    [s, -s, -s],
  ];

  // Rodrigues rotation: axis k=(1,0,-1)/sqrt(2), angle=atan(sqrt(2))
  // cos(atan(sqrt(2))) = 1/sqrt(3), sin = sqrt(2/3), 1-cos = 1 - 1/sqrt(3)
  const cosA = 1.0 / Math.sqrt(3);
  const sinA = Math.sqrt(2.0 / 3.0);
  const omcA = 1.0 - cosA;
  const kx = 1.0 / Math.sqrt(2),
    kz = -1.0 / Math.sqrt(2);

  function rotVec([vx, vy, vz]) {
    const dot = kx * vx + kz * vz; // k · v  (ky=0)
    const cx = -kz * vy; // (k × v).x
    const cy = kz * vx - kx * vz; // (k × v).y
    const cz = kx * vy; // (k × v).z
    return [
      vx * cosA + cx * sinA + kx * dot * omcA,
      vy * cosA + cy * sinA, // ky=0 → no k.y term
      vz * cosA + cz * sinA + kz * dot * omcA,
    ];
  }

  const ty = 1.0 / 3.0; // translate Y by radius/3
  const verts = raw.map((v) => {
    const r = rotVec(v);
    return [r[0], r[1] + ty, r[2]];
  });

  // Face index sets matching Three.js PolyhedronGeometry CCW winding
  const faces = [
    [2, 1, 0],
    [0, 3, 2],
    [1, 3, 0],
    [2, 3, 1],
  ];

  const bevel = 0.025;
  const insetFaces = faces.map((indices) => {
    const points = indices.map((index) => verts[index]);
    const center = points[0].map((_, axis) =>
      (points[0][axis] + points[1][axis] + points[2][axis]) / 3);
    const normal = normalize(cross(
      points[1].map((value, axis) => value - points[0][axis]),
      points[2].map((value, axis) => value - points[0][axis]),
    ));
    return indices.map((index) => ({
      index,
      position: verts[index].map((value, axis) => value * (1 - bevel) + center[axis] * bevel),
      normal,
    }));
  });
  const pos = [], nrm = [];
  function addTriangle(a, b, c) {
    const geometricNormal = cross(
      b.position.map((value, axis) => value - a.position[axis]),
      c.position.map((value, axis) => value - a.position[axis]),
    );
    const outward = a.normal.map((value, axis) => value + b.normal[axis] + c.normal[axis]);
    const facesOutward = dot(geometricNormal, outward) > 0;
    const triangle = facesOutward ? [a, b, c] : [a, c, b];
    // A planar chamfer catches light like a cut metal edge. Interpolating the
    // main-face normals across it makes a rounded, continuously bright rim.
    const normal = normalize(facesOutward ? geometricNormal : geometricNormal.map((value) => -value));
    for (const vertex of triangle) {
      pos.push(...vertex.position);
      nrm.push(...normal);
    }
  }
  for (const face of insetFaces) addTriangle(...face);
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const adjacent = insetFaces.filter((face) =>
        face.some((vertex) => vertex.index === i) && face.some((vertex) => vertex.index === j));
      const [a, b] = adjacent.map((face) => [
        face.find((vertex) => vertex.index === i), face.find((vertex) => vertex.index === j),
      ]);
      addTriangle(a[0], b[0], b[1]);
      addTriangle(a[0], b[1], a[1]);
    }
    const corner = insetFaces.flat().filter((vertex) => vertex.index === i);
    addTriangle(...corner);
  }

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nrm),
    count: pos.length / 3,
  };
}

// ── Matrix helpers (column-major, for WebGL) ──────────────────────────────────

/** Perspective projection matrix. fovDeg is vertical field-of-view in degrees. */
export function mat4Perspective(fovDeg, aspect, near, far) {
  const f = 1.0 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ]);
}

/** Preserve the original camera and screen position in the cropped canvas. */
export function mat4TetrahedronProjection(width, height) {
  const sceneHeight = height / DRAW_HEIGHT_FRACTION;
  const projection = mat4Perspective(35, width / sceneHeight, 0.1, 1000);
  projection[5] /= DRAW_HEIGHT_FRACTION;
  projection[9] = (1 - 2 * DRAW_TOP_FRACTION - DRAW_HEIGHT_FRACTION) / DRAW_HEIGHT_FRACTION;
  return projection;
}

/**
 * View matrix for a camera at (ex,ey,ez) looking at (cx,cy,cz), world-up=(0,1,0).
 */
export function mat4LookAt(ex, ey, ez, cx, cy, cz) {
  // forward = normalize(center - eye)
  let fx = cx - ex,
    fy = cy - ey,
    fz = cz - ez;
  const fl = Math.sqrt(fx * fx + fy * fy + fz * fz);
  fx /= fl;
  fy /= fl;
  fz /= fl;

  // right = normalize(cross(forward, world-up=(0,1,0)))
  //   cross(f,(0,1,0)) = (-fz, 0, fx)
  let sx = -fz,
    sz = fx;
  const sl = Math.sqrt(sx * sx + sz * sz);
  sx /= sl;
  sz /= sl; // sy = 0

  // true-up = cross(right, forward)
  const ux = -sz * fy; // sy*fz - sz*fy,  sy=0
  const uy = sz * fx - sx * fz;
  const uz = sx * fy; // sx*fy - sy*fx,  sy=0

  return new Float32Array([
    sx,
    ux,
    -fx,
    0,
    0,
    uy,
    -fy,
    0,
    sz,
    uz,
    -fz,
    0,
    -(sx * ex + sz * ez), // -dot(s, eye), sy=0
    -(ux * ex + uy * ey + uz * ez), // -dot(u, eye)
    fx * ex + fy * ey + fz * ez,
    1, //  dot(f, eye)
  ]);
}

/** Y-axis rotation matrix (right-handed, column-major). */
export function mat4RotateY(angle, target = new Float32Array(16)) {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  target[0] = c; target[1] = 0; target[2] = -s; target[3] = 0;
  target[4] = 0; target[5] = 1; target[6] = 0; target[7] = 0;
  target[8] = s; target[9] = 0; target[10] = c; target[11] = 0;
  target[12] = 0; target[13] = 0; target[14] = 0; target[15] = 1;
  return target;
}
