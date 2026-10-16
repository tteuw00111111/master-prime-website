import type { QuoteDraft } from './quote'

export type ComputerKind = '' | 'desktop' | 'pc-gamer' | 'unknown'

// Future extension: 'build' will get its own questions and validation for
// “Montar PC gamer”. Until then, only repair is accepted or exposed.
export type ComputerQuoteIntent = 'repair'

export interface ComputerQuoteDraft {
  version: 1
  category: 'computador'
  intent: ComputerQuoteIntent
  kind: ComputerKind
  configuration: string
  issueIds: string[]
  answers: Record<string, string | string[]>
  notes: string
  delivery: QuoteDraft['delivery']
  neighborhood: string
  city: string
}
