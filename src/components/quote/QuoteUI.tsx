import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion'
import { FiCheck, FiChevronDown, FiCopy, FiEdit2, FiHelpCircle, FiMapPin, FiMonitor, FiSearch, FiTruck, FiX } from 'react-icons/fi'
import { LuBatteryCharging, LuBrush, LuDisc3, LuGamepad2, LuGauge, LuHardDrive, LuKeyboard, LuLaptop, LuMemoryStick, LuMessageSquareMore, LuMonitorOff, LuPanelTop, LuPower, LuThermometer, LuWifi } from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { FaWhatsapp } from 'react-icons/fa'
import logoImage from '@/assets/images/logo.webp'
import { Footer } from '@/components/layout/Footer'
import type { CatalogModel, QuoteDraft, QuoteIssue } from '@/types/quote'
import { getWhatsAppQuoteUrl } from '@/utils/whatsapp'
import '@/styles/quote.css'

const quoteEase = [0.22, 1, 0.36, 1] as const

export const ModelSuggestions = ({ models, onSelect, onDismiss, reducedMotion, inputId = 'notebook-model' }: { models: CatalogModel[]; onSelect: (model: CatalogModel) => void; onDismiss: () => void; reducedMotion: boolean; inputId?: string }) => {
  const present = useIsPresent()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!present) return
    const dismissOutside = (event: PointerEvent) => { if (event.target instanceof Node && !ref.current?.parentElement?.contains(event.target)) onDismiss() }
    document.addEventListener('pointerdown', dismissOutside, { passive: true })
    return () => document.removeEventListener('pointerdown', dismissOutside)
  }, [onDismiss, present])
  useLayoutEffect(() => {
    if (!present) return
    const panel = ref.current
    const input = document.getElementById(inputId)
    if (!panel || !input) return
    const place = () => {
      const viewport = window.visualViewport
      const bounds = input.getBoundingClientRect()
      const top = viewport?.offsetTop ?? 0
      const bottom = top + (viewport?.height ?? window.innerHeight)
      const below = bottom - bounds.bottom - 16
      const above = bounds.top - top - 16
      const side = below < 156 && above > below ? 'above' : 'below'
      panel.dataset.side = side
      panel.style.maxHeight = `${Math.max(52, Math.min(260, side === 'above' ? above : below))}px`
    }
    place()
    window.visualViewport?.addEventListener('resize', place)
    window.visualViewport?.addEventListener('scroll', place)
    window.addEventListener('scroll', place, { passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.visualViewport?.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('scroll', place)
      window.removeEventListener('scroll', place)
      window.removeEventListener('resize', place)
    }
  }, [present, inputId])
  return (
    <motion.div ref={ref} id={`${inputId}-suggestions`} className="quote-model-suggestions" aria-label="Sugestões de modelo" aria-hidden={!present || undefined}
      initial={{ opacity: 0, y: reducedMotion ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
      transition={{ duration: reducedMotion ? 0 : 0.18, ease: quoteEase }} style={{ pointerEvents: present ? 'auto' : 'none' }}>
      {models.map(model => <button key={model.id} type="button" tabIndex={present ? 0 : -1} onMouseDown={event => event.preventDefault()} onClick={() => onSelect(model)}><FiMonitor aria-hidden="true" /><span>{model.name}</span><FiArrowUpRightMark /></button>)}
    </motion.div>
  )
}

export const QuoteReveal = ({ children, reducedMotion }: { children: React.ReactNode; reducedMotion: boolean }) => {
  const present = useIsPresent()
  return <motion.div ref={node => { if (node) node.inert = !present }} className="quote-reveal" aria-hidden={!present || undefined} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2, ease: quoteEase }}><div>{children}</div></motion.div>
}

