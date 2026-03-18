import {
  VERT_SRC, FRAG_SRC,
  buildGeometry,
  mat4Perspective, mat4LookAt, mat4RotateY,
} from '../utils/tetrahedron-webgl.js';

let gl, prog;
let uModelLoc, uAmbientLoc, uProjLoc;
let rotY = 0, animating = false;

function init(canvas, width, height, isDark) {
  gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
  if (!gl) {
    self.postMessage({ type: 'webgl-unsupported' });
    return;
  }

  // Set drawing-buffer resolution
  const maxDpr = width < 768 ? 1.5 : 2;
  const dpr = Math.min(self.devicePixelRatio ?? 1, maxDpr);
  canvas.width  = Math.round(width  * dpr);
  canvas.height = Math.round(height * dpr);

  // Compile shaders
  function makeShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  }
  prog = gl.createProgram();
  gl.attachShader(prog, makeShader(gl.VERTEX_SHADER,   VERT_SRC));
  gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, FRAG_SRC));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Upload geometry
  const geo = buildGeometry();

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, geo.positions, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

  const nrmBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
  gl.bufferData(gl.ARRAY_BUFFER, geo.normals, gl.STATIC_DRAW);
  const aNorm = gl.getAttribLocation(prog, 'aNorm');
  gl.enableVertexAttribArray(aNorm);
  gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);

  // Cache uniform locations
  uModelLoc   = gl.getUniformLocation(prog, 'uModel');
  uAmbientLoc = gl.getUniformLocation(prog, 'uAmbient');
  uProjLoc    = gl.getUniformLocation(prog, 'uProj');

  // Set static uniforms
  gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uView'), false,
    mat4LookAt(0, 0.5, 5.2, 0, 0, 0));
  gl.uniformMatrix4fv(uProjLoc, false,
    mat4Perspective(35, width / height, 0.1, 1000));
  gl.uniform1f(uAmbientLoc, isDark ? 0.0 : 1.0);

  // GL state
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.viewport(0, 0, canvas.width, canvas.height);

  animating = true;
  const animate = () => {
    if (!animating) return;
    rotY += 0.002;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uModelLoc, false, mat4RotateY(rotY));
    gl.drawArrays(gl.TRIANGLES, 0, 12);
    self.requestAnimationFrame(animate);
  };
  animate();
}

self.onmessage = (e) => {
  const { type } = e.data;
  if (type === 'init') {
    init(e.data.canvas, e.data.width, e.data.height, e.data.isDark);
  } else if (type === 'resize') {
    if (!gl || !prog) return;
    const { width, height } = e.data;
    const maxDpr = width < 768 ? 1.5 : 2;
    const dpr = Math.min(self.devicePixelRatio ?? 1, maxDpr);
    gl.canvas.width  = Math.round(width  * dpr);
    gl.canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.uniformMatrix4fv(uProjLoc, false, mat4Perspective(35, width / height, 0.1, 1000));
  } else if (type === 'theme') {
    if (uAmbientLoc) gl.uniform1f(uAmbientLoc, e.data.isDark ? 0.0 : 1.0);
  } else if (type === 'stop') {
    animating = false;
    if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
};
