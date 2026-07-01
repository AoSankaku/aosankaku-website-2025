// Shared native-WebGL utilities for the spinning tetrahedron.
// Used by both the OffscreenCanvas worker and the main-thread fallback.

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

// Camera position is constant so it's a shader constant rather than a uniform.
export const FRAG_SRC = `
precision mediump float;
varying vec3 vNorm;
varying vec3 vWorldPos;
uniform float uAmbient;
const vec3  BASE_LIGHT = vec3(0.0, 0.467, 1.0);
const vec3  BASE_DARK  = vec3(0.0, 0.39, 1.0);
const float METAL      = 0.92;
const vec3  LPOS      = vec3(0.0, 6.0, 7.0);
const float LINT      = 120.0;
const vec3  AUX_LPOS = vec3(6.5, 3.2, 3.8);
const float AUX_LINT = 58.0;
const vec3  AUX_TINT = vec3(0.0, 0.24, 0.72);
const float AUX_SHININESS = 42.0;
const float AUX_SPEC = 0.50;
const float AUX_WRAP = 0.18;
const vec3  CAM       = vec3(0.0, 0.5, 5.2);
const float SHININESS = 96.0;
const vec3  HEMI_LOW  = vec3(0.015, 0.035, 0.09);
const vec3  HEMI_HIGH = vec3(0.03, 0.16, 0.40);
const float DARK_FILL = 0.45;
void main(){
  vec3 N   = normalize(vNorm);
  vec3 V   = normalize(CAM - vWorldPos);
  vec3 toL = LPOS - vWorldPos;
  vec3 L   = normalize(toL);
  float att  = LINT / dot(toL, toL);
  float NdL  = max(dot(N, L), 0.0);
  vec3 base   = mix(BASE_DARK, BASE_LIGHT, uAmbient);
  vec3 diff  = (1.0 - METAL) * base * NdL * att;
  vec3 H     = normalize(L + V);
  float NdH  = max(dot(N, H), 0.0);
  float NdV  = max(dot(N, V), 0.0);
  vec3 F0    = mix(vec3(0.04), base, METAL);
  vec3 spec  = (F0 + vec3(0.15, 0.18, 0.28)) * pow(NdH, SHININESS) * att;
  vec3 toBackL = AUX_LPOS - vWorldPos;
  vec3 backL   = normalize(toBackL);
  float backAtt = AUX_LINT / dot(toBackL, toBackL);
  float backNdL = max(dot(N, backL), 0.0);
  float backMix = mix(1.0, 0.32, uAmbient);
  vec3 backColor = mix(base, AUX_TINT, 0.72);
  vec3 backDiff  = (1.0 - METAL) * backColor * backNdL * backAtt * 1.15 * backMix;
  vec3 backH     = normalize(backL + V);
  float backNdH  = max(dot(N, backH), 0.0);
  vec3 backSpec  = (F0 + AUX_TINT * 0.45) * pow(backNdH, AUX_SHININESS) * backAtt * AUX_SPEC * backMix;
  float backWrap = pow(clamp(dot(N, backL) * 0.45 + 0.55, 0.0, 1.0), 3.0);
  vec3 backSheen = AUX_TINT * backWrap * backAtt * AUX_WRAP * backMix;
  vec3 R     = reflect(-V, N);
  float skyMix = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
  float horizon = pow(1.0 - abs(R.y), 2.0);
  vec3 env   = mix(vec3(0.06, 0.09, 0.16), vec3(0.46, 0.68, 1.0), skyMix)
             + vec3(0.10, 0.20, 0.38) * horizon;
  float fresnel = pow(1.0 - NdV, 3.0);
  vec3 refl  = env * (0.13 + 0.34 * fresnel) * mix(1.0, 0.35, uAmbient);
  vec3 amb   = base * mix(0.20, 0.85, uAmbient);
  float hemiMix = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 fill  = mix(HEMI_LOW, HEMI_HIGH, hemiMix) * DARK_FILL * (1.0 - uAmbient);
  vec3 c     = amb + diff + spec + backDiff + backSpec + backSheen + refl + fill;
  c = c / (c + 1.0);
  gl_FragColor = vec4(c, 1.0);
}`;

// ── Geometry ─────────────────────────────────────────────────────────────────

/**
 * Build a flat-shaded regular tetrahedron matching Three.js's
 * TetrahedronGeometry(1, 0) after its initial orientation transform:
 *   - rotate around (1,0,-1)/sqrt(2) by atan(sqrt(2))
 *   - translate (0, 1/3, 0)
 *
 * Returns { positions: Float32Array, normals: Float32Array, count: 12 }
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

  const pos = [],
    nrm = [];
  for (const [i0, i1, i2] of faces) {
    const [p0, p1, p2] = [verts[i0], verts[i1], verts[i2]];
    const e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const e2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    let nx = e1[1] * e2[2] - e1[2] * e2[1];
    let ny = e1[2] * e2[0] - e1[0] * e2[2];
    let nz = e1[0] * e2[1] - e1[1] * e2[0];
    const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
    nx /= l;
    ny /= l;
    nz /= l;
    pos.push(...p0, ...p1, ...p2);
    nrm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  }

  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(nrm),
    count: 12,
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
export function mat4RotateY(angle) {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}
