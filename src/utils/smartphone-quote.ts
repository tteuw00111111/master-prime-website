import { SMARTPHONE_BRANDS, SMARTPHONE_ISSUES, SMARTPHONE_MODELS, SMARTPHONE_UNSURE, createSmartphoneQuoteDraft } from '@/data/smartphone-quote'
import { DELIVERY_LABELS } from '@/data/notebook-quote'
import type { QuoteQuestion } from '@/types/quote'
import type { SmartphoneQuoteDraft } from '@/types/smartphone-quote'
import { getQuoteAnswerValues, normalizeCatalogSearch, toggleQuoteAnswer } from './quote'

export const getSmartphoneBrand = (draft: SmartphoneQuoteDraft) => draft.brandId === 'unknown' ? 'Não sei a marca'
  : draft.brandId === 'other' ? draft.customBrand.trim()
    : SMARTPHONE_BRANDS.find(brand => brand.id === draft.brandId)?.name ?? ''

export const getSmartphoneIssues = (draft: SmartphoneQuoteDraft) => SMARTPHONE_ISSUES.filter(issue => draft.issueIds.includes(issue.id))
export const getSmartphoneQuestions = (draft: SmartphoneQuoteDraft) => getSmartphoneIssues(draft).flatMap(issue => issue.questions)

// A plus sign identifies a different phone. Keep S24 distinct from S24+ and
// Redmi Note 13 Pro distinct from Pro+, including when "Plus" is typed out.
const normalizeSmartphoneSearch = (value: string) => normalizeCatalogSearch(value.replace(/\+/g, ' plus '))
const smartphoneSearchIndex = SMARTPHONE_MODELS.map(model => ({
  model, name: normalizeSmartphoneSearch(model.name), aliases: model.aliases.map(normalizeSmartphoneSearch),
}))

export const searchSmartphoneModels = (brandId: string, query: string) => {
  const needle = normalizeSmartphoneSearch(query)
  if (needle.length < 2 || brandId === 'other') return []
  // Rank before limiting results so a full variant name is never hidden behind
  // the first eight family matches, even when searching across all brands.
  return smartphoneSearchIndex.filter(item => brandId === 'unknown' || item.model.brandId === brandId).map(item => {
    const names = [item.name, ...item.aliases]
    const rank = item.name === needle ? 5 : item.aliases.includes(needle) ? 4
      : names.some(name => name.startsWith(needle)) ? 3 : names.some(name => name.includes(needle)) ? 2 : 0
    return { model: item.model, rank }
  }).filter(item => item.rank).sort((a, b) => b.rank - a.rank).slice(0, 8).map(item => item.model)
}

export const getSmartphoneAnswerValues = (draft: Pick<SmartphoneQuoteDraft, 'answers'>, question: QuoteQuestion) => {
  const values = getQuoteAnswerValues(draft, question)
  return values.includes(SMARTPHONE_UNSURE) ? [SMARTPHONE_UNSURE] : values
}

export const toggleSmartphoneAnswer = (draft: SmartphoneQuoteDraft, question: QuoteQuestion, option: string): SmartphoneQuoteDraft['answers'] => {
  if (!question.options.includes(option)) return draft.answers
  const values = getSmartphoneAnswerValues(draft, question)
  if (question.multiple && option === SMARTPHONE_UNSURE) return { ...draft.answers, [question.id]: values.includes(option) ? [] : [option] }
  const answers = { ...draft.answers, [question.id]: question.multiple ? values.filter(value => value !== SMARTPHONE_UNSURE) : draft.answers[question.id] }
  return toggleQuoteAnswer({ answers }, question, option)
}

export const sanitizeSmartphoneQuote = (draft: SmartphoneQuoteDraft): SmartphoneQuoteDraft => {
  const issueIds = getSmartphoneIssues(draft).map(issue => issue.id)
  const answers: SmartphoneQuoteDraft['answers'] = {}
  for (const question of getSmartphoneQuestions({ ...draft, issueIds })) {
    const values = getSmartphoneAnswerValues(draft, question)
    if (values.length) answers[question.id] = question.multiple ? values : values[0]
  }
  return { ...draft, model: draft.modelUnknown ? '' : draft.model, issueIds, answers }
}

