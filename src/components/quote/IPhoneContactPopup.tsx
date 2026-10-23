import { useEffect, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { IPHONE_CONTACT_POPUP } from '@/data/iphone-contact-popup'
import { getIPhoneContactEmbedUrl, IPHONE_POPUP_SESSION_KEY, IPHONE_POPUP_VISIBLE_MS } from '@/utils/iphone-contact-popup'
import '@/styles/iphone-contact-popup.css'

// Fallback only for this document when sessionStorage is unavailable.
let shownInDocument = false

const isEditing = () => document.activeElement instanceof HTMLElement && (
  document.activeElement.matches('input, select, textarea') || document.activeElement.isContentEditable
)

export const IPhoneContactPopup = () => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const embedUrl = getIPhoneContactEmbedUrl(IPHONE_CONTACT_POPUP)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!embedUrl || !dialog || typeof dialog.showModal !== 'function' || shownInDocument) return
    try { if (sessionStorage.getItem(IPHONE_POPUP_SESSION_KEY) === '1') return } catch { /* Memory fallback. */ }

    let shown = false
    let pending = false
    let remaining = IPHONE_POPUP_VISIBLE_MS
    let visibleSince: number | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let focusTimer: ReturnType<typeof setTimeout> | undefined
    let previousScrollTop = document.documentElement.scrollTop

    const show = () => {
      if (shown || shownInDocument || document.hidden || isEditing()) return
      // A second mounted instance must also respect the shared session guard.
      try { if (sessionStorage.getItem(IPHONE_POPUP_SESSION_KEY) === '1') return } catch { /* Memory fallback. */ }
      dialog.showModal()
      shown = true
      shownInDocument = true
      clearTimeout(timer)
      try { sessionStorage.setItem(IPHONE_POPUP_SESSION_KEY, '1') } catch { /* No personal data is stored. */ }
      setIsOpen(true)
    }
    const requestShow = () => { pending = true; show() }
    const pauseTimer = () => {
      clearTimeout(timer)
      if (visibleSince !== null) remaining = Math.max(0, remaining - (performance.now() - visibleSince))
      visibleSince = null
    }
    const resumeTimer = () => {
      if (shown || document.hidden || pending) return
      visibleSince = performance.now()
      timer = setTimeout(requestShow, remaining)
    }
    const visibility = () => {
      pauseTimer()
      if (!document.hidden) {
        if (pending) show()
        else resumeTimer()
      }
    }
    const scroll = () => {
      const root = document.documentElement
      const top = root.scrollTop
      const moved = top !== previousScrollTop
      previousScrollTop = top
      const distance = root.scrollHeight - root.clientHeight
      if (moved && distance > 0 && top / distance >= .2) requestShow()
    }
    const focusOut = () => {
      clearTimeout(focusTimer)
      // Let the next focused element settle; moving between fields keeps waiting.
      focusTimer = setTimeout(() => { if (pending) show() }, 0)
    }
    resumeTimer()
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('focusout', focusOut)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => {
      pauseTimer()
      clearTimeout(focusTimer)
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('focusout', focusOut)
      window.removeEventListener('scroll', scroll)
      if (dialog.open) dialog.close()
    }
  }, [embedUrl])

  if (!embedUrl) return null
  return <dialog ref={dialogRef} className="iphone-contact-popup" aria-labelledby="iphone-contact-title" aria-describedby="iphone-contact-description" onClose={() => setIsOpen(false)} data-clarity-mask="true" data-hj-suppress>
    <div className="iphone-contact-popup-heading">
      <span className="iphone-contact-popup-eyebrow">Master Prime</span>
      <button type="button" autoFocus className="iphone-contact-popup-close" aria-label="Fechar convite de contato" onClick={() => dialogRef.current?.close()}><FiX aria-hidden="true" /></button>
      <h2 id="iphone-contact-title" className="sr-only">Quer ajuda para escolher seu iPhone?</h2>
      <p id="iphone-contact-description" className="sr-only">Deixe seu nome e WhatsApp para a equipe falar com você sobre modelos e condições.</p>
    </div>
    {isOpen && <iframe src={embedUrl} title="Solicitar contato da equipe Master Prime" className="iphone-contact-popup-frame" referrerPolicy="no-referrer" />}
    <a className="iphone-contact-popup-privacy" href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">Política de privacidade</a>
  </dialog>
}
