import { getIPhoneInstallmentPlan } from './iphone-pricing'
import { getIPhoneUsedColors } from '@/data/iphone-used-colors'
import { IPHONE_ACTIVATION, IPHONE_APPEARANCE, IPHONE_CASH_METHODS, IPHONE_CATALOG_DATE_LABEL, IPHONE_CATALOG_VERSION, IPHONE_FAULTS, IPHONE_INSTALLMENTS, IPHONE_LIQUID, IPHONE_MAX_AGE, IPHONE_PARTS, IPHONE_PAYMENTS, IPHONE_REPAIRS, IPHONE_TIMINGS, IPHONE_TRADE_COLORS, IPHONE_TRADE_MODELS, IPHONE_TRADE_NOTICE, IPHONE_VARIANTS, createIPhonePurchaseDraft, createIPhoneTrade } from '@/data/iphone-purchase'
import type { IPhonePurchaseDraft, IPhoneScreen, IPhoneSelection, IPhoneTradeIn } from '@/types/iphone-purchase'

export const formatIPhoneMoney = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
export const getIPhoneVariants = (selection: IPhoneSelection, catalog = IPHONE_VARIANTS) => catalog.filter(v => v.modelId === selection.modelId && v.condition === selection.condition && v.capacity === selection.capacity)
export const getIPhoneVariant = (selection: IPhoneSelection, catalog = IPHONE_VARIANTS) => getIPhoneVariants(selection, catalog).find(v => v.colorId === selection.colorId)
export const getIPhonePreferredColors = (draft: IPhonePurchaseDraft) => draft.selection.condition === 'used' ? getIPhoneUsedColors(draft.selection.modelId).filter(color => draft.preferredColorIds?.includes(color.id)) : []
export const getIPhonePreferredColorSummary = (draft: IPhonePurchaseDraft) => getIPhonePreferredColors(draft).map(color => color.name).join(', ')
export const iPhoneSelectionKey = (selection: IPhoneSelection) => `${selection.modelId}:${selection.capacity}:${selection.condition}`
export const iPhoneCatalogFingerprint = (catalog = IPHONE_VARIANTS) => JSON.stringify([IPHONE_CATALOG_VERSION, catalog.map(v => [v.id, v.cashCents, v.installmentCents, v.availability, v.color])])

/** Retain compatible choices, including silver across capacities; never choose a color. */
export const normalizeIPhoneSelection = (selection: IPhoneSelection, catalog = IPHONE_VARIANTS): IPhoneSelection => {
  const model = catalog.filter(v => v.modelId === selection.modelId)
  if (!model.length) return createIPhonePurchaseDraft().selection
  const condition = model.some(v => v.condition === selection.condition) ? selection.condition : model[0].condition
  const conditionVariants = model.filter(v => v.condition === condition)
  const capacity = conditionVariants.some(v => v.capacity === selection.capacity) ? selection.capacity : conditionVariants[0].capacity
  const options = conditionVariants.filter(v => v.capacity === capacity)
  return { modelId: selection.modelId, condition, capacity, colorId: options.some(v => v.colorId === selection.colorId) ? selection.colorId : '' }
}

/** URL supplies identifiers only. Price, stock and trade eligibility always come from code. */
export const parseIPhoneEntry = (search: string): IPhoneSelection => {
  const params = new URLSearchParams(search)
  const defaults = createIPhonePurchaseDraft().selection
  const modelId = params.get('model') ?? defaults.modelId
  const condition = params.get('condition') === 'used' ? 'used' : 'sealed'
  const capacity = /^(128|256|512)$/.test(params.get('capacity') ?? '') ? Number(params.get('capacity')) : defaults.capacity
  return normalizeIPhoneSelection({ modelId, condition, capacity, colorId: '' })
}

export const getIPhoneTradeEligibility = (draft: IPhonePurchaseDraft): 'eligible' | 'incompatible' | 'unknown' | 'pending' => {
  if (draft.selection.modelId !== 'iphone-17-pro-max') return 'pending'
  const model = IPHONE_TRADE_MODELS.find(v => v.id === draft.trade.modelId)
  if (!model) return 'unknown'
  // These names have already been recognized against the sourced model catalog.
  return /^iPhone (?:1[5-9]|[2-9]\d)(?:\b|e)|^iPhone Air$/.test(model.name) ? 'eligible' : 'incompatible'
}

