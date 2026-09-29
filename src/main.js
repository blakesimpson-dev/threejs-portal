import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {setupDebug} from './debug.js';
import {createFireflies} from './fireflies.js';
import {createMaterials} from './materials.js';
import {MAX_PIXEL_RATIO, SETTINGS} from './settings.js';
import './style.css';

const canvas = document.querySelector('canvas.webgl');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(SETTINGS.fog.color, SETTINGS.fog.density);

const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setClearColor(SETTINGS.clearColor);

const camera = new THREE.PerspectiveCamera(SETTINGS.camera.fov, 1, 0.1, 100);
camera.position.set(...SETTINGS.camera.position);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 10;
// Keep the camera above the ground
controls.maxPolarAngle = Math.PI / 2 - 0.1;

const bakedTexture = new THREE.TextureLoader().load('/baked.jpg');
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;
const materials = createMaterials(bakedTexture);

const fireflies = createFireflies(SETTINGS.fireflies);
scene.add(fireflies);

new GLTFLoader().load('/scene-optimized.glb', gltf => {
  gltf.scene.getObjectByName('Merged').material = materials.baked;
  gltf.scene.getObjectByName('PoleLightEmissionA').material =
    materials.poleLight;
  gltf.scene.getObjectByName('PoleLightEmissionB').material =
    materials.poleLight;
  gltf.scene.getObjectByName('PortalEmission').material = materials.portal;
  scene.add(gltf.scene);
  canvas.classList.add('is-loaded');
});

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);
  fireflies.material.uniforms.uPixelRatio.value = pixelRatio;
}
window.addEventListener('resize', resize);
resize();

const timer = new THREE.Timer();
renderer.setAnimationLoop(timestamp => {
  timer.update(timestamp);
  const elapsed = timer.getElapsed();
  materials.portal.uniforms.uTime.value = elapsed;
  fireflies.material.uniforms.uTime.value = elapsed;
  controls.update();
  renderer.render(scene, camera);
});

if (window.location.hash === '#debug') {
  void setupDebug({scene, renderer, materials, fireflies});
}
