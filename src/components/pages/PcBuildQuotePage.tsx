import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import pcImage from '@/assets/images/pc_gamer.webp'
import { QuoteHandoff, QuoteLayout, QuoteProgress, QuoteReviewSection, QuoteStepTransition } from '@/components/quote/QuoteUI'
import { PcBuildCasePreview, PcBuildCatalogPicker, PcBuildChoices, PcBuildDelivery, PcBuildDisclosure, PcBuildFeasibility, PcBuildLiveSummary, PcBuildSwatches } from '@/components/quote/PcBuildQuoteUI'
import { ExperienceImage } from '@/components/seo/ExperienceImage'
import { createPcBuildQuoteDraft, PC_BUILD_STEPS, PC_BUILD_STORAGE_KEY, PC_BUDGET_SCOPES, PC_COLORS, PC_CONNECTIVITY, PC_CPU, PC_EXPERIENCE_IMAGE, PC_FPS, PC_GPU, PC_GRAPHICS, PC_HORIZONS, PC_LIGHTING, PC_MODES, PC_PERIPHERALS, PC_PRIORITIES, PC_PURPOSES, PC_RESOLUTIONS } from '@/data/pc-build-quote'
import { useQuoteViewport } from '@/hooks/useQuoteViewport'
import type { PcBuildQuoteDraft } from '@/types/pc-build-quote'
import { buildPcBuildQuoteMessage, formatPcBudget, getPcFeasibilityNotice, getPcReviewGroups, parsePcBudget, restorePcBuildQuoteDraft, updatePcBuildQuote } from '@/utils/pc-build-quote'
import { getFirstIncompletePcBuildScreen, getPcBuildScreenErrors, getPcBuildScreens, getPcBuildScreenStep, isPcBuildScreenInScope, PC_BUILD_EDIT_SCOPES, restorePcBuildScreen } from '@/utils/pc-build-quote-flow'
import type { PcBuildEditScope, PcBuildErrors, PcBuildField, PcBuildScreen } from '@/utils/pc-build-quote-flow'
import { trackQuoteEvent } from '@/utils/quote'
import { getWhatsAppMessageUrl, getWhatsAppQuoteUrl, WHATSAPP_PHONE_PC_GAMER } from '@/utils/whatsapp'
import '@/styles/pc-build-quote.css'

const fieldTargets: Record<PcBuildField, string> = { mode: 'pcb-mode', purpose: 'pcb-purpose', budget: 'pcb-budget', budgetScope: 'pcb-budgetScope', games: 'pcb-games', programs: 'pcb-programs', customFps: 'pcb-customFps', fulfillment: 'pcb-fulfillment', neighborhood: 'pcb-neighborhood', city: 'pcb-city' }
const headings: Record<PcBuildScreen, [string, string]> = {
  mode: ['Como você quer montar seu PC?', 'Do primeiro componente ao seu próximo projeto.'],
  purpose: ['Para que você vai usar?', 'Vamos começar pelo que importa para você.'],
  ownedParts: ['Quais peças você já tem?', 'Opcional. Informe os modelos que souber.'],
  budget: ['Quanto pretende investir?', 'Seu limite ajuda a orientar a proposta.'],
  budgetScope: ['O que entra nesse valor?', 'Os itens escolhidos compartilham o mesmo investimento.'],
  games: ['Quais jogos você quer jogar?', 'Escolha seus favoritos ou adicione outros.'],
  programs: ['Quais programas você vai usar?', 'Conte quais ferramentas fazem parte da sua rotina.'],
  objective: ['O que seu próximo PC precisa fazer?', 'Opcional. Conte o que você mais quer melhorar ou realizar.'],
  personalize: ['Quer deixar o projeto mais seu?', 'Você pode indicar desempenho, peças e visual, ou seguir com o essencial.'],
  monitor: ['Em qual resolução pretende jogar?', 'Opcional. Pode ser a do monitor atual ou a que deseja usar.'],
  fps: ['Qual é a sua meta de fluidez?', 'Opcional. É um objetivo para avaliar, sem promessa de desempenho.'],
  graphics: ['O que importa mais ao jogar?', 'Opcional. Vamos entender o equilíbrio que você procura.'],
  workload: ['Como é o seu trabalho na prática?', 'Opcional. Tarefas e tamanho dos projetos ajudam a orientar a configuração.'],
  priorities: ['O que vem primeiro para você?', 'Opcional. Escolha até duas prioridades.'],
  gpu: ['Tem preferência de placa de vídeo?', 'Opcional. Entenda as diferenças ou deixe a escolha com a equipe.'],
  cpu: ['E de processador?', 'Opcional. A escolha depende dos modelos e do que você faz.'],
  appearance: ['Como imagina o visual do seu PC?', 'Opcional. Cor e iluminação como ponto de partida.'],
  connectivity: ['Precisa destas conexões?', 'Opcional. Marque o que gostaria de incluir.'],
  timing: ['Quando pensa em montar seu PC?', 'Opcional. É sua intenção de compra, sem definir prazo de entrega.'],
  fulfillment: ['Como prefere receber seu PC?', 'Escolha o que funciona melhor para você.'],
  neighborhood: ['Qual é o seu bairro?', 'Para consultar a possibilidade de entrega.'],
  city: ['Em qual cidade?', 'A equipe confirma a disponibilidade pelo WhatsApp.'],
  review: ['Seu projeto começa assim.', 'Confira as escolhas. A equipe continua com você no WhatsApp.'],
}

