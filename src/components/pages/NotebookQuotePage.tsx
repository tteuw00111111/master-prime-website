import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck, FiChevronDown, FiMonitor, FiSearch } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { DELIVERY_LABELS, NOTEBOOK_BRANDS, NOTEBOOK_ISSUES, QUOTE_STEPS, QUOTE_STORAGE_KEY, createQuoteDraft } from '@/data/notebook-quote'
import type { CatalogModel, NotebookCatalog, QuoteDraft, QuoteStep } from '@/types/quote'
import { buildQuoteMessage, getQuoteAnswerValues, getQuoteBrand, getQuoteIssues, getQuoteQuestions, normalizeCatalogSearch, parseNotebookCatalog, restoreQuoteDraft, searchCatalogModels, toggleQuoteAnswer, toggleQuoteIssue, trackQuoteEvent } from '@/utils/quote'
import type { QuoteField } from '@/utils/quote'
import { useQuoteViewport } from '@/hooks/useQuoteViewport'
import { getWhatsAppQuoteUrl, getWhatsAppMessageUrl } from '@/utils/whatsapp'
import { getFirstIncompleteScreen, getQuoteScreens, getScreenErrors, getScreenStep, restoreQuoteScreen } from '@/utils/quote-flow'
import type { QuoteScreen } from '@/utils/quote-flow'
import { IssueChoice, QuoteDeliveryFields, QuoteHandoff, QuoteLayout, QuoteModelField, QuoteProgress, QuoteReveal, QuoteReviewSection, QuoteStepTransition } from '@/components/quote/QuoteUI'

const fieldTargets: Record<QuoteField, string> = { brand: 'quote-brand', model: 'notebook-model', issues: 'quote-issues', delivery: 'quote-delivery', neighborhood: 'quote-neighborhood', city: 'quote-city' }

