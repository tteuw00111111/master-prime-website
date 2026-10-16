import { COMPUTER_ISSUES, COMPUTER_KINDS, createComputerQuoteDraft } from '@/data/computer-quote'
import { DELIVERY_LABELS } from '@/data/notebook-quote'
import type { ComputerQuoteDraft } from '@/types/computer-quote'
import { getQuoteAnswerValues } from './quote'

export const getComputerKindLabel = (draft: ComputerQuoteDraft) =>
  COMPUTER_KINDS.find(kind => kind.id === draft.kind)?.name ?? ''

export const getComputerIssues = (draft: ComputerQuoteDraft) =>
  draft.intent === 'repair' ? COMPUTER_ISSUES.filter(issue => draft.issueIds.includes(issue.id)) : []

export const getComputerQuestions = (draft: ComputerQuoteDraft) =>
  [...new Map(getComputerIssues(draft).flatMap(issue => issue.questions).map(question => [question.id, question])).values()]

export const sanitizeComputerQuote = (draft: ComputerQuoteDraft): ComputerQuoteDraft => {
  const issueIds = getComputerIssues(draft).map(issue => issue.id)
  const answers: ComputerQuoteDraft['answers'] = {}
  for (const question of getComputerQuestions({ ...draft, issueIds })) {
    const values = getQuoteAnswerValues(draft, question)
    if (values.length) answers[question.id] = question.multiple ? values : values[0]
  }
  return { ...draft, issueIds, answers }
}

export const updateComputerQuote = (draft: ComputerQuoteDraft, changes: Partial<ComputerQuoteDraft>) =>
  sanitizeComputerQuote({ ...draft, ...changes })

export const toggleComputerIssue = (draft: ComputerQuoteDraft, id: string) => {
  if (!COMPUTER_ISSUES.some(issue => issue.id === id)) return draft
  return updateComputerQuote(draft, { issueIds: draft.issueIds.includes(id) ? draft.issueIds.filter(value => value !== id) : [...draft.issueIds, id] })
}

export const buildComputerQuoteMessage = (value: ComputerQuoteDraft): string => {
  if (value.intent !== 'repair') throw new Error('Intenção de orçamento indisponível.')
  const draft = sanitizeComputerQuote(value)
  const lines = ['Olá! Vim da área de orçamento de computador do site Master Prime.', '',
    `Aparelho: ${draft.kind === 'unknown' ? 'Computador (tipo a identificar)' : getComputerKindLabel(draft)}`]
  if (draft.configuration.trim()) lines.push(`Marca, modelo ou configuração: ${draft.configuration.trim()}`)
  lines.push('', 'Problemas / solicitações:', ...getComputerIssues(draft).map(issue => `• ${issue.label}`))
  for (const question of getComputerQuestions(draft)) {
    const values = getQuoteAnswerValues(draft, question)
    if (values.length) lines.push(`${question.label} ${values.join('; ')}`)
  }
  if (draft.notes.trim()) lines.push('', `Observações: ${draft.notes.trim()}`)
  if (draft.delivery) lines.push('', `Atendimento: ${DELIVERY_LABELS[draft.delivery]}`)
  if (draft.delivery === 'pickup') lines.push(`Bairro: ${draft.neighborhood.trim()}`, `Cidade: ${draft.city.trim()}`, 'Gostaria de confirmar disponibilidade e condições de retirada e entrega.')
  lines.push('', 'Gostaria de consultar a possibilidade de atendimento e orçamento.')
  return lines.join('\n')
}

export const restoreComputerQuoteDraft = (raw: string | null, now = Date.now()): ComputerQuoteDraft | null => {
  if (!raw) return null
  try {
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object' || !Number.isFinite(saved.savedAt) || saved.savedAt > now || now - saved.savedAt > 7200000) return null
    const value = saved.draft
    if (!value || value.version !== 1 || value.category !== 'computador' || value.intent !== 'repair' ||
      !['', ...COMPUTER_KINDS.map(kind => kind.id)].includes(value.kind) || !Array.isArray(value.issueIds) ||
      !value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers)) return null
    const draft = createComputerQuoteDraft()
    for (const key of ['configuration', 'notes', 'neighborhood', 'city'] as const) {
      if (typeof value[key] !== 'string') return null
      draft[key] = value[key].slice(0, key === 'notes' ? 600 : key === 'configuration' ? 300 : 80)
    }
    draft.kind = value.kind
    draft.issueIds = value.issueIds
    draft.answers = value.answers
    draft.delivery = ['store', 'pickup', 'undecided'].includes(value.delivery) ? value.delivery : ''
    return sanitizeComputerQuote(draft)
  } catch { return null }
}
