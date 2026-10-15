import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck, FiChevronDown, FiSearch, FiSmartphone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { IssueChoice, QuoteDeliveryFields, QuoteHandoff, QuoteLayout, QuoteModelField, QuoteProgress, QuoteReveal, QuoteReviewSection, QuoteStepTransition } from '@/components/quote/QuoteUI'
import { SMARTPHONE_BRANDS, SMARTPHONE_ISSUES, SMARTPHONE_STEPS, SMARTPHONE_STORAGE_KEY, createSmartphoneQuoteDraft } from '@/data/smartphone-quote'
import { DELIVERY_LABELS } from '@/data/notebook-quote'
import { useQuoteViewport } from '@/hooks/useQuoteViewport'
import type { SmartphoneQuoteDraft } from '@/types/smartphone-quote'
import { buildSmartphoneQuoteMessage, getSmartphoneAnswerValues, getSmartphoneBrand, getSmartphoneIssues, getSmartphoneQuestions, restoreSmartphoneQuoteDraft, searchSmartphoneModels, toggleSmartphoneAnswer, toggleSmartphoneIssue, updateSmartphoneQuote } from '@/utils/smartphone-quote'
import { SMARTPHONE_EDIT_SCOPES, getFirstIncompleteSmartphoneScreen, getSmartphoneScreenErrors, getSmartphoneScreens, getSmartphoneScreenStep, isSmartphoneScreenInScope, restoreSmartphoneScreen } from '@/utils/smartphone-quote-flow'
import type { SmartphoneEditScope, SmartphoneQuoteErrors, SmartphoneQuoteField, SmartphoneQuoteScreen } from '@/utils/smartphone-quote-flow'
import { normalizeCatalogSearch, trackQuoteEvent } from '@/utils/quote'
import { getWhatsAppMessageUrl, getWhatsAppQuoteUrl } from '@/utils/whatsapp'

const fieldTargets: Record<SmartphoneQuoteField, string> = { brand: 'quote-brand', model: 'smartphone-model', issues: 'quote-issues', delivery: 'quote-delivery', neighborhood: 'quote-neighborhood', city: 'quote-city' }

