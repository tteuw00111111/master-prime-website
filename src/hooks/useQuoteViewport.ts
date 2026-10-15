import { useEffect } from 'react'

/** Keyboard presentation only. Scrolling belongs to the user and the browser. */
export const useQuoteViewport = () => {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.quote-page')
    const actions = document.querySelector<HTMLElement>('.quote-actions')
    // Some browsers resize both viewports, so innerHeight alone loses the
    // keyboard's height. Keep the unobstructed height until the width changes.
    let viewportWidth = window.innerWidth
    let restingHeight = window.innerHeight
    let keyboardWasOpen = false
    const sync = () => {
      if (!page) return
      const viewport = window.visualViewport
      const focused = document.activeElement
      const typing = focused instanceof HTMLElement && focused.matches('.quote-form input:not([type="checkbox"]), .quote-form textarea')
      const height = viewport?.height ?? window.innerHeight
      const unzoomed = !viewport || Math.abs(viewport.scale - 1) < 0.05
      if (window.innerWidth !== viewportWidth) {
        viewportWidth = window.innerWidth
        restingHeight = window.innerHeight
      }
      if (unzoomed) restingHeight = Math.max(restingHeight, window.innerHeight, height)
      const keyboard = window.matchMedia('(max-width: 800px)').matches && unzoomed && height < Math.max(restingHeight, window.innerHeight) - 120
      // A blur starts keyboard dismissal; keep actions hidden until the visual
      // viewport has recovered, rather than flashing them over the keyboard.
      keyboardWasOpen = keyboard && (typing || keyboardWasOpen)
      page.dataset.keyboard = keyboardWasOpen ? 'open' : 'closed'
      page.style.setProperty('--quote-viewport-height', `${height}px`)
      page.style.setProperty('--quote-actions-height', `${actions?.getBoundingClientRect().height ?? 80}px`)
    }
    const afterBlur = () => queueMicrotask(sync)
    const observer = new ResizeObserver(sync)
    if (actions) observer.observe(actions)
    window.visualViewport?.addEventListener('resize', sync)
    window.addEventListener('resize', sync)
    document.addEventListener('focusin', sync)
    document.addEventListener('focusout', afterBlur)
    sync()
    return () => {
      observer.disconnect()
      window.visualViewport?.removeEventListener('resize', sync)
      window.removeEventListener('resize', sync)
      document.removeEventListener('focusin', sync)
      document.removeEventListener('focusout', afterBlur)
    }
  }, [])
}