/** Collect a known phone's reported condition without asserting trade acceptance. */
export const canDescribeIPhoneTrade = (draft: IPhonePurchaseDraft) => draft.tradeChoice === 'yes'
  && IPHONE_TRADE_MODELS.some(model => model.id === draft.trade.modelId)
  && getIPhoneTradeEligibility(draft) !== 'incompatible'

const text = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/\p{Cc}/gu, char => char === '\n' || char === '\t' ? char : '').slice(0, max) : ''
const choice = (value: unknown, options: readonly string[]) => typeof value === 'string' && options.includes(value) ? value : ''
const choices = (value: unknown, options: readonly string[], exclusive: string[] = []) => {
  const values = Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string' && options.includes(v)))] : []
  return values.some(v => exclusive.includes(v)) ? [values.find(v => exclusive.includes(v))!] : values
}
export const sanitizeIPhoneTrade = (raw: Partial<IPhoneTradeIn>): IPhoneTradeIn => ({
  modelId: raw.modelId === 'other' || IPHONE_TRADE_MODELS.some(v => v.id === raw.modelId) ? raw.modelId! : '',
  otherModel: text(raw.otherModel, 100), capacity: choice(raw.capacity, ['64', '128', '256', '512', '1024', '2048', 'unknown']),
  color: choice(raw.color, IPHONE_TRADE_COLORS), battery: text(raw.battery, 8), batteryUnknown: raw.batteryUnknown === true,
  screen: choice(raw.screen, IPHONE_APPEARANCE), back: choice(raw.back, IPHONE_APPEARANCE), sides: choice(raw.sides, IPHONE_APPEARANCE),
  repairs: choice(raw.repairs, IPHONE_REPAIRS), repairParts: choices(raw.repairParts, IPHONE_PARTS, ['Não sei qual']), repairOther: text(raw.repairOther, 160),
  faults: choices(raw.faults, IPHONE_FAULTS, ['Nenhuma falha conhecida', 'Não sei']), faultOther: text(raw.faultOther, 160),
  liquid: choice(raw.liquid, IPHONE_LIQUID), activation: choice(raw.activation, IPHONE_ACTIVATION), notes: text(raw.notes, 600),
})

export const updateIPhonePurchase = (draft: IPhonePurchaseDraft, changes: Partial<IPhonePurchaseDraft>, catalog = IPHONE_VARIANTS): IPhonePurchaseDraft => {
  const result = { ...draft, ...changes, selection: normalizeIPhoneSelection(changes.selection ?? draft.selection, catalog) }
  result.preferredColorIds = result.selection.condition === 'used' && result.selection.modelId === draft.selection.modelId && result.selection.condition === draft.selection.condition
    ? choices(result.preferredColorIds, getIPhoneUsedColors(result.selection.modelId).map(color => color.id)) : []
  if (result.payment !== draft.payment) result.paymentDetail = ''
  result.paymentDetail = choice(result.paymentDetail, result.payment === 'À vista' ? IPHONE_CASH_METHODS : result.payment === 'Cartão de crédito' ? IPHONE_INSTALLMENTS : [])
  if (changes.trade) result.trade = sanitizeIPhoneTrade(changes.trade)
  if (result.tradeChoice !== 'yes') result.trade = createIPhoneTrade()
  if (result.trade.modelId !== draft.trade.modelId) result.trade = { ...createIPhoneTrade(), modelId: result.trade.modelId, otherModel: result.trade.otherModel }
  if (result.trade.batteryUnknown) result.trade.battery = ''
  if (result.trade.repairs !== 'Houve troca ou reparo') { result.trade.repairParts = []; result.trade.repairOther = '' }
  if (!result.trade.repairParts.includes('Outro')) result.trade.repairOther = ''
  if (!result.trade.faults.includes('Outra')) result.trade.faultOther = ''
  // Unknown or excluded phones retain only identification and clarification.
  if (!canDescribeIPhoneTrade(result)) result.trade = { ...createIPhoneTrade(), modelId: result.trade.modelId, otherModel: result.trade.otherModel, notes: result.trade.notes }
  return result
}

