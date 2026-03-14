import './style.css'
import * as THREE from 'three'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { initCursor } from './cursor.js'
import { initPreloader } from './preloader.js'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

// Global variables for mouse tracking
let fboMouse = new THREE.Vector3(0, 0, 0)
let pointerScreen = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2)

// ─────────────────────────────────────────────────
// PROJECT DATA
// ─────────────────────────────────────────────────
const projects = [
  { title: 'Simple Web Pages', tag: 'HTML / CSS', year: '2024', image: '/image.jpg', url: '#' },
  { title: 'AI Automation Workflow', tag: 'AI / Automation', year: '2025', image: '/image2.jpg', url: '#' },
]

const app = document.querySelector('#app')

// [MODIFICATION]: Removed the AI chat widget DOM elements from app.innerHTML
app.innerHTML = `
<header class="site-header">
  <div class="site-header__inner">
    <a href="#top" class="site-header__logo">PS</a>
    <nav class="site-header__nav" aria-label="Primary navigation">
      <button class="site-header__link" type="button" data-scroll-target="#about">About</button>
      <button class="site-header__link" type="button" data-scroll-target="#skills">Skills</button>
      <button class="site-header__link" type="button" data-scroll-target="#projects">Projects</button>
      <button class="site-header__link" type="button" data-scroll-target="#contact">Contact</button>
    </nav>
  </div>
</header>

<main class="page" id="top">
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__content">
      <p class="hero__eyebrow">Computer Science Student</p>
      <h1 id="hero-title" class="hero__title">Pidugu Shivaram, building the web.</h1>
      <p class="hero__subtitle">
        Motivated B.Tech CSE student with a strong foundation in C, HTML, CSS, and SQL. Eager to contribute to web development and software projects while growing fast.
      </p>
    </div>
  </section>

  <section class="about" id="about" aria-labelledby="about-title">
    <h2 id="about-title" class="section-label">About</h2>
    <div class="about__content">
      <h3 class="about__headline">Motivated problem-solver seeking to apply technical skills in real-world projects.</h3>
      <p class="about__body">
        I'm a 2nd-year B.Tech Computer Science Engineering student at Ku College of Engineering and Technology, Peddapalli, Telangana. I have a strong foundation in C programming, web technologies (HTML & CSS), and SQL databases. I'm eager to grow, learn fast, and deliver meaningful contributions in web development or software-related roles.
      </p>
    </div>
  </section>

  <section class="skills" id="skills" aria-labelledby="skills-title">
    <h2 id="skills-title" class="section-label">Skills</h2>
    <div class="skills__grid">
      <article class="skills__card"><h3 class="skills__title">Programming Languages</h3><p class="skills__meta">C</p></article>
      <article class="skills__card"><h3 class="skills__title">Web Technologies</h3><p class="skills__meta">HTML · CSS</p></article>
      <article class="skills__card"><h3 class="skills__title">Database</h3><p class="skills__meta">SQL</p></article>
      <article class="skills__card"><h3 class="skills__title">Tools & Platforms</h3><p class="skills__meta">VS Code · Git · GitHub · Microsoft Excel</p></article>
    </div>
  </section>

  <section class="experience" aria-labelledby="experience-title">
    <h2 id="experience-title" class="section-label">Education</h2>
    <ul class="experience__list">
      <li class="experience__item">
        <span class="experience__label">B.Tech in Computer Science Engineering</span>
        <span class="experience__meta">Ku College of Engineering & Technology · Currently 2nd Year · 2023–2027</span>
      </li>
    </ul>
  </section>

  <section class="projects" id="projects" aria-labelledby="projects-title">
    <header class="projects__header">
      <h2 id="projects-title" class="section-label">Selected projects</h2>
      <p class="projects__subtitle">A selection of recent work spanning AI products, creative engineering, and full-stack platforms.</p>
    </header>
    <div class="projects__grid">
      ${projects.map(p => `
        <div class="project-card" data-url="${p.url}" aria-label="View project: ${p.title}" tabindex="0">
          <div class="image-placeholder" data-image="${p.image}"></div>
          <div class="project-card__info">
            <span class="project-card__tag">${p.tag}</span>
            <h3 class="project-card__title">${p.title}</h3>
            <span class="project-card__year">${p.year}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </section>

  <section class="contact" id="contact" aria-labelledby="contact-title">
    <div class="contact__inner">
      <div class="contact__copy">
        <h2 id="contact-title" class="section-label">Contact</h2>
        <p class="contact__headline">Let's collaborate on something meaningful.</p>
        <p class="contact__body">Whether you're exploring an idea, looking for an internship opportunity, or curious about my work — feel free to reach out. Based in Peddapalli, Telangana · +91 9515546704</p>
      </div>
      <div class="contact__actions">
        <a class="contact__email" href="mailto:pidugushivaram@gmail.com">pidugushivaram@gmail.com</a>
        <div class="contact__buttons">
          <a href="/resume.pdf" download class="button button--primary">Download Resume</a>
          <div class="contact__links">
            <a href="https://www.linkedin.com/in/shivarampidugu" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
    </div>
    <footer class="footer">
      <p class="footer__text">© ${new Date().getFullYear()} Pidugu Shivaram. All rights reserved.</p>
    </footer>
  </section>
