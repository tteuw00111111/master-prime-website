import { DELIVERY_LABELS, LEGACY_NOTEBOOK_UPGRADE, NOTEBOOK_BRANDS, NOTEBOOK_ISSUES, createQuoteDraft } from '@/data/notebook-quote'
import type { CatalogModel, NotebookCatalog, QuoteDraft, QuoteQuestion, QuoteStep } from '@/types/quote'

export const normalizeCatalogSearch = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

const catalogSearchIndexes = new WeakMap<CatalogModel[], { model: CatalogModel; names: string[] }[]>()

export const searchCatalogModels = (models: CatalogModel[], brandId: string, query: string) => {
  const needle = normalizeCatalogSearch(query)
  let index = catalogSearchIndexes.get(models)
  if (!index) {
    index = models.map(model => ({ model, names: [...new Set([model.name, ...model.aliases].map(normalizeCatalogSearch))] }))
    catalogSearchIndexes.set(models, index)
  }
  // Inputs arrive sorted by the importer. Retain just eight candidates per rank,
  // rather than sorting tens of thousands of matches on every keypress.
  const buckets: CatalogModel[][] = [[], [], [], [], []]
  for (const { model, names } of index) {
    if (model.brandId !== brandId) continue
    const score = !needle ? 1 : names.some(name => name === needle) ? 4
      : names.some(name => name.startsWith(needle)) ? 3 : names.some(name => name.includes(needle)) ? 2 : 0
    if (score && buckets[score].length < 8) buckets[score].push(model)
  }
  return [...buckets[4], ...buckets[3], ...buckets[2], ...buckets[1]].slice(0, 8)
}

export const parseNotebookCatalog = (value: unknown): NotebookCatalog => {
  if (!value || typeof value !== 'object') throw new Error('Catálogo indisponível')
  const catalog = value as NotebookCatalog
  if (catalog.version !== 1 || typeof catalog.updatedAt !== 'string' || typeof catalog.source !== 'string' || !Array.isArray(catalog.models) || catalog.models.some(model =>
    !model || typeof model.id !== 'string' || typeof model.brandId !== 'string' ||
    typeof model.name !== 'string' || typeof model.source !== 'string' ||
    !Array.isArray(model.aliases) || model.aliases.some(alias => typeof alias !== 'string')
  )) throw new Error('Catálogo inválido')
  if (catalog.brands !== undefined && (!Array.isArray(catalog.brands) || catalog.brands.some(brand =>
    !brand || typeof brand.id !== 'string' || typeof brand.name !== 'string' ||
    !/^\/catalog\/notebooks\/[a-z0-9-]+\.json$/.test(brand.file) ||
    (brand.compressedFile !== undefined && !/^\/catalog\/notebooks\/[a-z0-9-]+\.json\.gz$/.test(brand.compressedFile)) ||
    !Number.isInteger(brand.count) || brand.count < 0
  ))) throw new Error('Índice de marcas inválido')
  return catalog
}

export const getQuoteBrand = (draft: QuoteDraft) => draft.brandId === 'unknown' ? 'Não sei a marca'
  : draft.brandId === 'other' ? draft.customBrand.trim()
    : NOTEBOOK_BRANDS.find(brand => brand.id === draft.brandId)?.name ?? draft.customBrand.trim()

export const getQuoteIssues = (draft: QuoteDraft) => [...NOTEBOOK_ISSUES, LEGACY_NOTEBOOK_UPGRADE]
  .filter(issue => draft.issueIds.includes(issue.id))

export const getQuoteQuestions = (draft: QuoteDraft) => [...new Map(getQuoteIssues(draft)
  .flatMap(issue => issue.questions).map(question => [question.id, question])).values()]

export const getQuoteAnswerValues = (draft: Pick<QuoteDraft, 'answers'>, question: QuoteQuestion): string[] => {
  const answer = draft.answers[question.id]
  const values = typeof answer === 'string' ? [answer] : question.multiple && Array.isArray(answer) ? answer : []
  // Only defined options survive, in display order, without duplicates.
  return question.options.filter(option => values.includes(option))
}

export const toggleQuoteAnswer = (draft: Pick<QuoteDraft, 'answers'>, question: QuoteQuestion, option: string): QuoteDraft['answers'] => {
  if (!question.options.includes(option)) return draft.answers
  const selected = getQuoteAnswerValues(draft, question)
  const answer = question.multiple
    ? selected.includes(option) ? selected.filter(value => value !== option) : [...selected, option]
    : selected.includes(option) ? '' : option
  return { ...draft.answers, [question.id]: answer }
}

export const toggleQuoteIssue = (draft: QuoteDraft, id: string): Pick<QuoteDraft, 'issueIds' | 'answers'> => {
  const currentIds = id === 'ssd' || id === 'ram' ? draft.issueIds.filter(value => value !== 'upgrade') : draft.issueIds
  const issueIds = currentIds.includes(id) ? currentIds.filter(value => value !== id) : [...currentIds, id]
  const allowed = new Set(getQuoteQuestions({ ...draft, issueIds }).map(question => question.id))
  return { issueIds, answers: Object.fromEntries(Object.entries(draft.answers).filter(([key]) => allowed.has(key))) }
}

export type QuoteField = 'brand' | 'model' | 'issues' | 'delivery' | 'neighborhood' | 'city'