export const PcBuildQuotePage = () => {
  const [draft, setDraft] = useState<PcBuildQuoteDraft>(createPcBuildQuoteDraft)
  const [screen, setScreen] = useState<PcBuildScreen>('mode')
  const [budgetInput, setBudgetInput] = useState('')
  const [restored, setRestored] = useState(false)
  const [errors, setErrors] = useState<PcBuildErrors>({})
  const [editScope, setEditScope] = useState<PcBuildEditScope | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState(1)
  const [handoff, setHandoff] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [showCopyFallback, setShowCopyFallback] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const startedRef = useRef(false)
  const pendingScroll = useRef(false)
  const focusFrame = useRef<number | null>(null)
  const transitioningRef = useRef(false)
  const reducedMotion = useReducedMotion() === true
  useQuoteViewport()
  const screens = getPcBuildScreens(draft)
  const step = getPcBuildScreenStep(screen)
  const screenIndex = screens.indexOf(screen)
  const nextScreen = screens[screenIndex + 1]
  const returnsToReview = !!editScope && !!nextScreen && !isPcBuildScreenInScope(nextScreen, editScope)
  const [title, subtitle] = headings[screen]
  const notice = getPcFeasibilityNotice(draft)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PC_BUILD_STORAGE_KEY)
      const savedDraft = restorePcBuildQuoteDraft(raw)
      if (savedDraft) {
        const saved = JSON.parse(raw!)
        const position = restorePcBuildScreen(savedDraft, saved)
        setDraft(savedDraft)
        setBudgetInput(savedDraft.budgetCents ? formatPcBudget(savedDraft.budgetCents).replace('R$', '').trim() : '')
        setScreen(position)
        setEditScope(position !== 'review' && PC_BUILD_EDIT_SCOPES.includes(saved.editScope) && isPcBuildScreenInScope(position, saved.editScope) ? saved.editScope : null)
      } else sessionStorage.removeItem(PC_BUILD_STORAGE_KEY)
    } catch { /* A private browser or unavailable storage must not block the request. */ }
    setRestored(true)
  }, [])
  useEffect(() => {
    if (!restored) return
    try { sessionStorage.setItem(PC_BUILD_STORAGE_KEY, JSON.stringify({ draft, screen, step, editScope, savedAt: Date.now() })) }
    catch { /* Request remains usable without persistence. */ }
  }, [draft, screen, step, editScope, restored])
  useEffect(() => () => { if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current) }, [])

  const markStarted = () => {
    if (!startedRef.current) { trackQuoteEvent('quote_started', 0, 'montagem-pc'); startedRef.current = true }
    setErrors({}); setHandoff(false); setCopyStatus(''); setShowCopyFallback(false)
  }
  const replaceDraft = (value: PcBuildQuoteDraft) => { markStarted(); setDraft(value) }
  const update = (changes: Partial<PcBuildQuoteDraft>) => { markStarted(); setDraft(current => updatePcBuildQuote(current, changes)) }
  const focusError = (invalid: PcBuildErrors) => {
    const field = Object.keys(invalid)[0] as PcBuildField | undefined
    const target = field ? document.getElementById(fieldTargets[field]) : headingRef.current
    target?.focus({ preventScroll: true })
    if (field) target?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' })
  }
  const revealStep = useCallback((element: HTMLDivElement | null) => {
    if (!element || !pendingScroll.current) return
    pendingScroll.current = false
    const heading = element.querySelector('h2')
    if (!heading) return
    const viewport = window.visualViewport
    const actions = document.querySelector<HTMLElement>('.quote-actions')
    const progress = document.querySelector<HTMLElement>('.quote-progress')
    const reserved = actions && getComputedStyle(actions).position === 'fixed' ? actions.getBoundingClientRect().height : 0
    const topSpace = progress && getComputedStyle(progress).position === 'sticky' ? progress.getBoundingClientRect().height + 12 : 24
    const bounds = heading.getBoundingClientRect()
    const shortMobile = window.innerWidth <= 800 && (viewport?.height ?? window.innerHeight) < 700
    if (!shortMobile && bounds.top >= (viewport?.offsetTop ?? 0) + topSpace && bounds.bottom <= (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - reserved - 24) return
    window.scrollTo({ top: Math.max(0, window.scrollY + bounds.top - topSpace), behavior: reducedMotion ? 'instant' : 'smooth' })
  }, [reducedMotion])
  const goToScreen = (target: PcBuildScreen, invalid: PcBuildErrors = {}) => {
    if (transitioningRef.current) return
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.matches('.quote-form input, .quote-form textarea')) focused.blur()
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current)
    setErrors(invalid)
    if (target === screen) { focusFrame.current = window.requestAnimationFrame(() => focusError(invalid)); return }
    transitioningRef.current = true; pendingScroll.current = true
    setDirection(screens.indexOf(target) < screenIndex ? -1 : 1)
    setTransitioning(true); setScreen(target)
    if (target === 'review') { setEditScope(null); trackQuoteEvent('quote_reviewed', 4, 'montagem-pc') }
  }
  const returnToReview = () => {
    const incomplete = getFirstIncompletePcBuildScreen(draft)
    goToScreen(incomplete ?? 'review', incomplete ? getPcBuildScreenErrors(draft, incomplete) : {})
  }
  const next = () => {
    if (transitioningRef.current) return
    const invalid = getPcBuildScreenErrors(draft, screen)
    if (Object.keys(invalid).length) { setErrors(invalid); focusFrame.current = window.requestAnimationFrame(() => focusError(invalid)); return }
    markStarted()
    if (!nextScreen || getPcBuildScreenStep(nextScreen) !== step) trackQuoteEvent('quote_step_completed', step, 'montagem-pc')
    if (returnsToReview || nextScreen === 'review') returnToReview()
    else if (nextScreen) goToScreen(nextScreen)
  }
  const previous = () => {
    const target = screens[screenIndex - 1]
    if (editScope && (!target || !isPcBuildScreenInScope(target, editScope))) returnToReview()
    else if (target) goToScreen(target)
  }
  const edit = (scope: PcBuildEditScope) => { if (!transitioningRef.current) { setEditScope(scope); goToScreen(screens.find(item => isPcBuildScreenInScope(item, scope)) ?? 'mode') } }
  const skipPreferences = () => {
    if (transitioningRef.current) return
    const invalid = getPcBuildScreenErrors(draft, 'fps')
    if (Object.keys(invalid).length) { goToScreen('fps', invalid); return }
    markStarted(); trackQuoteEvent('quote_step_completed', 2, 'montagem-pc')
    if (editScope) returnToReview(); else goToScreen('fulfillment')
  }
  const openSummary = () => {
    const incomplete = getFirstIncompletePcBuildScreen(draft)
    if (incomplete) { goToScreen(incomplete, getPcBuildScreenErrors(draft, incomplete)); return }
    trackQuoteEvent('quote_whatsapp_click', 4, 'montagem-pc')
    window.open(getWhatsAppMessageUrl(buildPcBuildQuoteMessage(draft), WHATSAPP_PHONE_PC_GAMER), '_blank', 'noopener,noreferrer')
    setHandoff(true)
  }
  const copySummary = async () => {
    try { await navigator.clipboard.writeText(buildPcBuildQuoteMessage(draft)); setCopyStatus('Resumo copiado!') }
    catch { setShowCopyFallback(true); setCopyStatus('Selecione e copie o resumo abaixo.') }
  }
  const choices = (field: keyof PcBuildQuoteDraft, items: readonly { id: string; name: string; hint?: string }[], multiple = false, limit?: number) => <PcBuildChoices items={items} value={draft[field] as string | string[]} multiple={multiple} limit={limit} onSelect={id => {
    const current = draft[field]
    update({ [field]: multiple && Array.isArray(current) ? current.includes(id) ? current.filter(item => item !== id) : [...current, id] : id })
  }} />
  const fieldset = (field: PcBuildField, label: string, children: React.ReactNode) => <fieldset id={`pcb-${field}`} tabIndex={-1} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `pcb-${field}-error` : undefined}><legend className="sr-only">{label}</legend>{errors[field] && <p className="quote-inline-error" id={`pcb-${field}-error`}>{errors[field]}</p>}{children}</fieldset>
  const textarea = (field: 'ownedParts' | 'objective' | 'workload' | 'notes', label: string, placeholder: string, limit: number) => <label className="quote-field" htmlFor={`pcb-${field}`}><span className="sr-only">{label}</span><textarea id={`pcb-${field}`} rows={3} maxLength={limit} value={draft[field]} onChange={event => update({ [field]: event.target.value })} placeholder={placeholder} /><span className="quote-field-counter">{draft[field].length}/{limit}</span></label>

  return <div className="pc-build-page"><QuoteLayout title={<>Orçamento para <span>montar seu PC.</span></>}
    helpUrl={getWhatsAppQuoteUrl(WHATSAPP_PHONE_PC_GAMER)}
    breadcrumbs={<><a href="/">Início</a><span aria-hidden="true">/</span><a href="/servicos">Serviços</a><span aria-hidden="true">/</span><span aria-current="page">Montar seu PC</span></>}
    helpContent={<><p>Conte como quer usar seu PC, quanto pretende investir e quais peças já possui. Você revisa as preferências e continua pelo WhatsApp para consultar o planejamento e a montagem com a Master Prime. A equipe avalia compatibilidade, configuração, valores e condições. Metas de FPS e preferências de marcas orientam a conversa; o desempenho depende do conjunto, do jogo e dos ajustes. Entrega depende da disponibilidade e dos custos para o endereço.</p><a href="/upgrade-de-pc-gamer">Já tem um PC e procura um upgrade? <FiArrowRight aria-hidden="true" /></a><ExperienceImage {...PC_EXPERIENCE_IMAGE} /></>}>
    <QuoteProgress steps={PC_BUILD_STEPS} step={step} transitioning={transitioning} onNavigate={index => { const target = screens.find(item => getPcBuildScreenStep(item) === index); if (target && !transitioningRef.current) { setEditScope(null); goToScreen(target) } }} />
    {screen !== 'mode' && screen !== 'review' && <PcBuildLiveSummary draft={draft} reducedMotion={reducedMotion} />}
    <noscript><div className="quote-noscript">Para preencher por etapas, ative o JavaScript. Você também pode <a href={getWhatsAppQuoteUrl(WHATSAPP_PHONE_PC_GAMER)}>solicitar seu orçamento pelo WhatsApp</a>, informando seu investimento, jogos ou programas e se já possui peças.</div></noscript>
    <form className="quote-form" data-screen={screen} aria-busy={transitioning} noValidate onSubmit={event => { event.preventDefault(); if (restored && !transitioningRef.current) { if (screen === 'review') openSummary(); else next() } }}>
      <div className="quote-private clarity-mask" data-clarity-mask="true" style={{ pointerEvents: transitioning ? 'none' : undefined }}><AnimatePresence key={restored ? 'ready' : 'initial'} initial={false} mode="wait" custom={direction}><QuoteStepTransition key={screen} direction={direction} reducedMotion={reducedMotion} nodeRef={revealStep} onVisible={() => { transitioningRef.current = false; if (transitioning) { setTransitioning(false); focusError(errors) } }}>
        <div className="quote-form-heading"><div className={screen === 'mode' ? 'pcb-opening' : undefined}><h2 id={`pcb-heading-${screen}`} ref={headingRef} tabIndex={-1}>{title}</h2>{screen === 'mode' && <img src={pcImage} alt="" width="720" height="720" loading="eager" />}</div>{subtitle && <p>{subtitle}</p>}</div>
        <div className="quote-step-fields">
          {screen === 'mode' && fieldset('mode', 'Tipo de pedido de montagem', choices('mode', PC_MODES))}
          {screen === 'purpose' && fieldset('purpose', 'Uso principal do PC', choices('purpose', PC_PURPOSES))}
          {screen === 'ownedParts' && <>{textarea('ownedParts', 'Peças que já possui', 'Ex.: Ryzen 5 5600, placa-mãe B550, memória DDR4…', 600)}<p className="quote-small-print">Pode deixar em branco. Fotos das peças e etiquetas podem ser enviadas no WhatsApp. A equipe avalia a compatibilidade.</p></>}
          {screen === 'budget' && <><label className="quote-field" htmlFor="pcb-budget"><span className="sr-only">Investimento pretendido em reais</span><span className={`pcb-budget-input ${draft.budgetUndecided ? 'pcb-disabled' : ''}`}><span aria-hidden="true">R$</span><input id="pcb-budget" type="text" inputMode="decimal" enterKeyHint="done" autoComplete="off" placeholder="0,00" maxLength={24} value={budgetInput} disabled={draft.budgetUndecided} aria-invalid={!!errors.budget} aria-describedby={`pcb-budget-help${errors.budget ? ' pcb-budget-error' : ''}`} onChange={event => { setBudgetInput(event.target.value); update({ budgetCents: parsePcBudget(event.target.value), budgetUndecided: false }) }} onBlur={() => { const value = parsePcBudget(budgetInput); if (value) setBudgetInput(formatPcBudget(value).replace('R$', '').trim()) }} /></span>{errors.budget && <span id="pcb-budget-error" className="quote-inline-error">{errors.budget}</span>}</label><label className="quote-check"><input type="checkbox" checked={draft.budgetUndecided} onChange={event => { update({ budgetUndecided: event.target.checked, budgetCents: event.target.checked ? null : parsePcBudget(budgetInput) }); if (event.target.checked) setBudgetInput('') }} /><span>Ainda não defini</span></label><p id="pcb-budget-help" className="quote-field-hint">{draft.mode === 'assembly' ? 'Considere a montagem e os itens adicionais que deseja consultar. As peças que você já possui ficam fora desse valor.' : 'Considere as peças a comprar e a montagem. As peças que você já possui ficam fora desse valor.'} Valores e condições são confirmados pela equipe. Entrega a combinar.</p></>}
          {screen === 'budgetScope' && <>{fieldset('budgetScope', 'O que o investimento inclui', choices('budgetScope', PC_BUDGET_SCOPES))}{draft.budgetScope === 'setup' && <fieldset><legend>Quais periféricos?</legend>{choices('peripheralIds', PC_PERIPHERALS, true)}<p className="quote-field-hint">Opcional. Se ainda não souber, a equipe ajuda a definir.</p></fieldset>}</>}
          {(screen === 'games' || screen === 'programs') && <PcBuildCatalogPicker key={screen} kind={screen} draft={draft} onChange={replaceDraft} error={errors[screen]} reducedMotion={reducedMotion} />}
          {screen === 'objective' && textarea('objective', 'Objetivo do PC', 'Ex.: jogar com amigos, editar vídeos, estudar e trabalhar com vários programas…', 300)}
          {screen === 'personalize' && <><PcBuildChoices items={[{ id: 'yes', name: 'Quero personalizar', hint: 'Desempenho, marcas, visual e outros detalhes.' }, { id: 'no', name: 'Seguir com o essencial', hint: 'A equipe me ajuda a definir o restante.' }]} value={draft.personalize ? 'yes' : 'no'} onSelect={id => update({ personalize: id === 'yes' })} /><p className="quote-small-print">Você não precisa conhecer peças para pedir um orçamento.</p></>}
          {screen === 'monitor' && <>{choices('resolution', PC_RESOLUTIONS)}<PcBuildDisclosure title="Como resolução e monitor entram na escolha?" reducedMotion={reducedMotion}><p>A resolução define quantos pixels formam a imagem. A equipe considera o monitor que você usa ou pretende comprar junto com os jogos e a meta de desempenho.</p><p>Hz é a frequência de atualização do monitor; FPS é a taxa de quadros do jogo. São medidas diferentes e precisam ser consideradas em conjunto.</p></PcBuildDisclosure></>}
          {screen === 'fps' && <>{choices('targetFps', PC_FPS)}{draft.targetFps === 'custom' && <label className="quote-field" htmlFor="pcb-customFps"><span>Sua meta de FPS</span><input id="pcb-customFps" inputMode="numeric" enterKeyHint="done" maxLength={4} value={draft.customFps} aria-invalid={!!errors.customFps} aria-describedby={errors.customFps ? 'pcb-customFps-error' : undefined} onChange={event => update({ customFps: event.target.value })} placeholder="Ex.: 165" />{errors.customFps && <span id="pcb-customFps-error" className="quote-inline-error">{errors.customFps}</span>}</label>}<PcBuildDisclosure title="O que significa essa meta?" reducedMotion={reducedMotion}><p>FPS informa quantos quadros o jogo apresenta por segundo. A meta será avaliada considerando o título, modo, resolução, ajustes e configuração completa.</p><p>Geração de quadros e renderização nativa são medidas diferentes. A equipe precisa distinguir as duas ao comparar resultados. Não há estimativa automática de FPS neste pedido.</p></PcBuildDisclosure></>}
          {screen === 'graphics' && choices('graphics', PC_GRAPHICS)}
          {screen === 'workload' && textarea('workload', 'Tarefas e projetos de trabalho', 'Ex.: editar vídeos em 4K, modelar no Revit, renderizar no Blender, programar com máquinas virtuais…', 300)}
          {screen === 'priorities' && choices('priorityIds', PC_PRIORITIES, true, 2)}
          {screen === 'gpu' && <>{choices('gpu', PC_GPU)}<PcBuildDisclosure title="NVIDIA ou AMD: o que comparar?" reducedMotion={reducedMotion}><p><strong>NVIDIA GeForce:</strong> a linha RTX oferece recursos DLSS nos jogos compatíveis. Super Resolution, geração de quadros e outros recursos têm requisitos próprios; a disponibilidade muda conforme o modelo e a geração.</p><p><strong>AMD Radeon:</strong> os recursos FSR também dependem da versão, do jogo e do hardware. Algumas versões atendem a GPUs de mais de uma marca; outras possuem requisitos específicos.</p><p><strong>Na prática:</strong> compare modelos na mesma faixa de investimento, memória de vídeo, consumo, resultados nos seus jogos e suporte nos programas que usa. A qualidade de reconstrução de imagem varia por versão, jogo e ajuste; uma marca inteira não define o resultado.</p><p>Para edição, renderização ou outras tarefas, o suporte do programa e dos plugins deve entrar na avaliação. A preferência não reserva um modelo nem confirma compatibilidade.</p><p className="pcb-sources">Fontes: <a href="https://www.nvidia.com/en-us/geforce/technologies/dlss/" target="_blank" rel="noopener noreferrer">NVIDIA DLSS</a> · <a href="https://www.amd.com/en/products/graphics/technologies/fidelityfx/super-resolution.html" target="_blank" rel="noopener noreferrer">AMD FSR</a>. Revisão: 16/10/2026.</p></PcBuildDisclosure></>}
          {screen === 'cpu' && <>{choices('cpu', PC_CPU)}<PcBuildDisclosure title="Ryzen ou Intel: o que muda para você?" reducedMotion={reducedMotion}><p><strong>AMD Ryzen e Intel Core:</strong> ambas as famílias têm modelos para diferentes usos. Multitarefa depende do processador específico, da geração e da capacidade dos programas de aproveitar núcleos e threads.</p><p><strong>Para jogos:</strong> compare resultados nos títulos e na configuração desejados. <strong>Para trabalho:</strong> considere as tarefas, memória e suporte do software. O nome da família ou a quantidade de núcleos, sozinhos, não determinam qual é a melhor opção.</p><p>O orçamento precisa considerar o conjunto: processador, placa-mãe, memória e refrigeração. A equipe verifica a plataforma e as possibilidades de upgrade antes de indicar peças.</p><p className="pcb-sources">Fontes: <a href="https://www.intel.com/content/www/us/en/gaming/resources/gaming-cpu.html" target="_blank" rel="noopener noreferrer">Intel</a> · <a href="https://www.amd.com/en/products/processors/desktops/ryzen.html" target="_blank" rel="noopener noreferrer">AMD Ryzen</a>. Revisão: 16/10/2026.</p></PcBuildDisclosure></>}
          {screen === 'appearance' && <><PcBuildCasePreview color={draft.caseColor} lighting={draft.lighting} /><fieldset><legend>Cor do gabinete</legend><PcBuildSwatches field="caseColor" items={PC_COLORS} value={draft.caseColor} onSelect={id => update({ caseColor: id as PcBuildQuoteDraft['caseColor'] })} /></fieldset><fieldset><legend>Iluminação</legend><PcBuildSwatches field="lighting" items={PC_LIGHTING} value={draft.lighting} onSelect={id => update({ lighting: id as PcBuildQuoteDraft['lighting'] })} /></fieldset><p className="quote-small-print">O gabinete e os recursos disponíveis são definidos com a equipe, considerando espaço, ventilação e investimento.</p></>}
          {screen === 'connectivity' && choices('connectivityIds', PC_CONNECTIVITY, true)}
          {screen === 'timing' && <>{choices('horizon', PC_HORIZONS)}{textarea('notes', 'Observações sobre o projeto', 'Algo mais que a equipe precisa saber? Ex.: espaço na mesa, armazenamento ou preferência por alguma peça.', 600)}<p className="quote-small-print">Não inclua senhas. Fotos e referências podem ser enviadas no WhatsApp.</p></>}
          {screen === 'fulfillment' && <PcBuildDelivery draft={draft} error={errors.fulfillment} onSelect={id => update({ fulfillment: id as PcBuildQuoteDraft['fulfillment'] })} />}
          {(screen === 'neighborhood' || screen === 'city') && <label className="quote-field" htmlFor={`pcb-${screen}`}><span className="sr-only">{screen === 'city' ? 'Cidade' : 'Bairro'}</span><input id={`pcb-${screen}`} enterKeyHint="done" maxLength={80} value={draft[screen]} aria-invalid={!!errors[screen]} aria-describedby={errors[screen] ? `pcb-${screen}-error` : undefined} autoComplete={screen === 'city' ? 'address-level2' : 'address-level3'} placeholder={screen === 'city' ? 'Ex.: Rio de Janeiro' : 'Ex.: Campo Grande'} onChange={event => update({ [screen]: event.target.value })} />{errors[screen] && <span id={`pcb-${screen}-error`} className="quote-inline-error">{errors[screen]}</span>}</label>}
          {notice && ['fps', 'graphics', 'review'].includes(screen) && <PcBuildFeasibility notice={notice} guidanceSelected={draft.guidanceRequested} onGuidance={() => update({ guidanceRequested: true })} onBudget={() => { if (screen === 'review') setEditScope('budget'); else setEditScope(null); goToScreen('budget') }} onPerformance={() => { if (!draft.personalize) update({ personalize: true }); if (screen === 'review') setEditScope('preferences'); goToScreen('fps') }} />}
          {step === 2 && draft.personalize && !['games', 'programs', 'objective', 'personalize'].includes(screen) && <button type="button" className="quote-skip-details" onClick={skipPreferences}>Pular os próximos detalhes <FiArrowRight aria-hidden="true" /></button>}
          {screen === 'review' && <div className="quote-step-fields quote-review">{getPcReviewGroups(draft).map((group, index) => <QuoteReviewSection key={group.title} title={group.title} onEdit={() => edit(PC_BUILD_EDIT_SCOPES[index])}>{group.lines.map((line, i) => <p key={i} className="quote-preserve-text">{line}</p>)}</QuoteReviewSection>)}<QuoteHandoff handoff={handoff} onCopy={copySummary} copyStatus={copyStatus} showCopyFallback={showCopyFallback} message={() => buildPcBuildQuoteMessage(draft)} /></div>}
        </div>
      </QuoteStepTransition></AnimatePresence></div>
      <div className="sr-only" role="alert">{Object.keys(errors).length ? `Confira as informações: ${Object.values(errors).join(' ')}` : ''}</div>
      <div className="quote-actions">{(screenIndex > 0 || editScope) && <button type="button" className="quote-back" onClick={previous} disabled={transitioning}><FiArrowLeft aria-hidden="true" /> Voltar</button>}<button type="submit" className={`quote-next ${step === 4 ? 'whatsapp' : ''}`} disabled={!restored || transitioning}>{step === 4 ? <><FaWhatsapp aria-hidden="true" />{handoff ? 'Abrir WhatsApp novamente' : 'Continuar no WhatsApp'}</> : <>{returnsToReview ? 'Salvar e ver resumo' : nextScreen === 'review' ? 'Revisar pedido' : 'Continuar'}<FiArrowRight aria-hidden="true" /></>}</button></div>
    </form>
  </QuoteLayout></div>
}