const issueVisuals: Record<string, { icon: IconType; tone: string }> = {
  power: { icon: LuPower, tone: 'amber' },
  image: { icon: LuMonitorOff, tone: 'sky' },
  screen: { icon: LuPanelTop, tone: 'violet' },
  keyboard: { icon: LuKeyboard, tone: 'mint' },
  hinge: { icon: LuLaptop, tone: 'steel' },
  heat: { icon: LuThermometer, tone: 'coral' },
  slow: { icon: LuGauge, tone: 'violet' },
  battery: { icon: LuBatteryCharging, tone: 'amber' },
  other: { icon: LuMessageSquareMore, tone: 'steel' },
  cleaning: { icon: LuBrush, tone: 'mint' },
  ssd: { icon: LuHardDrive, tone: 'sky' },
  ram: { icon: LuMemoryStick, tone: 'violet' },
  upgrade: { icon: LuMemoryStick, tone: 'sky' },
  shutdown: { icon: LuPower, tone: 'coral' },
  freeze: { icon: LuGauge, tone: 'violet' },
  disc: { icon: LuDisc3, tone: 'sky' },
  drift: { icon: LuGamepad2, tone: 'amber' },
  buttons: { icon: LuGamepad2, tone: 'mint' },
  triggers: { icon: LuGamepad2, tone: 'violet' },
  connection: { icon: LuWifi, tone: 'sky' },
  hall: { icon: LuGamepad2, tone: 'mint' },
}

