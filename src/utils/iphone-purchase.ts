import { getIPhoneInstallmentPlan } from './iphone-pricing'
import { getIPhoneUsedColors } from '@/data/iphone-used-colors'
import { IPHONE_CASH_METHODS, IPHONE_CATALOG_DATE_LABEL, IPHONE_CATALOG_VERSION, IPHONE_INSTALLMENTS, IPHONE_MAX_AGE, IPHONE_PAYMENTS, IPHONE_VARIANTS, createIPhonePurchaseDraft } from '@/data/iphone-purchase'
import type { IPhonePurchaseDraft, IPhoneScreen, IPhoneSelection } from '@/types/iphone-purchase'

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

/** URL supplies identifiers only. Price and stock always come from code. */
export const parseIPhoneEntry = (search: string): IPhoneSelection => {
  const params = new URLSearchParams(search)
  const defaults = createIPhonePurchaseDraft().selection
  const modelId = params.get('model') ?? defaults.modelId
  const condition = params.get('condition') === 'used' ? 'used' : 'sealed'
  const capacity = /^(128|256|512)$/.test(params.get('capacity') ?? '') ? Number(params.get('capacity')) : defaults.capacity
  return normalizeIPhoneSelection({ modelId, condition, capacity, colorId: '' })
}

const text = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/\p{Cc}/gu, char => char === '\n' || char === '\t' ? char : '').slice(0, max) : ''
const choice = (value: unknown, options: readonly string[]) => typeof value === 'string' && options.includes(value) ? value : ''
const choices = (value: unknown, options: readonly string[], exclusive: string[] = []) => {
  const values = Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string' && options.includes(v)))] : []
  return values.some(v => exclusive.includes(v)) ? [values.find(v => exclusive.includes(v))!] : values
}
/** Allowlist also drops fields from legacy drafts passed at runtime. */
export const updateIPhonePurchase = (draft: IPhonePurchaseDraft, changes: Partial<IPhonePurchaseDraft>, catalog = IPHONE_VARIANTS): IPhonePurchaseDraft => {
  const selection = normalizeIPhoneSelection(changes.selection ?? draft.selection, catalog)
  const payment = choice(changes.payment ?? draft.payment, IPHONE_PAYMENTS)
  return {
    version: 2, selection,
    preferredColorIds: selection.condition === 'used' && selection.modelId === draft.selection.modelId && selection.condition === draft.selection.condition
      ? choices(changes.preferredColorIds ?? draft.preferredColorIds, getIPhoneUsedColors(selection.modelId).map(color => color.id)) : [],
    payment,
    paymentDetail: payment !== draft.payment ? '' : choice(changes.paymentDetail ?? draft.paymentDetail, payment === 'À vista' ? IPHONE_CASH_METHODS : payment === 'Cartão de crédito' ? IPHONE_INSTALLMENTS : []),
  }
}

export const toggleIPhoneChoice = (values: string[], value: string, exclusive: readonly string[]) => {
  if (values.includes(value)) return values.filter(v => v !== value)
  return exclusive.includes(value) ? [value] : [...values.filter(v => !exclusive.includes(v)), value]
}
export const getIPhoneScreens = (): IPhoneScreen[] => ['product', 'payment', 'review']
export const getIPhoneStep = (screen: IPhoneScreen) => getIPhoneScreens().indexOf(screen)
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
  return errors
}
export const firstIncompleteIPhoneScreen = (draft: IPhonePurchaseDraft, catalog = IPHONE_VARIANTS) => getIPhoneScreens().find(screen => screen !== 'review' && Object.keys(getIPhoneErrors(draft, screen, catalog)).length) ?? null

export const restoreIPhonePurchase = (raw: string | null, now = Date.now(), catalog = IPHONE_VARIANTS) => {
  if (!raw) return null
  try {
    const saved = JSON.parse(raw)
    if (!saved || ![1, 2].includes(saved.draft?.version) || !saved.draft.selection || typeof saved.draft.selection !== 'object' ||
      !Number.isFinite(saved.savedAt) || saved.savedAt > now || now - saved.savedAt > IPHONE_MAX_AGE || typeof saved.attemptId !== 'string') return null
    const d = saved.draft
    const selection = normalizeIPhoneSelection({ modelId: text(d.selection.modelId, 70), capacity: Number(d.selection.capacity), condition: d.selection.condition === 'used' ? 'used' : 'sealed', colorId: text(d.selection.colorId, 30) }, catalog)
    // Replay only current allowlisted choices. Never retain timing or trade data.
    const draft = updateIPhonePurchase({ ...createIPhonePurchaseDraft(), selection }, {
      payment: choice(d.payment, IPHONE_PAYMENTS), preferredColorIds: d.preferredColorIds,
    }, catalog)
    const restored = updateIPhonePurchase(draft, { paymentDetail: text(d.paymentDetail, 30) }, catalog)
    const catalogChanged = saved.catalogFingerprint !== iPhoneCatalogFingerprint(catalog)
    const incomplete = firstIncompleteIPhoneScreen(restored, catalog)
    const screens = getIPhoneScreens()
    const removedScreen = ['timing', 'trade', 'device', 'condition', 'history'].includes(saved.screen)
    const requested = screens.includes(saved.screen) ? saved.screen as IPhoneScreen : removedScreen ? 'review' : 'product'
    const screen = catalogChanged ? 'product' : incomplete && screens.indexOf(incomplete) < screens.indexOf(requested) ? incomplete : requested
    return { draft: restored, screen, catalogChanged, catalogFingerprint: text(saved.catalogFingerprint, 20000), attemptId: saved.attemptId, entryKey: text(saved.entryKey, 200) }
  } catch { return null }
}

export const buildIPhonePurchaseMessage = (draft: IPhonePurchaseDraft): string => {
  if (firstIncompleteIPhoneScreen(draft)) throw new Error('Revise as escolhas antes de preparar o resumo.')
  const v = getIPhoneVariant(draft.selection)!
  const plan = getIPhonePaymentPlan(draft)!
  return ['Olá! Fiz uma consulta de iPhone no site da Master Prime e quero confirmar disponibilidade e condições.', '', 'APARELHO DESEJADO',
    `${v.model} · ${v.capacity} GB · ${v.condition === 'sealed' ? 'Lacrado' : 'Seminovo'}${v.color ? ` · ${v.color}` : ''}`,
    ...(v.condition === 'used' ? [`Cores aceitas: ${getIPhonePreferredColorSummary(draft)}`, 'Disponibilidade das cores e condição da unidade a confirmar pela equipe.'] : []),
    `À vista: ${formatIPhoneMoney(v.cashCents)}`, `Cartão: ${formatIPhoneInstallmentPlan(plan)} · Total: ${formatIPhoneMoney(plan.totalCents)}`,
    `Pagamento pretendido: ${getIPhonePaymentSummary(draft)}`,
    `Valores consultados na tabela de ${IPHONE_CATALOG_DATE_LABEL}. Gostaria de confirmar valores e disponibilidade.`, '',
  ].join('\n')
}

export const validateIPhoneSalesPhone = (value: unknown): string | null => typeof value === 'string' && /^55[1-9]\d9\d{8}$/.test(value) ? value : null
export const buildIPhoneSalesUrl = (message: string, phone: unknown): string | null => {
  const confirmed = validateIPhoneSalesPhone(phone)
  return confirmed ? `https://api.whatsapp.com/send/?phone=${confirmed}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0` : null
}
