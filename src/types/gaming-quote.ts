import type { CatalogModel, QuoteDraft } from './quote'

export type GamingDeviceKind = 'console' | 'controller'
export type GamingPlatform = '' | 'playstation' | 'xbox' | 'unknown'
export type GamingQuoteMode = '' | GamingDeviceKind | 'both'

export interface GamingDeviceDraft {
  platform: GamingPlatform
  model: string
  modelUnknown: boolean
  issueIds: string[]
  answers: Record<string, string | string[]>
}

export interface GamingQuoteDraft {
  version: 1
  category: 'videogame'
  mode: GamingQuoteMode
  console: GamingDeviceDraft
  controller: GamingDeviceDraft
  notes: string
  delivery: QuoteDraft['delivery']
  neighborhood: string
  city: string
}

export interface GamingCatalogModel extends CatalogModel {
  device: GamingDeviceKind
  /** Only exact, unambiguous drive-less models set this to false. */
  discDrive?: false
}
