export interface CatalogModel {
  id: string
  brandId: string
  name: string
  aliases: string[]
  source: string
}

export interface NotebookCatalog {
  version: 1
  updatedAt: string
  source: string
  brands?: { id: string; name: string; file: string; compressedFile?: string; count: number }[]
  license?: string
  models: CatalogModel[]
}

export interface QuoteQuestion {
  id: string
  label: string
  options: readonly string[]
  multiple?: boolean
}

export interface QuoteIssue {
  id: string
  label: string
  hint: string
  kind: 'symptom' | 'request'
  questions: readonly QuoteQuestion[]
}

export interface QuoteDraft {
  version: 1
  category: 'notebook'
  brandId: string
  customBrand: string
  model: string
  modelUnknown: boolean
  issueIds: string[]
  answers: Record<string, string | string[]>
  notes: string
  delivery: '' | 'store' | 'pickup' | 'undecided'
  neighborhood: string
  city: string
}

export type QuoteStep = 0 | 1 | 2 | 3 | 4
