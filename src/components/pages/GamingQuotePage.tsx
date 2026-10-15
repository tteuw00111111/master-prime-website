import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { IssueChoice, QuoteDeliveryFields, QuoteHandoff, QuoteLayout, QuoteModelField, QuoteProgress, QuoteReviewSection, QuoteStepTransition } from '@/components/quote/QuoteUI'
import { GAMING_DEVICE_LABELS, GAMING_MODES, GAMING_PLATFORMS, GAMING_STEPS, GAMING_STORAGE_KEY, createGamingQuoteDraft } from '@/data/gaming-quote'
import { DELIVERY_LABELS } from '@/data/notebook-quote'
import { useQuoteViewport } from '@/hooks/useQuoteViewport'
import type { GamingDeviceDraft, GamingDeviceKind, GamingQuoteDraft } from '@/types/gaming-quote'
import { buildGamingQuoteMessage, getGamingDevices, getGamingIssues, getGamingPlatformLabel, getGamingQuestions, getLegacyGamingModelError, getSelectedGamingIssues, getSupportedGamingModel, restoreGamingQuoteDraft, searchGamingModels, toggleGamingIssue, updateGamingDevice } from '@/utils/gaming-quote'
import { getFirstIncompleteGamingScreen, getGamingScreenDevice, getGamingScreenErrors, getGamingScreens, getGamingScreenStep, restoreGamingScreen } from '@/utils/gaming-quote-flow'
import type { GamingQuoteErrors, GamingQuoteScreen } from '@/utils/gaming-quote-flow'
import { getQuoteAnswerValues, toggleQuoteAnswer, trackQuoteEvent } from '@/utils/quote'
import { getWhatsAppMessageUrl, getWhatsAppQuoteUrl } from '@/utils/whatsapp'

type EditScope = 'devices' | 'console:identity' | 'controller:identity' | 'console:issues' | 'controller:issues' | 'details' | 'delivery'
const editScopes: EditScope[] = ['devices', 'console:identity', 'controller:identity', 'console:issues', 'controller:issues', 'details', 'delivery']
const isInScope = (screen: GamingQuoteScreen, scope: EditScope) => {
  if (scope === 'devices') return getGamingScreenStep(screen) === 0
  if (scope === 'details') return getGamingScreenStep(screen) === 2
  if (scope === 'delivery') return getGamingScreenStep(screen) === 3
  const [kind, group] = scope.split(':')
  return getGamingScreenDevice(screen) === kind && (group === 'identity' ? getGamingScreenStep(screen) === 0 : screen === `${kind}:issues`)
}

