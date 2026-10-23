import { useCallback, useEffect, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { IPHONE_CONTACT_POPUP } from '@/data/iphone-contact-popup'
import { getIPhoneContactEmbedUrl, IPHONE_POPUP_VISIBLE_MS } from '@/utils/iphone-contact-popup'
import '@/styles/iphone-contact-popup.css'

// One automatic display per loaded document; a new visit starts fresh.
let shownInDocument = false

const isEditing = () => document.activeElement instanceof HTMLElement && (
  document.activeElement.matches('input, select, textarea') || document.activeElement.isContentEditable
)

export const IPhoneContactPopup = ({ openRequest = 0 }: { openRequest?: number }) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [loadTimedOut, setLoadTimedOut] = useState(false)
  const [frameVersion, setFrameVersion] = useState(0)
  const manualRequestRef = useRef(0)
  const embedUrl = getIPhoneContactEmbedUrl(IPHONE_CONTACT_POPUP)

  const openDialog = useCallback(() => {
    const dialog = dialogRef.current
    if (!embedUrl || !dialog || typeof dialog.showModal !== 'function' || dialog.open || document.hidden) return
    setShouldLoad(true)
    dialog.showModal()
    shownInDocument = true
    setIsOpen(true)
  }, [embedUrl])

  useEffect(() => {
    if (openRequest <= manualRequestRef.current) return
    manualRequestRef.current = openRequest
    openDialog()
  }, [openRequest, openDialog])

  useEffect(() => {
    if (!shouldLoad || frameLoaded) return
    const timeout = setTimeout(() => setLoadTimedOut(true), 8000)
    return () => clearTimeout(timeout)
  }, [shouldLoad, frameLoaded, frameVersion])

  const retry = () => {
    setFrameLoaded(false)
    setLoadTimedOut(false)
    setFrameVersion(value => value + 1)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!embedUrl || !dialog || typeof dialog.showModal !== 'function' || shownInDocument) return

    let shown = false
    let pending = false
    let remaining = IPHONE_POPUP_VISIBLE_MS
    let visibleSince: number | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let focusTimer: ReturnType<typeof setTimeout> | undefined
    let warmTimer: ReturnType<typeof setTimeout> | undefined
    let previousScrollTop = document.documentElement.scrollTop

    const show = () => {
      if (shown || shownInDocument || document.hidden || isEditing()) return
      shown = true
      clearTimeout(timer)
      openDialog()
    }
    const requestShow = () => { pending = true; show() }
    const pauseTimer = () => {
      clearTimeout(timer)
      clearTimeout(warmTimer)
      if (visibleSince !== null) remaining = Math.max(0, remaining - (performance.now() - visibleSince))
      visibleSince = null
    }
    const resumeTimer = () => {
      if (shown || document.hidden || pending) return
      visibleSince = performance.now()
      timer = setTimeout(requestShow, remaining)
      // Use the existing wait before automatic display to fetch the external form.
      // A dismissed document does not reopen automatically; manual reopening works.
      warmTimer = setTimeout(() => { if (!document.hidden) setShouldLoad(true) }, Math.min(1000, remaining))
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
  }, [embedUrl, openDialog])

  if (!embedUrl) return null
  return <dialog ref={dialogRef} className="iphone-contact-popup" aria-labelledby="iphone-contact-title" aria-describedby="iphone-contact-description" onClose={() => setIsOpen(false)} data-clarity-mask="true" data-hj-suppress>
    <div className="iphone-contact-popup-heading">
      <span className="iphone-contact-popup-eyebrow">Master Prime</span>
      <button type="button" autoFocus className="iphone-contact-popup-close" aria-label="Fechar convite de contato" onClick={() => dialogRef.current?.close()}><FiX aria-hidden="true" /></button>
      <h2 id="iphone-contact-title" className="sr-only">Quer ajuda para escolher seu iPhone?</h2>
      <p id="iphone-contact-description" className="sr-only">Deixe seu nome e WhatsApp para a equipe falar com você sobre modelos e condições.</p>
    </div>
    <div className="iphone-contact-popup-body" aria-busy={!frameLoaded}>
      {isOpen && !frameLoaded && <div className="iphone-contact-popup-loading" role="status">
        <span className="iphone-contact-popup-spinner" aria-hidden="true" />
        <p>{loadTimedOut ? 'O formulário está demorando para carregar.' : 'Carregando formulário…'}</p>
        {loadTimedOut && <button type="button" onClick={retry}>Tentar novamente</button>}
      </div>}
      {shouldLoad && <iframe key={frameVersion} src={embedUrl} title="Solicitar contato da equipe Master Prime" className={`iphone-contact-popup-frame${frameLoaded ? '' : ' is-loading'}`} referrerPolicy="no-referrer" loading="eager" tabIndex={frameLoaded ? 0 : -1} onLoad={() => { setFrameLoaded(true); setLoadTimedOut(false) }} onError={() => setLoadTimedOut(true)} />}
    </div>
    <div className="iphone-contact-popup-alternatives">
      <button type="button" onClick={retry}>Recarregar formulário</button>
      <a href={embedUrl.replace('/embed/', '/r/')} target="_blank" rel="noopener noreferrer">Abrir em outra aba</a>
    </div>
    <a className="iphone-contact-popup-privacy" href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">Política de privacidade</a>
  </dialog>
}
