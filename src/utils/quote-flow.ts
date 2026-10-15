import type { QuoteDraft, QuoteStep } from '../types/quote'
import { getQuoteFieldErrors, getQuoteQuestions } from './quote'
import type { QuoteField } from './quote'

export type QuoteScreen = 'brand' | 'model' | 'issues' | `question:${string}` | 'notes' | 'delivery' | 'neighborhood' | 'city' | 'review'

export const getQuoteScreens = (draft: QuoteDraft): QuoteScreen[] => [
  'brand', 'model', 'issues', ...getQuoteQuestions(draft).map(question => `question:${question.id}` as const),
  'notes', 'delivery', ...(draft.delivery === 'pickup' ? ['neighborhood', 'city'] as const : []), 'review',
]

export const getScreenStep = (screen: QuoteScreen): QuoteStep => {
  if (screen === 'brand' || screen === 'model') return 0
  if (screen === 'issues') return 1
  if (screen === 'notes' || screen.startsWith('question:')) return 2
  if (screen === 'review') return 4
  return 3
}

export const getScreenErrors = (draft: QuoteDraft, screen: QuoteScreen): Partial<Record<QuoteField, string>> => {
  const errors = getQuoteFieldErrors(draft, getScreenStep(screen))
  const fields: Partial<Record<QuoteScreen, QuoteField>> = { brand: 'brand', model: 'model', issues: 'issues', delivery: 'delivery', neighborhood: 'neighborhood', city: 'city' }
  const field = fields[screen]
  return field && errors[field] ? { [field]: errors[field] } : {}
}

export const getFirstIncompleteScreen = (draft: QuoteDraft): QuoteScreen | null =>
  getQuoteScreens(draft).find(screen => Object.keys(getScreenErrors(draft, screen)).length > 0) ?? null

/** Restore old five-stage drafts as well as the current question, without skipping required fields. */
export const restoreQuoteScreen = (draft: QuoteDraft, saved: { screen?: unknown; step?: unknown }): QuoteScreen => {
  const screens = getQuoteScreens(draft)
  const candidate = screens.find(screen => screen === saved.screen)
    ?? screens.find(screen => getScreenStep(screen) === saved.step) ?? 'brand'
  const incomplete = getFirstIncompleteScreen(draft)
  return incomplete && screens.indexOf(candidate) > screens.indexOf(incomplete) ? incomplete : candidate
}
