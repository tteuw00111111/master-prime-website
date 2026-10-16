import type { PcBuildQuoteDraft } from '@/types/pc-build-quote'
import type { QuoteStep } from '@/types/quote'
import { getPcSelections, getPcTargetFps, isPcGaming, isPcWork } from './pc-build-quote'

export type PcBuildScreen = 'mode' | 'purpose' | 'ownedParts' | 'budget' | 'budgetScope' | 'games' | 'programs' | 'objective' | 'personalize' | 'monitor' | 'fps' | 'graphics' | 'workload' | 'priorities' | 'gpu' | 'cpu' | 'appearance' | 'connectivity' | 'timing' | 'fulfillment' | 'neighborhood' | 'city' | 'review'
export type PcBuildField = 'mode' | 'purpose' | 'budget' | 'budgetScope' | 'games' | 'programs' | 'customFps' | 'fulfillment' | 'neighborhood' | 'city'
export type PcBuildErrors = Partial<Record<PcBuildField, string>>
export type PcBuildEditScope = 'project' | 'budget' | 'preferences' | 'fulfillment'
export const PC_BUILD_EDIT_SCOPES: PcBuildEditScope[] = ['project', 'budget', 'preferences', 'fulfillment']

export const getPcBuildScreens = (draft: PcBuildQuoteDraft): PcBuildScreen[] => [
  'mode', 'purpose', ...(['partial', 'assembly'].includes(draft.mode) ? ['ownedParts'] as const : []), 'budget', 'budgetScope',
  ...(isPcGaming(draft) ? ['games'] as const : []), ...(isPcWork(draft) ? ['programs'] as const : []), 'objective', 'personalize',
  ...(draft.personalize ? [...(isPcGaming(draft) ? ['monitor', 'fps', 'graphics'] as const : []), ...(isPcWork(draft) ? ['workload'] as const : []), 'priorities', 'gpu', 'cpu', 'appearance', 'connectivity', 'timing'] as PcBuildScreen[] : []),
  'fulfillment', ...(draft.fulfillment === 'delivery' ? ['neighborhood', 'city'] as const : []), 'review',
]
export const getPcBuildScreenStep = (screen: PcBuildScreen): QuoteStep => ['mode', 'purpose', 'ownedParts'].includes(screen) ? 0 : ['budget', 'budgetScope'].includes(screen) ? 1 : ['fulfillment', 'neighborhood', 'city'].includes(screen) ? 3 : screen === 'review' ? 4 : 2
export const isPcBuildScreenInScope = (screen: PcBuildScreen, scope: PcBuildEditScope) => getPcBuildScreenStep(screen) === PC_BUILD_EDIT_SCOPES.indexOf(scope)

export const getPcBuildScreenErrors = (d: PcBuildQuoteDraft, screen: PcBuildScreen): PcBuildErrors => {
  if (!['complete', 'partial', 'assembly'].includes(d.mode) && screen === 'mode') return { mode: 'Escolha como deseja montar seu PC.' }
  if (!['gaming', 'work', 'both'].includes(d.purpose) && screen === 'purpose') return { purpose: 'Escolha o uso principal do seu PC.' }
  if (screen === 'budget' && !d.budgetUndecided && !(Number.isSafeInteger(d.budgetCents) && (d.budgetCents ?? 0) > 0)) return { budget: 'Informe um valor válido em reais ou marque “Ainda não defini”.' }
  if (screen === 'budgetScope' && !['pc', 'setup', 'unsure'].includes(d.budgetScope)) return { budgetScope: 'Escolha o que o investimento deve incluir.' }
  if (screen === 'games' && isPcGaming(d) && !getPcSelections(d, 'games').length && !d.gamesUndecided) return { games: 'Escolha ou adicione um jogo, ou marque “Ainda não sei”.' }
  if (screen === 'programs' && isPcWork(d) && !getPcSelections(d, 'programs').length && !d.programsUndecided) return { programs: 'Escolha ou adicione um programa, ou marque “Ainda não sei”.' }
  if ((screen === 'fps' || screen === 'personalize' && !d.personalize) && isPcGaming(d) && d.targetFps === 'custom' && !(getPcTargetFps(d) ?? 0)) return { customFps: 'Informe uma meta de FPS maior que zero ou escolha outra opção.' }
  if (screen === 'fulfillment' && !['store', 'delivery', 'undecided'].includes(d.fulfillment)) return { fulfillment: 'Escolha como prefere receber seu PC.' }
  if (d.fulfillment === 'delivery') {
    if (screen === 'neighborhood' && !d.neighborhood.trim()) return { neighborhood: 'Informe seu bairro para consultar a entrega.' }
    if (screen === 'city' && !d.city.trim()) return { city: 'Informe sua cidade para consultar a entrega.' }
  }
  return {}
}
export const getFirstIncompletePcBuildScreen = (draft: PcBuildQuoteDraft): PcBuildScreen | null => getPcBuildScreens(draft).find(screen => Object.keys(getPcBuildScreenErrors(draft, screen)).length) ?? null
export const restorePcBuildScreen = (draft: PcBuildQuoteDraft, saved: { screen?: unknown; step?: unknown }): PcBuildScreen => {
  const screens = getPcBuildScreens(draft)
  const candidate = screens.find(screen => screen === saved.screen) ?? screens.find(screen => getPcBuildScreenStep(screen) === saved.step) ?? 'mode'
  const incomplete = getFirstIncompletePcBuildScreen(draft)
  return incomplete && screens.indexOf(candidate) > screens.indexOf(incomplete) ? incomplete : candidate
}