</main>
`

gsap.registerPlugin(ScrollTrigger)

// --- Premium Text Splitter Utility ---
function splitWords(selector) {
  const element = document.querySelector(selector);
  if (!element) return;

  const words = element.innerText.split(' ');
  element.innerHTML = ''; 

  words.forEach(word => {
    const wrapper = document.createElement('span');
    wrapper.style.cssText = 'overflow: hidden; display: inline-flex; padding-bottom: 0.1em; margin-right: 0.25em;';

    const inner = document.createElement('span');
    inner.style.cssText = 'display: inline-block; transform: translateY(110%);'; 
    inner.className = 'reveal-word';
    inner.innerText = word;

    wrapper.appendChild(inner);
    element.appendChild(wrapper);
    
    // [BUG FIX]: Accessibility fix to ensure screen readers read words individually and copy/paste works
    const space = document.createTextNode(' ');
    element.appendChild(space);
  });
}

splitWords('.hero__title');
splitWords('.hero__subtitle');

// --- The Cascade Animation ---
const heroTimeline = gsap.timeline({ paused: true });

heroTimeline.from('.hero__eyebrow', {
  opacity: 0,
  duration: 1,
  ease: 'power3.inOut'
});

heroTimeline.to('.hero__title .reveal-word', {
  y: '0%',
  duration: 1.2,
  stagger: 0.04, 
  ease: 'power4.out'
}, '-=0.5');

heroTimeline.to('.hero__subtitle .reveal-word', {
  y: '0%',
  duration: 1.0,
  stagger: 0.02,
  ease: 'power4.out'
}, '-=0.9');

// Start the preloader and pass the timeline
initPreloader(() => heroTimeline.play());

// Section scroll animations
document.querySelectorAll('.about, .skills, .experience, .projects').forEach((section) => {
  gsap.from(section, {
    y: 50,
    opacity: 0,
    duration: 1.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
  })
})

// Create a full-viewport background canvas
const backgroundCanvas = document.createElement('canvas')
backgroundCanvas.className = 'scene-canvas'
document.body.appendChild(backgroundCanvas)

// Basic Three.js scene
const scene = new THREE.Scene()

const vertexShader = `
uniform float uVelocity;
uniform float uHoverStrength;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 transformed = position;

  float strength = clamp(abs(uVelocity) * 0.6, 0.0, 1.0);
  float edge = vUv.y - 0.5;
  float curveProfile = edge * abs(edge); 

  float bendY = -sign(uVelocity) * strength * curveProfile * 50.0;
  float bendZ = strength * curveProfile * 140.0;
  bendZ += uHoverStrength * 20.0;

  transformed.y += bendY;
  transformed.z += bendZ;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uTexture;
uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform vec2 uMouse;
uniform float uHoverStrength;
varying vec2 vUv;

