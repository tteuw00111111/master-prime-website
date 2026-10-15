import { useCallback, useEffect, useRef } from 'react'

/** Guidance follows committed pointer choices, never typing or background updates. */
export const useQuoteGuidance = () => {
  const pointerInput = useRef(false)
  const pending = useRef<number | null>(null)
  const animation = useRef<number | null>(null)
  const pause = useRef<number | null>(null)
  const cancel = useCallback(() => {
    if (pending.current !== null) window.cancelAnimationFrame(pending.current)
    if (animation.current !== null) window.cancelAnimationFrame(animation.current)
    if (pause.current !== null) window.clearTimeout(pause.current)
    pending.current = null
    animation.current = null
    pause.current = null
  }, [])

  const moveTo = useCallback((target: HTMLElement, mode: 'guide' | 'focus' | 'step' = 'step') => {
    cancel()
    const viewport = window.visualViewport
    const top = (viewport?.offsetTop ?? 0) + 20
    const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 20
    const rect = target.getBoundingClientRect()
    // For a tall group, reveal its heading and first control rather than its end.
    const firstControl = target.querySelector<HTMLElement>('input, textarea, button')
    const contentHeight = firstControl ? firstControl.getBoundingClientRect().bottom - rect.top : rect.height
    const visibleHeight = Math.min(contentHeight, Math.max(48, bottom - top))
    if (mode === 'focus' && rect.top >= top && rect.top + visibleHeight <= bottom) return
    // A completed choice gently brings the next question into the reading area,
    // even if it was partly visible. Corrections never pull the page backwards.
    const readingTop = mode === 'guide' ? top + Math.min(48, (bottom - top) * .12) : top
    const distance = rect.top - readingTop
    if (mode === 'guide' && distance < 24) return
    const start = window.scrollY
    const end = Math.max(0, Math.min(start + distance, document.documentElement.scrollHeight - window.innerHeight))
    if (Math.abs(end - start) < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: end, behavior: 'instant' })
      return
    }
    const duration = mode === 'focus' ? 280 : Math.min(800, 550 + Math.abs(end - start) * .2)
    const started = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
      window.scrollTo({ top: start + (end - start) * eased, behavior: 'instant' })
      animation.current = progress < 1 ? window.requestAnimationFrame(tick) : null
    }
    animation.current = window.requestAnimationFrame(tick)
  }, [cancel])

  const guideTo = useCallback((id: string, confirmedText = false) => {
    cancel()
    if ((!pointerInput.current && !confirmedText) || !window.matchMedia('(max-width: 800px)').matches || (window.visualViewport?.scale ?? 1) !== 1) return
    // Leave a short beat to see the selection before guiding to the next field.
    pause.current = window.setTimeout(() => {
      pause.current = null
      pending.current = window.requestAnimationFrame(() => {
        pending.current = window.requestAnimationFrame(() => {
          pending.current = null
          const target = document.getElementById(id)
          if (target) moveTo(target, 'guide')
        })
      })
    }, 120)
  }, [cancel, moveTo])

  useEffect(() => {
    const pointer = () => { pointerInput.current = true; cancel() }
    const keyboard = () => { pointerInput.current = false; cancel() }
    const ensureFocusedVisible = () => {
      if (!window.matchMedia('(max-width: 800px)').matches) return
      const viewport = window.visualViewport
      // Pinch zoom also reduces viewport height, but must not be treated as a keyboard.
      if (viewport && viewport.scale !== 1) return
      const focused = document.activeElement
      if (focused instanceof HTMLElement && focused.matches('.quote-form input, .quote-form textarea')) moveTo(focused, 'focus')
    }
    window.addEventListener('pointerdown', pointer, { passive: true })
    window.addEventListener('keydown', keyboard, true)
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchmove', cancel, { passive: true })
    window.addEventListener('popstate', cancel)
    window.addEventListener('pagehide', cancel)
    window.visualViewport?.addEventListener('resize', ensureFocusedVisible)
    document.addEventListener('focusin', ensureFocusedVisible)

    return () => {
      cancel()
      window.removeEventListener('pointerdown', pointer)
      window.removeEventListener('keydown', keyboard, true)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchmove', cancel)
      window.removeEventListener('popstate', cancel)
      window.removeEventListener('pagehide', cancel)
      window.visualViewport?.removeEventListener('resize', ensureFocusedVisible)
      document.removeEventListener('focusin', ensureFocusedVisible)
    }
  }, [cancel, moveTo])

  return { guideTo, moveTo, cancelGuidance: cancel }
}
