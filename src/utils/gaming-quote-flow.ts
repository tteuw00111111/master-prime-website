import type { GamingDeviceKind, GamingQuoteDraft } from '@/types/gaming-quote'
import type { QuoteStep } from '@/types/quote'
import { getGamingDevices, getGamingQuestions, getLegacyGamingModelError, getSelectedGamingIssues, getSupportedGamingModel } from './gaming-quote'

export type GamingQuoteScreen = 'mode' | `${GamingDeviceKind}:platform` | `${GamingDeviceKind}:model` | `${GamingDeviceKind}:issues` | `${GamingDeviceKind}:question:${string}` | 'notes' | 'delivery' | 'neighborhood' | 'city' | 'review'
export type GamingQuoteField = 'mode' | 'platform' | 'model' | 'issues' | 'delivery' | 'neighborhood' | 'city'
export type GamingQuoteErrors = Partial<Record<GamingQuoteField, string>>

export const getGamingScreenDevice = (screen: GamingQuoteScreen): GamingDeviceKind | null =>
  screen.startsWith('console:') ? 'console' : screen.startsWith('controller:') ? 'controller' : null

export const getGamingScreens = (draft: GamingQuoteDraft): GamingQuoteScreen[] => {
  const devices = getGamingDevices(draft)
  return ['mode',
    ...devices.flatMap(kind => [`${kind}:platform`, `${kind}:model`] as const),
    ...devices.map(kind => `${kind}:issues` as const),
    ...devices.flatMap(kind => getGamingQuestions(kind, draft[kind]).map(question => `${kind}:question:${question.id}` as const)),
    'notes', 'delivery', ...(draft.delivery === 'pickup' ? ['neighborhood', 'city'] as const : []), 'review']
}

export const getGamingScreenStep = (screen: GamingQuoteScreen): QuoteStep => {
  if (screen === 'mode' || screen.endsWith(':platform') || screen.endsWith(':model')) return 0
  if (screen.endsWith(':issues')) return 1
  if (screen === 'notes' || screen.includes(':question:')) return 2
  return screen === 'review' ? 4 : 3
}

export const getGamingScreenErrors = (draft: GamingQuoteDraft, screen: GamingQuoteScreen): GamingQuoteErrors => {
  if (screen === 'mode' && !getGamingDevices(draft).length) return { mode: 'Escolha o que precisa de atendimento.' }
  const kind = getGamingScreenDevice(screen)
  if (kind) {
    const device = draft[kind]
    if (screen.endsWith(':platform') && !['playstation', 'xbox', 'unknown'].includes(device.platform)) return { platform: 'Escolha a plataforma ou selecione “Não sei”.' }
    if (screen.endsWith(':model') && !getSupportedGamingModel(kind, device)) return { model: getLegacyGamingModelError(device.model) ?? 'Escolha um modelo da lista. Este formulário é para PS4, PS5, Xbox One e Xbox Series X|S e seus controles.' }
    if (screen.endsWith(':issues') && !getSelectedGamingIssues(kind, device).length) return { issues: 'Escolha pelo menos uma opção. Você também pode marcar “Outro problema”.' }
  }
  if (screen === 'delivery' && !['store', 'pickup', 'undecided'].includes(draft.delivery)) return { delivery: 'Escolha como prefere o atendimento.' }
  if (draft.delivery === 'pickup') {
    if (screen === 'neighborhood' && !draft.neighborhood.trim()) return { neighborhood: 'Informe seu bairro para consultar a retirada e entrega.' }
    if (screen === 'city' && !draft.city.trim()) return { city: 'Informe sua cidade para consultar a retirada e entrega.' }
  }
  return {}
}

export const getFirstIncompleteGamingScreen = (draft: GamingQuoteDraft) =>
  getGamingScreens(draft).find(screen => Object.keys(getGamingScreenErrors(draft, screen)).length > 0) ?? null

export const restoreGamingScreen = (draft: GamingQuoteDraft, saved: { screen?: unknown; step?: unknown }): GamingQuoteScreen => {
  const screens = getGamingScreens(draft)
  const candidate = screens.find(screen => screen === saved.screen) ?? screens.find(screen => getGamingScreenStep(screen) === saved.step) ?? 'mode'
  const incomplete = getFirstIncompleteGamingScreen(draft)
  return incomplete && screens.indexOf(candidate) > screens.indexOf(incomplete) ? incomplete : candidate
}