export const GamingQuotePage = () => {
  const [draft, setDraft] = useState<GamingQuoteDraft>(createGamingQuoteDraft)
  const [screen, setScreen] = useState<GamingQuoteScreen>('mode')
  const [restored, setRestored] = useState(false)
  const [errors, setErrors] = useState<GamingQuoteErrors>({})
  const [editScope, setEditScope] = useState<EditScope | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState(1)
  const [modelFocus, setModelFocus] = useState(false)
  const [modelSelected, setModelSelected] = useState(false)
  const [modelHelpOpen, setModelHelpOpen] = useState(false)
  const [handoff, setHandoff] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [showCopyFallback, setShowCopyFallback] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const startedRef = useRef(false)
  const pendingScroll = useRef(false)
  const focusFrame = useRef<number | null>(null)
  const reducedMotion = useReducedMotion() === true
  useQuoteViewport()

  const step = getGamingScreenStep(screen)
  const screens = getGamingScreens(draft)
  const screenIndex = screens.indexOf(screen)
  const kind = getGamingScreenDevice(screen)
  const device = kind ? draft[kind] : null
  const questions = kind && device ? getGamingQuestions(kind, device) : []
  const question = questions.find(item => screen === `${kind}:question:${item.id}`)
  const nextScreen = screens[screenIndex + 1]
  const returnsToReview = !!editScope && !!nextScreen && !isInScope(nextScreen, editScope)
  const suggestions = kind && device ? searchGamingModels(kind, device.platform, device.model) : []
  const showSuggestions = modelFocus && !modelSelected && !!device && !device.modelUnknown && suggestions.length > 0
  const modelId = kind ? `gaming-${kind}-model` : 'gaming-model'
  const headings: Record<string, [string, string]> = {
    mode: ['O que precisa de atendimento?', ''],
    platform: ['Qual é a plataforma?', ''],
    model: ['E o modelo?', 'Busque e escolha um dos modelos da lista.'],
    issues: ['O que está acontecendo?', 'Pode escolher mais de uma opção.'],
    notes: ['Quer acrescentar algo?', 'Opcional. Conte o que achar importante.'],
    delivery: ['Como prefere ser atendido?', 'Escolha o que funciona melhor para você.'],
    neighborhood: ['Qual é o seu bairro?', 'Para consultar retirada e entrega.'],
    city: ['Em qual cidade?', 'A equipe confirma a disponibilidade pelo WhatsApp.'],
    review: ['Confira seu pedido.', 'Depois, continuamos pelo WhatsApp.'],
  }
  const [title, subtitle] = question
    ? [question.label, question.multiple ? 'Pode escolher mais de uma opção. Opcional.' : 'Opcional. Responda se souber.']
    : headings[kind ? screen.split(':')[1] : screen]

  useEffect(() => {
    let savedDraft: GamingQuoteDraft | null = null
    try {
      const raw = sessionStorage.getItem(GAMING_STORAGE_KEY)
      savedDraft = restoreGamingQuoteDraft(raw)
      if (savedDraft) {
        const saved = JSON.parse(raw!)
        const position = restoreGamingScreen(savedDraft, saved)
        setDraft(savedDraft)
        setScreen(position)
        setEditScope(position !== 'review' && editScopes.includes(saved.editScope) ? saved.editScope : null)
      } else sessionStorage.removeItem(GAMING_STORAGE_KEY)
    } catch { /* Storage failures do not block the request or its entry preset. */ }
    if (!savedDraft) {
      const entry = new URLSearchParams(window.location.search).get('aparelho')
      if (entry === 'videogame' || entry === 'controle') setDraft(current => ({ ...current, mode: entry === 'videogame' ? 'console' : 'controller' }))
    }
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    try { sessionStorage.setItem(GAMING_STORAGE_KEY, JSON.stringify({ draft, screen, step, editScope, savedAt: Date.now() })) }
    catch { /* The form and WhatsApp handoff remain usable without storage. */ }
  }, [draft, screen, step, editScope, restored])

  useEffect(() => () => { if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current) }, [])

  const markStarted = () => {
    if (!startedRef.current) { trackQuoteEvent('quote_started', 0, 'videogame'); startedRef.current = true }
    setErrors({})
    setHandoff(false)
    setCopyStatus('')
    setShowCopyFallback(false)
  }
  const update = (changes: Partial<GamingQuoteDraft>) => {
    markStarted()
    setDraft(current => ({ ...current, ...changes }))
  }
  const updateDevice = (target: GamingDeviceKind, changes: Partial<GamingDeviceDraft>) => {
    markStarted()
    setDraft(current => ({ ...current, [target]: updateGamingDevice(target, current[target], changes) }))
  }
  const focusError = (invalid: GamingQuoteErrors) => {
    const field = Object.keys(invalid)[0]
    const target = field ? document.getElementById(field === 'model' ? modelId : `quote-${field}`) : headingRef.current
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

  const goToScreen = (next: GamingQuoteScreen, invalid: GamingQuoteErrors = {}) => {
    if (transitioning) return
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.matches('.quote-form input, .quote-form textarea')) focused.blur()
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current)
    setErrors(invalid)
    if (next === screen) { focusFrame.current = window.requestAnimationFrame(() => focusError(invalid)); return }
    pendingScroll.current = true
    setDirection(screens.indexOf(next) < screenIndex ? -1 : 1)
    setTransitioning(true)
    setModelFocus(false)
    setModelSelected(false)
    setModelHelpOpen(false)
    setScreen(next)
    if (next === 'review') { setEditScope(null); trackQuoteEvent('quote_reviewed', 4, 'videogame') }
  }
  const returnToReview = () => {
    const incomplete = getFirstIncompleteGamingScreen(draft)
    goToScreen(incomplete ?? 'review', incomplete ? getGamingScreenErrors(draft, incomplete) : {})
  }
  const next = () => {
    if (transitioning) return
    const invalid = getGamingScreenErrors(draft, screen)
    if (Object.keys(invalid).length) { setErrors(invalid); focusFrame.current = window.requestAnimationFrame(() => focusError(invalid)); return }
    markStarted()
    if (!nextScreen || getGamingScreenStep(nextScreen) !== step) trackQuoteEvent('quote_step_completed', step, 'videogame')
    if (returnsToReview || nextScreen === 'review') returnToReview()
    else if (nextScreen) goToScreen(nextScreen)
  }
  const previous = () => {
    const target = screens[screenIndex - 1]
    if (editScope && (!target || !isInScope(target, editScope))) returnToReview()
    else if (target) goToScreen(target)
  }
  const edit = (target: GamingQuoteScreen, scope: EditScope) => { setEditScope(scope); goToScreen(target) }
  const skipDetails = () => {
    markStarted()
    trackQuoteEvent('quote_step_completed', 2, 'videogame')
    if (editScope) returnToReview()
    else goToScreen('delivery')
  }
  const openSummary = () => {
    const incomplete = getFirstIncompleteGamingScreen(draft)
    if (incomplete) { goToScreen(incomplete, getGamingScreenErrors(draft, incomplete)); return }
    trackQuoteEvent('quote_whatsapp_click', 4, 'videogame')
    window.open(getWhatsAppMessageUrl(buildGamingQuoteMessage(draft)), '_blank', 'noopener,noreferrer')
    setHandoff(true)
  }
  const copySummary = async () => {
    try { await navigator.clipboard.writeText(buildGamingQuoteMessage(draft)); setCopyStatus('Resumo copiado!') }
    catch { setShowCopyFallback(true); setCopyStatus('Selecione e copie o resumo abaixo.') }
  }

  return <QuoteLayout title={<>Orçamento de <span>videogame e controle.</span></>}
    breadcrumbs={<><a href="/">Início</a><span aria-hidden="true">/</span><a href="/servicos">Serviços</a><span aria-hidden="true">/</span><span aria-current="page">Orçamento de videogame e controle</span></>}
    helpContent={<><p>Você informa o videogame, o controle ou os dois e descreve os sintomas. Pelo WhatsApp, a equipe orienta sobre a avaliação técnica e confirma a possibilidade e as condições de atendimento. Retirada e entrega dependem da disponibilidade para o endereço.</p><a href="/conserto-de-videogame">Conhecer os serviços de videogame <FiArrowRight aria-hidden="true" /></a><a href="/conserto-de-controle">Conhecer os serviços de controle <FiArrowRight aria-hidden="true" /></a></>}>
    <QuoteProgress steps={GAMING_STEPS} step={step} transitioning={transitioning} onNavigate={index => { const target = screens.find(item => getGamingScreenStep(item) === index); if (target) { setEditScope(null); goToScreen(target) } }} />
    <noscript><div className="quote-noscript">Para preencher por etapas, ative o JavaScript. Você também pode <a href={getWhatsAppQuoteUrl()}>solicitar seu orçamento pelo WhatsApp</a>, informando o modelo do videogame ou controle, os sintomas e como prefere o atendimento.</div></noscript>
    <form className="quote-form" data-screen={screen} aria-busy={transitioning} noValidate onSubmit={event => { event.preventDefault(); if (!transitioning) { if (screen === 'review') openSummary(); else next() } }}>
      <div className="quote-private clarity-mask" data-clarity-mask="true" style={{ pointerEvents: transitioning ? 'none' : undefined }}>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <QuoteStepTransition key={screen} direction={direction} reducedMotion={reducedMotion} nodeRef={revealStep} onVisible={() => { if (transitioning) { setTransitioning(false); focusError(errors) } }}>
            <div className="quote-form-heading">
              {kind && device && <p className="quote-device-context">{GAMING_DEVICE_LABELS[kind]}{device.platform && ` · ${getGamingPlatformLabel(device.platform)}`}{!device.modelUnknown && device.model && !screen.endsWith(':model') && ` · ${device.model}`}</p>}
              <h2 ref={headingRef} tabIndex={-1}>{title}</h2>{subtitle && <p>{subtitle}</p>}
            </div>
            {screen === 'mode' && <fieldset id="quote-mode" tabIndex={-1} aria-invalid={!!errors.mode} aria-describedby={errors.mode ? 'quote-mode-error' : undefined}>
              <legend className="sr-only">Aparelhos para atendimento</legend>
              {errors.mode && <p id="quote-mode-error" className="quote-inline-error">{errors.mode}</p>}
              <div className="quote-answers">{GAMING_MODES.map(choice => <button type="button" key={choice.id} className={`quote-answer ${draft.mode === choice.id ? 'selected' : ''}`} aria-pressed={draft.mode === choice.id} onClick={() => update({ mode: choice.id })}><span>{choice.name}</span><span className="quote-radio-mark" aria-hidden="true">{draft.mode === choice.id && <FiCheck />}</span></button>)}</div>
            </fieldset>}
            {kind && device && screen.endsWith(':platform') && <fieldset id="quote-platform" tabIndex={-1} aria-invalid={!!errors.platform} aria-describedby={errors.platform ? 'quote-platform-error' : undefined}>
              <legend className="sr-only">Plataforma do {GAMING_DEVICE_LABELS[kind].toLowerCase()}</legend>
              {errors.platform && <p id="quote-platform-error" className="quote-inline-error">{errors.platform}</p>}
              <div className="quote-answers">{GAMING_PLATFORMS.map(platform => <button type="button" key={platform.id} className={`quote-answer ${device.platform === platform.id ? 'selected' : ''}`} aria-pressed={device.platform === platform.id} onClick={() => updateDevice(kind, { platform: platform.id })}><span>{platform.name}</span><span className="quote-radio-mark" aria-hidden="true">{device.platform === platform.id && <FiCheck />}</span></button>)}</div>
            </fieldset>}
            {kind && device && screen.endsWith(':model') && <QuoteModelField id={modelId} label={`Modelo do ${GAMING_DEVICE_LABELS[kind].toLowerCase()}`} model={device.model} unknown={false} allowUnknown={false} error={getLegacyGamingModelError(device.model) ?? errors.model}
              platformLabel={<>Plataforma: <strong>{getGamingPlatformLabel(device.platform)}</strong></>} platformEditLabel="Alterar plataforma" onPlatformEdit={() => goToScreen(`${kind}:platform`)}
              placeholder={kind === 'console' ? device.platform === 'xbox' ? 'Ex.: Xbox Series S' : 'Ex.: PS5 Slim' : device.platform === 'xbox' ? 'Ex.: Controle Xbox Series X|S' : 'Ex.: DualSense'}
              help={`Procure o nome ou código na etiqueta do ${kind === 'console' ? 'videogame' : 'controle'} ou na embalagem. Não precisa informar número de série. Se não encontrar, a equipe pode ajudar pelo WhatsApp.`}
              helpOpen={modelHelpOpen} onHelpToggle={() => { setModelFocus(false); setModelHelpOpen(!modelHelpOpen) }} focused={modelFocus} showSuggestions={showSuggestions} suggestions={suggestions} reducedMotion={reducedMotion}
              hint={getLegacyGamingModelError(device.model) ? '\u00a0' : getSupportedGamingModel(kind, device) ? 'Modelo reconhecido. Pode continuar.' : device.model.trim() && !suggestions.length ? 'Nenhum modelo desta lista corresponde à busca.' : '\u00a0'}
              modelPolicy={<p className="quote-small-print">Para PS4, PS5, Xbox One e Xbox Series X|S e seus controles. Não sabe identificar? <a className="quote-model-help-link" href={getWhatsAppQuoteUrl()} target="_blank" rel="noopener noreferrer">Peça ajuda no WhatsApp.</a></p>}
              onFocus={setModelFocus} onChange={model => { updateDevice(kind, { model }); setModelSelected(false); setModelFocus(true) }} onUnknownChange={modelUnknown => { updateDevice(kind, { modelUnknown }); setModelFocus(false) }}
              onSelect={model => { updateDevice(kind, { model: model.name }); setModelSelected(true); setModelFocus(false); document.getElementById(modelId)?.blur() }} />}
            {kind && device && screen.endsWith(':issues') && <div className="quote-step-fields">
              <fieldset id="quote-issues" tabIndex={-1} aria-invalid={!!errors.issues} aria-describedby={errors.issues ? 'quote-issues-error' : undefined}><legend className="sr-only">Problemas do {GAMING_DEVICE_LABELS[kind].toLowerCase()}</legend>
                {errors.issues && <p id="quote-issues-error" className="quote-inline-error">{errors.issues}</p>}
                <div className="quote-issues">{getGamingIssues(kind, device).filter(issue => issue.kind === 'symptom').map(issue => <IssueChoice key={issue.id} issue={issue} selected={device.issueIds.includes(issue.id)} onToggle={() => { markStarted(); setDraft(current => ({ ...current, [kind]: toggleGamingIssue(kind, current[kind], issue.id) })) }} />)}</div>
              </fieldset>
              <fieldset><legend className="quote-secondary-legend">Quer consultar um serviço?</legend><div className="quote-issues">{getGamingIssues(kind, device).filter(issue => issue.kind === 'request').map(issue => <IssueChoice key={issue.id} issue={issue} selected={device.issueIds.includes(issue.id)} onToggle={() => { markStarted(); setDraft(current => ({ ...current, [kind]: toggleGamingIssue(kind, current[kind], issue.id) })) }} />)}</div></fieldset>
              {kind === 'controller' && device.issueIds.includes('hall') && <p className="quote-small-print">A equipe confirma a compatibilidade do Hall Effect após avaliar o modelo e o estado do controle.</p>}
              <p className="quote-field-hint" role="status">{device.issueIds.length ? `${device.issueIds.length} ${device.issueIds.length === 1 ? 'opção selecionada' : 'opções selecionadas'}` : 'Selecione ao menos uma opção.'}</p>
            </div>}
            {kind && device && question && <fieldset><legend className="sr-only">{question.label}</legend><div className="quote-answers">{question.options.map(option => {
              const selected = getQuoteAnswerValues(device, question).includes(option)
              return <button type="button" key={option} role={question.multiple ? 'checkbox' : undefined} aria-checked={question.multiple ? selected : undefined} aria-pressed={question.multiple ? undefined : selected} className={`quote-answer ${selected ? 'selected' : ''}`} onClick={() => { markStarted(); setDraft(current => ({ ...current, [kind]: { ...current[kind], answers: toggleQuoteAnswer(current[kind], question, option) } })) }}><span>{option}</span><span className={`quote-radio-mark ${question.multiple ? 'quote-checkbox-mark' : ''}`} aria-hidden="true">{selected && <FiCheck />}</span></button>
            })}</div></fieldset>}
            {screen === 'notes' && <div className="quote-step-fields"><label className="quote-field" htmlFor="quote-notes"><span className="sr-only">Observações sobre os aparelhos</span><textarea id="quote-notes" rows={4} value={draft.notes} onChange={event => update({ notes: event.target.value })} maxLength={600} placeholder="Ex.: começou ontem, depois de uma queda…" aria-describedby="notes-hint" /><span className="quote-field-counter">{draft.notes.length}/600</span></label><p id="notes-hint" className="quote-small-print">Não inclua senhas. Fotos e vídeos podem ser enviados no WhatsApp.</p></div>}
            {screen === 'delivery' && <QuoteDeliveryFields value={draft.delivery} error={errors.delivery} onChange={delivery => update({ delivery })} />}
            {screen === 'neighborhood' && <label className="quote-field" htmlFor="quote-neighborhood"><span className="sr-only">Bairro</span><input id="quote-neighborhood" enterKeyHint="done" aria-invalid={!!errors.neighborhood} aria-describedby={errors.neighborhood ? 'quote-neighborhood-error' : undefined} value={draft.neighborhood} maxLength={80} onChange={event => update({ neighborhood: event.target.value })} placeholder="Ex.: Campo Grande" autoComplete="address-level3" />{errors.neighborhood && <span id="quote-neighborhood-error" className="quote-inline-error">{errors.neighborhood}</span>}</label>}
            {screen === 'city' && <label className="quote-field" htmlFor="quote-city"><span className="sr-only">Cidade</span><input id="quote-city" enterKeyHint="done" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'quote-city-error' : undefined} value={draft.city} maxLength={80} onChange={event => update({ city: event.target.value })} placeholder="Ex.: Rio de Janeiro" autoComplete="address-level2" />{errors.city && <span id="quote-city-error" className="quote-inline-error">{errors.city}</span>}</label>}
            {step === 2 && <button type="button" className="quote-skip-details" onClick={skipDetails}>Pular detalhes <FiArrowRight aria-hidden="true" /></button>}
            {screen === 'review' && <div className="quote-step-fields quote-review">
              <QuoteReviewSection title="Aparelhos" onEdit={() => edit('mode', 'devices')}><p>{GAMING_MODES.find(mode => mode.id === draft.mode)?.name}</p></QuoteReviewSection>
              {getGamingDevices(draft).map(target => <div key={target} className="quote-step-fields">
                <QuoteReviewSection title={GAMING_DEVICE_LABELS[target]} onEdit={() => edit(`${target}:platform`, `${target}:identity`)}><p className="quote-review-device"><strong>{getGamingPlatformLabel(draft[target].platform)}</strong></p><p>{getSupportedGamingModel(target, draft[target])?.name}</p></QuoteReviewSection>
                <QuoteReviewSection title={`Problemas do ${GAMING_DEVICE_LABELS[target].toLowerCase()}`} onEdit={() => edit(`${target}:issues`, `${target}:issues`)}><div className="quote-review-tags">{getSelectedGamingIssues(target, draft[target]).map(issue => <span key={issue.id}><FiCheck aria-hidden="true" />{issue.label}</span>)}</div></QuoteReviewSection>
              </div>)}
              <QuoteReviewSection title="Detalhes" onEdit={() => edit(screens.find(item => getGamingScreenStep(item) === 2) ?? 'notes', 'details')}>
                {getGamingDevices(draft).map(target => getGamingQuestions(target, draft[target]).filter(item => getQuoteAnswerValues(draft[target], item).length).map(item => <p key={`${target}:${item.id}`}><span className="quote-review-question">{GAMING_DEVICE_LABELS[target]} · {item.label}</span>{getQuoteAnswerValues(draft[target], item).join('; ')}</p>))}
                {draft.notes.trim() && <p className="quote-preserve-text">{draft.notes}</p>}
                {!draft.notes.trim() && !getGamingDevices(draft).some(target => getGamingQuestions(target, draft[target]).some(item => getQuoteAnswerValues(draft[target], item).length)) && <p>Você pode contar mais no WhatsApp.</p>}
              </QuoteReviewSection>
              <QuoteReviewSection title="Atendimento" onEdit={() => edit('delivery', 'delivery')}><p>{draft.delivery && DELIVERY_LABELS[draft.delivery]}</p>{draft.delivery === 'pickup' && <p>{draft.neighborhood} · {draft.city}<br /><small>Disponibilidade e condições a confirmar pela equipe.</small></p>}</QuoteReviewSection>
              <QuoteHandoff handoff={handoff} onCopy={copySummary} copyStatus={copyStatus} showCopyFallback={showCopyFallback} message={() => buildGamingQuoteMessage(draft)} />
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
