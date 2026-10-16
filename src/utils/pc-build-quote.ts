import { createPcBuildQuoteDraft, PC_BUDGET_REFERENCES, PC_BUDGET_SCOPES, PC_COLORS, PC_CONNECTIVITY, PC_CPU, PC_FPS, PC_FULFILLMENT, PC_GAMES, PC_GPU, PC_GRAPHICS, PC_HORIZONS, PC_LIGHTING, PC_MODES, PC_PERIPHERALS, PC_PRIORITIES, PC_PROGRAMS, PC_PURPOSES, PC_RESOLUTIONS } from '@/data/pc-build-quote'
import type { PcBudgetReference, PcBuildQuoteDraft, PcCatalogItem, PcFeasibilityNotice } from '@/types/pc-build-quote'

export const normalizePcSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]/g, '')
export const searchPcCatalog = (items: readonly PcCatalogItem[], query: string) => {
  const needle = normalizePcSearch(query)
  return items.filter(item => [item.name, ...(item.aliases ?? [])].some(name => normalizePcSearch(name).includes(needle)))
}
export const pcLabel = (items: readonly { id: string; name: string }[], id: string) => items.find(item => item.id === id)?.name ?? ''
export const isPcGaming = (draft: PcBuildQuoteDraft) => ['gaming', 'both'].includes(draft.purpose)
export const isPcWork = (draft: PcBuildQuoteDraft) => ['work', 'both'].includes(draft.purpose)
export const formatPcBudget = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Brazilian currency only; integer arithmetic avoids binary rounding in cents. */
export const parsePcBudget = (input: string): number | null => {
  const value = input.trim().replace(/^R\$\s*/i, '').trim()
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return null
  const [whole, decimal = ''] = value.replace(/\./g, '').split(',')
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

const text = (value: unknown, limit: number) => typeof value === 'string' ? value.split('\u0000').join('').slice(0, limit) : ''
const ids = (value: unknown, options: readonly { id: string }[], limit = 10) => Array.isArray(value) ? options.filter(option => value.includes(option.id)).map(option => option.id).slice(0, limit) : []
const option = <T extends string>(value: unknown, options: readonly { id: T }[]): T | '' => options.find(item => item.id === value)?.id ?? ''
const customNames = (value: unknown, selectedIds: string[], catalog: readonly PcCatalogItem[]) => {
  const seen = new Set(selectedIds.flatMap(id => {
    const item = catalog.find(candidate => candidate.id === id)
    return item ? [item.name, ...(item.aliases ?? [])].map(normalizePcSearch) : []
  }))
  const result: string[] = []
  if (!Array.isArray(value)) return result
  for (const item of value) {
    const name = text(item, 60).trim()
    const normalized = normalizePcSearch(name)
    if (!normalized || seen.has(normalized)) continue
    result.push(name)
    seen.add(normalized)
    if (result.length >= 10 - selectedIds.length) break
  }
  return selectedIds.length >= 10 ? [] : result
}

export const sanitizePcBuildQuote = (value: PcBuildQuoteDraft): PcBuildQuoteDraft => {
  const d = createPcBuildQuoteDraft()
  d.mode = option(value.mode, PC_MODES)
  d.purpose = option(value.purpose, PC_PURPOSES)
  for (const key of ['ownedParts', 'objective', 'workload', 'notes', 'neighborhood', 'city'] as const) d[key] = text(value[key], ['objective', 'workload'].includes(key) ? 300 : ['neighborhood', 'city'].includes(key) ? 80 : 600)
  d.budgetUndecided = value.budgetUndecided === true
  d.budgetCents = !d.budgetUndecided && Number.isSafeInteger(value.budgetCents) && (value.budgetCents ?? 0) > 0 ? value.budgetCents : null
  d.budgetScope = option(value.budgetScope, PC_BUDGET_SCOPES)
  d.peripheralIds = d.budgetScope === 'setup' ? ids(value.peripheralIds, PC_PERIPHERALS) : []
  d.personalize = value.personalize === true
  d.guidanceRequested = value.guidanceRequested === true
  d.priorityIds = ids(value.priorityIds, PC_PRIORITIES, 2)
  d.connectivityIds = ids(value.connectivityIds, PC_CONNECTIVITY)
  d.gpu = option(value.gpu, PC_GPU)
  d.cpu = option(value.cpu, PC_CPU)
  d.caseColor = option(value.caseColor, PC_COLORS)
  d.lighting = option(value.lighting, PC_LIGHTING)
  d.horizon = option(value.horizon, PC_HORIZONS)
  d.fulfillment = option(value.fulfillment, PC_FULFILLMENT)
  if (isPcGaming(d)) {
    d.gamesUndecided = value.gamesUndecided === true
    d.gameIds = d.gamesUndecided ? [] : ids(value.gameIds, PC_GAMES)
    d.customGames = d.gamesUndecided ? [] : customNames(value.customGames, d.gameIds, PC_GAMES)
    d.resolution = option(value.resolution, PC_RESOLUTIONS)
    d.targetFps = option(value.targetFps, PC_FPS)
    d.customFps = d.targetFps === 'custom' ? text(value.customFps, 4) : ''
    if (!d.personalize && d.targetFps === 'custom' && (!/^\d{1,4}$/.test(d.customFps) || Number(d.customFps) <= 0)) { d.targetFps = ''; d.customFps = '' }
    d.graphics = option(value.graphics, PC_GRAPHICS)
  }
  if (isPcWork(d)) {
    d.programsUndecided = value.programsUndecided === true
    d.programIds = d.programsUndecided ? [] : ids(value.programIds, PC_PROGRAMS)
    d.customPrograms = d.programsUndecided ? [] : customNames(value.customPrograms, d.programIds, PC_PROGRAMS)
  } else d.workload = ''
  if (!['partial', 'assembly'].includes(d.mode)) d.ownedParts = ''
  return d
}

export const updatePcBuildQuote = (draft: PcBuildQuoteDraft, changes: Partial<PcBuildQuoteDraft>) => sanitizePcBuildQuote({ ...draft, ...changes })
export const getPcSelections = (draft: PcBuildQuoteDraft, kind: 'games' | 'programs') => {
  const catalog = kind === 'games' ? PC_GAMES : PC_PROGRAMS
  return [...draft[kind === 'games' ? 'gameIds' : 'programIds'].map(id => pcLabel(catalog, id)), ...draft[kind === 'games' ? 'customGames' : 'customPrograms']]
}
export const togglePcSelection = (draft: PcBuildQuoteDraft, kind: 'games' | 'programs', id: string): PcBuildQuoteDraft => {
  const catalog = kind === 'games' ? PC_GAMES : PC_PROGRAMS
  if (!catalog.some(item => item.id === id)) return draft
  const key = kind === 'games' ? 'gameIds' : 'programIds'
  const selected = draft[key].includes(id)
  if (!selected && getPcSelections(draft, kind).length >= 10) return draft
  return updatePcBuildQuote(draft, { [key]: selected ? draft[key].filter(item => item !== id) : [...draft[key], id], [kind === 'games' ? 'gamesUndecided' : 'programsUndecided']: false })
}
export const addPcCustomSelection = (draft: PcBuildQuoteDraft, kind: 'games' | 'programs', name: string): PcBuildQuoteDraft => {
  const catalog = kind === 'games' ? PC_GAMES : PC_PROGRAMS
  const normalized = normalizePcSearch(name)
  if (!normalized || getPcSelections(draft, kind).length >= 10) return draft
  const match = catalog.find(item => [item.name, ...(item.aliases ?? [])].some(alias => normalizePcSearch(alias) === normalized))
  if (match) return draft[kind === 'games' ? 'gameIds' : 'programIds'].includes(match.id) ? draft : togglePcSelection(draft, kind, match.id)
  const key = kind === 'games' ? 'customGames' : 'customPrograms'
  return updatePcBuildQuote(draft, { [key]: [...draft[key], name], [kind === 'games' ? 'gamesUndecided' : 'programsUndecided']: false })
}

export const getPcTargetFps = (draft: PcBuildQuoteDraft) => /^\d{1,4}$/.test(draft.targetFps === 'custom' ? draft.customFps : draft.targetFps) ? Number(draft.targetFps === 'custom' ? draft.customFps : draft.targetFps) : null

export const getPcFeasibilityNotice = (draft: PcBuildQuoteDraft, references: readonly PcBudgetReference[] = PC_BUDGET_REFERENCES, now = Date.now()): PcFeasibilityNotice | null => {
  if (!isPcGaming(draft)) return null
  const fps = getPcTargetFps(draft)
  if (!fps || !draft.gameIds.length && !draft.customGames.length) return null
  const reference = draft.mode === 'complete' && draft.budgetCents !== null ? references.find(item =>
    draft.gameIds.includes(item.gameId) && item.resolution === draft.resolution && item.graphics === draft.graphics && item.targetFps === fps &&
    Number.isSafeInteger(item.minimumBudgetCents) && item.minimumBudgetCents > 0 && draft.budgetCents! < item.minimumBudgetCents &&
    /^https:\/\//.test(item.source) && /^\d{4}-\d{2}-\d{2}$/.test(item.reviewedAt) && /^\d{4}-\d{2}-\d{2}$/.test(item.validUntil) &&
    Date.parse(item.reviewedAt) <= now && Date.parse(item.validUntil) + 86400000 > now && Date.parse(item.validUntil) >= Date.parse(item.reviewedAt)
  ) : undefined
  if (reference) return { kind: 'review', referenceId: reference.id, title: 'Seu orçamento e sua meta precisam de revisão.', message: 'O valor informado está abaixo da referência revisada para este jogo, resolução e meta. Ajuste o investimento, reveja o desempenho ou peça orientação à equipe.' }
  if (fps >= 240) return { kind: 'context', title: 'Uma meta alta merece uma avaliação cuidadosa.', message: `${draft.budgetCents ? `Você informou ${formatPcBudget(draft.budgetCents)} e uma meta de ${fps} FPS. ` : `Sua meta é de ${fps} FPS. `}A equipe precisa avaliar o jogo, a resolução, os ajustes gráficos e as peças disponíveis para verificar se o pedido é viável. Essa meta não é uma previsão de desempenho.` }
  return null
}

export interface PcReviewGroup { title: string; lines: string[] }
export const getPcReviewGroups = (value: PcBuildQuoteDraft): PcReviewGroup[] => {
  const d = sanitizePcBuildQuote(value)
  const list = (options: readonly { id: string; name: string }[], values: string[]) => values.map(id => pcLabel(options, id)).join(', ')
  const detail = (name: string, label: string) => label ? `${name}: ${label}` : ''
  return [
    { title: 'Seu projeto', lines: [pcLabel(PC_MODES, d.mode), detail('Uso', pcLabel(PC_PURPOSES, d.purpose)), detail('Peças que já tenho', d.ownedParts.trim())].filter(Boolean) },
    { title: 'Investimento', lines: [d.budgetUndecided ? 'Investimento ainda não definido' : d.budgetCents ? `Investimento pretendido: até ${formatPcBudget(d.budgetCents)}` : '', detail('Inclui', pcLabel(PC_BUDGET_SCOPES, d.budgetScope)), detail('Periféricos', list(PC_PERIPHERALS, d.peripheralIds)), 'Peças a comprar e montagem dentro do valor informado. Entrega a combinar.'].filter(Boolean) },
    { title: 'Uso e preferências', lines: [
      isPcGaming(d) ? `Jogos: ${d.gamesUndecided ? 'Ainda não sei' : getPcSelections(d, 'games').join(', ')}` : '',
      isPcWork(d) ? `Programas: ${d.programsUndecided ? 'Ainda não sei' : getPcSelections(d, 'programs').join(', ')}` : '',
      detail('Objetivo', d.objective.trim()), detail('Resolução', pcLabel(PC_RESOLUTIONS, d.resolution)), detail('Meta de FPS', d.targetFps === 'custom' ? d.customFps : pcLabel(PC_FPS, d.targetFps)),
      detail('Experiência', pcLabel(PC_GRAPHICS, d.graphics)), detail('Trabalho', d.workload.trim()), detail('Prioridades', list(PC_PRIORITIES, d.priorityIds)),
      d.guidanceRequested ? 'Quero orientação para alinhar orçamento e desempenho.' : '',
      detail('Preferência de GPU', pcLabel(PC_GPU, d.gpu)), detail('Preferência de CPU', pcLabel(PC_CPU, d.cpu)), detail('Cor', pcLabel(PC_COLORS, d.caseColor)), detail('Iluminação', pcLabel(PC_LIGHTING, d.lighting)),
      detail('Conexões', list(PC_CONNECTIVITY, d.connectivityIds)), detail('Quando pretendo montar', pcLabel(PC_HORIZONS, d.horizon)), detail('Observações', d.notes.trim()),
    ].filter(Boolean) },
    { title: 'Atendimento', lines: [pcLabel(PC_FULFILLMENT, d.fulfillment), ...(d.fulfillment === 'delivery' ? [detail('Bairro', d.neighborhood.trim()), detail('Cidade', d.city.trim()), 'Disponibilidade e custos de entrega a confirmar.'] : d.fulfillment === 'store' ? ['Avenida Cesário de Melo, 2571, Campo Grande, Rio de Janeiro/RJ.'] : [])].filter(Boolean) },
  ]
}
export const buildPcBuildQuoteMessage = (value: PcBuildQuoteDraft): string => {
  if (value.category !== 'montagem-pc' || value.intent !== 'build') throw new Error('Solicitação de montagem inválida.')
  const d = sanitizePcBuildQuote(value)
  const notice = getPcFeasibilityNotice(d)
  return ['Olá! Quero consultar um orçamento para montar meu PC na Master Prime.', ...getPcReviewGroups(d).flatMap(group => ['', `${group.title}:`, ...group.lines]),
    ...(notice ? ['', `Ponto para avaliar: ${notice.title}`, notice.message] : []), '', 'As preferências e metas dependem da avaliação da equipe. Gostaria de confirmar configuração, compatibilidade, valores e condições.'].join('\n')
}

export const restorePcBuildQuoteDraft = (raw: string | null, now = Date.now()): PcBuildQuoteDraft | null => {
  if (!raw) return null
  try {
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object' || !Number.isFinite(saved.savedAt) || saved.savedAt > now || now - saved.savedAt > 7200000) return null
    const value = saved.draft
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 || value.category !== 'montagem-pc' || value.intent !== 'build') return null
    const initial = createPcBuildQuoteDraft()
    for (const [key, defaultValue] of Object.entries(initial)) {
      const v = value[key]
      if (Array.isArray(defaultValue) ? !Array.isArray(v) || v.some((item: unknown) => typeof item !== 'string') : key === 'budgetCents' ? v !== null && (!Number.isSafeInteger(v) || v <= 0) : typeof v !== typeof defaultValue) return null
    }
    return sanitizePcBuildQuote(value)
  } catch { return null }
}
