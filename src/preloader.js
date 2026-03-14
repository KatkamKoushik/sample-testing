/**
 * preloader.js
 * Animated percentage counter overlay.
 * Usage: import { initPreloader } from './preloader.js'
 *        const done = initPreloader()   // returns a Promise that resolves when loader exits
 */
export function initPreloader(onCompleteCallback) {
  return new Promise((resolve) => {
    // ── Build DOM ──────────────────────────────────────────────
    const el = document.createElement('div')
    el.className = 'preloader'
    el.innerHTML = `
      <div class="preloader__panel preloader__panel--top"></div>
      <div class="preloader__panel preloader__panel--bottom"></div>
      <span class="preloader__count">0</span>
      <div class="preloader__bar"></div>
    `
    document.body.appendChild(el)

    const countEl = el.querySelector('.preloader__count')
    const barEl   = el.querySelector('.preloader__bar')
    const panelT  = el.querySelector('.preloader__panel--top')
    const panelB  = el.querySelector('.preloader__panel--bottom')

    let current = 0
    let target  = 0
    let raf     = null

    // ── Count up animation ────────────────────────────────────
    function tick() {
      if (current < target) {
        current = Math.min(current + Math.ceil((target - current) * 0.12 + 0.5), target)
        countEl.textContent = current
        barEl.style.width   = current + '%'
      }
      if (current < 100) {
        raf = requestAnimationFrame(tick)
      } else {
        // Exit: split panels slide up/down
        exitPreloader()
      }
    }

    function exitPreloader() {
      // Small delay so user sees 100
      setTimeout(() => {
        // Animate panels out
        const tDuration = 700
        const tEase     = 'cubic-bezier(0.76, 0, 0.24, 1)'

        panelT.style.transition = `transform ${tDuration}ms ${tEase}`
        panelB.style.transition = `transform ${tDuration}ms ${tEase}`
        countEl.style.transition = `opacity 250ms ease`

        countEl.style.opacity = '0'

        // stagger panels slightly
        setTimeout(() => {
          panelT.style.transform = 'scaleY(0)'
          panelT.style.transformOrigin = 'top'
          panelB.style.transform = 'scaleY(0)'
          panelB.style.transformOrigin = 'bottom'
        }, 80)

        setTimeout(() => {
          el.remove()
          if (typeof onCompleteCallback === 'function') onCompleteCallback()
          resolve()
        }, tDuration + 200)
      }, 180)
    }

    // ── Simulate three.js asset loading  ─────────────────────
    // We drive the counter by time-phases so it always completes
    // regardless of actual network speed.
    const phases = [
      { pct: 30, delay: 200  },
      { pct: 60, delay: 550  },
      { pct: 85, delay: 900  },
      { pct: 100, delay: 1300 },
    ]

    phases.forEach(({ pct, delay }) => {
      setTimeout(() => {
        target = pct
        if (!raf) raf = requestAnimationFrame(tick)
      }, delay)
    })

    // Kick off tick
    raf = requestAnimationFrame(tick)
  })
}
