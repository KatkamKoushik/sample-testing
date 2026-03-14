/**
 * heroObject.js
 * Adds an interactive wireframe icosahedron to the hero using the existing Three.js scene.
 * - Rotates slowly on its own
 * - Tilts toward mouse (parallax)
 * - Shrinks + fades on scroll via GSAP ScrollTrigger
 */
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let heroMesh = null
let mouseX = 0, mouseY = 0
let targetX = 0, targetY = 0

const heroVertexShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normal;
    vPosition = position;

    // Subtle vertex displacement along normals
    vec3 displaced = position + normal * sin(uTime * 0.8 + position.y * 3.0) * 0.03;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

const heroFragmentShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Fresnel-like edge glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(normalize(vNormal), viewDir), 2.5);

    vec3 colorA = vec3(0.22, 0.74, 0.97); // --color-accent
    vec3 colorB = vec3(0.39, 0.40, 0.95); // --color-accent-2
    float t = sin(uTime * 0.4 + vPosition.y * 1.5) * 0.5 + 0.5;
    vec3 finalColor = mix(colorA, colorB, t);

    float alpha = 0.15 + fresnel * 0.65;
    gl_FragColor = vec4(finalColor, alpha);
  }
`

export function initHeroObject(scene, bloomLayer) {
  if (!scene) return null

  // Outer wireframe sphere
  const geoOuter = new THREE.IcosahedronGeometry(130, 1)
  const matOuter = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.07,
  })
  const outerMesh = new THREE.Mesh(geoOuter, matOuter)

  // Inner glowing icosahedron
  const geoInner = new THREE.IcosahedronGeometry(88, 2)
  const matInner = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: heroVertexShader,
    fragmentShader: heroFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
  heroMesh = new THREE.Mesh(geoInner, matInner)
  heroMesh.layers.set(bloomLayer)

  // Group them
  const group = new THREE.Group()
  group.add(outerMesh)
  group.add(heroMesh)

  // Position: right side of viewport, vertically centred
  group.position.set(window.innerWidth * 0.78, window.innerHeight * 0.5, -100)

  scene.add(group)

  // ── Mouse parallax ───────────────────────────────────────
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2
  })

  // ── Scroll dissolve (GSAP ScrollTrigger) ─────────────────
  // The hero section takes up ~100vh; we fade the object out over that range
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.5,
    onUpdate: (self) => {
      const p = self.progress
      group.scale.setScalar(1 - p * 0.4)
      matInner.uniforms && (matInner.opacity = 1 - p)
      matOuter.opacity = 0.08 * (1 - p)
      group.position.y = window.innerHeight * 0.5 + p * 80
    }
  })

  // ── Animate in on load ────────────────────────────────────
  gsap.from(group.scale, {
    x: 0, y: 0, z: 0,
    duration: 1.6,
    ease: 'elastic.out(1, 0.6)',
    delay: 0.2
  })

  // ── Public update called inside raf() ────────────────────
  function update(time) {
    // Slow self-rotation
    group.rotation.y = time * 0.12
    group.rotation.x = time * 0.07

    // Smooth parallax lerp
    targetX += (mouseX * 0.08 - targetX) * 0.05
    targetY += (mouseY * 0.08 - targetY) * 0.05
    group.rotation.x += targetY
    group.rotation.y += targetX

    // Update shader time
    if (heroMesh?.material?.uniforms?.uTime) {
      heroMesh.material.uniforms.uTime.value = time
    }

    // Resize guard
    group.position.x = window.innerWidth * 0.78
  }

  return { update, group }
}
