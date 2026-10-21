import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiCheck, FiCopy } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { QuoteLayout, QuoteProgress, QuoteReviewSection } from '@/components/quote/QuoteUI'
import { IPhoneHero } from '@/components/quote/IPhoneHero'
import { getIPhoneUsedColors } from '@/data/iphone-used-colors'
import { getIPhoneThumbnail } from '@/data/iphone-product-images'
import { IPhoneChoices, IPhoneTextField } from '@/components/quote/IPhonePurchaseFields'
import { IPHONE_ACTIVATION, IPHONE_APPEARANCE, IPHONE_CASH_METHODS, IPHONE_CATALOG_DATE_LABEL, IPHONE_FAULTS, IPHONE_INSTALLMENTS, IPHONE_LIQUID, IPHONE_PARTS, IPHONE_PAYMENTS, IPHONE_REPAIRS, IPHONE_STEPS, IPHONE_STORAGE_KEY, IPHONE_TIMINGS, IPHONE_TRADE_COLORS, IPHONE_TRADE_MODELS, IPHONE_TRADE_NOTICE, IPHONE_VARIANTS, createIPhonePurchaseDraft } from '@/data/iphone-purchase'
import { getIPhoneInstallmentPlan } from '@/utils/iphone-pricing'
import { getIPhoneCatalogHomeLink } from '@/utils/iphone-catalog'
import { useQuoteViewport } from '@/hooks/useQuoteViewport'
import type { IPhonePurchaseDraft, IPhoneScreen, IPhoneTradeIn } from '@/types/iphone-purchase'
import { buildIPhonePurchaseMessage, buildIPhoneSalesUrl, canDescribeIPhoneTrade, firstIncompleteIPhoneScreen, formatIPhoneInstallmentPlan, formatIPhoneMoney, getIPhonePaymentPlan, getIPhonePreferredColorSummary, getIPhoneErrors, getIPhonePaymentSummary, getIPhoneScreens, getIPhoneStep, getIPhoneTradeEligibility, getIPhoneTradeSummary, getIPhoneVariant, getIPhoneVariants, iPhoneCatalogFingerprint, iPhoneSelectionKey, parseIPhoneEntry, restoreIPhonePurchase, toggleIPhoneChoice, updateIPhonePurchase } from '@/utils/iphone-purchase'
import type { IPhoneErrors } from '@/utils/iphone-purchase'
import { createIPhonePurchaseTracker } from '@/utils/iphone-purchase-tracking'
import type { IPhonePurchaseTracker } from '@/utils/iphone-purchase-tracking'
import { WHATSAPP_PHONE } from '@/utils/whatsapp'
import '@/styles/iphone-purchase.css'

const salesPhone = WHATSAPP_PHONE
const displayColor = (color: string) => color === 'Silver/Prateado' ? 'Prateado' : color
const headings: Record<IPhoneScreen, [string, string]> = {
  product: ['Seu próximo iPhone.', ''],
  payment: ['Como pretende pagar?', ''],
  timing: ['Quando pretende comprar?', ''],
  trade: ['Quer oferecer um usado?', ''],
  device: ['Conte sobre o seu usado.', 'Responda apenas o que souber.'],
  condition: ['Como está por fora?', 'Informe o que percebe no aparelho. Não é um laudo.'],
  history: ['E o funcionamento?', 'O técnico fará a avaliação. Não precisa atestar originalidade.'],
  review: ['Confira sua consulta.', ''],
}
const modelOptions = [...new Map(IPHONE_VARIANTS.map(v => [v.modelId, v.model])).entries()]
const swatches: Record<string, string> = { orange: '#dc8d55', silver: '#d4d4d5', blue: '#516888', black: '#3d3d3f', burgundy: '#854354' }

