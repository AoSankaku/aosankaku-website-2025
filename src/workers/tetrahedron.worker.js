import { Scene } from "three/src/scenes/Scene.js";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera.js";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import { TetrahedronGeometry } from "three/src/geometries/TetrahedronGeometry.js";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial.js";
import { Mesh } from "three/src/objects/Mesh.js";
import { AmbientLight } from "three/src/lights/AmbientLight.js";
import { PointLight } from "three/src/lights/PointLight.js";
import { Vector3 } from "three/src/math/Vector3.js";
import { Matrix4 } from "three/src/math/Matrix4.js";

let renderer, camera, tetrahedron, ambientLight;
let animating = false;

function init(canvas, width, height, isDark) {
  const scene = new Scene();
  camera = new PerspectiveCamera(35, width / height, 0.1, 1000);

  renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  const maxPixelRatio = width < 768 ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(self.devicePixelRatio ?? 1, maxPixelRatio));
  renderer.setSize(width, height, false);

  ambientLight = new AmbientLight(0xffffff, isDark ? 0.3 : 8);
  scene.add(ambientLight);

  const pointLight = new PointLight(0xffffff, 30);
  pointLight.position.set(0, 6, 7);
  scene.add(pointLight);

  const radius = 1;
  const geometry = new TetrahedronGeometry(radius, 0);

  const upAxis = new Vector3(1, 0, -1).normalize();
  const angle = Math.atan(Math.sqrt(2));
  const rotationMatrix = new Matrix4().makeRotationAxis(upAxis, angle);
  geometry.applyMatrix4(rotationMatrix);
  geometry.translate(0, radius / 3, 0);

  const material = new MeshStandardMaterial({
    color: 0x0077ff,
    metalness: 0.8,
    roughness: 0.35,
  });

  tetrahedron = new Mesh(geometry, material);
  scene.add(tetrahedron);

  camera.position.z = 5.2;
  camera.position.y = 0.5;

  animating = true;
  const animate = () => {
    if (!animating) return;
    self.requestAnimationFrame(animate);
    tetrahedron.rotation.y += 0.002;
    renderer.render(scene, camera);
  };
  animate();
}

self.onmessage = (e) => {
  const { type } = e.data;
  if (type === "init") {
    init(e.data.canvas, e.data.width, e.data.height, e.data.isDark);
  } else if (type === "resize") {
    if (!renderer || !camera) return;
    camera.aspect = e.data.width / e.data.height;
    camera.updateProjectionMatrix();
    renderer.setSize(e.data.width, e.data.height, false);
  } else if (type === "theme") {
    if (ambientLight) ambientLight.intensity = e.data.isDark ? 0.3 : 8;
  } else if (type === "stop") {
    animating = false;
    renderer?.dispose();
  }
};
