import {rawColor} from './materials.js';
import {SETTINGS} from './settings.js';

// Loaded only with #debug in the URL, so lil-gui stays out of the main bundle
export async function setupDebug({scene, renderer, materials, fireflies}) {
  const {GUI} = await import('lil-gui');
  const gui = new GUI({width: 400});

  const sceneFolder = gui.addFolder('Scene').close();
  sceneFolder
    .addColor(SETTINGS.fog, 'color')
    .name('Fog color')
    .onChange(color => scene.fog.color.set(color));
  sceneFolder
    .add(SETTINGS.fog, 'density', 0, 0.5, 0.05)
    .name('Fog density')
    .onChange(density => {
      scene.fog.density = density;
    });
  sceneFolder
    .addColor(SETTINGS, 'clearColor')
    .name('Clear color')
    .onChange(color => renderer.setClearColor(color));

  const lightsFolder = gui.addFolder('Lights').close();
  lightsFolder
    .addColor(SETTINGS, 'poleLightColor')
    .name('Pole lights')
    .onChange(color => materials.poleLight.color.set(color));

  const {uniforms} = materials.portal;
  const portalFolder = gui.addFolder('Portal').close();
  portalFolder
    .addColor(SETTINGS.portal, 'colorStart')
    .name('Color start')
    .onChange(color => uniforms.uColorStart.value.copy(rawColor(color)));
  portalFolder
    .addColor(SETTINGS.portal, 'colorEnd')
    .name('Color end')
    .onChange(color => uniforms.uColorEnd.value.copy(rawColor(color)));

  gui
    .addFolder('Fireflies')
    .close()
    .add(fireflies.material.uniforms.uSize, 'value', 0, 500, 1)
    .name('Size');
}