export const SmartphoneQuotePage = () => {
  const [draft, setDraft] = useState<SmartphoneQuoteDraft>(createSmartphoneQuoteDraft)
  const [screen, setScreen] = useState<SmartphoneQuoteScreen>('brand')
  const [restored, setRestored] = useState(false)
  const [errors, setErrors] = useState<SmartphoneQuoteErrors>({})
  const [editScope, setEditScope] = useState<SmartphoneEditScope | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState(1)
  const [allBrands, setAllBrands] = useState(false)
  const [brandSearch, setBrandSearch] = useState('')
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

  const step = getSmartphoneScreenStep(screen)
  const screens = getSmartphoneScreens(draft)
  const screenIndex = screens.indexOf(screen)
  const questions = getSmartphoneQuestions(draft)
  const question = questions.find(item => screen === `question:${item.id}`)
  const nextScreen = screens[screenIndex + 1]
  const returnsToReview = !!editScope && !!nextScreen && !isSmartphoneScreenInScope(nextScreen, editScope)
  const selectedIssues = getSmartphoneIssues(draft)
  const selectedAnswers = question ? getSmartphoneAnswerValues(draft, question) : []
  const suggestions = searchSmartphoneModels(draft.brandId, draft.model)
  const showSuggestions = modelFocus && !modelSelected && !draft.modelUnknown && suggestions.length > 0
  const activeBrands = SMARTPHONE_BRANDS.filter((brand, index) => allBrands
    ? normalizeCatalogSearch(brand.name).includes(normalizeCatalogSearch(brandSearch))
    : index < 4 || brand.id === draft.brandId)
  const headings: Record<string, [string, string]> = {
    brand: ['Qual é a marca?', ''],
    model: ['E o modelo?', 'Digite o modelo ou escolha uma sugestão.'],
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
    try {
      const raw = sessionStorage.getItem(SMARTPHONE_STORAGE_KEY)
      const savedDraft = restoreSmartphoneQuoteDraft(raw)
      if (savedDraft) {
        const saved = JSON.parse(raw!)
        const position = restoreSmartphoneScreen(savedDraft, saved)
        setDraft(savedDraft)
        setScreen(position)
        setEditScope(position !== 'review' && SMARTPHONE_EDIT_SCOPES.includes(saved.editScope) && isSmartphoneScreenInScope(position, saved.editScope) ? saved.editScope : null)
      } else sessionStorage.removeItem(SMARTPHONE_STORAGE_KEY)
    } catch { /* Storage failures do not block the form. */ }
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    try { sessionStorage.setItem(SMARTPHONE_STORAGE_KEY, JSON.stringify({ draft, screen, step, editScope, savedAt: Date.now() })) }
    catch { /* WhatsApp handoff remains available without persistence. */ }
  }, [draft, screen, step, editScope, restored])

  useEffect(() => () => { if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current) }, [])

  const markStarted = () => {
    if (!startedRef.current) { trackQuoteEvent('quote_started', 0, 'celular'); startedRef.current = true }
    setErrors({})
    setHandoff(false)
    setCopyStatus('')
    setShowCopyFallback(false)
  }
  const update = (changes: Partial<SmartphoneQuoteDraft>) => {
    markStarted()
    setDraft(current => updateSmartphoneQuote(current, changes))
  }
  const focusError = (invalid: SmartphoneQuoteErrors) => {
    const field = Object.keys(invalid)[0] as SmartphoneQuoteField | undefined
    const target = field ? document.getElementById(field === 'brand' && draft.brandId === 'other' ? 'quote-custom-brand' : fieldTargets[field]) : headingRef.current
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

  const goToScreen = (next: SmartphoneQuoteScreen, invalid: SmartphoneQuoteErrors = {}) => {
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
    if (next === 'review') { setEditScope(null); trackQuoteEvent('quote_reviewed', 4, 'celular') }
  }
  const returnToReview = () => {
    const incomplete = getFirstIncompleteSmartphoneScreen(draft)
    goToScreen(incomplete ?? 'review', incomplete ? getSmartphoneScreenErrors(draft, incomplete) : {})
  }
  const next = () => {
    if (transitioning) return
    const invalid = getSmartphoneScreenErrors(draft, screen)
    if (Object.keys(invalid).length) { setErrors(invalid); focusFrame.current = window.requestAnimationFrame(() => focusError(invalid)); return }
    markStarted()
    if (!nextScreen || getSmartphoneScreenStep(nextScreen) !== step) trackQuoteEvent('quote_step_completed', step, 'celular')
    if (returnsToReview || nextScreen === 'review') returnToReview()
    else if (nextScreen) goToScreen(nextScreen)
  }
  const previous = () => {
    const target = screens[screenIndex - 1]
    if (editScope && (!target || !isSmartphoneScreenInScope(target, editScope))) returnToReview()
    else if (target) goToScreen(target)
  }
  const edit = (scope: SmartphoneEditScope) => {
    setEditScope(scope)
    goToScreen(screens.find(item => isSmartphoneScreenInScope(item, scope)) ?? 'brand')
  }
  const skipDetails = () => {
    markStarted()
    trackQuoteEvent('quote_step_completed', 2, 'celular')
    if (editScope) returnToReview()
    else goToScreen('delivery')
  }
  const openSummary = () => {
    const incomplete = getFirstIncompleteSmartphoneScreen(draft)
    if (incomplete) { goToScreen(incomplete, getSmartphoneScreenErrors(draft, incomplete)); return }
    trackQuoteEvent('quote_whatsapp_click', 4, 'celular')
    window.open(getWhatsAppMessageUrl(buildSmartphoneQuoteMessage(draft)), '_blank', 'noopener,noreferrer')
    setHandoff(true)
  }
  const copySummary = async () => {
    try { await navigator.clipboard.writeText(buildSmartphoneQuoteMessage(draft)); setCopyStatus('Resumo copiado!') }
    catch { setShowCopyFallback(true); setCopyStatus('Selecione e copie o resumo abaixo.') }
  }
  const selectBrand = (brandId: string) => {
    update({ brandId })
    setModelFocus(false)
    setModelSelected(false)
  }
  const toggleIssue = (id: string) => { markStarted(); setDraft(current => toggleSmartphoneIssue(current, id)) }
  const liquidGuidance = draft.issueIds.includes('liquid')
  const batteryGuidance = getSmartphoneAnswerValues(draft, SMARTPHONE_ISSUES[1].questions[0]).includes('A tela ou tampa está levantando')
  const guidance = <>
    {liquidGuidance && <p className="quote-small-print">Se houve contato com líquido, mantenha o celular desligado e não carregue até a avaliação.</p>}
    {batteryGuidance && <p className="quote-small-print">Se a tela ou tampa está levantando, não pressione para fechar e evite carregar até a inspeção.</p>}
  </>

  return <QuoteLayout title={<>Orçamento de <span>celular.</span></>}
    breadcrumbs={<><a href="/">Início</a><span aria-hidden="true">/</span><a href="/servicos">Serviços</a><span aria-hidden="true">/</span><span aria-current="page">Orçamento de celular</span></>}
    helpContent={<><p>Você informa a marca, o modelo e os sintomas do celular. Pelo WhatsApp, a equipe orienta sobre a avaliação técnica e confirma a possibilidade e as condições de atendimento. Retirada e entrega dependem da disponibilidade para o endereço.</p><a href="/conserto-de-celular-campo-grande-rj">Conhecer os serviços de celular <FiArrowRight aria-hidden="true" /></a></>}>
    <QuoteProgress steps={SMARTPHONE_STEPS} step={step} transitioning={transitioning} onNavigate={index => { const target = screens.find(item => getSmartphoneScreenStep(item) === index); if (target) { setEditScope(null); goToScreen(target) } }} />
    <noscript><div className="quote-noscript">Para preencher por etapas, ative o JavaScript. Você também pode <a href={getWhatsAppQuoteUrl()}>solicitar seu orçamento pelo WhatsApp</a>, informando a marca e o modelo do celular, os sintomas e como prefere o atendimento.</div></noscript>
    <form className="quote-form" data-screen={screen} aria-busy={transitioning} noValidate onSubmit={event => { event.preventDefault(); if (!transitioning && restored) { if (screen === 'review') openSummary(); else next() } }}>
      <div className="quote-private clarity-mask" data-clarity-mask="true" style={{ pointerEvents: transitioning ? 'none' : undefined }}>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <QuoteStepTransition key={screen} direction={direction} reducedMotion={reducedMotion} nodeRef={revealStep} onVisible={() => { if (transitioning) { setTransitioning(false); focusError(errors) } }}>
            <div className="quote-form-heading"><h2 ref={headingRef} tabIndex={-1}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
            {screen === 'brand' && <div className="quote-step-fields">
              <fieldset id="quote-brand" tabIndex={-1} aria-invalid={!!errors.brand} aria-describedby={errors.brand ? 'quote-brand-error' : undefined}>
                <legend className="sr-only">Marca do celular</legend>
                {errors.brand && <p id="quote-brand-error" className="quote-inline-error">{errors.brand}</p>}
                <AnimatePresence initial={false}>{allBrands && <QuoteReveal key="brand-search" reducedMotion={reducedMotion}><div className="quote-search-field"><FiSearch aria-hidden="true" /><input aria-label="Buscar marca" placeholder="Buscar marca" value={brandSearch} maxLength={80} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="done" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() } }} onChange={event => setBrandSearch(event.target.value)} /></div></QuoteReveal>}</AnimatePresence>
                <div className={`quote-brands quote-brands-smartphone ${allBrands ? 'expanded' : ''}`}>{activeBrands.map(brand => <button type="button" key={brand.id} aria-pressed={draft.brandId === brand.id} className={`quote-brand ${draft.brandId === brand.id ? 'selected' : ''}`} onClick={() => selectBrand(brand.id)}><span>{brand.name}</span>{draft.brandId === brand.id && <FiCheck aria-hidden="true" />}</button>)}</div>
                {allBrands && !activeBrands.length && <p className="quote-field-hint">Você pode informar outra marca abaixo.</p>}
                <button type="button" className="quote-text-action" aria-expanded={allBrands} onClick={() => { setAllBrands(!allBrands); setBrandSearch('') }}>{allBrands ? 'Mostrar menos marcas' : 'Ver todas as marcas'} <FiChevronDown aria-hidden="true" /></button>
                <div className="quote-choice-row">{[{ id: 'other', label: 'Outra marca' }, { id: 'unknown', label: 'Não sei a marca' }].map(choice => <button key={choice.id} type="button" aria-pressed={draft.brandId === choice.id} className={`quote-small-choice ${draft.brandId === choice.id ? 'selected' : ''}`} onClick={() => selectBrand(choice.id)}>{choice.label}{draft.brandId === choice.id && <FiCheck aria-hidden="true" />}</button>)}</div>
                <AnimatePresence initial={false}>{draft.brandId === 'other' && <QuoteReveal key="custom-brand" reducedMotion={reducedMotion}><label className="quote-field" htmlFor="quote-custom-brand">Nome da marca<input id="quote-custom-brand" enterKeyHint="done" aria-invalid={!!errors.brand} aria-describedby={errors.brand ? 'quote-brand-error' : undefined} value={draft.customBrand} onChange={event => update({ customBrand: event.target.value })} maxLength={80} placeholder="Digite a marca" autoComplete="off" /></label></QuoteReveal>}</AnimatePresence>
              </fieldset>
            </div>}
            {screen === 'model' && <QuoteModelField id="smartphone-model" suggestionIcon={FiSmartphone} label="Modelo do celular" model={draft.model} unknown={draft.modelUnknown} error={errors.model}
              platformLabel={<>Marca: <strong>{getSmartphoneBrand(draft)}</strong></>} onPlatformEdit={() => goToScreen('brand')}
              placeholder={draft.brandId === 'apple' ? 'Ex.: iPhone 13' : draft.brandId === 'samsung' ? 'Ex.: Galaxy A55' : 'Digite o nome ou código do modelo'}
              help="Se o aparelho estiver acessível, procure em Ajustes/Ajustes gerais → Sobre ou Configurações → Sobre o telefone. Você também pode consultar a caixa. Não ligue um aparelho molhado ou com bateria deformada para procurar o modelo. Se não souber, marque “Não sei o modelo”. Não precisa informar IMEI ou número de série."
              helpOpen={modelHelpOpen} onHelpToggle={() => { setModelFocus(false); setModelHelpOpen(!modelHelpOpen) }} focused={modelFocus} showSuggestions={showSuggestions} suggestions={suggestions} reducedMotion={reducedMotion}
              hint={draft.modelUnknown ? '' : modelSelected ? 'Modelo selecionado. Pode continuar.' : draft.model.trim() && !suggestions.length ? 'Pode continuar com o modelo que você digitou.' : '\u00a0'}
              onFocus={setModelFocus} onChange={model => { update({ model }); setModelSelected(false); setModelFocus(true) }} onUnknownChange={modelUnknown => { update({ modelUnknown }); setModelFocus(false) }}
              onSelect={model => { update({ model: model.name }); setModelSelected(true); setModelFocus(false); document.getElementById('smartphone-model')?.blur() }} />}
            {screen === 'issues' && <div className="quote-step-fields">
              <fieldset id="quote-issues" tabIndex={-1} aria-invalid={!!errors.issues} aria-describedby={errors.issues ? 'quote-issues-error' : undefined}><legend className="sr-only">Problemas do celular</legend>{errors.issues && <p id="quote-issues-error" className="quote-inline-error">{errors.issues}</p>}<div className="quote-issues">{SMARTPHONE_ISSUES.map(issue => <IssueChoice key={issue.id} issue={issue} selected={draft.issueIds.includes(issue.id)} onToggle={() => toggleIssue(issue.id)} />)}</div></fieldset>
              <p className="quote-field-hint" role="status">{draft.issueIds.length ? `${draft.issueIds.length} ${draft.issueIds.length === 1 ? 'opção selecionada' : 'opções selecionadas'}` : 'Selecione ao menos uma opção.'}</p>
              {guidance}
            </div>}
            {question && <div className="quote-step-fields"><fieldset><legend className="sr-only">{question.label}</legend><div className="quote-answers">{question.options.map(option => {
              const selected = selectedAnswers.includes(option)
              return <button type="button" key={option} role={question.multiple ? 'checkbox' : undefined} aria-checked={question.multiple ? selected : undefined} aria-pressed={question.multiple ? undefined : selected} className={`quote-answer ${selected ? 'selected' : ''}`} onClick={() => { markStarted(); setDraft(current => ({ ...current, answers: toggleSmartphoneAnswer(current, question, option) })) }}><span>{option}</span><span className={`quote-radio-mark ${question.multiple ? 'quote-checkbox-mark' : ''}`} aria-hidden="true">{selected && <FiCheck aria-hidden="true" />}</span></button>
            })}</div></fieldset>{guidance}</div>}
            {screen === 'notes' && <div className="quote-step-fields"><label className="quote-field" htmlFor="quote-notes"><span className="sr-only">Observações sobre o celular</span><textarea id="quote-notes" rows={4} value={draft.notes} onChange={event => update({ notes: event.target.value })} maxLength={600} placeholder="Ex.: começou ontem, depois de uma queda…" aria-describedby="notes-hint" /><span className="quote-field-counter">{draft.notes.length}/600</span></label><p id="notes-hint" className="quote-small-print">Não inclua senhas, IMEI ou dados de contas. Fotos e vídeos podem ser enviados no WhatsApp.</p>{guidance}</div>}
            {screen === 'delivery' && <QuoteDeliveryFields value={draft.delivery} error={errors.delivery} onChange={delivery => update({ delivery })} />}
            {screen === 'neighborhood' && <label className="quote-field" htmlFor="quote-neighborhood"><span className="sr-only">Bairro</span><input id="quote-neighborhood" enterKeyHint="done" aria-invalid={!!errors.neighborhood} aria-describedby={errors.neighborhood ? 'quote-neighborhood-error' : undefined} value={draft.neighborhood} maxLength={80} onChange={event => update({ neighborhood: event.target.value })} placeholder="Ex.: Campo Grande" autoComplete="address-level3" />{errors.neighborhood && <span id="quote-neighborhood-error" className="quote-inline-error">{errors.neighborhood}</span>}</label>}
            {screen === 'city' && <label className="quote-field" htmlFor="quote-city"><span className="sr-only">Cidade</span><input id="quote-city" enterKeyHint="done" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'quote-city-error' : undefined} value={draft.city} maxLength={80} onChange={event => update({ city: event.target.value })} placeholder="Ex.: Rio de Janeiro" autoComplete="address-level2" />{errors.city && <span id="quote-city-error" className="quote-inline-error">{errors.city}</span>}</label>}
            {step === 2 && <button type="button" className="quote-skip-details" onClick={skipDetails}>Pular detalhes <FiArrowRight aria-hidden="true" /></button>}
            {screen === 'review' && <div className="quote-step-fields quote-review">
              <QuoteReviewSection title="Seu celular" onEdit={() => edit('identity')}><p className="quote-review-device"><FiSmartphone aria-hidden="true" /><strong>{getSmartphoneBrand(draft)}</strong></p><p>{draft.modelUnknown ? 'Modelo a identificar com a equipe' : draft.model}</p></QuoteReviewSection>
              <QuoteReviewSection title="Problemas" onEdit={() => edit('issues')}><div className="quote-review-tags">{selectedIssues.map(issue => <span key={issue.id}><FiCheck aria-hidden="true" />{issue.label}</span>)}</div></QuoteReviewSection>
              <QuoteReviewSection title="Detalhes" onEdit={() => edit('details')}>{questions.filter(item => getSmartphoneAnswerValues(draft, item).length).map(item => <p key={item.id}><span className="quote-review-question">{item.label}</span>{getSmartphoneAnswerValues(draft, item).join('; ')}</p>)}{draft.notes.trim() && <p className="quote-preserve-text">{draft.notes}</p>}{!draft.notes.trim() && !questions.some(item => getSmartphoneAnswerValues(draft, item).length) && <p>Você pode contar mais no WhatsApp.</p>}</QuoteReviewSection>
              <QuoteReviewSection title="Atendimento" onEdit={() => edit('delivery')}><p>{draft.delivery ? DELIVERY_LABELS[draft.delivery] : ''}</p>{draft.delivery === 'pickup' && <p>{draft.neighborhood} · {draft.city}<br /><small>Disponibilidade e condições a confirmar pela equipe.</small></p>}</QuoteReviewSection>
              {guidance}
              <QuoteHandoff handoff={handoff} onCopy={copySummary} copyStatus={copyStatus} showCopyFallback={showCopyFallback} message={() => buildSmartphoneQuoteMessage(draft)} />
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