export const toggleIPhoneChoice = (values: string[], value: string, exclusive: readonly string[]) => {
  if (values.includes(value)) return values.filter(v => v !== value)
  return exclusive.includes(value) ? [value] : [...values.filter(v => !exclusive.includes(v)), value]
}
export const getIPhoneScreens = (draft: IPhonePurchaseDraft): IPhoneScreen[] => [
  'product', 'payment', 'timing', 'trade', ...(draft.tradeChoice === 'yes' ? ['device' as const,
    ...(canDescribeIPhoneTrade(draft) ? ['condition' as const, 'history' as const] : [])] : []), 'review',
]
export const getIPhoneStep = (screen: IPhoneScreen) => screen === 'product' ? 0 : screen === 'payment' ? 1 : screen === 'timing' ? 2 : screen === 'review' ? 4 : 3
export const getIPhonePaymentPlan = (draft: IPhonePurchaseDraft) => {
  const variant = getIPhoneVariant(draft.selection)
  if (!variant) return null
  const count = draft.payment === 'Cartão de crédito' && IPHONE_INSTALLMENTS.includes(draft.paymentDetail as typeof IPHONE_INSTALLMENTS[number]) ? Number.parseInt(draft.paymentDetail, 10) : 12
  return getIPhoneInstallmentPlan(variant.cashCents, count)
}
export const formatIPhoneInstallmentPlan = (plan: ReturnType<typeof getIPhoneInstallmentPlan>) => `${plan.count}× de ${formatIPhoneMoney(plan.installmentCents)}${plan.lastInstallmentCents !== plan.installmentCents ? ` (última de ${formatIPhoneMoney(plan.lastInstallmentCents)})` : ''}`
export const getIPhonePaymentSummary = (draft: IPhonePurchaseDraft) => {
  const plan = getIPhonePaymentPlan(draft)
  return `${draft.payment} · ${draft.paymentDetail}${draft.payment === 'Cartão de crédito' && plan && IPHONE_INSTALLMENTS.includes(draft.paymentDetail as typeof IPHONE_INSTALLMENTS[number]) ? ` · ${formatIPhoneInstallmentPlan(plan)} · Total: ${formatIPhoneMoney(plan.totalCents)}` : ''}`
}
export type IPhoneErrors = Record<string, string>
export const getIPhoneErrors = (draft: IPhonePurchaseDraft, screen: IPhoneScreen, catalog = IPHONE_VARIANTS): IPhoneErrors => {
  const errors: IPhoneErrors = {}
  const t = draft.trade
  const eligibility = getIPhoneTradeEligibility(draft)
  if (screen === 'product') {
    const v = getIPhoneVariant(draft.selection, catalog)
    if (!v) errors.color = 'Escolha a cor para conferir o valor exato.'
    else if (v.availability === 'unavailable') errors.product = 'Esta variante está indisponível para consulta. Escolha outra opção.'
    if (draft.selection.condition === 'used' && !getIPhonePreferredColors(draft).length) errors.preferredColors = 'Marque pelo menos uma cor que você aceita.'
  }
  if (screen === 'payment') {
    if (!IPHONE_PAYMENTS.includes(draft.payment as typeof IPHONE_PAYMENTS[number])) errors.payment = 'Escolha pagamento à vista ou cartão de crédito.'
    else if (draft.payment === 'À vista' && !IPHONE_CASH_METHODS.includes(draft.paymentDetail as typeof IPHONE_CASH_METHODS[number])) errors.paymentDetail = 'Escolha Pix ou cartão para o pagamento à vista.'
    else if (draft.payment === 'Cartão de crédito' && !IPHONE_INSTALLMENTS.includes(draft.paymentDetail as typeof IPHONE_INSTALLMENTS[number])) errors.paymentDetail = 'Escolha a quantidade de parcelas.'
  }
  if (screen === 'timing' && !IPHONE_TIMINGS.includes(draft.timing as typeof IPHONE_TIMINGS[number])) errors.timing = 'Informe quando pretende comprar.'
  if (screen === 'trade' && !['yes', 'no'].includes(draft.tradeChoice)) errors.tradeChoice = 'Escolha se quer oferecer um usado.'
  if (screen === 'device') {
    if (!t.modelId) errors.modelId = 'Escolha o modelo ou a opção de esclarecer com a equipe.'
    if (t.modelId === 'other' && t.otherModel.trim().length < 3) errors.otherModel = 'Informe o modelo como souber ou escreva “Não sei”.'
    if (eligibility === 'incompatible') errors.modelId = 'Para comprar o 17 Pro Max, a triagem começa na linha iPhone 15. Você pode continuar sem troca.'
    if (canDescribeIPhoneTrade(draft)) {
      if (!t.capacity) errors.capacity = 'Informe a capacidade ou escolha “Não sei”.'
      if (!t.batteryUnknown && (!/^\d{1,3}$/.test(t.battery) || Number(t.battery) > 100)) errors.battery = 'Informe de 0 a 100 ou marque “Não sei”.'
    }
  }
  if (screen === 'condition') for (const key of ['screen', 'back', 'sides'] as const) if (!IPHONE_APPEARANCE.includes(t[key] as typeof IPHONE_APPEARANCE[number])) errors[key] = 'Escolha uma opção, incluindo “Não sei”.'
  if (screen === 'history') {
    if (!t.repairs) errors.repairs = 'Informe o histórico conhecido ou escolha “Não sei”.'
    if (t.repairs === 'Houve troca ou reparo' && !t.repairParts.length) errors.repairParts = 'Indique o que foi reparado ou escolha “Não sei qual”.'
    if (t.repairParts.includes('Outro') && !t.repairOther.trim()) errors.repairOther = 'Descreva o outro reparo como souber.'
    if (!t.faults.length) errors.faults = 'Informe as falhas conhecidas ou escolha “Não sei”.'
    if (t.faults.includes('Outra') && !t.faultOther.trim()) errors.faultOther = 'Descreva a outra falha como souber.'
    if (!t.liquid) errors.liquid = 'Escolha uma opção sobre contato com líquido.'
    if (!t.activation) errors.activation = 'Informe a situação conhecida ou escolha “Não sei”.'
  }
  return errors
}
export const firstIncompleteIPhoneScreen = (draft: IPhonePurchaseDraft, catalog = IPHONE_VARIANTS) => getIPhoneScreens(draft).find(screen => screen !== 'review' && Object.keys(getIPhoneErrors(draft, screen, catalog)).length) ?? null

