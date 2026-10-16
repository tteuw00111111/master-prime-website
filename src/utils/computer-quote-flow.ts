import type { ComputerQuoteDraft } from '@/types/computer-quote'
import type { QuoteStep } from '@/types/quote'
import { getComputerIssues, getComputerKindLabel, getComputerQuestions } from './computer-quote'

export type ComputerQuoteScreen = 'kind' | 'configuration' | 'issues' | `question:${string}` | 'notes' | 'delivery' | 'neighborhood' | 'city' | 'review'
export type ComputerQuoteField = 'kind' | 'issues' | 'delivery' | 'neighborhood' | 'city'
export type ComputerQuoteErrors = Partial<Record<ComputerQuoteField, string>>
export type ComputerEditScope = 'identity' | 'issues' | 'details' | 'delivery'
export const COMPUTER_EDIT_SCOPES: ComputerEditScope[] = ['identity', 'issues', 'details', 'delivery']

export const getComputerScreens = (draft: ComputerQuoteDraft): ComputerQuoteScreen[] => draft.intent !== 'repair' ? [] : [
  'kind', 'configuration', 'issues', ...getComputerQuestions(draft).map(question => `question:${question.id}` as const),
  'notes', 'delivery', ...(draft.delivery === 'pickup' ? ['neighborhood', 'city'] as const : []), 'review',
]

export const getComputerScreenStep = (screen: ComputerQuoteScreen): QuoteStep => {
  if (screen === 'kind' || screen === 'configuration') return 0
  if (screen === 'issues') return 1
  if (screen === 'notes' || screen.startsWith('question:')) return 2
  return screen === 'review' ? 4 : 3
}

export const isComputerScreenInScope = (screen: ComputerQuoteScreen, scope: ComputerEditScope) =>
  getComputerScreenStep(screen) === COMPUTER_EDIT_SCOPES.indexOf(scope)

export const getComputerScreenErrors = (draft: ComputerQuoteDraft, screen: ComputerQuoteScreen): ComputerQuoteErrors => {
  if (draft.intent !== 'repair') return { kind: 'Esta opção de orçamento ainda não está disponível.' }
  if (screen === 'kind' && !getComputerKindLabel(draft)) return { kind: 'Escolha o tipo de computador ou selecione “Não sei dizer”.' }
  if (screen === 'issues' && !getComputerIssues(draft).length) return { issues: 'Escolha pelo menos uma opção. Você também pode marcar “Outro problema”.' }
  if (screen === 'delivery' && !['store', 'pickup', 'undecided'].includes(draft.delivery)) return { delivery: 'Escolha como prefere o atendimento.' }
  if (draft.delivery === 'pickup') {
    if (screen === 'neighborhood' && !draft.neighborhood.trim()) return { neighborhood: 'Informe seu bairro para consultar a retirada e entrega.' }
    if (screen === 'city' && !draft.city.trim()) return { city: 'Informe sua cidade para consultar a retirada e entrega.' }
  }
  return {}
}

export const getFirstIncompleteComputerScreen = (draft: ComputerQuoteDraft): ComputerQuoteScreen | null =>
  draft.intent !== 'repair' ? 'kind' : getComputerScreens(draft).find(screen => Object.keys(getComputerScreenErrors(draft, screen)).length > 0) ?? null

export const restoreComputerScreen = (draft: ComputerQuoteDraft, saved: { screen?: unknown; step?: unknown }): ComputerQuoteScreen => {
  const screens = getComputerScreens(draft)
  const candidate = screens.find(screen => screen === saved.screen) ?? screens.find(screen => getComputerScreenStep(screen) === saved.step) ?? 'kind'
  const incomplete = getFirstIncompleteComputerScreen(draft)
  return incomplete && screens.indexOf(candidate) > screens.indexOf(incomplete) ? incomplete : candidate
}
