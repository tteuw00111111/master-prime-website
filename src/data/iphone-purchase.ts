import type { IPhonePurchaseDraft, IPhoneTradeIn, IPhoneVariant } from '@/types/iphone-purchase'
import { getIPhoneInstallmentPlan } from '../utils/iphone-pricing'
import { SMARTPHONE_MODELS } from './smartphone-models'

export const IPHONE_PURCHASE_PATH = '/orcamento/iphone'
export const IPHONE_CATALOG_VERSION = '2026-10-21.v2'
export const IPHONE_CATALOG_DATE_LABEL = '21/10/2026'
export const IPHONE_STORAGE_KEY = 'master-prime:iphone-purchase:v1'
export const IPHONE_MAX_AGE = 2 * 60 * 60 * 1000
export const IPHONE_STEPS = ['Seu iPhone', 'Pagamento', 'Quando comprar', 'Troca opcional', 'Revisar'] as const

// Source: commercial table supplied by Master Prime, 21/10/2026.
// Installments use the 8.57% markup subsequently confirmed by Master Prime.
const usedRows: [string, string, number, number][] = [
  ['iphone-13', 'iPhone 13', 128, 230000],
  ['iphone-13-pro-max', 'iPhone 13 Pro Max', 128, 380000],
  ['iphone-14', 'iPhone 14', 128, 245000],
  ['iphone-14-plus', 'iPhone 14 Plus', 128, 270000],
  ['iphone-14-pro', 'iPhone 14 Pro', 128, 320000],
  ['iphone-14-pro-max', 'iPhone 14 Pro Max', 128, 370000],
  ['iphone-15', 'iPhone 15', 128, 320000],
  ['iphone-15-plus', 'iPhone 15 Plus', 128, 335000],
  ['iphone-15-pro', 'iPhone 15 Pro', 128, 395000],
  ['iphone-15-pro', 'iPhone 15 Pro', 256, 405000],
  ['iphone-15-pro-max', 'iPhone 15 Pro Max', 256, 440000],
  ['iphone-16', 'iPhone 16', 128, 410000],
  ['iphone-16-pro-max', 'iPhone 16 Pro Max', 256, 540000],
]
const sealedRows: [string, string, number, string, string, number][] = [
  ['iphone-17-pro-max', 'iPhone 17 Pro Max', 256, 'orange', 'Laranja', 769999],
  ['iphone-17-pro-max', 'iPhone 17 Pro Max', 256, 'silver', 'Silver/Prateado', 810000],
  ['iphone-17-pro-max', 'iPhone 17 Pro Max', 256, 'blue', 'Azul Intenso', 799999],
  ['iphone-17-pro-max', 'iPhone 17 Pro Max', 512, 'orange', 'Laranja Cósmico', 979999],
  ['iphone-17-pro-max', 'iPhone 17 Pro Max', 512, 'silver', 'Silver/Prateado', 979999],
  ['iphone-17-pro-max', 'iPhone 17 Pro Max', 512, 'blue', 'Azul Intenso', 1030000],
  ['iphone-18-pro-max', 'iPhone 18 Pro Max', 256, 'black', 'Preto', 990000],
  ['iphone-18-pro-max', 'iPhone 18 Pro Max', 256, 'burgundy', 'Bordô', 1110000],
  ['iphone-18-pro-max', 'iPhone 18 Pro Max', 256, 'silver', 'Prateado', 1050000],
]
// Add an ID only when the store confirms that a variant is unavailable.
// An empty set means consultation, never confirmed stock.
const unavailableVariantIds = new Set<string>()
export const IPHONE_VARIANTS: readonly IPhoneVariant[] = [
  ...sealedRows.map(([modelId, model, capacity, colorId, color, cashCents]) => ({
    id: `${modelId}-${capacity}-sealed-${colorId}`, modelId, model, capacity, colorId, color,
    condition: 'sealed' as const, cashCents, installmentCents: getIPhoneInstallmentPlan(cashCents).installmentCents, availability: 'consult' as const,
  })),
  ...usedRows.map(([modelId, model, capacity, cashCents]) => ({
    id: `${modelId}-${capacity}-used`, modelId, model, capacity, colorId: '', color: '',
    condition: 'used' as const, cashCents, installmentCents: getIPhoneInstallmentPlan(cashCents).installmentCents, availability: 'consult' as const,
  })),
].map(variant => ({ ...variant, availability: unavailableVariantIds.has(variant.id) ? 'unavailable' : 'consult' }))

// Model recognition reuses the repository's sourced catalog, never a number typed by the visitor.
export const IPHONE_TRADE_MODELS = SMARTPHONE_MODELS.filter(model => model.brandId === 'apple')
export const IPHONE_PAYMENTS = ['À vista', 'Cartão de crédito'] as const
export const IPHONE_CASH_METHODS = ['Pix', 'Cartão'] as const
// The same 8.57% markup applies to every supported installment count.
export const IPHONE_INSTALLMENTS = ['2 parcelas', '3 parcelas', '4 parcelas', '5 parcelas', '6 parcelas', '7 parcelas', '8 parcelas', '9 parcelas', '10 parcelas', '11 parcelas', '12 parcelas'] as const
export const IPHONE_TIMINGS = ['Assim que confirmar as condições', 'Nos próximos dias', 'Estou pesquisando'] as const
// Visitor-reported colors; these options do not describe store inventory.
export const IPHONE_TRADE_COLORS = ['Preto', 'Branco', 'Prateado', 'Cinza', 'Azul', 'Verde', 'Rosa', 'Roxo', 'Vermelho', 'Amarelo', 'Dourado', 'Natural', 'Laranja', 'Bordô', 'Outra cor', 'Não sei'] as const
export const IPHONE_APPEARANCE = ['Sem dano percebido', 'Marcas ou riscos', 'Trinca ou quebra', 'Não sei'] as const
export const IPHONE_REPAIRS = ['Não conheço reparos anteriores', 'Houve troca ou reparo', 'Não sei'] as const
export const IPHONE_PARTS = ['Tela', 'Bateria', 'Câmeras', 'Placa', 'Outro', 'Não sei qual'] as const
export const IPHONE_FAULTS = ['Nenhuma falha conhecida', 'Face ID', 'Câmeras', 'Carga', 'Tela/toque', 'Outra', 'Não sei'] as const
export const IPHONE_LIQUID = ['Não tenho conhecimento', 'Sim', 'Não sei'] as const
export const IPHONE_ACTIVATION = ['Sem bloqueio conhecido', 'Há bloqueio de ativação', 'Há gestão corporativa', 'Não sei'] as const
export const IPHONE_TRADE_NOTICE = 'As informações serão analisadas pela equipe. A aceitação e o valor do aparelho usado dependem de avaliação técnica.'
export const createIPhoneTrade = (): IPhoneTradeIn => ({
  modelId: '', otherModel: '', capacity: '', color: '', battery: '', batteryUnknown: false,
  screen: '', back: '', sides: '', repairs: '', repairParts: [], repairOther: '', faults: [], faultOther: '', liquid: '', activation: '', notes: '',
})
export const createIPhonePurchaseDraft = (): IPhonePurchaseDraft => ({
  version: 1, selection: { modelId: 'iphone-17-pro-max', capacity: 256, condition: 'sealed', colorId: '' },
  preferredColorIds: [], payment: '', paymentDetail: '', timing: '', tradeChoice: '', trade: createIPhoneTrade(),
})