void main() {
  // [BUG FIX]: Use max() to prevent division by zero before images/layout load
  float imageAspect = uImageSize.x / max(uImageSize.y, 0.001);
  float planeAspect = uPlaneSize.x / max(uPlaneSize.y, 0.001);

  vec2 uv = vUv;

  if (imageAspect > planeAspect) {
    float scale = planeAspect / imageAspect;
    uv.x = (uv.x - 0.5) * scale + 0.5;
  } else {
    float scale = imageAspect / planeAspect;
    uv.y = (uv.y - 0.5) * scale + 0.5;
  }

  float distToMouse = distance(uv, uMouse);
  float radius = 0.35;
  float hoverMask = smoothstep(radius, 0.0, distToMouse) * uHoverStrength;

  vec2 direction = normalize(uv - uMouse);
  direction = mix(direction, vec2(0.0, 0.0), 1.0 - hoverMask);

  float maxShift = 0.025;
  vec2 shift = direction * maxShift * hoverMask;

  vec4 colorR = texture2D(uTexture, uv + shift * 0.7);
  vec4 colorG = texture2D(uTexture, uv);
  vec4 colorB = texture2D(uTexture, uv - shift * 0.7);

  vec4 color = vec4(colorR.r, colorG.g, colorB.b, colorG.a);
  gl_FragColor = color;
}
`

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

let isMobile = window.innerWidth < 768

const camera = new THREE.OrthographicCamera(0, sizes.width, sizes.height, 0, -1000, 1000)
camera.position.z = 10

const renderer = new THREE.WebGLRenderer({
  canvas: backgroundCanvas,
  antialias: true,
  alpha: true,
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor(0x000000, 0)

// --- Post-processing (selective bloom: particles only) ---
const BLOOM_LAYER = 1
const bloomComposer = new EffectComposer(renderer)
const finalComposer = new EffectComposer(renderer)
const renderScene = new RenderPass(scene, camera)

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  0.85, 0.95, 0.6 
)

bloomComposer.renderToScreen = false
bloomComposer.addPass(renderScene)
bloomComposer.addPass(bloomPass)

// [BUG FIX]: ShaderPass expects an object configuration, not an instantiated Material
const finalPass = new ShaderPass(
  {
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: null }, 
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      varying vec2 vUv;
      void main() {
        vec4 base = texture2D(baseTexture, vUv);
        vec4 bloom = texture2D(bloomTexture, vUv);
        gl_FragColor = base + bloom;
      }
    `,
  },
  'baseTexture',
)
finalPass.needsSwap = true

finalComposer.addPass(renderScene)
finalComposer.addPass(finalPass)

// --- FBO / GPGPU bootstrap ---
const COMPUTE_SIZE = 236
let gpuCompute = null, positionVariable = null, velocityVariable = null, particles = null, pointsMaterial = null

function fillPositionTexture(texture) {
  const data = texture.image.data
  for (let i = 0; i < data.length; i += 4) {
    data[i + 0] = Math.random() * window.innerWidth
    data[i + 1] = Math.random() * window.innerHeight
    data[i + 2] = (Math.random() - 0.5) * 100.0
    data[i + 3] = 1.0
  }
}

function fillVelocityTexture(texture) {
  const data = texture.image.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 1;
  }
}