export const restoreIPhonePurchase = (raw: string | null, now = Date.now(), catalog = IPHONE_VARIANTS) => {
  if (!raw) return null
  try {
    const saved = JSON.parse(raw)
    if (!saved || saved.draft?.version !== 1 || !saved.draft.selection || typeof saved.draft.trade !== 'object' || !saved.draft.trade ||
      !Number.isFinite(saved.savedAt) || saved.savedAt > now || now - saved.savedAt > IPHONE_MAX_AGE || typeof saved.attemptId !== 'string') return null
    const d = saved.draft
    const selection = normalizeIPhoneSelection({ modelId: text(d.selection.modelId, 70), capacity: Number(d.selection.capacity), condition: d.selection.condition === 'used' ? 'used' : 'sealed', colorId: text(d.selection.colorId, 30) }, catalog)
    const draft = updateIPhonePurchase(createIPhonePurchaseDraft(), { selection, payment: choice(d.payment, IPHONE_PAYMENTS), timing: choice(d.timing, IPHONE_TIMINGS), tradeChoice: d.tradeChoice === 'yes' ? 'yes' : d.tradeChoice === 'no' ? 'no' : '', trade: sanitizeIPhoneTrade(d.trade) }, catalog)
    // updateIPhonePurchase intentionally clears dependent answers when the model changes;
    // restoration replays sanitized answers with the recognized model already in place.
    const restored = updateIPhonePurchase(draft, { preferredColorIds: d.preferredColorIds, paymentDetail: text(d.paymentDetail, 30), trade: sanitizeIPhoneTrade(d.trade) }, catalog)
    const catalogChanged = saved.catalogFingerprint !== iPhoneCatalogFingerprint(catalog)
    const incomplete = firstIncompleteIPhoneScreen(restored, catalog)
    const screens = getIPhoneScreens(restored)
    const requested = screens.includes(saved.screen) ? saved.screen as IPhoneScreen : 'product'
    const screen = catalogChanged ? 'product' : incomplete && screens.indexOf(incomplete) < screens.indexOf(requested) ? incomplete : requested
    return { draft: restored, screen, catalogChanged, catalogFingerprint: text(saved.catalogFingerprint, 20000), attemptId: saved.attemptId, entryKey: text(saved.entryKey, 200) }
  } catch { return null }
}