export const getQuoteFieldErrors = (draft: QuoteDraft, step: QuoteStep): Partial<Record<QuoteField, string>> => {
  const errors: Partial<Record<QuoteField, string>> = {}
  if (step === 0) {
    if (!getQuoteBrand(draft)) errors.brand = draft.brandId === 'other' ? 'Digite o nome da marca.' : 'Escolha a marca ou selecione “Não sei a marca”.'
    if (!draft.model.trim() && !draft.modelUnknown) errors.model = 'Informe o modelo ou marque “Não sei o modelo”.'
  }
  if (step === 1 && !draft.issueIds.length) errors.issues = 'Escolha pelo menos uma opção. Você também pode marcar “Outro problema”.'
  if (step === 3) {
    if (!draft.delivery) errors.delivery = 'Escolha como prefere o atendimento.'
    if (draft.delivery === 'pickup') {
      if (!draft.neighborhood.trim()) errors.neighborhood = 'Informe seu bairro para consultar a retirada e entrega.'
      if (!draft.city.trim()) errors.city = 'Informe sua cidade para consultar a retirada e entrega.'
    }
  }
  return errors
}

export const getStepError = (draft: QuoteDraft, step: QuoteStep): string | null =>
  Object.values(getQuoteFieldErrors(draft, step))[0] ?? null

export const getFirstIncompleteStep = (draft: QuoteDraft): QuoteStep | null => {
  for (const step of [0, 1, 2, 3] as const) if (getStepError(draft, step)) return step
  return null
}

export const buildQuoteMessage = (draft: QuoteDraft): string => {
  const questions = getQuoteQuestions(draft)
  const lines = [
    'Olá! Vim da área de orçamento de notebook do site Master Prime.', '',
    'Aparelho: Notebook',
    `Marca: ${getQuoteBrand(draft) || 'Não informada'}`,
    `Modelo: ${draft.modelUnknown ? 'Não sei o modelo' : draft.model.trim()}`,
    '', 'Problemas / solicitações:',
    ...getQuoteIssues(draft).map(issue => `• ${issue.label}`),
    ...questions.flatMap(question => {
      const values = getQuoteAnswerValues(draft, question)
      return !values.length ? [] : question.multiple ? [question.label, ...values.map(value => `• ${value}`)] : [`${question.label} ${values[0]}`]
    }),
  ]
  if (draft.notes.trim()) lines.push('', `Observações: ${draft.notes.trim()}`)
  if (draft.delivery) lines.push('', `Atendimento: ${DELIVERY_LABELS[draft.delivery]}`)
  if (draft.delivery === 'pickup') {
    lines.push(`Bairro: ${draft.neighborhood.trim()}`, `Cidade: ${draft.city.trim()}`, 'Gostaria de confirmar disponibilidade e condições de retirada e entrega.')
  }
  lines.push('', 'Gostaria de consultar a possibilidade de atendimento e orçamento.')
  return lines.join('\n')
}

// Keep the draft in this browser tab only. Reject stale/malformed state on restore.
export const restoreQuoteDraft = (raw: string | null, now = Date.now()): QuoteDraft | null => {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    if (!value || typeof value !== 'object' || !Number.isFinite(value.savedAt) ||
      now - value.savedAt > 2 * 60 * 60 * 1000 || value.savedAt > now) return null
    const draft = value.draft
    if (!draft || draft.version !== 1 || draft.category !== 'notebook') return null
    const initial = createQuoteDraft()
    for (const key of ['customBrand', 'model', 'notes', 'neighborhood', 'city'] as const) {
      if (typeof draft[key] !== 'string') return null
      const limit = key === 'notes' ? 600 : key === 'model' ? 120 : 80
      initial[key] = draft[key].slice(0, limit)
    }
    const brandIds: string[] = NOTEBOOK_BRANDS.map(brand => brand.id)
    initial.brandId = typeof draft.brandId === 'string' &&
      ([...brandIds, 'other', 'unknown'].includes(draft.brandId) || (/^[a-z0-9-]{1,80}$/.test(draft.brandId) && initial.customBrand.trim())) ? draft.brandId : ''
    initial.modelUnknown = draft.modelUnknown === true
    initial.issueIds = [...NOTEBOOK_ISSUES, LEGACY_NOTEBOOK_UPGRADE].filter(issue => Array.isArray(draft.issueIds) && draft.issueIds.includes(issue.id)).map(issue => issue.id)
    const answers = draft.answers && typeof draft.answers === 'object' ? draft.answers : {}
    for (const question of getQuoteQuestions(initial)) {
      const values = getQuoteAnswerValues({ ...initial, answers }, question)
      if (values.length) initial.answers[question.id] = question.multiple ? values : values[0]
    }
    initial.delivery = ['store', 'pickup', 'undecided'].includes(draft.delivery) ? draft.delivery : ''
    return initial
  } catch { return null }
}

export const trackQuoteEvent = (event: 'quote_started' | 'quote_step_completed' | 'quote_reviewed' | 'quote_whatsapp_click', step: QuoteStep, category: 'notebook' | 'videogame' = 'notebook') => {
  // Deliberate allowlist: no message, href, brand/model, free text or location data.
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, quote_category: category, quote_step: step + 1 })
}
