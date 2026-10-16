export interface PcBuildQuoteDraft {
  version: 1
  category: 'montagem-pc'
  intent: 'build'
  mode: '' | 'complete' | 'partial' | 'assembly'
  purpose: '' | 'gaming' | 'work' | 'both'
  ownedParts: string
  budgetCents: number | null
  budgetUndecided: boolean
  budgetScope: '' | 'pc' | 'setup' | 'unsure'
  peripheralIds: string[]
  gameIds: string[]
  customGames: string[]
  gamesUndecided: boolean
  programIds: string[]
  customPrograms: string[]
  programsUndecided: boolean
  objective: string
  personalize: boolean
  resolution: '' | '1080p' | '1440p' | '4k' | 'unsure'
  targetFps: '' | '60' | '120' | '144' | '240' | 'custom' | 'unsure'
  customFps: string
  guidanceRequested: boolean
  graphics: '' | 'competitive' | 'balanced' | 'quality' | 'unsure'
  workload: string
  priorityIds: string[]
  gpu: '' | 'nvidia' | 'amd' | 'best-fit' | 'guidance'
  cpu: '' | 'amd' | 'intel' | 'best-fit' | 'guidance'
  caseColor: '' | 'black' | 'white' | 'any'
  lighting: '' | 'rgb' | 'none' | 'any'
  connectivityIds: string[]
  horizon: '' | 'soon' | 'month' | 'researching' | 'unsure'
  notes: string
  fulfillment: '' | 'store' | 'delivery' | 'undecided'
  neighborhood: string
  city: string
}

export interface PcCatalogItem {
  id: string
  name: string
  aliases?: string[]
  image?: string
  source?: string
  tone?: string
}

export interface PcBudgetReference {
  id: string
  gameId: string
  resolution: PcBuildQuoteDraft['resolution']
  graphics: PcBuildQuoteDraft['graphics']
  targetFps: number
  minimumBudgetCents: number
  source: string
  reviewedAt: string
  validUntil: string
}

export interface PcFeasibilityNotice {
  kind: 'review' | 'context'
  title: string
  message: string
  referenceId?: string
}
