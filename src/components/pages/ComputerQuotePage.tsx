import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { IssueChoice, QuoteDeliveryFields, QuoteHandoff, QuoteLayout, QuoteProgress, QuoteReviewSection, QuoteStepTransition } from '@/components/quote/QuoteUI'
import { COMPUTER_ISSUES, COMPUTER_KINDS, COMPUTER_STEPS, COMPUTER_STORAGE_KEY, createComputerQuoteDraft } from '@/data/computer-quote'
import { DELIVERY_LABELS } from '@/data/notebook-quote'
import { useQuoteViewport } from '@/hooks/useQuoteViewport'
import type { ComputerQuoteDraft } from '@/types/computer-quote'
import { buildComputerQuoteMessage, getComputerIssues, getComputerKindLabel, getComputerQuestions, restoreComputerQuoteDraft, toggleComputerIssue, updateComputerQuote } from '@/utils/computer-quote'
import { COMPUTER_EDIT_SCOPES, getFirstIncompleteComputerScreen, getComputerScreenErrors, getComputerScreens, getComputerScreenStep, isComputerScreenInScope, restoreComputerScreen } from '@/utils/computer-quote-flow'
import type { ComputerEditScope, ComputerQuoteErrors, ComputerQuoteField, ComputerQuoteScreen } from '@/utils/computer-quote-flow'
import { getQuoteAnswerValues, toggleQuoteAnswer, trackQuoteEvent } from '@/utils/quote'
import { getWhatsAppMessageUrl, getWhatsAppQuoteUrl, WHATSAPP_PHONE_PC_GAMER } from '@/utils/whatsapp'

const fieldTargets: Record<ComputerQuoteField, string> = { kind: 'quote-kind', issues: 'quote-issues', delivery: 'quote-delivery', neighborhood: 'quote-neighborhood', city: 'quote-city' }