export const IPhonePurchaseQuotePage = () => {
  const [draft, setDraft] = useState(createIPhonePurchaseDraft)
  const [screen, setScreen] = useState<IPhoneScreen>('product')
  const [ready, setReady] = useState(false)
  const [errors, setErrors] = useState<IPhoneErrors>({})
  const [catalogChanged, setCatalogChanged] = useState(false)
  const [fingerprint, setFingerprint] = useState(iPhoneCatalogFingerprint)
  const [status, setStatus] = useState('')
  const [showCopy, setShowCopy] = useState(false)
  const [handoff, setHandoff] = useState(false)
  const [offline, setOffline] = useState(false)
  const [editing, setEditing] = useState(false)
  const tracker = useRef<IPhonePurchaseTracker | null>(null)
  const entryKey = useRef('')
  const initialized = useRef(false)
  const focusPending = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useQuoteViewport()
  const reducedMotion = useReducedMotion()
  const variants = getIPhoneVariants(draft.selection)
  const variant = getIPhoneVariant(draft.selection)
  const paymentPlan = getIPhonePaymentPlan(draft)
  const usedColors = getIPhoneUsedColors(draft.selection.modelId)
  const preferredColors = getIPhonePreferredColorSummary(draft)
  const previewColorId = draft.selection.condition === 'used' ? draft.preferredColorIds[draft.preferredColorIds.length - 1] || '' : draft.selection.colorId
  const thumbnail = variant ? getIPhoneThumbnail(variant.modelId, draft.selection.condition === 'used' ? draft.preferredColorIds[0] || '' : variant.colorId, variant.condition) : undefined
  const selectedModel = IPHONE_VARIANTS.find(v => v.modelId === draft.selection.modelId)!
  const eligibility = getIPhoneTradeEligibility(draft)
  const describeTrade = canDescribeIPhoneTrade(draft)
  const screens = getIPhoneScreens(draft)
  const screenIndex = screens.indexOf(screen)
  const step = getIPhoneStep(screen)
  const t = draft.trade
  const reviewValid = !catalogChanged && firstIncompleteIPhoneScreen(draft) === null
  const message = screen === 'review' && reviewValid ? buildIPhonePurchaseMessage(draft) : ''

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const initial = parseIPhoneEntry(window.location.search)
    entryKey.current = iPhoneSelectionKey(initial)
    tracker.current = createIPhonePurchaseTracker(initial)
    let nextDraft = { ...createIPhonePurchaseDraft(), selection: initial }
    let nextScreen: IPhoneScreen = 'product'
    try {
      const saved = restoreIPhonePurchase(sessionStorage.getItem(IPHONE_STORAGE_KEY))
      if (saved && saved.attemptId === tracker.current.attemptId && saved.entryKey === entryKey.current) {
        nextDraft = saved.draft
        nextScreen = saved.screen
        setCatalogChanged(saved.catalogChanged)
        if (saved.catalogChanged) setFingerprint(saved.catalogFingerprint)
      }
    } catch { /* Form remains usable without storage. */ }
    setDraft(nextDraft)
    setScreen(nextScreen)
    setReady(true)
    tracker.current.track('viewed', initial)
  }, [])
  useEffect(() => {
    if (!ready) return
    try { sessionStorage.setItem(IPHONE_STORAGE_KEY, JSON.stringify({ draft, screen, savedAt: Date.now(), attemptId: tracker.current?.attemptId, entryKey: entryKey.current, catalogFingerprint: fingerprint })) } catch { /* No persistence required to prepare a message. */ }
  }, [draft, screen, ready, fingerprint])
  useEffect(() => {
    if (ready && screen === 'review' && reviewValid) {
      if (draft.tradeChoice === 'yes' && eligibility === 'eligible') tracker.current?.track('tradeCompleted', draft.selection, 'review')
      tracker.current?.track('reviewed', draft.selection, 'review')
    }
  }, [ready, screen, reviewValid, draft.selection, draft.tradeChoice, eligibility])
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync) }
  }, [])
  useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    const id = window.requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true })
      const rect = heading.current?.getBoundingClientRect()
      if (rect && (rect.top < 100 || rect.bottom > window.innerHeight - 150)) document.getElementById('quote-form')?.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [screen])

  const change = (changes: Partial<IPhonePurchaseDraft>) => {
    const updated = updateIPhonePurchase(draft, changes)
    tracker.current?.track('started', updated.selection)
    setDraft(updated); setErrors({}); setStatus(''); setHandoff(false); setShowCopy(false)
  }
  const changeTrade = (changes: Partial<IPhoneTradeIn>) => {
    tracker.current?.track('tradeStarted', draft.selection, screen)
    change({ trade: { ...draft.trade, ...changes } })
  }
  const go = (target: IPhoneScreen) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    focusPending.current = true
    setScreen(target); setErrors({}); setStatus(''); setShowCopy(false); setHandoff(false)
  }
  const showErrors = (invalid: IPhoneErrors) => {
    setErrors(invalid)
    const field = Object.keys(invalid)[0]
    window.requestAnimationFrame(() => document.getElementById(`iphone-${field}`)?.focus())
  }
  const next = () => {
    if (!ready) return
    if (catalogChanged) { showErrors({ product: 'Confira os valores atuais e confirme a atualização abaixo.' }); return }
    const invalid = getIPhoneErrors(draft, screen)
    if (Object.keys(invalid).length) { showErrors(invalid); return }
    tracker.current?.track('started', draft.selection)
    tracker.current?.track('step', draft.selection, screen)
    const target = screens[screenIndex + 1]
    if (editing || target === 'review') {
      const incomplete = firstIncompleteIPhoneScreen(draft)
      if (!incomplete) { setEditing(false); go('review') }
      else go(incomplete)
    } else if (target) go(target)
  }
  const edit = (target: IPhoneScreen) => { setEditing(true); go(target) }
  const copy = async () => {
    if (!reviewValid) return
    try { await navigator.clipboard.writeText(buildIPhonePurchaseMessage(draft)); setStatus('Resumo copiado. Nenhuma mensagem foi enviada.') }
    catch { setShowCopy(true); setStatus('A cópia automática não ficou disponível. Selecione e copie o resumo abaixo.') }
  }
  const openWhatsApp = () => {
    const incomplete = firstIncompleteIPhoneScreen(draft)
    if (catalogChanged || incomplete) { go(catalogChanged ? 'product' : incomplete!); return }
    const url = buildIPhoneSalesUrl(buildIPhonePurchaseMessage(draft), salesPhone)
    if (!url) return
    tracker.current?.track('whatsapp', draft.selection, 'review')
    try { window.open(url, '_blank', 'noopener,noreferrer'); setHandoff(true); setStatus('Se a conversa não abrir, copie o resumo e tente novamente.') }
    catch { setShowCopy(true); setStatus('Não foi possível abrir o WhatsApp. Copie o resumo abaixo.') }
  }
  const choices = (key: 'screen' | 'back' | 'sides' | 'repairs' | 'liquid' | 'activation', label: string, options: readonly string[]) => <IPhoneChoices id={key} label={label} options={options} selected={t[key]} error={errors[key]} onChange={value => changeTrade({ [key]: value })} />

  const actions = <div className="quote-actions">{screen === 'product' && <div className="iphone-action-summary" aria-live="polite" aria-atomic="true"><p>{draft.selection.capacity} GB · {draft.selection.condition === 'sealed' ? displayColor(variant?.color || '') || 'Escolha a cor' : draft.preferredColorIds.length ? `${draft.preferredColorIds.length} ${draft.preferredColorIds.length === 1 ? 'cor aceita' : 'cores aceitas'}` : 'Escolha as cores'}</p>{variant && <p><strong>{formatIPhoneMoney(variant.cashCents)} à vista</strong><span>12× de {formatIPhoneMoney(variant.installmentCents)}</span></p>}</div>}{screenIndex > 0 && <button type="button" className="quote-back" disabled={!ready} onClick={() => { setEditing(false); go(screens[screenIndex - 1]) }}><FiArrowLeft aria-hidden="true" /> Voltar</button>}<button type="submit" className={`quote-next ${screen === 'review' ? 'whatsapp' : ''}`} disabled={!ready || (screen === 'review' && !reviewValid)}>{screen === 'review' ? <><FaWhatsapp aria-hidden="true" />{handoff ? 'Abrir novamente' : 'Continuar no WhatsApp'}</> : <>{editing ? 'Salvar e revisar' : screens[screenIndex + 1] === 'review' ? 'Revisar consulta' : 'Continuar'}<FiArrowRight aria-hidden="true" /></>}</button></div>

  return <QuoteLayout className={`iphone-purchase-page ${screen === 'product' ? 'is-configuring' : ''}`} title={<>Orçamento de <span>iPhone.</span></>}
    headerAction={<a href={getIPhoneCatalogHomeLink(ready ? window.location.search : '')} className="quote-help"><FiArrowLeft aria-hidden="true" /> Ver todos os iPhones</a>}
    footerContent={<footer className="iphone-footer"><strong>Master Prime Assistência</strong><p>Avenida Cesário de Melo, 2571<br />Campo Grande, Rio de Janeiro/RJ</p><a href="/">Voltar ao site</a><a href="/orcamento/celular">Preciso de reparo no meu celular</a></footer>}
    breadcrumbs={<><a href="/">Início</a><span aria-hidden="true">/</span><span aria-current="page">Orçamento de iPhone</span></>}
    helpContent={<div id="iphone-how"><p>Escolha o iPhone, confira os valores e indique como pretende pagar. A disponibilidade e as condições são confirmadas pela equipe. Se oferecer um usado, as informações organizam a avaliação técnica; não definem aceitação ou valor de troca. Fotos podem ser solicitadas depois, na conversa.</p><a href="/orcamento/celular">Precisa consertar um celular? Solicite reparo aqui.</a></div>}>
    <div className="iphone-purchase">
      <QuoteProgress steps={IPHONE_STEPS} step={step} transitioning={!ready} onNavigate={index => { setEditing(false); go(index === 0 ? 'product' : index === 1 ? 'payment' : index === 2 ? 'timing' : 'trade') }} />
      <noscript><p className="quote-noscript">Ative o JavaScript para escolher a variante e preparar o resumo. A compra e a eventual troca dependem de confirmação com a equipe na loja.</p></noscript>
      {offline && <p className="iphone-notice" role="status">Você está sem conexão. Pode continuar preenchendo e copiar o resumo. O WhatsApp precisa de internet para enviar.</p>}
      {catalogChanged && <div className="iphone-notice" role="alert"><strong>A tabela mudou desde o seu rascunho.</strong><p>Confira os valores e a disponibilidade atuais antes de continuar. Sua consulta usará os novos valores.</p><button type="button" onClick={() => { setCatalogChanged(false); setFingerprint(iPhoneCatalogFingerprint()); setErrors({}) }}>Entendi, vou conferir os valores atuais</button></div>}
      <form className="quote-form" data-screen={screen} noValidate onSubmit={event => { event.preventDefault(); if (screen === 'review') openWhatsApp(); else next() }}>
        <motion.fieldset key={screen} initial={ready && !reducedMotion ? { opacity: .6 } : false} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : .18 }} className="iphone-form-content quote-private clarity-mask" data-clarity-mask="true" disabled={!ready}>
          <legend className="sr-only">Consulta de compra de iPhone</legend>
          <div className="quote-form-heading"><h2 ref={heading} tabIndex={-1}>{headings[screen][0]}</h2>{headings[screen][1] && <p>{headings[screen][1]}</p>}</div>
          {(screen === 'payment' || screen === 'timing' || screen === 'trade') && variant && <div className="iphone-recap">
            {thumbnail && <img src={thumbnail} alt="" width={619} height={1100} />}
            <p><strong>{variant.model} · {variant.capacity} GB{variant.color ? ` · ${displayColor(variant.color)}` : ''}</strong>{variant.condition === 'used' && <span>Cores aceitas: {preferredColors}</span>}{screen !== 'payment' && <span>{formatIPhoneMoney(variant.cashCents)} à vista · 12× de {formatIPhoneMoney(variant.installmentCents)}</span>}</p>
          </div>}
          {screen === 'product' && <div className="quote-step-fields">
            <div className="iphone-configurator">
              <div className="iphone-model-heading"><p>{draft.selection.condition === 'sealed' ? 'Lacrado' : 'Seminovo'}</p><h3>{selectedModel.model}</h3></div>
              <div className="iphone-product-media" id="iphone-product" tabIndex={-1}><IPhoneHero key={`${draft.selection.modelId}-${draft.selection.condition}`} modelId={draft.selection.modelId} model={selectedModel.model} condition={draft.selection.condition} colorId={previewColorId} /></div>
              <div className="iphone-configuration">
                <div className="iphone-price-summary" aria-live="polite" aria-atomic="true">
                  <p className="iphone-selection-label">{draft.selection.capacity} GB{draft.selection.condition === 'used' ? ' · Seminovo' : variant?.color ? ` · ${displayColor(variant.color)}` : ' · Escolha a cor'}</p>
                  <p className="iphone-hero-price">{!variant && <span className="iphone-from">A partir de</span>}<strong>{formatIPhoneMoney(variant ? variant.cashCents : Math.min(...variants.map(v => v.cashCents)))}</strong> <span>à vista</span></p>
                  <p className="iphone-hero-installment">ou 12× de {formatIPhoneMoney(variant ? variant.installmentCents : Math.min(...variants.map(v => v.installmentCents)))} no cartão</p>
                </div>
            {errors.product && <p className="quote-inline-error" role="alert">{errors.product}</p>}
            <fieldset className="iphone-capacity-choice"><legend>Capacidade</legend><div className="iphone-segments">{[...new Set(IPHONE_VARIANTS.filter(v => v.modelId === draft.selection.modelId && v.condition === draft.selection.condition).map(v => v.capacity))].map(capacity => <button type="button" key={capacity} className={draft.selection.capacity === capacity ? 'selected' : ''} aria-pressed={draft.selection.capacity === capacity} onClick={() => change({ selection: { ...draft.selection, capacity } })}><span>{capacity} GB</span>{draft.selection.capacity === capacity && <FiCheck aria-hidden="true" />}</button>)}</div></fieldset>
            {draft.selection.condition === 'sealed' ? <fieldset id="iphone-color" tabIndex={-1} aria-invalid={!!errors.color} aria-describedby={errors.color ? 'iphone-color-error' : undefined}><legend>Cor e valor</legend><div className="iphone-colors">{variants.map(v => <button type="button" key={v.id} aria-pressed={variant?.id === v.id} className={`iphone-color ${variant?.id === v.id ? 'selected' : ''}`} onClick={() => change({ selection: { ...draft.selection, colorId: v.colorId } })}>
              <span className="iphone-color-top"><span className="iphone-swatch" style={{ backgroundColor: swatches[v.colorId] }} aria-hidden="true" /><strong>{displayColor(v.color)}</strong><span className="quote-radio-mark" aria-hidden="true">{variant?.id === v.id && <FiCheck />}</span></span>
              <span className="iphone-color-price">{formatIPhoneMoney(v.cashCents)} <small>à vista</small></span><span className="iphone-installment">12× de {formatIPhoneMoney(v.installmentCents)}<span className="iphone-installment-qualifier"> no cartão</span></span>{v.availability === 'unavailable' && <span className="quote-inline-error">Indisponível para consulta</span>}
            </button>)}</div>{errors.color && <p id="iphone-color-error" className="quote-inline-error">{errors.color}</p>}</fieldset> : variant && <fieldset id="iphone-preferredColors" className="iphone-used-preferences" tabIndex={-1} aria-invalid={!!errors.preferredColors} aria-describedby={`iphone-used-colors-help${errors.preferredColors ? ' iphone-preferredColors-error' : ''}`}><legend>Quais cores você aceita?</legend><p id="iphone-used-colors-help" className="quote-small-print">Marque uma ou mais. A equipe confirma a disponibilidade no WhatsApp.</p><div className="iphone-used-colors">{usedColors.map(color => {
              const active = draft.preferredColorIds.includes(color.id)
              return <button type="button" key={color.id} role="checkbox" aria-checked={active} className={`iphone-used-color quote-answer ${active ? 'selected' : ''}`} onClick={() => change({ preferredColorIds: toggleIPhoneChoice(draft.preferredColorIds, color.id, []) })}><span className="iphone-swatch" style={{ backgroundColor: color.swatch }} aria-hidden="true" /><span>{color.name}</span><span className="quote-radio-mark quote-checkbox-mark" aria-hidden="true">{active && <FiCheck />}</span></button>
            })}</div><button type="button" className="iphone-all-colors" aria-pressed={draft.preferredColorIds.length === usedColors.length} onClick={() => change({ preferredColorIds: draft.preferredColorIds.length === usedColors.length ? [] : usedColors.map(color => color.id) })}>Aceito todas as cores</button>{errors.preferredColors && <p id="iphone-preferredColors-error" className="quote-inline-error">{errors.preferredColors}</p>}<p className="quote-small-print">Bateria, histórico e condição da unidade a consultar.</p></fieldset>}
              </div>
            </div>

          </div>}
          {screen === 'payment' && <div className="quote-step-fields"><IPhoneChoices id="payment" label="Forma de pagamento" options={IPHONE_PAYMENTS} descriptions={variant ? { 'À vista': formatIPhoneMoney(variant.cashCents), 'Cartão de crédito': `12× de ${formatIPhoneMoney(variant.installmentCents)}` } : undefined} selected={draft.payment} error={errors.payment} onChange={payment => change({ payment })} />
            {draft.payment === 'À vista' && <IPhoneChoices id="paymentDetail" label="Como vai pagar à vista?" options={IPHONE_CASH_METHODS} selected={draft.paymentDetail} error={errors.paymentDetail} onChange={paymentDetail => change({ paymentDetail })} />}
            {draft.payment === 'Cartão de crédito' && <IPhoneChoices id="paymentDetail" className="iphone-installment-choices" label="Quantidade de parcelas" options={IPHONE_INSTALLMENTS} descriptions={variant ? Object.fromEntries(IPHONE_INSTALLMENTS.map(option => [option, formatIPhoneMoney(getIPhoneInstallmentPlan(variant.cashCents, Number.parseInt(option, 10)).installmentCents)])) : undefined} selected={draft.paymentDetail} error={errors.paymentDetail} onChange={paymentDetail => change({ paymentDetail })} />}
            {draft.payment === 'Cartão de crédito' && paymentPlan && <div className="iphone-credit-summary" aria-live="polite" aria-atomic="true"><p>Total no cartão: <strong>{formatIPhoneMoney(paymentPlan.totalCents)}</strong></p><p className="quote-small-print">Acréscimo único de 8,57% sobre o valor à vista, de 2 a 12 parcelas.</p>{draft.paymentDetail && paymentPlan.lastInstallmentCents !== paymentPlan.installmentCents && <p className="quote-small-print">Última parcela de {formatIPhoneMoney(paymentPlan.lastInstallmentCents)} para ajustar os centavos.</p>}</div>}
          </div>}
          {screen === 'timing' && <div className="quote-step-fields"><IPhoneChoices id="timing" label="Quando pretende comprar?" options={IPHONE_TIMINGS} selected={draft.timing} error={errors.timing} onChange={timing => change({ timing })} /></div>}
          {screen === 'trade' && <div className="quote-step-fields"><IPhoneChoices id="tradeChoice" label="Oferecer um aparelho usado" options={['Comprar sem troca', 'Quero oferecer um usado']} selected={draft.tradeChoice === 'no' ? 'Comprar sem troca' : draft.tradeChoice === 'yes' ? 'Quero oferecer um usado' : ''} error={errors.tradeChoice} onChange={value => change({ tradeChoice: value === 'Comprar sem troca' ? 'no' : 'yes' })} />
            <p className="quote-small-print">{draft.selection.modelId === 'iphone-17-pro-max' ? 'Para a compra do 17 Pro Max, recebemos para triagem aparelhos da linha iPhone 15 em diante. Cada unidade depende de avaliação.' : 'A política de troca para este modelo será confirmada pela equipe. Você pode indicar o aparelho para consultar a possibilidade.'}</p><p className="iphone-notice">{IPHONE_TRADE_NOTICE}</p></div>}
          {screen === 'device' && <div className="quote-step-fields"><label className="quote-field" htmlFor="iphone-modelId">Modelo do aparelho usado<select id="iphone-modelId" value={t.modelId} aria-invalid={!!errors.modelId} aria-describedby={errors.modelId ? 'iphone-modelId-error' : undefined} onChange={event => changeTrade({ modelId: event.target.value })}><option value="">Escolha o modelo</option>{IPHONE_TRADE_MODELS.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}<option value="other">Outro modelo / não sei ao certo</option></select>{errors.modelId && <span className="quote-inline-error" id="iphone-modelId-error">{errors.modelId}</span>}</label>
            {t.modelId === 'other' && <IPhoneTextField id="otherModel" label="Como você conhece o modelo? Pode escrever “Não sei”." value={t.otherModel} onChange={otherModel => changeTrade({ otherModel })} error={errors.otherModel} />}
            {t.modelId && !describeTrade && <div className="iphone-notice"><p>{eligibility === 'incompatible' ? 'A triagem para compra do 17 Pro Max começa na linha iPhone 15. Continue a consulta de compra sem troca.' : 'A equipe esclarecerá o modelo e a possibilidade de troca. Esta consulta não confirma aceitação.'}</p><button type="button" onClick={() => { change({ tradeChoice: 'no' }); setEditing(false); go('review') }}>Continuar a compra sem troca <FiArrowRight aria-hidden="true" /></button></div>}
            {describeTrade && <><label className="quote-field" htmlFor="iphone-capacity">Capacidade do usado<select id="iphone-capacity" value={t.capacity} aria-invalid={!!errors.capacity} aria-describedby={errors.capacity ? 'iphone-capacity-error' : undefined} onChange={event => changeTrade({ capacity: event.target.value })}><option value="">Selecione</option>{['64', '128', '256', '512', '1024', '2048'].map(c => <option key={c} value={c}>{c} GB</option>)}<option value="unknown">Não sei</option></select>{errors.capacity && <span className="quote-inline-error" id="iphone-capacity-error">{errors.capacity}</span>}</label>
              <label className="quote-field" htmlFor="iphone-color">Cor do usado (opcional)<select id="iphone-color" value={t.color} onChange={event => changeTrade({ color: event.target.value })}><option value="">Selecione a cor</option>{IPHONE_TRADE_COLORS.map(color => <option key={color}>{color}</option>)}</select></label>
              <label className="quote-field" htmlFor="iphone-battery">Saúde da bateria (%)<input id="iphone-battery" type="text" inputMode="numeric" enterKeyHint="done" autoComplete="off" maxLength={3} disabled={t.batteryUnknown} value={t.battery} aria-invalid={!!errors.battery} aria-describedby={`iphone-battery-help${errors.battery ? ' iphone-battery-error' : ''}`} onChange={event => changeTrade({ battery: event.target.value })} />{errors.battery && <span id="iphone-battery-error" className="quote-inline-error">{errors.battery}</span>}</label>
              <label className="quote-check"><input type="checkbox" checked={t.batteryUnknown} onChange={event => changeTrade({ batteryUnknown: event.target.checked })} /><span>Não sei a saúde da bateria</span></label><p id="iphone-battery-help" className="quote-small-print">Se souber, informe de 0 a 100. Não precisa ligar um aparelho com falha para descobrir.</p></>}
            {!describeTrade && t.modelId && <IPhoneTextField id="notes" label="O que gostaria de esclarecer? (opcional)" value={t.notes} maxLength={600} multiline onChange={notes => changeTrade({ notes })} />}
          </div>}
          {screen === 'condition' && <div className="quote-step-fields">{choices('screen', 'Tela', IPHONE_APPEARANCE)}{choices('back', 'Traseira', IPHONE_APPEARANCE)}{choices('sides', 'Laterais', IPHONE_APPEARANCE)}</div>}
          {screen === 'history' && <div className="quote-step-fields">{choices('repairs', 'Histórico conhecido de troca ou reparo', IPHONE_REPAIRS)}
            {t.repairs === 'Houve troca ou reparo' && <><IPhoneChoices id="repairParts" label="O que foi trocado ou reparado?" multiple options={IPHONE_PARTS} selected={t.repairParts} error={errors.repairParts} onChange={value => changeTrade({ repairParts: toggleIPhoneChoice(t.repairParts, value, ['Não sei qual']) })} />{t.repairParts.includes('Outro') && <IPhoneTextField id="repairOther" label="Qual outro reparo?" value={t.repairOther} maxLength={160} error={errors.repairOther} onChange={repairOther => changeTrade({ repairOther })} />}</>}
            <IPhoneChoices id="faults" label="Falhas conhecidas de funcionamento" multiple options={IPHONE_FAULTS} selected={t.faults} error={errors.faults} onChange={value => changeTrade({ faults: toggleIPhoneChoice(t.faults, value, ['Nenhuma falha conhecida', 'Não sei']) })} />
            {t.faults.includes('Outra') && <IPhoneTextField id="faultOther" label="Qual outra falha?" value={t.faultOther} maxLength={160} error={errors.faultOther} onChange={faultOther => changeTrade({ faultOther })} />}
            {choices('liquid', 'Já teve contato com líquido?', IPHONE_LIQUID)}{choices('activation', 'Bloqueio de ativação ou gestão corporativa', IPHONE_ACTIVATION)}<p className="quote-small-print">Não informe senha, Apple ID, IMEI ou número de série. A equipe verifica a situação durante a avaliação.</p>
            <IPhoneTextField id="notes" label="Observação para o técnico (opcional, até 600 caracteres)" value={t.notes} multiline maxLength={600} onChange={notes => changeTrade({ notes })} /><p className="quote-small-print">Fotos podem ser solicitadas depois pelo técnico no WhatsApp.</p>
          </div>}
          {screen === 'review' && <div className="quote-step-fields quote-review">
            <QuoteReviewSection title="Aparelho desejado" onEdit={() => edit('product')}><div className="iphone-mini-summary">{variant && thumbnail && <img src={thumbnail} alt="" width={619} height={1100} />}<div><p className="quote-review-device">{variant?.model} · {variant?.capacity} GB</p><p>{variant?.condition === 'sealed' ? 'Lacrado' : 'Seminovo'}{variant?.color && ` · ${displayColor(variant.color)}`}</p>{variant && <><p className="iphone-mini-summary-price">{formatIPhoneMoney(variant.cashCents)} à vista</p><p>Cartão: {paymentPlan && formatIPhoneInstallmentPlan(paymentPlan)}<br />Total parcelado: {paymentPlan && formatIPhoneMoney(paymentPlan.totalCents)}</p></>}{variant?.condition === 'used' && <><p>Cores aceitas: {preferredColors}.</p><p>Disponibilidade das cores e condição da unidade a confirmar pela equipe.</p></>}<p className="quote-small-print">Tabela de {IPHONE_CATALOG_DATE_LABEL}. Confirme valores e disponibilidade.</p></div></div></QuoteReviewSection>
            <QuoteReviewSection title="Pagamento" onEdit={() => edit('payment')}><p>{getIPhonePaymentSummary(draft)}</p></QuoteReviewSection>
            <QuoteReviewSection title="Quando pretende comprar" onEdit={() => edit('timing')}><p>{draft.timing}</p></QuoteReviewSection>
            <QuoteReviewSection title={draft.tradeChoice === 'yes' ? 'Aparelho oferecido na troca' : 'Compra sem troca'} onEdit={() => edit('trade')}>
              {draft.tradeChoice === 'yes' ? <>{getIPhoneTradeSummary(draft).map((line, index) => <p key={index}>{line}</p>)}<p className="iphone-notice">{IPHONE_TRADE_NOTICE}</p>{describeTrade && <div className="iphone-review-edits"><button type="button" onClick={() => edit('device')}>Editar aparelho e bateria</button><button type="button" onClick={() => edit('condition')}>Editar estado externo</button><button type="button" onClick={() => edit('history')}>Editar funcionamento</button></div>}</> : <p>Sem oferecer aparelho usado.</p>}
            </QuoteReviewSection>
            <p className="quote-next-note">O resumo vai preenchido no WhatsApp. Você precisa tocar em Enviar na conversa para a equipe receber.</p>
            {handoff && <p role="status" className="quote-handoff">Continue na conversa e envie a mensagem. A abertura do WhatsApp não confirma a compra.</p>}
            <button type="button" className="quote-copy" onClick={() => void copy()}><FiCopy aria-hidden="true" /> Copiar resumo</button>
            {status && <p role="status" className="quote-field-hint">{status}</p>}
            {showCopy && <label className="quote-field" htmlFor="iphone-copy">Resumo para selecionar e copiar<textarea id="iphone-copy" readOnly rows={12} value={message} onFocus={event => event.target.select()} /></label>}
          </div>}
        </motion.fieldset>
        {actions}
        {screen === 'product' && <fieldset className="iphone-other-models" disabled={!ready}>            <details className="iphone-alternatives"><summary>Consultar outros modelos e condições</summary><div className="quote-step-fields"><label className="quote-field" htmlFor="iphone-model">Modelo desejado<select id="iphone-model" value={draft.selection.modelId} onChange={event => change({ selection: { ...draft.selection, modelId: event.target.value } })}>{modelOptions.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
              <fieldset><legend>Condição</legend><div className="iphone-segments">{[...new Set(IPHONE_VARIANTS.filter(v => v.modelId === draft.selection.modelId).map(v => v.condition))].map(condition => <button type="button" key={condition} aria-pressed={draft.selection.condition === condition} className={draft.selection.condition === condition ? 'selected' : ''} onClick={() => change({ selection: { ...draft.selection, condition } })}>{condition === 'sealed' ? 'Lacrado' : 'Seminovo'}</button>)}</div></fieldset></div></details></fieldset>}
      </form>
    </div>
  </QuoteLayout>
}
