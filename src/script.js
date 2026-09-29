import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'

import fireFliesVertexShader from './shaders/fireflies/vertex.glsl'
import fireFliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

// /**
//  * Spector JS
//  */
// const SPECTOR = require('spectorjs')
// const spector = new SPECTOR.Spector()
// spector.displayUI()

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const sceneProperties = {
    fogColor: '#001115',
    fogDensity: 0.05
}

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(sceneProperties.fogColor, sceneProperties.fogDensity)

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ 
    map: bakedTexture 
})

const poleLightEmissionProperties = {
    color: '#ffffe5'
}

const poleLightEmissionMaterial = new THREE.MeshBasicMaterial({ 
    color: poleLightEmissionProperties.color
})

const portalEmissionProperties = {
    colorStart: '#6a79ff',
    colorEnd: '#dde0ff'
}

const portalEmissionMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(portalEmissionProperties.colorStart) },
        uColorEnd: { value: new THREE.Color(portalEmissionProperties.colorEnd) }
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    side: THREE.DoubleSide
})

/**
 * Model
 */
gltfLoader.load('scene-optimized.glb', (gltf) => {
    const mergedMesh = gltf.scene.children.find(child => child.name == "Merged")
    const poleLightEmissionMeshA = gltf.scene.children.find(child => child.name == "PoleLightEmissionA")
    const poleLightEmissionMeshB = gltf.scene.children.find(child => child.name == "PoleLightEmissionB")
    const portalEmissionMesh = gltf.scene.children.find(child => child.name == "PortalEmission")

    mergedMesh.material = bakedMaterial
    poleLightEmissionMeshA.material = poleLightEmissionMaterial
    poleLightEmissionMeshB.material = poleLightEmissionMaterial
    portalEmissionMesh.material = portalEmissionMaterial
    
    scene.add(gltf.scene)
})

/**
 * Fire flies
 */

// Geometry
const fireFliesGeometryProperties = {
    count: 30,
    spread: 4,
    height: 1.5
}

let fireFliesGeometry = new THREE.BufferGeometry()
const createFireFliesGeometry = () => {
    const positions = new Float32Array(fireFliesGeometryProperties.count * 3)
    const scales = new Float32Array(fireFliesGeometryProperties.count)

    for (let i = 0; i < fireFliesGeometryProperties.count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * fireFliesGeometryProperties.spread
        positions[i * 3 + 1] = Math.random() * fireFliesGeometryProperties.height
        positions[i * 3 + 2] = (Math.random() - 0.5) * fireFliesGeometryProperties.spread

        scales[i] = Math.random()
    }

    fireFliesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    fireFliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
}
createFireFliesGeometry()

// Material
const fireFliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uPixelRation: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100 }
    },
    vertexShader: fireFliesVertexShader,
    fragmentShader: fireFliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

// Points
const fireFlies = new THREE.Points(fireFliesGeometry, fireFliesMaterial)
scene.add(fireFlies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    fireFliesMaterial.uniforms.uPixelRation.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const rendererProperties = {
    clearColor: '#001115'
}

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setClearColor(rendererProperties.clearColor)

/**
 * Composer
 */
 const renderScene = new RenderPass(scene, camera)
 const composer = new EffectComposer(renderer)
 composer.addPass(renderScene)

//  const bloomPass = new UnrealBloomPass(
//     new THREE.Vector2(window.innerWidth, window.innerHeight),
//     0.1, // intensity
//     0.01, // radius
//     0.01 // selector ?
//  )
//  composer.addPass(bloomPass)
// renderer.toneMapping = THREE.CineonToneMapping
// renderer.toneMappingExposure = 1.5

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update materials
    fireFliesMaterial.uniforms.uTime.value = elapsedTime
    portalEmissionMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    // renderer.render(scene, camera)
    composer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

/**
 * Debug
 */
 const gui = new dat.GUI({
    width: 400
})

// Folders
const sceneFolder = gui.addFolder('Scene').close()
const rendererFolder = gui.addFolder('Renderer').close()
const poleLightEmissionFolder = gui.addFolder('Pole Light Emission').close()
const portalEmissionFolder = gui.addFolder('Portal Emission').close()
const fireFliesFolder = gui.addFolder('Fire Flies').close()
const fireFliesShaderFolder = fireFliesFolder.addFolder('Shader').close()

// Scene properties
sceneFolder.addColor(sceneProperties, 'fogColor')
    .onChange((color) => {
        scene.fog.color.set(color)
    })
    .name('Fog Color')

sceneFolder.add(sceneProperties, 'fogDensity')
    .onChange((density) => {
        scene.fog.density = density
    })
    .min(0)
    .max(0.5)
    .step(0.05)
    .name('Fog Density')

// Renderer properties
rendererFolder.addColor(rendererProperties, 'clearColor')
    .onChange((color) => {
        renderer.setClearColor(color)
    })
    .name('Clear Color')

// Pole light properties
poleLightEmissionFolder.addColor(poleLightEmissionProperties, 'color')
    .onChange((color) => {
        poleLightEmissionMaterial.color = new THREE.Color(color)
    })
    .name('Color')

// Portal properties
portalEmissionFolder.addColor(portalEmissionProperties, 'colorStart')
    .onChange((color) => {
        portalEmissionMaterial.uniforms.uColorStart.value.set(color)
    })
    .name('Color Start')

portalEmissionFolder.addColor(portalEmissionProperties, 'colorEnd')
    .onChange((color) => {
        portalEmissionMaterial.uniforms.uColorEnd.value.set(color)
    })
    .name('Color End')

// Fire flies properties
fireFliesShaderFolder.add(fireFliesMaterial.uniforms.uSize, 'value')
    .min(0)
    .max(500)
    .step(1)
    .name('Size')