export const ComputerQuotePage = () => {
  const [draft, setDraft] = useState<ComputerQuoteDraft>(createComputerQuoteDraft)
  const [screen, setScreen] = useState<ComputerQuoteScreen>('kind')
  const [restored, setRestored] = useState(false)
  const [errors, setErrors] = useState<ComputerQuoteErrors>({})
  const [editScope, setEditScope] = useState<ComputerEditScope | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState(1)
  const [handoff, setHandoff] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [showCopyFallback, setShowCopyFallback] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const startedRef = useRef(false)
  const pendingScroll = useRef(false)
  const focusFrame = useRef<number | null>(null)
  // Guard synchronous repeat clicks before React commits the transition state.
  const transitioningRef = useRef(false)
  const reducedMotion = useReducedMotion() === true
  useQuoteViewport()

  const step = getComputerScreenStep(screen)
  const screens = getComputerScreens(draft)
  const screenIndex = screens.indexOf(screen)
  const questions = getComputerQuestions(draft)
  const question = questions.find(item => screen === `question:${item.id}`)
  const nextScreen = screens[screenIndex + 1]
  const returnsToReview = !!editScope && !!nextScreen && !isComputerScreenInScope(nextScreen, editScope)
  const selectedIssues = getComputerIssues(draft)
  const headings: Record<string, [string, string]> = {
    kind: ['Qual é o seu computador?', ''],
    configuration: ['Sabe a marca, o modelo ou a configuração?', 'Opcional. Informe apenas o que souber.'],
    issues: ['O que está acontecendo?', 'Pode escolher mais de uma opção.'],
    notes: ['Quer acrescentar algo?', 'Opcional. Conte o que achar importante.'],
    delivery: ['Como prefere ser atendido?', 'Escolha o que funciona melhor para você.'],
    neighborhood: ['Qual é o seu bairro?', 'Para consultar retirada e entrega.'],
    city: ['Em qual cidade?', 'A equipe confirma a disponibilidade pelo WhatsApp.'],
    review: ['Confira seu pedido.', 'Depois, continuamos pelo WhatsApp.'],
  }
  const [title, subtitle] = question
    ? [question.label, question.multiple ? 'Pode escolher mais de uma opção. Opcional.' : 'Opcional. Responda se souber.']
    : headings[screen]

  useEffect(() => {
    let savedDraft: ComputerQuoteDraft | null = null
    try {
      const raw = sessionStorage.getItem(COMPUTER_STORAGE_KEY)
      savedDraft = restoreComputerQuoteDraft(raw)
      if (savedDraft) {
        const saved = JSON.parse(raw!)
        const position = restoreComputerScreen(savedDraft, saved)
        setDraft(savedDraft)
        setScreen(position)
        setEditScope(position !== 'review' && COMPUTER_EDIT_SCOPES.includes(saved.editScope) && isComputerScreenInScope(position, saved.editScope) ? saved.editScope : null)
      } else sessionStorage.removeItem(COMPUTER_STORAGE_KEY)
    } catch { /* Storage failures do not block the form or its entry preset. */ }
    if (!savedDraft && new URLSearchParams(window.location.search).get('tipo') === 'pc-gamer') {
      setDraft(current => ({ ...current, kind: 'pc-gamer' }))
    }
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    try { sessionStorage.setItem(COMPUTER_STORAGE_KEY, JSON.stringify({ draft, screen, step, editScope, savedAt: Date.now() })) }
    catch { /* WhatsApp handoff remains available without persistence. */ }
  }, [draft, screen, step, editScope, restored])

  useEffect(() => () => { if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current) }, [])

  const markStarted = () => {
    if (!startedRef.current) { trackQuoteEvent('quote_started', 0, 'computador'); startedRef.current = true }
    setErrors({})
    setHandoff(false)
    setCopyStatus('')
    setShowCopyFallback(false)
  }
  const update = (changes: Partial<ComputerQuoteDraft>) => {
    markStarted()
    setDraft(current => updateComputerQuote(current, changes))
  }
  const focusError = (invalid: ComputerQuoteErrors) => {
    const field = Object.keys(invalid)[0] as ComputerQuoteField | undefined
    const target = field ? document.getElementById(fieldTargets[field]) : headingRef.current
    target?.focus({ preventScroll: true })
  }
  const revealStep = useCallback((element: HTMLDivElement | null) => {
    if (!element || !pendingScroll.current) return
    pendingScroll.current = false
    const heading = element.querySelector('h2')
    const workspace = document.getElementById('quote-form')
    if (!heading || !workspace) return
    const viewport = window.visualViewport
    const actions = document.querySelector<HTMLElement>('.quote-actions')
    const reserved = actions && getComputedStyle(actions).position === 'fixed' ? actions.getBoundingClientRect().height : 0
    const top = (viewport?.offsetTop ?? 0) + 24
    const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - reserved - 24
    const bounds = heading.getBoundingClientRect()
    if (bounds.top >= top && bounds.bottom <= bottom) return
    window.scrollTo({ top: Math.max(0, window.scrollY + workspace.getBoundingClientRect().top - 24), behavior: reducedMotion ? 'instant' : 'smooth' })
  }, [reducedMotion])

  const goToScreen = (next: ComputerQuoteScreen, invalid: ComputerQuoteErrors = {}) => {
    if (transitioningRef.current) return
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.matches('.quote-form input, .quote-form textarea')) focused.blur()
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current)
    setErrors(invalid)
    if (next === screen) { focusFrame.current = window.requestAnimationFrame(() => focusError(invalid)); return }
    pendingScroll.current = true
    transitioningRef.current = true
    setDirection(screens.indexOf(next) < screenIndex ? -1 : 1)
    setTransitioning(true)
    setScreen(next)
    if (next === 'review') { setEditScope(null); trackQuoteEvent('quote_reviewed', 4, 'computador') }
  }
  const returnToReview = () => {
    const incomplete = getFirstIncompleteComputerScreen(draft)
    goToScreen(incomplete ?? 'review', incomplete ? getComputerScreenErrors(draft, incomplete) : {})
  }
  const next = () => {
    if (transitioningRef.current) return
    const invalid = getComputerScreenErrors(draft, screen)
    if (Object.keys(invalid).length) { setErrors(invalid); focusFrame.current = window.requestAnimationFrame(() => focusError(invalid)); return }
    markStarted()
    if (!nextScreen || getComputerScreenStep(nextScreen) !== step) trackQuoteEvent('quote_step_completed', step, 'computador')
    if (returnsToReview || nextScreen === 'review') returnToReview()
    else if (nextScreen) goToScreen(nextScreen)
  }
  const previous = () => {
    const target = screens[screenIndex - 1]
    if (editScope && (!target || !isComputerScreenInScope(target, editScope))) returnToReview()
    else if (target) goToScreen(target)
  }
  const edit = (scope: ComputerEditScope) => {
    if (transitioningRef.current) return
    setEditScope(scope)
    goToScreen(screens.find(item => isComputerScreenInScope(item, scope)) ?? 'kind')
  }
  const skipDetails = () => {
    if (transitioningRef.current) return
    markStarted()
    trackQuoteEvent('quote_step_completed', 2, 'computador')
    if (editScope) returnToReview()
    else goToScreen('delivery')
  }
  const openSummary = () => {
    const incomplete = getFirstIncompleteComputerScreen(draft)
    if (incomplete) { goToScreen(incomplete, getComputerScreenErrors(draft, incomplete)); return }
    trackQuoteEvent('quote_whatsapp_click', 4, 'computador')
    window.open(getWhatsAppMessageUrl(buildComputerQuoteMessage(draft), draft.kind === 'pc-gamer' ? WHATSAPP_PHONE_PC_GAMER : undefined), '_blank', 'noopener,noreferrer')
    setHandoff(true)
  }
  const copySummary = async () => {
    try { await navigator.clipboard.writeText(buildComputerQuoteMessage(draft)); setCopyStatus('Resumo copiado!') }
    catch { setShowCopyFallback(true); setCopyStatus('Selecione e copie o resumo abaixo.') }
  }
  const toggleIssue = (id: string) => { markStarted(); setDraft(current => toggleComputerIssue(current, id)) }

  return <QuoteLayout title={<>Orçamento de <span>computador.</span></>}
    breadcrumbs={<><a href="/">Início</a><span aria-hidden="true">/</span><a href="/servicos">Serviços</a><span aria-hidden="true">/</span><span aria-current="page">Orçamento de computador</span></>}
    helpContent={<><p>Você informa o computador, os sintomas ou o serviço que deseja consultar. Pelo WhatsApp, a equipe orienta sobre a avaliação técnica e confirma as condições de atendimento. Limpeza, formatação e upgrades dependem do estado e da configuração do equipamento. Retirada e entrega dependem da disponibilidade para o endereço.</p><a href="/conserto-de-computador-campo-grande-rj">Conhecer os serviços de computador <FiArrowRight aria-hidden="true" /></a><a href="/manutencao-de-pc-gamer">Conhecer a manutenção de PC gamer <FiArrowRight aria-hidden="true" /></a></>}>
    <QuoteProgress steps={COMPUTER_STEPS} step={step} transitioning={transitioning} onNavigate={index => { const target = screens.find(item => getComputerScreenStep(item) === index); if (target && !transitioningRef.current) { setEditScope(null); goToScreen(target) } }} />
    <noscript><div className="quote-noscript">Para preencher por etapas, ative o JavaScript. Você também pode <a href={getWhatsAppQuoteUrl()}>solicitar seu orçamento pelo WhatsApp</a>, informando o computador, os sintomas e como prefere o atendimento.</div></noscript>
    <form className="quote-form" data-screen={screen} aria-busy={transitioning} noValidate onSubmit={event => { event.preventDefault(); if (!transitioningRef.current && restored) { if (screen === 'review') openSummary(); else next() } }}>
      <div className="quote-private clarity-mask" data-clarity-mask="true" style={{ pointerEvents: transitioning ? 'none' : undefined }}>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <QuoteStepTransition key={screen} direction={direction} reducedMotion={reducedMotion} nodeRef={revealStep} onVisible={() => { transitioningRef.current = false; if (transitioning) { setTransitioning(false); focusError(errors) } }}>
            <div className="quote-form-heading"><h2 ref={headingRef} tabIndex={-1}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
            {screen === 'kind' && <fieldset id="quote-kind" tabIndex={-1} aria-invalid={!!errors.kind} aria-describedby={errors.kind ? 'quote-kind-error' : undefined}>
              <legend className="sr-only">Tipo de computador</legend>
              {errors.kind && <p id="quote-kind-error" className="quote-inline-error">{errors.kind}</p>}
              <div className="quote-answers">{COMPUTER_KINDS.map(kind => <button type="button" key={kind.id} className={`quote-answer ${draft.kind === kind.id ? 'selected' : ''}`} aria-pressed={draft.kind === kind.id} onClick={() => update({ kind: kind.id })}><span>{kind.name}</span><span className="quote-radio-mark" aria-hidden="true">{draft.kind === kind.id && <FiCheck />}</span></button>)}</div>
            </fieldset>}
            {screen === 'configuration' && <label className="quote-field" htmlFor="quote-configuration"><span className="sr-only">Marca, modelo ou configuração do computador</span><textarea id="quote-configuration" rows={3} value={draft.configuration} onChange={event => update({ configuration: event.target.value })} maxLength={300} placeholder="Ex.: Dell OptiPlex, Intel Core i5, 8 GB de RAM…" aria-describedby="configuration-hint" /><span className="quote-field-counter">{draft.configuration.length}/300</span><span id="configuration-hint" className="quote-field-hint">Se não souber, pode continuar sem preencher.</span></label>}
            {screen === 'issues' && <div className="quote-step-fields">
              <fieldset id="quote-issues" tabIndex={-1} aria-invalid={!!errors.issues} aria-describedby={errors.issues ? 'quote-issues-error' : undefined}>
                <legend className="sr-only">Problemas do computador</legend>
                {errors.issues && <p id="quote-issues-error" className="quote-inline-error">{errors.issues}</p>}
                <div className="quote-issues">{COMPUTER_ISSUES.filter(issue => issue.kind === 'symptom').map(issue => <IssueChoice key={issue.id} issue={issue} selected={draft.issueIds.includes(issue.id)} onToggle={() => toggleIssue(issue.id)} />)}</div>
              </fieldset>
              <fieldset><legend className="quote-secondary-legend">Quer consultar um serviço?</legend><div className="quote-issues">{COMPUTER_ISSUES.filter(issue => issue.kind === 'request').map(issue => <IssueChoice key={issue.id} issue={issue} selected={draft.issueIds.includes(issue.id)} onToggle={() => toggleIssue(issue.id)} />)}</div></fieldset>
              <p className="quote-field-hint" role="status">{selectedIssues.length ? `${selectedIssues.length} ${selectedIssues.length === 1 ? 'opção selecionada' : 'opções selecionadas'}` : 'Selecione ao menos uma opção.'}</p>
            </div>}
            {question && <fieldset><legend className="sr-only">{question.label}</legend><div className="quote-answers">{question.options.map(option => {
              const selected = getQuoteAnswerValues(draft, question).includes(option)
              return <button type="button" key={option} role={question.multiple ? 'checkbox' : undefined} aria-checked={question.multiple ? selected : undefined} aria-pressed={question.multiple ? undefined : selected} className={`quote-answer ${selected ? 'selected' : ''}`} onClick={() => update({ answers: toggleQuoteAnswer(draft, question, option) })}><span>{option}</span><span className={`quote-radio-mark ${question.multiple ? 'quote-checkbox-mark' : ''}`} aria-hidden="true">{selected && <FiCheck />}</span></button>
            })}</div></fieldset>}
            {screen === 'notes' && <div className="quote-step-fields"><label className="quote-field" htmlFor="quote-notes"><span className="sr-only">Observações sobre o computador</span><textarea id="quote-notes" rows={4} value={draft.notes} onChange={event => update({ notes: event.target.value })} maxLength={600} placeholder="Ex.: começou depois de trocar uma peça, acontece em um jogo…" aria-describedby="notes-hint" /><span className="quote-field-counter">{draft.notes.length}/600</span></label><p id="notes-hint" className="quote-small-print">Não inclua senhas. Fotos e vídeos podem ser enviados no WhatsApp.</p></div>}
            {screen === 'delivery' && <QuoteDeliveryFields value={draft.delivery} error={errors.delivery} onChange={delivery => update({ delivery })} />}
            {screen === 'neighborhood' && <label className="quote-field" htmlFor="quote-neighborhood"><span className="sr-only">Bairro</span><input id="quote-neighborhood" enterKeyHint="done" aria-invalid={!!errors.neighborhood} aria-describedby={errors.neighborhood ? 'quote-neighborhood-error' : undefined} value={draft.neighborhood} maxLength={80} onChange={event => update({ neighborhood: event.target.value })} placeholder="Ex.: Campo Grande" autoComplete="address-level3" />{errors.neighborhood && <span id="quote-neighborhood-error" className="quote-inline-error">{errors.neighborhood}</span>}</label>}
            {screen === 'city' && <label className="quote-field" htmlFor="quote-city"><span className="sr-only">Cidade</span><input id="quote-city" enterKeyHint="done" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'quote-city-error' : undefined} value={draft.city} maxLength={80} onChange={event => update({ city: event.target.value })} placeholder="Ex.: Rio de Janeiro" autoComplete="address-level2" />{errors.city && <span id="quote-city-error" className="quote-inline-error">{errors.city}</span>}</label>}
            {step === 2 && <button type="button" className="quote-skip-details" onClick={skipDetails}>Pular detalhes <FiArrowRight aria-hidden="true" /></button>}
            {screen === 'review' && <div className="quote-step-fields quote-review">
              <QuoteReviewSection title="Computador" onEdit={() => edit('identity')}><p className="quote-review-device"><strong>{draft.kind === 'unknown' ? 'Computador (tipo a identificar)' : getComputerKindLabel(draft)}</strong></p>{draft.configuration.trim() && <p className="quote-preserve-text">{draft.configuration}</p>}</QuoteReviewSection>
              <QuoteReviewSection title="Problemas e solicitações" onEdit={() => edit('issues')}><div className="quote-review-tags">{selectedIssues.map(issue => <span key={issue.id}><FiCheck aria-hidden="true" />{issue.label}</span>)}</div></QuoteReviewSection>
              <QuoteReviewSection title="Detalhes" onEdit={() => edit('details')}>
                {questions.filter(item => getQuoteAnswerValues(draft, item).length).map(item => <p key={item.id}><span className="quote-review-question">{item.label}</span>{getQuoteAnswerValues(draft, item).join('; ')}</p>)}
                {draft.notes.trim() && <p className="quote-preserve-text">{draft.notes}</p>}
                {!draft.notes.trim() && !questions.some(item => getQuoteAnswerValues(draft, item).length) && <p>Você pode contar mais no WhatsApp.</p>}
              </QuoteReviewSection>
              <QuoteReviewSection title="Atendimento" onEdit={() => edit('delivery')}><p>{draft.delivery && DELIVERY_LABELS[draft.delivery]}</p>{draft.delivery === 'pickup' && <p>{draft.neighborhood} · {draft.city}<br /><small>Disponibilidade e condições a confirmar pela equipe.</small></p>}</QuoteReviewSection>
              <QuoteHandoff handoff={handoff} onCopy={copySummary} copyStatus={copyStatus} showCopyFallback={showCopyFallback} message={() => buildComputerQuoteMessage(draft)} />
            </div>}
          </QuoteStepTransition>
        </AnimatePresence>
      </div>
      <div className="sr-only" role="alert">{Object.keys(errors).length ? `Confira as informações: ${Object.values(errors).join(' ')}` : ''}</div>
      <div className="quote-actions">
        {(screenIndex > 0 || editScope) && <button type="button" className="quote-back" onClick={previous} disabled={transitioning}><FiArrowLeft aria-hidden="true" /> Voltar</button>}
        <button type="submit" className={`quote-next ${step === 4 ? 'whatsapp' : ''}`} disabled={!restored || transitioning}>{step === 4 ? <><FaWhatsapp aria-hidden="true" />{handoff ? 'Abrir WhatsApp novamente' : 'Continuar no WhatsApp'}</> : <>{returnsToReview ? 'Salvar e ver resumo' : nextScreen === 'review' ? 'Revisar pedido' : 'Continuar'}<FiArrowRight aria-hidden="true" /></>}</button>
      </div>
    </form>
  </QuoteLayout>
}