function initGpuCompute() {
  try {
    gpuCompute = new GPUComputationRenderer(COMPUTE_SIZE, COMPUTE_SIZE, renderer)

    const positionTexture = gpuCompute.createTexture()
    const velocityTexture = gpuCompute.createTexture()
    fillPositionTexture(positionTexture)
    fillVelocityTexture(velocityTexture)

    const positionFragmentShader = `
      uniform vec3 uBounds; uniform float uDelta; uniform float uTime;
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec4 pos = texture2D(texturePosition, uv);
        vec4 vel = texture2D(textureVelocity, uv);
        vec3 nextPos = pos.xyz + vel.xyz;
        vec3 center = vec3(uBounds.x * 0.5, uBounds.y * 0.5, 0.0);
        vec3 span = vec3(uBounds.x, uBounds.y, uBounds.z);
        float h = fract(sin(dot(uv + uTime * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
        float h2 = fract(sin(dot(uv + vec2(4.123, 9.456) + uTime * 0.02, vec2(39.346, 11.135))) * 24634.6345);
        bool outX = abs(nextPos.x - center.x) > span.x * 1.25;
        bool outY = abs(nextPos.y - center.y) > span.y * 1.25;
        bool outZ = abs(nextPos.z) > span.z * 1.25;
        if (outX || outY || outZ) {
          nextPos = center + vec3((h - 0.5) * uBounds.x * 0.15, (h2 - 0.5) * uBounds.y * 0.15, (h - 0.5) * uBounds.z * 0.15);
        }
        gl_FragColor = vec4(nextPos, 1.0);
      }
    `
    const velocityFragmentShader = `
      uniform vec3 uMouse; uniform vec3 uBounds; uniform float uDelta; uniform float uTime;
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m; return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      vec3 curlNoise(vec3 p) {
        const float e = 0.1; vec3 dx = vec3(e, 0.0, 0.0); vec3 dy = vec3(0.0, e, 0.0); vec3 dz = vec3(0.0, 0.0, e);
        vec3 p_x0 = vec3(snoise(p - dx), snoise(p - dx + vec3(12.3)), snoise(p - dx + vec3(24.6)));
        vec3 p_x1 = vec3(snoise(p + dx), snoise(p + dx + vec3(12.3)), snoise(p + dx + vec3(24.6)));
        vec3 p_y0 = vec3(snoise(p - dy), snoise(p - dy + vec3(12.3)), snoise(p - dy + vec3(24.6)));
        vec3 p_y1 = vec3(snoise(p + dy), snoise(p + dy + vec3(12.3)), snoise(p + dy + vec3(24.6)));
        vec3 p_z0 = vec3(snoise(p - dz), snoise(p - dz + vec3(12.3)), snoise(p - dz + vec3(24.6)));
        vec3 p_z1 = vec3(snoise(p + dz), snoise(p + dz + vec3(12.3)), snoise(p + dz + vec3(24.6)));
        float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y; float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z; float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
        return normalize(vec3(x, y, z) / (2.0 * e));
      }
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 pos = texture2D(texturePosition, uv).xyz;
        vec3 vel = texture2D(textureVelocity, uv).xyz;
        vec3 targetVel = curlNoise(pos * 0.002 + uTime * 0.2) * 2.0;
        vel += (targetVel - vel) * 0.05;
        float dist = distance(pos.xy, uMouse.xy);
        float maxDistance = 100.0; 
        if (dist < maxDistance) {
          vec2 dir = pos.xy - uMouse.xy;
          float force = (maxDistance - dist) / maxDistance;
          vel.xy += normalize(dir + 0.0001) * force * 20.0;
        }
        vel *= 0.95;
        gl_FragColor = vec4(vel, 1.0);
      }
    `

    positionVariable = gpuCompute.addVariable('texturePosition', positionFragmentShader, positionTexture)
    velocityVariable = gpuCompute.addVariable('textureVelocity', velocityFragmentShader, velocityTexture)

    gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable])
    gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable])

    positionVariable.material.uniforms.uBounds = { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 100) }
    positionVariable.material.uniforms.uTime = { value: 0.0 }
    positionVariable.material.uniforms.uDelta = { value: 0.016 }

    velocityVariable.material.uniforms.uBounds = { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 100) };
    velocityVariable.material.uniforms.uDelta = { value: 0.016 };
    velocityVariable.material.uniforms.uTime = { value: 0.0 };
    velocityVariable.material.uniforms.uMouse = { value: fboMouse };

    const initError = gpuCompute.init()
    if (initError) { gpuCompute = null; positionVariable = null; velocityVariable = null; }
  } catch {
    gpuCompute = null; positionVariable = null; velocityVariable = null;
  }
}

initGpuCompute()

