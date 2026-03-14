import * as THREE from 'three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

// --- Fix Background & Layout ---
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'
document.body.style.backgroundColor = '#020617' // Dark background required for Additive Blending

// --- State & Config ---
let fboMouse = new THREE.Vector3(window.innerWidth / 2, window.innerHeight / 2, 0)
const sizes = { width: window.innerWidth, height: window.innerHeight }

// --- Three.js Scene Setup ---
const backgroundCanvas = document.createElement('canvas')
backgroundCanvas.className = 'scene-canvas'
backgroundCanvas.style.display = 'block'
document.body.appendChild(backgroundCanvas)

const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(0, sizes.width, sizes.height, 0, -1000, 1000)
camera.position.z = 10

const renderer = new THREE.WebGLRenderer({ canvas: backgroundCanvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(sizes.width, sizes.height)

// --- Post Processing (Bloom) ---
const BLOOM_LAYER = 1
const bloomComposer = new EffectComposer(renderer)
const finalComposer = new EffectComposer(renderer)

bloomComposer.addPass(new RenderPass(scene, camera))

const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 1.8, 0.5, 0.8)
bloomComposer.addPass(bloomPass)
bloomComposer.renderToScreen = false

const finalPass = new ShaderPass({
  uniforms: { baseTexture: { value: null }, bloomTexture: { value: null } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv; void main() { gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv); }`
}, 'baseTexture')

finalComposer.addPass(new RenderPass(scene, camera))
finalComposer.addPass(finalPass)

// --- GPU Particles (FBO) ---
const COMPUTE_SIZE = 128
let gpuCompute, positionVariable, velocityVariable, pointsMaterial

const noiseChunks = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    vec3 p_x0 = vec3(snoise(p - dx), snoise(p - dx + vec3(12.3)), snoise(p - dx + vec3(24.6)));
    vec3 p_x1 = vec3(snoise(p + dx), snoise(p + dx + vec3(12.3)), snoise(p + dx + vec3(24.6)));
    vec3 p_y0 = vec3(snoise(p - dy), snoise(p - dy + vec3(12.3)), snoise(p - dy + vec3(24.6)));
    vec3 p_y1 = vec3(snoise(p + dy), snoise(p + dy + vec3(12.3)), snoise(p + dy + vec3(24.6)));
    vec3 p_z0 = vec3(snoise(p - dz), snoise(p - dz + vec3(12.3)), snoise(p - dz + vec3(24.6)));
    vec3 p_z1 = vec3(snoise(p + dz), snoise(p + dz + vec3(12.3)), snoise(p + dz + vec3(24.6)));
    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
    return normalize(vec3(x, y, z) / (2.0 * e));
  }
`

function initGpuCompute() {
  gpuCompute = new GPUComputationRenderer(COMPUTE_SIZE, COMPUTE_SIZE, renderer)
  const posTex = gpuCompute.createTexture()
  const velTex = gpuCompute.createTexture()
  
  const posData = posTex.image.data
  for(let i = 0; i < posData.length; i += 4) {
    posData[i] = Math.random() * sizes.width
    posData[i+1] = Math.random() * sizes.height
    posData[i+2] = (Math.random() - 0.5) * 50 
    posData[i+3] = 1
  }

  positionVariable = gpuCompute.addVariable('texturePosition', `
    uniform vec2 uBounds;
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec4 pos = texture2D(texturePosition, uv);
      vec4 vel = texture2D(textureVelocity, uv);
      
      vec3 nextPos = pos.xyz + vel.xyz;

      if(nextPos.x < -100.0) nextPos.x = uBounds.x + 100.0;
      if(nextPos.x > uBounds.x + 100.0) nextPos.x = -100.0;
      if(nextPos.y < -100.0) nextPos.y = uBounds.y + 100.0;
      if(nextPos.y > uBounds.y + 100.0) nextPos.y = -100.0;

      gl_FragColor = vec4(nextPos, 1.0);
    }
  `, posTex)

  velocityVariable = gpuCompute.addVariable('textureVelocity', `
    ${noiseChunks}
    uniform vec3 uMouse;
    uniform float uTime;
    
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec3 pos = texture2D(texturePosition, uv).xyz;
      vec3 vel = texture2D(textureVelocity, uv).xyz;
      
      vec3 targetVel = curlNoise(pos * 0.003 + uTime * 0.2) * 2.5;
      vel += (targetVel - vel) * 0.06;
      
      vec3 dir = pos - uMouse;
      float dist = length(dir);
      
      if(dist < 300.0) {
        float force = (300.0 - dist) / 300.0;
        vec3 normDir = normalize(dir);
        vec3 tangent = vec3(-normDir.y, normDir.x, 0.0);
        
        vel += (tangent * 8.0 + normDir * 2.0) * force; 
      }
      
      vel *= 0.94;
      
      gl_FragColor = vec4(vel, 1.0);
    }
  `, velTex)

  gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable])
  gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable])
  
  positionVariable.material.uniforms.uBounds = { value: new THREE.Vector2(sizes.width, sizes.height) }
  velocityVariable.material.uniforms.uMouse = { value: fboMouse }
  velocityVariable.material.uniforms.uTime = { value: 0 }
  
  gpuCompute.init()
}