export const updateSmartphoneQuote = (draft: SmartphoneQuoteDraft, changes: Partial<SmartphoneQuoteDraft>): SmartphoneQuoteDraft => {
  const changedBrand = changes.brandId !== undefined && changes.brandId !== draft.brandId
  const next = { ...draft, ...changes, ...(changedBrand ? { customBrand: '', model: '', modelUnknown: false } : {}) }
  return sanitizeSmartphoneQuote(next)
}

export const toggleSmartphoneIssue = (draft: SmartphoneQuoteDraft, id: string): SmartphoneQuoteDraft => {
  if (!SMARTPHONE_ISSUES.some(issue => issue.id === id)) return draft
  return sanitizeSmartphoneQuote({ ...draft, issueIds: draft.issueIds.includes(id) ? draft.issueIds.filter(value => value !== id) : [...draft.issueIds, id] })
}

export const buildSmartphoneQuoteMessage = (value: SmartphoneQuoteDraft): string => {
  const draft = sanitizeSmartphoneQuote(value)
  const lines = ['Olá! Vim da área de orçamento de celular do site Master Prime.', '', 'Aparelho: Celular',
    `Marca: ${getSmartphoneBrand(draft) || 'Não informada'}`, `Modelo: ${draft.modelUnknown ? 'Não sei o modelo' : draft.model.trim()}`,
    '', 'Problemas:', ...getSmartphoneIssues(draft).map(issue => `• ${issue.label}`)]
  for (const question of getSmartphoneQuestions(draft)) {
    const values = getSmartphoneAnswerValues(draft, question)
    if (values.length) lines.push(`${question.label} ${values.join('; ')}`)
  }
  if (draft.notes.trim()) lines.push('', `Observações: ${draft.notes.trim()}`)
  if (draft.delivery) lines.push('', `Atendimento: ${DELIVERY_LABELS[draft.delivery]}`)
  if (draft.delivery === 'pickup') lines.push(`Bairro: ${draft.neighborhood.trim()}`, `Cidade: ${draft.city.trim()}`, 'Gostaria de confirmar disponibilidade e condições de retirada e entrega.')
  lines.push('', 'Gostaria de consultar a possibilidade de atendimento e orçamento.')
  return lines.join('\n')
}

export const restoreSmartphoneQuoteDraft = (raw: string | null, now = Date.now()): SmartphoneQuoteDraft | null => {
  if (!raw) return null
  try {
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object' || !Number.isFinite(saved.savedAt) || saved.savedAt > now || now - saved.savedAt > 7200000) return null
    const value = saved.draft
    if (!value || value.version !== 1 || value.category !== 'celular' || typeof value.brandId !== 'string' || typeof value.modelUnknown !== 'boolean' ||
      !Array.isArray(value.issueIds) || !value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers)) return null
    const draft = createSmartphoneQuoteDraft()
    for (const key of ['customBrand', 'model', 'notes', 'neighborhood', 'city'] as const) {
      if (typeof value[key] !== 'string') return null
      draft[key] = value[key].slice(0, key === 'notes' ? 600 : key === 'model' ? 120 : 80)
    }
    const allowedBrands: string[] = [...SMARTPHONE_BRANDS.map(brand => brand.id), 'other', 'unknown']
    draft.brandId = allowedBrands.includes(value.brandId) ? value.brandId : ''
    draft.customBrand = draft.brandId === 'other' ? draft.customBrand : ''
    draft.modelUnknown = value.modelUnknown
    draft.issueIds = value.issueIds
    draft.answers = value.answers
    draft.delivery = ['store', 'pickup', 'undecided'].includes(value.delivery) ? value.delivery : ''
    return sanitizeSmartphoneQuote(draft)
  } catch { return null }
}