// --- Particle render layer ---
function initParticles() {
  if (!gpuCompute || !positionVariable) return

  const size = COMPUTE_SIZE
  const particlesCount = size * size

  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particlesCount * 3)
  const references = new Float32Array(particlesCount * 2)

  for (let i = 0; i < particlesCount; i++) {
    const x = ((i % size) + 0.5) / size
    const y = (Math.floor(i / size) + 0.5) / size
    references[i * 2] = x
    references[i * 2 + 1] = y
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2))

  const particlesVertexShader = `
    uniform sampler2D uPositionTexture;
    attribute vec2 reference;
    varying vec3 vPos;

    void main() {
      vec3 pos = texture2D(uPositionTexture, reference).xyz;
      vPos = pos; 
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = 2.0;
    }
  `

  const particlesFragmentShader = `
    uniform float uAlpha;
    varying vec3 vPos;

    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      float mask = smoothstep(0.5, 0.35, d);

      vec3 color1 = vec3(1.0, 0.84, 0.0); vec3 color2 = vec3(1.0, 0.55, 0.0);

      float mixFactor = (vPos.x * 0.001) + (vPos.y * 0.001) + 0.5;
      vec3 finalColor = mix(color1, color2, clamp(mixFactor, 0.0, 1.0));

      gl_FragColor = vec4(finalColor, uAlpha * mask);
    }
  `

  pointsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPositionTexture: { value: null },
      uAlpha: { value: 0.85 },
    },
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  particles = new THREE.Points(geometry, pointsMaterial)
  particles.frustumCulled = false
  particles.position.z = -300
  particles.layers.set(BLOOM_LAYER)
  scene.add(particles)
}
initParticles()

// Three.js planes mapped to .image-placeholder elements
const placeholderMeshes = []
const textureLoader = new THREE.TextureLoader()

function createPlaceholderMeshes() {
  placeholderMeshes.forEach(({ mesh }) => {
    scene.remove(mesh)
    mesh.geometry.dispose()
    mesh.material.dispose()
  })
  placeholderMeshes.length = 0

  const placeholders = document.querySelectorAll('.image-placeholder')

  placeholders.forEach((element) => {
    const rect = element.getBoundingClientRect()
    const geometry = new THREE.PlaneGeometry(rect.width, rect.height, 32, 32)
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uVelocity: { value: 0 },
        uHoverStrength: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        // [BUG FIX]: Initialize uImageSize safely to avoid early 0x0 division
        uImageSize: { value: new THREE.Vector2(Math.max(rect.width, 1), Math.max(rect.height, 1)) },
        uPlaneSize: { value: new THREE.Vector2(rect.width, rect.height) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    })
    const mesh = new THREE.Mesh(geometry, material)

    const imageUrl = element.dataset.image
    if (imageUrl) {
      textureLoader.load(
        imageUrl,
        (texture) => {
          if (texture.image) {
            material.uniforms.uImageSize.value.set(texture.image.width, texture.image.height)
          }
          material.uniforms.uTexture.value = texture
          material.needsUpdate = true
        },
        undefined,
        () => { }
      )
    }

    scene.add(mesh)
    placeholderMeshes.push({ element, mesh })
  })
}

const raycaster = new THREE.Raycaster()
const pointerNDC = new THREE.Vector2(2, 2)

// [BUG FIX]: Consolidated mouse listeners to stop getBoundingClientRect layout thrashing
window.addEventListener('pointermove', (event) => {
  // Save screen space coords for local UV math later
  pointerScreen.x = event.clientX;
  pointerScreen.y = event.clientY;

  // Normalized coordinates for Raycasting
  pointerNDC.x = (event.clientX / sizes.width) * 2 - 1
  pointerNDC.y = -(event.clientY / sizes.height) * 2 + 1

  // Map mouse for FBO particle interaction
  if (typeof fboMouse !== 'undefined') {
    fboMouse.x = event.clientX;
    fboMouse.y = sizes.height - event.clientY; 
    fboMouse.z = 0;
  }
})

function updatePlaceholderMeshTransforms(scrollY = 0) {
  const viewportHeight = sizes.height

  placeholderMeshes.forEach(({ element, mesh }) => {
    const rect = element.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = viewportHeight - (rect.top + rect.height / 2)
    mesh.position.set(x, y, 0)
  })
}