initGpuCompute()

// --- Particle Material & Mesh ---
const particlesGeom = new THREE.BufferGeometry()
const refs = new Float32Array(COMPUTE_SIZE * COMPUTE_SIZE * 2)

for(let i = 0; i < COMPUTE_SIZE * COMPUTE_SIZE; i++) {
  refs[i*2] = (i % COMPUTE_SIZE) / COMPUTE_SIZE
  refs[i*2+1] = Math.floor(i / COMPUTE_SIZE) / COMPUTE_SIZE
}

particlesGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COMPUTE_SIZE * COMPUTE_SIZE * 3), 3))
particlesGeom.setAttribute('reference', new THREE.BufferAttribute(refs, 2))

pointsMaterial = new THREE.ShaderMaterial({
  uniforms: { 
    uPositionTexture: { value: null }, 
    uTime: { value: 0 },
    uAlpha: { value: 1.0 }
  },
  vertexShader: `
    uniform sampler2D uPositionTexture; 
    attribute vec2 reference; 
    varying vec3 vPos;
    
    void main() { 
      vec3 pos = texture2D(uPositionTexture, reference).xyz; 
      vPos = pos; 
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0); 
      gl_PointSize = 4.0; 
    }`,
  fragmentShader: `
    uniform float uAlpha; 
    uniform float uTime; 
    varying vec3 vPos; 
    
    void main() { 
      // 1. Get the distance from the center of the particle
      vec2 c = gl_PointCoord - 0.5; 
      float d = length(c); 
      
      // 2. Define the Aura (Soft fade from center to edge)
      float aura = smoothstep(0.5, 0.1, d);
      
      // 3. Define the Core (Sharp, tiny bright dot exactly in the middle)
      float core = smoothstep(0.15, 0.02, d); 
      
      // 4. DISCO MATH (Your shifting colors)
      float r = 0.5 + 0.5 * sin(uTime * 2.0 + vPos.x * 0.005); 
      float g = 0.5 + 0.5 * sin(uTime * 3.0 + vPos.y * 0.005 + 2.0); 
      float b = 0.5 + 0.5 * sin(uTime * 1.5 + vPos.z * 0.005 + 4.0); 
      vec3 baseColor = vec3(r, g, b); 
      
      // 5. Combine them: Color the aura, but make the core pure white
      vec3 finalColor = (baseColor * aura) + (vec3(1.0) * core);
      
      // 6. Set opacity based on the aura's fade
      gl_FragColor = vec4(finalColor, uAlpha * aura); 
    }
  `,
  transparent: true, 
  blending: THREE.AdditiveBlending,
  depthWrite: false
})

const particles = new THREE.Points(particlesGeom, pointsMaterial)
particles.layers.set(BLOOM_LAYER) 
scene.add(particles)

// --- Interaction ---
window.addEventListener('pointermove', (e) => {
  fboMouse.x = e.clientX
  fboMouse.y = sizes.height - e.clientY
})

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  
  camera.right = sizes.width
  camera.top = sizes.height
  camera.updateProjectionMatrix()
  
  renderer.setSize(sizes.width, sizes.height)
  bloomComposer.setSize(sizes.width, sizes.height)
  finalComposer.setSize(sizes.width, sizes.height)
  
  if (positionVariable) {
    positionVariable.material.uniforms.uBounds.value.set(sizes.width, sizes.height)
  }
})

// --- Main Render Loop ---
const clock = new THREE.Clock()

function raf() {
  requestAnimationFrame(raf)
  
  const elapsedTime = clock.getElapsedTime()

  if (gpuCompute && velocityVariable && positionVariable) {
    velocityVariable.material.uniforms.uTime.value = elapsedTime
    gpuCompute.compute()
    
    pointsMaterial.uniforms.uPositionTexture.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture
    pointsMaterial.uniforms.uTime.value = elapsedTime
  }

  camera.layers.set(BLOOM_LAYER)
  bloomComposer.render()
  
  if (finalPass) {
    finalPass.uniforms.bloomTexture.value = bloomComposer.readBuffer.texture
  }
  
  camera.layers.set(0)
  finalComposer.render()
}

raf()
