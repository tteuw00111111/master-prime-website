import type { SmartphoneQuoteDraft } from '@/types/smartphone-quote'
import type { QuoteStep } from '@/types/quote'
import { getSmartphoneBrand, getSmartphoneIssues, getSmartphoneQuestions } from './smartphone-quote'

export type SmartphoneQuoteScreen = 'brand' | 'model' | 'issues' | `question:${string}` | 'notes' | 'delivery' | 'neighborhood' | 'city' | 'review'
export type SmartphoneQuoteField = 'brand' | 'model' | 'issues' | 'delivery' | 'neighborhood' | 'city'
export type SmartphoneQuoteErrors = Partial<Record<SmartphoneQuoteField, string>>
export type SmartphoneEditScope = 'identity' | 'issues' | 'details' | 'delivery'
export const SMARTPHONE_EDIT_SCOPES: SmartphoneEditScope[] = ['identity', 'issues', 'details', 'delivery']

export const getSmartphoneScreens = (draft: SmartphoneQuoteDraft): SmartphoneQuoteScreen[] => [
  'brand', 'model', 'issues', ...getSmartphoneQuestions(draft).map(question => `question:${question.id}` as const),
  'notes', 'delivery', ...(draft.delivery === 'pickup' ? ['neighborhood', 'city'] as const : []), 'review',
]

export const getSmartphoneScreenStep = (screen: SmartphoneQuoteScreen): QuoteStep => {
  if (screen === 'brand' || screen === 'model') return 0
  if (screen === 'issues') return 1
  if (screen === 'notes' || screen.startsWith('question:')) return 2
  return screen === 'review' ? 4 : 3
}

export const isSmartphoneScreenInScope = (screen: SmartphoneQuoteScreen, scope: SmartphoneEditScope) =>
  getSmartphoneScreenStep(screen) === SMARTPHONE_EDIT_SCOPES.indexOf(scope)

export const getSmartphoneScreenErrors = (draft: SmartphoneQuoteDraft, screen: SmartphoneQuoteScreen): SmartphoneQuoteErrors => {
  if (screen === 'brand' && !getSmartphoneBrand(draft)) return { brand: draft.brandId === 'other' ? 'Digite o nome da marca.' : 'Escolha a marca ou selecione “Não sei a marca”.' }
  if (screen === 'model' && !draft.modelUnknown && !draft.model.trim()) return { model: 'Informe o modelo ou marque “Não sei o modelo”.' }
  if (screen === 'issues' && !getSmartphoneIssues(draft).length) return { issues: 'Escolha pelo menos uma opção. Você também pode marcar “Outro problema”.' }
  if (screen === 'delivery' && !['store', 'pickup', 'undecided'].includes(draft.delivery)) return { delivery: 'Escolha como prefere o atendimento.' }
  if (draft.delivery === 'pickup') {
    if (screen === 'neighborhood' && !draft.neighborhood.trim()) return { neighborhood: 'Informe seu bairro para consultar a retirada e entrega.' }
    if (screen === 'city' && !draft.city.trim()) return { city: 'Informe sua cidade para consultar a retirada e entrega.' }
  }
  return {}
}

export const getFirstIncompleteSmartphoneScreen = (draft: SmartphoneQuoteDraft) =>
  getSmartphoneScreens(draft).find(screen => Object.keys(getSmartphoneScreenErrors(draft, screen)).length > 0) ?? null

export const restoreSmartphoneScreen = (draft: SmartphoneQuoteDraft, saved: { screen?: unknown; step?: unknown }): SmartphoneQuoteScreen => {
  const screens = getSmartphoneScreens(draft)
  const candidate = screens.find(screen => screen === saved.screen) ?? screens.find(screen => getSmartphoneScreenStep(screen) === saved.step) ?? 'brand'
  const incomplete = getFirstIncompleteSmartphoneScreen(draft)
  return incomplete && screens.indexOf(candidate) > screens.indexOf(incomplete) ? incomplete : candidate
}