function onResize() {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  isMobile = window.innerWidth < 768

  camera.right = sizes.width
  camera.top = sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  bloomComposer.setSize(sizes.width, sizes.height)
  finalComposer.setSize(sizes.width, sizes.height)
  
  if (typeof bloomPass !== 'undefined') {
    bloomPass.setSize(new THREE.Vector2(sizes.width, sizes.height))
  }

  if (positionVariable && positionVariable.material) {
    positionVariable.material.uniforms.uBounds.value.set(window.innerWidth, window.innerHeight, 100)
  }

  if (velocityVariable && velocityVariable.material) {
    velocityVariable.material.uniforms.uBounds.value.set(window.innerWidth, window.innerHeight, 100)
  }

  createPlaceholderMeshes()
  updatePlaceholderMeshTransforms()
}

window.addEventListener('resize', onResize)

// Initial sync once layout is ready
createPlaceholderMeshes()
updatePlaceholderMeshTransforms()

// Lenis smooth scroll
const lenis = new Lenis()
let currentScroll = 0
let scrollVelocity = 0
let smoothedVelocity = 0
let lastRafTime = performance.now()

lenis.on('scroll', ({ scroll, velocity }) => {
  currentScroll = scroll
  scrollVelocity = velocity
  ScrollTrigger.update(); // [BUG FIX]: Explicitly sync Lenis with GSAP ScrollTrigger
})

const navButtons = document.querySelectorAll('[data-scroll-target]')
navButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault()
    const targetSelector = button.getAttribute('data-scroll-target')
    if (!targetSelector) return

    const targetElement = document.querySelector(targetSelector)
    if (!targetElement) return

    lenis.scrollTo(targetElement, {
      offset: -80,
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    })
  })
})

function raf(time) {
  if (typeof lenis !== 'undefined' && lenis) lenis.raf(time);

  const now = performance.now();
  lastRafTime = now;

  const targetVelocity = isMobile ? 0 : scrollVelocity;
  smoothedVelocity += (targetVelocity - smoothedVelocity) * 0.16;

  if (typeof updatePlaceholderMeshTransforms === 'function') {
    updatePlaceholderMeshTransforms(currentScroll);
  }

  raycaster.setFromCamera(pointerNDC, camera);
  const intersects = raycaster.intersectObjects(placeholderMeshes.map(p => p.mesh));

  placeholderMeshes.forEach(({ element, mesh }) => {
    mesh.material.uniforms.uVelocity.value = smoothedVelocity;

    const isHovered = intersects.length > 0 && intersects[0].object === mesh;
    const targetHover = isHovered ? 1.0 : 0.0;
    mesh.material.uniforms.uHoverStrength.value += (targetHover - mesh.material.uniforms.uHoverStrength.value) * 0.1;

    // [BUG FIX]: Map the mouse directly to the local bounding box UV space instead of using global NDC
    const rect = element.getBoundingClientRect();
    const localX = (pointerScreen.x - rect.left) / Math.max(rect.width, 1.0);
    const localY = (pointerScreen.y - rect.top) / Math.max(rect.height, 1.0);
    mesh.material.uniforms.uMouse.value.set(localX, 1.0 - localY);
  });

  if (gpuCompute && positionVariable && velocityVariable) {
    velocityVariable.material.uniforms.uMouse.value.copy(fboMouse);
    velocityVariable.material.uniforms.uTime.value += 0.01;
    positionVariable.material.uniforms.uTime.value += 0.01;

    gpuCompute.compute();

    if (pointsMaterial) {
      pointsMaterial.uniforms.uPositionTexture.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
    }
  }

  if (typeof bloomComposer !== 'undefined' && typeof finalComposer !== 'undefined') {
    camera.layers.set(BLOOM_LAYER);
    bloomComposer.render();

    // Dynamically pass the bloomed texture to the final pass safely
    if (finalPass && finalPass.uniforms && finalPass.uniforms.bloomTexture) {
      finalPass.uniforms.bloomTexture.value = bloomComposer.readBuffer.texture;
    }

    camera.layers.set(0);
    finalComposer.render();
  }

  requestAnimationFrame(raf);
}

// Initialize custom cursor
const cursor = initCursor()
if (cursor && typeof cursor.setupMagnetic === 'function') {
  cursor.setupMagnetic()
}

// Start Render Loop
raf(performance.now());
