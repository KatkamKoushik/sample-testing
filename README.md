<h1 align="center">Pidugu Shivaram — Developer Portfolio</h1>

<p align="center">
  A premium, WebGL-powered portfolio built to showcase my projects, skills, and experience as a Computer Science Engineering student.
</p>

<p align="center">
  <a href="https://portfolio-sr-ashy.vercel.app/" target="_blank"><strong>✨ View Live Site ✨</strong></a>
</p>

---

## 🚀 Overview

This repository contains the source code for my personal portfolio. It is designed to be highly interactive, performant, and visually engaging, utilizing modern web technologies and 3D graphics rendering directly in the browser. 

## 🛠 Tech Stack

* **Build Tool:** [Vite](https://vitejs.dev/) - For lightning-fast hot module replacement and optimized production builds.
* **3D Graphics:** [Three.js](https://threejs.org/) - Powering the background FBO (Frame Buffer Object) particle system and liquid-distortion image shaders.
* **Animation:** [GSAP](https://gsap.com/) - Handling scroll-triggered section reveals, magnetic button physics, and buttery-smooth custom cursor tracking.
* **Scrolling:** [Lenis](https://lenis.studiofreight.com/) - Providing momentum-based smooth scrolling across all devices.
* **Core:** Vanilla JavaScript, HTML5, CSS3.

## ✨ Key Features

* **Interactive WebGL Background:** A dynamic, physics-based particle system that reacts to mouse movement and scroll velocity.
* **Custom Preloader (`preloader.js`):** Ensures all high-fidelity assets and fonts are fully loaded before revealing the DOM, preventing flashes of unstyled content.
* **Interactive Hero Elements (`heroObject.js`):** Dedicated logic for handling specialized 3D objects or animations within the initial landing view.
* **Custom Tech Cursor:** A specialized `< />` cursor that tracks the mouse and seamlessly expands into framing brackets when interacting with clickable elements.
* **Liquid Image Shaders:** Project thumbnails utilize custom GLSL shaders (Vertex and Fragment) to warp and bend based on the user's scroll speed and hover state.
* **Fully Responsive:** Fluid typography and layout adjustments ensure the experience degrades gracefully on mobile devices, converting complex hover states into touch-friendly interactions.

## 💻 Running Locally

If you want to run this project on your local machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Pidugu-shivaram/Portfolio_SR.git](https://github.com/Pidugu-shivaram/Portfolio_SR.git)

   cd Portfolio_SR

   npm install

   npm run dev

   Open http://localhost:5173 in your browser.

📬 Contact
Email: pidugushivaram@gmail.com

LinkedIn: linkedin.com/in/shivarampidugu

Designed and built with code, craft, and curiosity. © 2026 Pidugu Shivaram.
