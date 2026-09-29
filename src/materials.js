import * as THREE from 'three';
import portalFragmentShader from './shaders/portal/fragment.glsl?raw';
import portalVertexShader from './shaders/portal/vertex.glsl?raw';
import {SETTINGS} from './settings.js';

// The portal shader writes its colour unconverted, so it needs the raw hex
// values rather than three's sRGB -> linear conversion
export function rawColor(hex) {
  return new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
}

export function createMaterials(bakedTexture) {
  return {
    baked: new THREE.MeshBasicMaterial({map: bakedTexture}),
    poleLight: new THREE.MeshBasicMaterial({color: SETTINGS.poleLightColor}),
    portal: new THREE.ShaderMaterial({
      uniforms: {
        uTime: {value: 0},
        uColorStart: {value: rawColor(SETTINGS.portal.colorStart)},
        uColorEnd: {value: rawColor(SETTINGS.portal.colorEnd)},
      },
      vertexShader: portalVertexShader,
      fragmentShader: portalFragmentShader,
      side: THREE.DoubleSide,
    }),
  };
}
