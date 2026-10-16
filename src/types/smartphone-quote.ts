import type { QuoteDraft } from './quote'

export interface SmartphoneQuoteDraft {
  version: 1
  category: 'celular'
  brandId: string
  customBrand: string
  model: string
  modelUnknown: boolean
  issueIds: string[]
  answers: Record<string, string | string[]>
  notes: string
  delivery: QuoteDraft['delivery']
  neighborhood: string
  city: string
}