export const IssueChoice = ({ issue, selected, onToggle }: { issue: QuoteIssue; selected: boolean; onToggle: () => void }) => {
  const { icon: Icon, tone } = issueVisuals[issue.id] ?? issueVisuals.other
  const label = issue.kind === 'request' ? issue.label.replace(/^Consultar /, '') : issue.label
  return (
    <button type="button" className={`quote-issue ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={onToggle}>
      <Icon className={`quote-issue-icon tone-${tone}`} aria-hidden="true" />
      <strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong>
      <span className="quote-issue-check" aria-hidden="true"><FiCheck /></span>
    </button>
  )
}


export const QuoteLayout = ({ title, breadcrumbs, helpContent, children }: { title: ReactNode; breadcrumbs: ReactNode; helpContent: ReactNode; children: ReactNode }) => {
  const [helpOpen, setHelpOpen] = useState(false)
  const reducedMotion = useReducedMotion() === true
  return <div className="quote-page min-h-screen bg-dark text-white">
    <a href="#quote-form" className="quote-skip">Pular para o orçamento</a>
    <header className="quote-header">
      <a href="/" aria-label="Master Prime Assistência — início"><img src={logoImage} alt="Master Prime Assistência" width="639" height="376" /></a>
      <a href={getWhatsAppQuoteUrl()} target="_blank" rel="noopener noreferrer" className="quote-help"><FaWhatsapp aria-hidden="true" /><span>Ajuda no WhatsApp</span></a>
    </header>
    <main className="quote-layout">
      <div className="quote-page-title"><h1>{title}</h1></div>
      <div className="quote-workspace" id="quote-form">
        {children}
        <p className="quote-privacy-note"><a href="/politica-de-privacidade">Privacidade</a></p>
        <nav aria-label="Breadcrumb" className="quote-breadcrumb">{breadcrumbs}</nav>
      </div>
    </main>
    <section className="quote-bottom-context" aria-label="Sobre o orçamento">
      <button type="button" aria-expanded={helpOpen} aria-controls={helpOpen ? 'quote-help-content' : undefined} onClick={() => setHelpOpen(!helpOpen)}>Como funciona o orçamento? <FiChevronDown className="quote-disclosure-chevron" aria-hidden="true" /></button>
      <AnimatePresence initial={false}>{helpOpen && <QuoteReveal key="quote-help" reducedMotion={reducedMotion}><div id="quote-help-content">{helpContent}</div></QuoteReveal>}</AnimatePresence>
    </section>
    <Footer />
  </div>
}

export const QuoteProgress = ({ steps, step, transitioning, onNavigate }: { steps: readonly string[]; step: number; transitioning: boolean; onNavigate: (index: number) => void }) => (
  <div className="quote-progress" aria-label={`Etapa ${step + 1} de ${steps.length}: ${steps[step]}`}>
    <div className="quote-progress-top"><span>Etapa <strong>{step + 1}</strong> de {steps.length}</span><span>{steps[step]}</span></div>
    <ol>{steps.map((name, index) => <li key={name} aria-current={index === step ? 'step' : undefined} className={index <= step ? 'active' : ''}>
      {index < step ? <button type="button" disabled={transitioning} onClick={() => onNavigate(index)} aria-label={`Voltar para a etapa ${index + 1} de ${steps.length}: ${name}, concluída`} /> : <span className="sr-only">{name}{index === step ? ', atual' : ''}</span>}
    </li>)}</ol>
  </div>
)

export const QuoteStepTransition = ({ direction, reducedMotion, nodeRef, onVisible, children }: { direction: number; reducedMotion: boolean; nodeRef: (element: HTMLDivElement | null) => void; onVisible: () => void; children: ReactNode }) => (
  <motion.div ref={nodeRef} className="quote-step" custom={direction} initial="enter" animate="visible" exit="exit"
    variants={{
      enter: (travel: number) => ({ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : travel * 28 }),
      visible: { opacity: 1, x: 0, transition: { duration: reducedMotion ? 0 : 0.24, ease: quoteEase } },
      exit: (travel: number) => ({ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : travel * -20, transition: { duration: reducedMotion ? 0 : 0.13, ease: 'easeIn' } }),
    }} onAnimationComplete={animation => { if (animation === 'visible') onVisible() }}>{children}</motion.div>
)

interface QuoteModelFieldProps {
  id: string
  label: string
  model: string
  unknown: boolean
  error?: string
  platformLabel: ReactNode
  onPlatformEdit: () => void
  platformEditLabel?: string
  placeholder: string
  help: string
  helpOpen: boolean
  onHelpToggle: () => void
  focused: boolean
  showSuggestions: boolean
  suggestions: CatalogModel[]
  hint: string
  reducedMotion: boolean
  onFocus: (focused: boolean) => void
  onChange: (value: string) => void
  onUnknownChange: (value: boolean) => void
  onSelect: (model: CatalogModel) => void
  credit?: ReactNode
  allowUnknown?: boolean
  modelPolicy?: ReactNode
}

export const QuoteModelField = ({ id, label, model, unknown, error, platformLabel, onPlatformEdit, platformEditLabel = 'Alterar marca', placeholder, help, helpOpen, onHelpToggle, focused, showSuggestions, suggestions, hint, reducedMotion, onFocus, onChange, onUnknownChange, onSelect, credit, allowUnknown = true, modelPolicy }: QuoteModelFieldProps) => (
  <div className="quote-step-fields"><div className="quote-model-field" id="quote-model-section" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onFocus(false) }}>
    <p className="quote-model-brand"><span>{platformLabel}</span><button type="button" onClick={onPlatformEdit} aria-label={platformEditLabel}><FiEdit2 aria-hidden="true" /> Alterar</button></p>
    <label className="sr-only" htmlFor={id}>{label}</label>
    <div className="quote-model-search">
      <div className="quote-search-field"><FiSearch aria-hidden="true" /><input id={id} enterKeyHint="done" aria-invalid={!!error} value={model} disabled={unknown} onChange={event => onChange(event.target.value)} onFocus={() => onFocus(true)} onKeyDown={event => { if (event.key === 'Escape') { onFocus(false); event.stopPropagation() } }} maxLength={120} placeholder={placeholder} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-controls={showSuggestions ? `${id}-suggestions` : undefined} aria-describedby={`model-help model-search-status${error ? ' quote-model-error' : ''}`} /><button type="button" className="quote-suggestions-dismiss" aria-label="Fechar sugestões" aria-hidden={!showSuggestions || undefined} tabIndex={showSuggestions ? 0 : -1} data-visible={showSuggestions} onMouseDown={event => event.preventDefault()} onClick={() => onFocus(false)}><FiX aria-hidden="true" /></button></div>
      <AnimatePresence initial={false}>{showSuggestions && <ModelSuggestions key="models" inputId={id} models={suggestions} reducedMotion={reducedMotion} onDismiss={() => onFocus(false)} onSelect={onSelect} />}</AnimatePresence>
    </div>
    {error && <p id="quote-model-error" className="quote-inline-error">{error}</p>}
    <div id="model-search-status" className="sr-only" role="status">{focused && !unknown && suggestions.length ? `${suggestions.length} sugestões de modelo abaixo.` : ''}</div>
    <p className="quote-field-hint quote-model-hint" role="status">{hint}</p>
    {allowUnknown && <label className="quote-check"><input type="checkbox" checked={unknown} onChange={event => onUnknownChange(event.target.checked)} /><span>Não sei o modelo</span></label>}
    {modelPolicy}
    <div id="model-help" className="quote-model-help"><button type="button" aria-expanded={helpOpen} aria-controls={helpOpen ? 'quote-model-help-content' : undefined} onClick={onHelpToggle}><FiHelpCircle aria-hidden="true" /> Onde encontro o modelo?<FiChevronDown className="quote-disclosure-chevron" aria-hidden="true" /></button><AnimatePresence initial={false}>{helpOpen && <QuoteReveal key="model-help" reducedMotion={reducedMotion}><p id="quote-model-help-content">{help}</p></QuoteReveal>}</AnimatePresence></div>
    {credit}
  </div></div>
)

export const QuoteReviewSection = ({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) => (
  <section className="quote-review-block"><div className="quote-review-heading"><h3>{title}</h3><button type="button" onClick={onEdit} aria-label={`Editar ${title.toLowerCase()}`}><FiEdit2 aria-hidden="true" /> Editar</button></div>{children}</section>
)

export const QuoteHandoff = ({ handoff, onCopy, copyStatus, showCopyFallback, message }: { handoff: boolean; onCopy: () => void; copyStatus: string; showCopyFallback: boolean; message: () => string }) => <>
  <div className="quote-next-note"><FaWhatsapp aria-hidden="true" /><p>O resumo vai preenchido no WhatsApp. Toque em <strong>Enviar</strong> na conversa.</p></div>
  <p className="quote-small-print">Valores e condições são confirmados pela equipe após avaliar o caso.</p>
  {handoff && <div className="quote-handoff" role="status"><strong>Continue na conversa do WhatsApp.</strong><p>Envie a mensagem para a equipe receber o pedido. Se precisar, abra novamente ou copie o resumo.</p></div>}
  <button type="button" className="quote-copy" onClick={onCopy}><FiCopy aria-hidden="true" /> Copiar resumo</button>
  {copyStatus && <p className="quote-field-hint" role="status">{copyStatus}</p>}
  {showCopyFallback && <label className="quote-field">Resumo para copiar<textarea readOnly rows={9} value={message()} onFocus={event => event.target.select()} /></label>}
</>

const FiArrowUpRightMark = () => <span aria-hidden="true" className="quote-suggestion-arrow">↗</span>

export const QuoteDeliveryFields = ({ value, error, onChange }: { value: QuoteDraft['delivery']; error?: string; onChange: (value: QuoteDraft['delivery']) => void }) => (
<div className="quote-step-fields">
                    <fieldset id="quote-delivery" tabIndex={-1} aria-invalid={!!error} aria-describedby={error ? 'quote-delivery-error' : undefined}><legend className="sr-only">Preferência de atendimento</legend>{error && <p id="quote-delivery-error" className="quote-inline-error">{error}</p>}<div className="quote-delivery-options">{(['store', 'pickup', 'undecided'] as const).map(choice => {
                      const Icon = choice === 'store' ? FiMapPin : choice === 'pickup' ? FiTruck : FiHelpCircle
                      const labels = { store: 'Levar à loja', pickup: 'Consultar retirada e entrega', undecided: 'Combinar pelo WhatsApp' }
                      return <button type="button" key={choice} className={`quote-delivery ${value === choice ? 'selected' : ''}`} aria-pressed={value === choice} onClick={() => onChange(choice)}><Icon aria-hidden="true" /><span><strong>{labels[choice]}</strong>{choice === 'store' && <small>Campo Grande, Rio de Janeiro</small>}</span><span className="quote-radio-mark">{value === choice && <FiCheck aria-hidden="true" />}</span></button>
                    })}</div></fieldset>
                    {value === 'store' && <div className="quote-location-note"><FiMapPin aria-hidden="true" /><p>Avenida Cesário de Melo, 2571<br />Campo Grande, Rio de Janeiro/RJ<br /><a href="/#location">Ver localização</a></p></div>}
                    {value === 'pickup' && <p className="quote-small-print">Disponibilidade, condições e eventuais custos são confirmados pela equipe.</p>}
                  </div>
)