export const getIPhoneTradeSummary = (draft: IPhonePurchaseDraft): string[] => {
  const t = draft.trade
  const eligibility = getIPhoneTradeEligibility(draft)
  const model = IPHONE_TRADE_MODELS.find(v => v.id === t.modelId)?.name ?? t.otherModel.trim()
  if (!canDescribeIPhoneTrade(draft)) return [model || 'Modelo a esclarecer', eligibility === 'pending' ? 'Consulta sobre possibilidade de troca para este produto; política a confirmar pela equipe.' : 'Modelo não reconhecido: esclarecer com a equipe, sem aceitação confirmada.', ...(t.notes ? [`Observação: ${t.notes}`] : [])]
  return [model, ...(eligibility === 'pending' ? ['Troca para este produto: política a confirmar pela equipe.'] : []), `Capacidade: ${t.capacity === 'unknown' ? 'Não sei' : `${t.capacity} GB`}`, ...(t.color ? [`Cor informada: ${t.color}`] : []),
    `Saúde da bateria: ${t.batteryUnknown ? 'Não sei' : `${t.battery}%`}`, `Tela: ${t.screen}`, `Traseira: ${t.back}`, `Laterais: ${t.sides}`,
    `Reparos: ${t.repairs}${t.repairParts.length ? ` — ${t.repairParts.join(', ')}` : ''}${t.repairOther ? ` (${t.repairOther})` : ''}`,
    `Falhas conhecidas: ${t.faults.join(', ')}${t.faultOther ? ` (${t.faultOther})` : ''}`, `Contato com líquido: ${t.liquid}`, `Bloqueio/gestão: ${t.activation}`, ...(t.notes ? [`Observação: ${t.notes}`] : [])]
}
export const buildIPhonePurchaseMessage = (draft: IPhonePurchaseDraft): string => {
  if (firstIncompleteIPhoneScreen(draft)) throw new Error('Revise as escolhas antes de preparar o resumo.')
  const v = getIPhoneVariant(draft.selection)!
  const plan = getIPhonePaymentPlan(draft)!
  return ['Olá! Quero consultar a compra de um iPhone na Master Prime.', '', 'APARELHO DESEJADO',
    `${v.model} · ${v.capacity} GB · ${v.condition === 'sealed' ? 'Lacrado' : 'Seminovo'}${v.color ? ` · ${v.color}` : ''}`,
    ...(v.condition === 'used' ? [`Cores aceitas: ${getIPhonePreferredColorSummary(draft)}`, 'Disponibilidade das cores e condição da unidade a confirmar pela equipe.'] : []),
    `À vista: ${formatIPhoneMoney(v.cashCents)}`, `Cartão: ${formatIPhoneInstallmentPlan(plan)} · Total: ${formatIPhoneMoney(plan.totalCents)}`,
    `Pagamento pretendido: ${getIPhonePaymentSummary(draft)}`, `Quando pretendo comprar: ${draft.timing}`,
    `Valores consultados na tabela de ${IPHONE_CATALOG_DATE_LABEL}. Gostaria de confirmar valores e disponibilidade.`, '',
    ...(draft.tradeChoice === 'yes' ? ['APARELHO OFERECIDO NA TROCA', ...getIPhoneTradeSummary(draft), '', IPHONE_TRADE_NOTICE] : ['Compra sem oferecer usado na troca.']),
  ].join('\n')
}

export const validateIPhoneSalesPhone = (value: unknown): string | null => typeof value === 'string' && /^55[1-9]\d9\d{8}$/.test(value) ? value : null
export const buildIPhoneSalesUrl = (message: string, phone: unknown): string | null => {
  const confirmed = validateIPhoneSalesPhone(phone)
  return confirmed ? `https://api.whatsapp.com/send/?phone=${confirmed}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0` : null
}