export const NotebookQuotePage = () => {
  const [draft, setDraft] = useState<QuoteDraft>(createQuoteDraft)
  const [screen, setScreen] = useState<QuoteScreen>('brand')
  const step = getScreenStep(screen)
  const [restored, setRestored] = useState(false)
  const [catalog, setCatalog] = useState<NotebookCatalog | null>(null)
  const [models, setModels] = useState<CatalogModel[]>([])
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [allBrands, setAllBrands] = useState(false)
  const [brandSearch, setBrandSearch] = useState('')
  const [modelFocus, setModelFocus] = useState(false)
  const [modelSelected, setModelSelected] = useState(false)
  const [modelHelpOpen, setModelHelpOpen] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState(1)
  const reducedMotion = useReducedMotion() === true
  const [errors, setErrors] = useState<Partial<Record<QuoteField, string>>>({})
  const [editingReview, setEditingReview] = useState(false)
  const [handoff, setHandoff] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [showCopyFallback, setShowCopyFallback] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const startedRef = useRef(false)
  const stepFrame = useRef<number | null>(null)
  const pendingStepScroll = useRef(false)
  useQuoteViewport()
  const questions = getQuoteQuestions(draft)
  const screens = getQuoteScreens(draft)
  const question = questions.find(item => screen === `question:${item.id}`)
  const selectedAnswers = question ? getQuoteAnswerValues(draft, question) : []
  const questionIndex = questions.findIndex(item => item.id === question?.id)
  const screenIndex = screens.indexOf(screen)
  const headings: Record<string, [string, string]> = {
    brand: ['Qual é a marca?', ''],
    model: ['E o modelo?', 'Digite o nome ou o código da etiqueta.'],
    issues: ['O que está acontecendo?', 'Pode escolher mais de uma opção.'],
    notes: ['Quer acrescentar algo?', 'Opcional. Conte o que achar importante.'],
    delivery: ['Como prefere ser atendido?', 'Escolha o que funciona melhor para você.'],
    neighborhood: ['Qual é o seu bairro?', 'Para consultar retirada e entrega.'],
    city: ['Em qual cidade?', 'A equipe confirma a disponibilidade pelo WhatsApp.'],
    review: ['Confira seu pedido.', 'Depois, continuamos pelo WhatsApp.'],
  }
  const [title, subtitle] = question ? [question.label, question.multiple ? 'Pode escolher mais de uma opção. Opcional.' : `Pergunta ${questionIndex + 1} de ${questions.length} · Opcional`] : headings[screen]
  const nextScreen = screens[screenIndex + 1]
  const returnsToReview = editingReview && nextScreen && getScreenStep(nextScreen) !== step
  const nextLabel = returnsToReview ? 'Salvar e ver resumo' : nextScreen === 'review' ? 'Revisar pedido' : 'Continuar'
  const selectedIssues = getQuoteIssues(draft)
  const suggestions = useMemo(() => normalizeCatalogSearch(draft.model).length >= 2 ? searchCatalogModels(models, draft.brandId, draft.model) : [], [models, draft.brandId, draft.model])
  const showSuggestions = modelFocus && !modelSelected && !draft.modelUnknown && suggestions.length > 0
  const brands: { id: string; name: string }[] = [...NOTEBOOK_BRANDS, ...(catalog?.brands ?? []).filter(brand => !NOTEBOOK_BRANDS.some(item => item.id === brand.id))]

  useEffect(() => () => {
    if (stepFrame.current !== null) window.cancelAnimationFrame(stepFrame.current)
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(QUOTE_STORAGE_KEY)
      const saved = restoreQuoteDraft(raw)
      if (saved) {
        const savedState = JSON.parse(raw!)
        setDraft(saved)
        const restoredScreen = restoreQuoteScreen(saved, savedState)
        setScreen(restoredScreen)
        setEditingReview(savedState.editingReview === true && restoredScreen !== 'review')
      } else sessionStorage.removeItem(QUOTE_STORAGE_KEY)
    } catch { /* Storage can be disabled; the form still works. */ }
    setRestored(true)
  }, [])

  useEffect(() => {
    setModels([])
    const brand = catalog?.brands?.find(item => item.id === draft.brandId)
    if (!brand) { if (catalog) setCatalogStatus('ready'); return }
    const controller = new AbortController()
    setCatalogStatus('loading')
    const load = async () => {
      if (brand.compressedFile && typeof DecompressionStream !== 'undefined') {
        try {
          const response = await fetch(brand.compressedFile, { signal: controller.signal })
          if (!response.ok || !response.body) throw new Error('Catálogo indisponível')
          return await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json()
        } catch (error) { if (controller.signal.aborted) throw error }
      }
      const response = await fetch(brand.file, { signal: controller.signal })
      if (!response.ok) throw new Error('Catálogo indisponível')
      return response.json()
    }
    load()
      .then(value => { setModels(parseNotebookCatalog(value).models); setCatalogStatus('ready') })
      .catch(() => { if (!controller.signal.aborted) setCatalogStatus('unavailable') })
    return () => controller.abort()
  }, [draft.brandId, catalog])

  useEffect(() => {
    if (!restored) return
    try { sessionStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify({ draft, step, screen, editingReview, savedAt: Date.now() })) }
    catch { /* No persistence is required for submitting via WhatsApp. */ }
  }, [draft, restored, step, screen, editingReview])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/catalog/notebooks.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Catálogo indisponível'); return response.json() })
      .then(value => { setCatalog(parseNotebookCatalog(value)); setCatalogStatus('ready') })
      .catch(() => { if (!controller.signal.aborted) setCatalogStatus('unavailable') })
    return () => controller.abort()
  }, [])

  const markStarted = () => {
    if (!startedRef.current) { trackQuoteEvent('quote_started', 0); startedRef.current = true }
    setErrors({})
    setHandoff(false)
    setCopyStatus('')
    setShowCopyFallback(false)
  }

  const update = (changes: Partial<QuoteDraft>) => {
    markStarted()
    setDraft(current => ({ ...current, ...changes }))
  }

  const focusError = (invalid: Partial<Record<QuoteField, string>>) => {
    const first = Object.keys(invalid)[0] as QuoteField | undefined
    const target = first ? document.getElementById(first === 'brand' && draft.brandId === 'other' ? 'quote-custom-brand' : fieldTargets[first]) : headingRef.current
    target?.focus({ preventScroll: true })
  }

  const revealStep = useCallback((element: HTMLDivElement | null) => {
    if (!element || !pendingStepScroll.current) return
    pendingStepScroll.current = false
    const heading = element.querySelector('h2')
    const workspace = document.getElementById('quote-form')
    if (!heading || !workspace) return
    const viewport = window.visualViewport
    const top = (viewport?.offsetTop ?? 0) + 24
    const actions = document.querySelector<HTMLElement>('.quote-actions')
    const reservedBottom = actions && getComputedStyle(actions).position === 'fixed' ? actions.getBoundingClientRect().height : 0
    const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - reservedBottom - 24
    const bounds = heading.getBoundingClientRect()
    if (bounds.top >= top && bounds.bottom <= bottom) return
    // Only committed navigation may reposition the page. Typing and selecting a
    // model leave scrolling to the browser; the next question starts in view.
    window.scrollTo({ top: Math.max(0, window.scrollY + workspace.getBoundingClientRect().top - 24), behavior: reducedMotion ? 'instant' : 'smooth' })
  }, [reducedMotion])

  const goToScreen = (next: QuoteScreen, invalid: Partial<Record<QuoteField, string>> = {}) => {
    if (transitioning) return
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.matches('.quote-form input, .quote-form textarea')) focused.blur()
    if (stepFrame.current !== null) window.cancelAnimationFrame(stepFrame.current)
    setErrors(invalid)
    if (next === screen) { stepFrame.current = window.requestAnimationFrame(() => focusError(invalid)); return }
    pendingStepScroll.current = true
    setDirection(screens.indexOf(next) < screenIndex ? -1 : 1)
    setTransitioning(true)
    setModelFocus(false)
    setScreen(next)
    if (next === 'review') { setEditingReview(false); trackQuoteEvent('quote_reviewed', 4) }
  }

  const nextStep = () => {
    if (transitioning) return
    const invalid = getScreenErrors(draft, screen)
    if (Object.keys(invalid).length) {
      setErrors(invalid)
      stepFrame.current = window.requestAnimationFrame(() => focusError(invalid))
      return
    }
    markStarted()
    if (!nextScreen || getScreenStep(nextScreen) !== step) trackQuoteEvent('quote_step_completed', step)
    if (returnsToReview) {
      const incomplete = getFirstIncompleteScreen(draft)
      goToScreen(incomplete ?? 'review', incomplete ? getScreenErrors(draft, incomplete) : {})
    } else if (nextScreen) goToScreen(nextScreen)
  }

  const previousScreen = () => {
    const previous = screens[screenIndex - 1]
    if (editingReview && (!previous || getScreenStep(previous) !== step)) {
      const incomplete = getFirstIncompleteScreen(draft)
      goToScreen(incomplete ?? 'review', incomplete ? getScreenErrors(draft, incomplete) : {})
    } else if (previous) goToScreen(previous)
  }

  const skipDetails = () => {
    markStarted()
    trackQuoteEvent('quote_step_completed', 2)
    goToScreen(editingReview ? 'review' : 'delivery')
  }

  const selectBrand = (brandId: string) => {
    const changed = brandId !== draft.brandId
    update({ brandId, ...(changed ? { customBrand: brands.find(brand => brand.id === brandId)?.name ?? '', model: '', modelUnknown: false } : {}) })
    setModelFocus(false)
    setModelSelected(false)
  }

  const toggleIssue = (id: string) => {
    markStarted()
    setDraft(current => ({ ...current, ...toggleQuoteIssue(current, id) }))
  }

  const openSummary = () => {
    const incomplete = getFirstIncompleteScreen(draft)
    if (incomplete !== null) { goToScreen(incomplete, getScreenErrors(draft, incomplete)); return }
    trackQuoteEvent('quote_whatsapp_click', 4)
    // Construct only on click. The message never appears in a DOM href or analytics.
    window.open(getWhatsAppMessageUrl(buildQuoteMessage(draft)), '_blank', 'noopener,noreferrer')
    setHandoff(true)
  }

  const copySummary = async () => {
    try { await navigator.clipboard.writeText(buildQuoteMessage(draft)); setCopyStatus('Resumo copiado!') }
    catch { setShowCopyFallback(true); setCopyStatus('Selecione e copie o resumo abaixo.') }
  }

  const activeBrands = brands.filter(brand => {
    if (allBrands) return normalizeCatalogSearch(brand.name).includes(normalizeCatalogSearch(brandSearch))
    return NOTEBOOK_BRANDS.slice(0, 6).some(item => item.id === brand.id) || brand.id === draft.brandId
  })

  const renderReviewSection = (title: string, editStep: QuoteStep, children: React.ReactNode) => (
    <QuoteReviewSection title={title} onEdit={() => { setEditingReview(true); goToScreen(screens.find(item => getScreenStep(item) === editStep) ?? 'brand') }}>{children}</QuoteReviewSection>
  )

  return (
    <QuoteLayout title={<>Orçamento de <span>notebook.</span></>}
      breadcrumbs={<><a href="/">Início</a><span aria-hidden="true">/</span><a href="/conserto-de-notebook-campo-grande-rj">Notebooks</a><span aria-hidden="true">/</span><span aria-current="page">Orçamento</span></>}
      helpContent={<><p>Você informa o notebook e os sintomas. Pelo WhatsApp, a equipe orienta sobre a avaliação técnica e confirma as condições de atendimento. Retirada e entrega dependem da disponibilidade para o endereço.</p><a href="/conserto-de-notebook-campo-grande-rj">Conhecer os serviços de notebook <FiArrowRight aria-hidden="true" /></a></>}>
          <QuoteProgress steps={QUOTE_STEPS} step={step} transitioning={transitioning} onNavigate={index => { const target = screens.find(item => getScreenStep(item) === index); if (target) goToScreen(target) }} />

          <noscript><div className="quote-noscript">Para preencher por etapas, ative o JavaScript. Você também pode <a href={getWhatsAppQuoteUrl()}>solicitar seu orçamento pelo WhatsApp</a>, informando modelo, sintoma e se deseja consultar retirada e entrega.</div></noscript>

          <form className="quote-form" aria-busy={transitioning} onSubmit={event => { event.preventDefault(); if (transitioning) return; if (step === 4) openSummary(); else nextStep() }} noValidate>
            <div className="quote-private clarity-mask" data-clarity-mask="true" style={{ pointerEvents: transitioning ? 'none' : undefined }}>
              <AnimatePresence initial={false} mode="wait" custom={direction}>
              <QuoteStepTransition key={screen} direction={direction} reducedMotion={reducedMotion} nodeRef={revealStep} onVisible={() => { if (transitioning) { setTransitioning(false); focusError(errors) } }}>
                  <div className="quote-form-heading"><h2 ref={headingRef} tabIndex={-1}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
                  {screen === 'brand' && <div className="quote-step-fields">
                    <fieldset id="quote-brand" tabIndex={-1} aria-invalid={!!errors.brand} aria-describedby={errors.brand ? "quote-brand-error" : undefined}><legend className="sr-only">Marca do notebook</legend>
                      {errors.brand && <p id="quote-brand-error" className="quote-inline-error">{errors.brand}</p>}
                      <AnimatePresence initial={false}>{allBrands && <QuoteReveal key="brand-search" reducedMotion={reducedMotion}><div className="quote-search-field"><FiSearch aria-hidden="true" /><input aria-label="Buscar marca" placeholder="Buscar marca" value={brandSearch} maxLength={80} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="done" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() } }} onChange={event => setBrandSearch(event.target.value)} /></div></QuoteReveal>}</AnimatePresence>
                      <div className={`quote-brands ${allBrands ? 'expanded' : ''}`}>
                        {activeBrands.map(brand => <button type="button" key={brand.id} aria-pressed={draft.brandId === brand.id} className={`quote-brand ${draft.brandId === brand.id ? 'selected' : ''}`} onClick={() => selectBrand(brand.id)}><span>{brand.name}</span>{draft.brandId === brand.id && <FiCheck aria-hidden="true" />}</button>)}
                      </div>
                      {allBrands && !activeBrands.length && <p className="quote-field-hint">Você pode informar outra marca abaixo.</p>}
                      <button type="button" className="quote-text-action" aria-expanded={allBrands} onClick={() => { setAllBrands(!allBrands); setBrandSearch('') }}>{allBrands ? 'Mostrar menos marcas' : 'Ver todas as marcas'} <FiChevronDown aria-hidden="true" /></button>
                      <div className="quote-choice-row">{[{ id: 'other', label: 'Outra marca' }, { id: 'unknown', label: 'Não sei a marca' }].map(choice => <button key={choice.id} type="button" aria-pressed={draft.brandId === choice.id} className={`quote-small-choice ${draft.brandId === choice.id ? 'selected' : ''}`} onClick={() => selectBrand(choice.id)}>{choice.label}{draft.brandId === choice.id && <FiCheck aria-hidden="true" />}</button>)}</div>
                      <AnimatePresence initial={false}>{draft.brandId === 'other' && <QuoteReveal key="custom-brand" reducedMotion={reducedMotion}><label id="quote-custom-brand-field" className="quote-field">Nome da marca<input id="quote-custom-brand" enterKeyHint="done" aria-invalid={!!errors.brand} aria-describedby={errors.brand ? "quote-brand-error" : undefined} value={draft.customBrand} onChange={event => update({ customBrand: event.target.value })} maxLength={80} placeholder="Digite a marca" autoComplete="off" /></label></QuoteReveal>}</AnimatePresence>
                    </fieldset>
                  </div>}

                  {screen === 'model' && <QuoteModelField id="notebook-model" label="Modelo do notebook" model={draft.model} unknown={draft.modelUnknown} error={errors.model}
                    platformLabel={<>Marca: <strong>{getQuoteBrand(draft)}</strong></>} onPlatformEdit={() => goToScreen('brand')}
                    placeholder={draft.brandId === 'dell' || !draft.brandId ? 'Ex.: Inspiron 15 3520' : 'Digite o nome ou código do modelo'}
                    help="Procure o nome ou código na etiqueta embaixo do notebook ou na embalagem. Não precisa informar o número de série. Se não encontrar, a equipe pode ajudar pelo WhatsApp."
                    helpOpen={modelHelpOpen} onHelpToggle={() => { setModelFocus(false); setModelHelpOpen(!modelHelpOpen) }}
                    focused={modelFocus} showSuggestions={showSuggestions} suggestions={suggestions} reducedMotion={reducedMotion}
                    hint={draft.modelUnknown ? '' : modelSelected ? 'Modelo selecionado. Pode continuar.' : catalogStatus === 'loading' && draft.brandId ? 'Carregando sugestões. Você já pode digitar e continuar.' : draft.model.trim() && (catalogStatus === 'unavailable' || (catalogStatus === 'ready' && !suggestions.length)) ? 'Pode continuar com o modelo que você digitou.' : '\u00a0'}
                    onFocus={setModelFocus} onChange={value => { update({ model: value }); setModelSelected(false); setModelFocus(true) }}
                    onUnknownChange={value => { update({ modelUnknown: value }); setModelFocus(false) }}
                    onSelect={model => { update({ model: model.name }); setModelSelected(true); setModelFocus(false); document.getElementById('notebook-model')?.blur() }}
                    credit={catalog?.source === 'Open Icecat' && <p className="quote-catalog-credit">Sugestões: <a href="https://icecat.biz" target="_blank" rel="noopener noreferrer">Specs Icecat</a> · <a href="/catalog/icecat-license.txt">Licença e alterações</a>. Dados fornecidos sem garantia.</p>} />}

                  {screen === 'issues' && <div className="quote-step-fields">
                    <fieldset id="quote-issues" tabIndex={-1} aria-invalid={!!errors.issues} aria-describedby={errors.issues ? "quote-issues-error" : undefined}><legend className="sr-only">Problemas do notebook</legend>{errors.issues && <p id="quote-issues-error" className="quote-inline-error">{errors.issues}</p>}<div className="quote-issues">{NOTEBOOK_ISSUES.filter(issue => issue.kind === 'symptom').map(issue => <IssueChoice key={issue.id} issue={issue} selected={draft.issueIds.includes(issue.id)} onToggle={() => toggleIssue(issue.id)} />)}</div></fieldset>
                    <fieldset><legend className="quote-secondary-legend">Quer consultar um serviço?</legend><div className="quote-issues">{NOTEBOOK_ISSUES.filter(issue => issue.id === 'cleaning').map(issue => <IssueChoice key={issue.id} issue={issue} selected={draft.issueIds.includes(issue.id)} onToggle={() => toggleIssue(issue.id)} />)}</div></fieldset>
                    <fieldset><legend>Upgrade de notebook</legend><p className="quote-field-hint quote-upgrade-hint">Escolha SSD, memória RAM ou os dois.</p><div className="quote-issues">{NOTEBOOK_ISSUES.filter(issue => issue.id === 'ssd' || issue.id === 'ram').map(issue => <IssueChoice key={issue.id} issue={issue} selected={draft.issueIds.includes(issue.id)} onToggle={() => toggleIssue(issue.id)} />)}{selectedIssues.filter(issue => issue.id === 'upgrade').map(issue => <IssueChoice key={issue.id} issue={issue} selected onToggle={() => toggleIssue(issue.id)} />)}</div></fieldset>
                    <p className="quote-field-hint" role="status">{draft.issueIds.length ? `${draft.issueIds.length} ${draft.issueIds.length === 1 ? 'opção selecionada' : 'opções selecionadas'}` : 'Selecione ao menos uma opção.'}</p>
                  </div>}

                  {question && <div className="quote-step-fields">
                    <fieldset><legend className="sr-only">{question.label}</legend><div className="quote-answers">{question.options.map(option => {
                      const selected = selectedAnswers.includes(option)
                      return <button type="button" key={option} role={question.multiple ? 'checkbox' : undefined} aria-checked={question.multiple ? selected : undefined} aria-pressed={question.multiple ? undefined : selected} className={`quote-answer ${selected ? 'selected' : ''}`} onClick={() => { markStarted(); setDraft(current => ({ ...current, answers: toggleQuoteAnswer(current, question, option) })) }}><span>{option}</span><span className={`quote-radio-mark ${question.multiple ? 'quote-checkbox-mark' : ''}`} aria-hidden="true">{selected && <FiCheck aria-hidden="true" />}</span></button>
                    })}</div></fieldset>
                  </div>}

                  {screen === 'notes' && <div className="quote-step-fields">
                    <label className="quote-field" htmlFor="quote-notes"><span className="sr-only">Observações sobre o notebook</span><textarea id="quote-notes" rows={4} value={draft.notes} onChange={event => update({ notes: event.target.value })} maxLength={600} placeholder="Ex.: começou ontem, depois de uma queda…" aria-describedby="notes-hint" /><span className="quote-field-counter">{draft.notes.length}/600</span></label>
                    <p id="notes-hint" className="quote-small-print">Não inclua senhas. Fotos e vídeos podem ser enviados no WhatsApp.</p>
                  </div>}

                  {screen === 'delivery' && <QuoteDeliveryFields value={draft.delivery} error={errors.delivery} onChange={delivery => update({ delivery })} />}

                  {screen === 'neighborhood' && <label className="quote-field" htmlFor="quote-neighborhood"><span className="sr-only">Bairro</span><input id="quote-neighborhood" enterKeyHint="done" aria-invalid={!!errors.neighborhood} aria-describedby={errors.neighborhood ? 'quote-neighborhood-error' : undefined} value={draft.neighborhood} maxLength={80} onChange={event => update({ neighborhood: event.target.value })} placeholder="Ex.: Campo Grande" autoComplete="address-level3" />{errors.neighborhood && <span id="quote-neighborhood-error" className="quote-inline-error">{errors.neighborhood}</span>}</label>}

                  {screen === 'city' && <label className="quote-field" htmlFor="quote-city"><span className="sr-only">Cidade</span><input id="quote-city" enterKeyHint="done" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'quote-city-error' : undefined} value={draft.city} maxLength={80} onChange={event => update({ city: event.target.value })} placeholder="Ex.: Rio de Janeiro" autoComplete="address-level2" />{errors.city && <span id="quote-city-error" className="quote-inline-error">{errors.city}</span>}</label>}

                  {step === 2 && <button type="button" className="quote-skip-details" onClick={skipDetails}>Pular detalhes <FiArrowRight aria-hidden="true" /></button>}

                  {screen === 'review' && <div className="quote-step-fields quote-review">
                    {renderReviewSection('Seu notebook', 0, <><p className="quote-review-device"><FiMonitor aria-hidden="true" /><strong>{getQuoteBrand(draft)}</strong></p><p>{draft.modelUnknown ? 'Modelo a identificar com a equipe' : draft.model}</p></>)}
                    {renderReviewSection('O que você precisa', 1, <div className="quote-review-tags">{selectedIssues.map(issue => <span key={issue.id}><FiCheck aria-hidden="true" />{issue.label}</span>)}</div>)}
                    {renderReviewSection('Detalhes', 2, <>{questions.filter(question => getQuoteAnswerValues(draft, question).length).map(question => <p key={question.id}><span className="quote-review-question">{question.label}</span>{getQuoteAnswerValues(draft, question).join('; ')}</p>)}{draft.notes.trim() && <p className="quote-preserve-text">{draft.notes}</p>}{!draft.notes.trim() && !questions.some(question => getQuoteAnswerValues(draft, question).length) && <p>Você pode contar mais no WhatsApp.</p>}</>)}
                    {renderReviewSection('Atendimento', 3, <><p>{draft.delivery ? DELIVERY_LABELS[draft.delivery] : ''}</p>{draft.delivery === 'pickup' && <p>{draft.neighborhood} · {draft.city}<br /><small>Disponibilidade e condições a confirmar pela equipe.</small></p>}</>)}
                    <QuoteHandoff handoff={handoff} onCopy={copySummary} copyStatus={copyStatus} showCopyFallback={showCopyFallback} message={() => buildQuoteMessage(draft)} />
                  </div>}
              </QuoteStepTransition>
              </AnimatePresence>
            </div>

            <div className="sr-only" role="alert">{Object.keys(errors).length ? `Confira as informações: ${Object.values(errors).join(' ')}` : ''}</div>
            <div className="quote-actions">
              {(screenIndex > 0 || editingReview) && <button type="button" className="quote-back" onClick={previousScreen} disabled={transitioning}><FiArrowLeft aria-hidden="true" /> Voltar</button>}
              <button type="submit" className={`quote-next ${step === 4 ? 'whatsapp' : ''}`} disabled={!restored || transitioning}>{step === 4 ? <><FaWhatsapp aria-hidden="true" />{handoff ? 'Abrir WhatsApp novamente' : 'Continuar no WhatsApp'}</> : <>{nextLabel}<FiArrowRight aria-hidden="true" /></>}</button>
            </div>
          </form>
    </QuoteLayout>
  )
}
