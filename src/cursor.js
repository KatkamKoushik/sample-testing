import gsap from 'gsap'

export function initCursor() {
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return

  // ── Build DOM ────────────────────────────────────────────
  const techCursor = document.createElement('div')
  techCursor.className = 'tech-cursor'
  techCursor.innerHTML = '<span>&lt;</span><span>/&gt;</span>'
  document.body.appendChild(techCursor)

  // ── GSAP quickTo setters ─────────────────────────────────
  // Center the cursor exactly on the mouse pointer
  gsap.set(techCursor, { xPercent: -50, yPercent: -50 })
  
  const setCursorX = gsap.quickTo(techCursor, 'x', { duration: 0.15, ease: 'power3.out' })
  const setCursorY = gsap.quickTo(techCursor, 'y', { duration: 0.15, ease: 'power3.out' })

  // ── Mouse tracking ────────────────────────────────────────
  window.addEventListener('mousemove', (e) => {
    setCursorX(e.clientX)
    setCursorY(e.clientY)
  })

  // Hide when mouse leaves window
  document.addEventListener('mouseleave', () => {
    gsap.to(techCursor, { opacity: 0, duration: 0.3 })
  })
  document.addEventListener('mouseenter', () => {
    gsap.to(techCursor, { opacity: 1, duration: 0.3 })
  })

  // ── Hover States: Expand brackets on interaction ──────────
  const clickables = 'a, button, [data-magnetic], .project-card'
  
  document.body.addEventListener('mouseenter', (e) => {
    if (e.target.closest(clickables)) {
      techCursor.classList.add('is-hovering')
    }
  }, true)
  
  document.body.addEventListener('mouseleave', (e) => {
    if (e.target.closest(clickables)) {
      techCursor.classList.remove('is-hovering')
    }
  }, true)

  // ── Magnetic pull on [data-magnetic] elements ─────────────
  function setupMagnetic() {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width  / 2
        const centerY = rect.top  + rect.height / 2
        const dx = e.clientX - centerX
        const dy = e.clientY - centerY

        gsap.to(el, {
          x: dx * strength,
          y: dy * strength,
          duration: 0.4,
          ease: 'power2.out',
        })
      })

      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' })
      })
    })
  }

  // Run once now for static elements
  setupMagnetic()
  
  return { setupMagnetic }
}
