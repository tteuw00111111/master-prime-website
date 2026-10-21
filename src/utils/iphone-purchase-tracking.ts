import { IPHONE_CATALOG_VERSION, IPHONE_MAX_AGE } from '@/data/iphone-purchase'
import type { IPhoneScreen, IPhoneSelection } from '@/types/iphone-purchase'
import { getIPhoneVariant, iPhoneSelectionKey, normalizeIPhoneSelection } from './iphone-purchase'
import { getIPhoneInstallmentPlan } from './iphone-pricing'
import type {} from './metaTracking'
import type {} from './whatsapp'

export const IPHONE_PIXEL_ID = '1430740015202870'
export const IPHONE_TRACKING_KEY = 'master-prime:iphone-purchase-tracking:v1'
export const IPHONE_EVENTS = {
  viewed: 'IPhonePurchaseQuoteViewed', started: 'IPhonePurchaseQuoteStarted', step: 'IPhonePurchaseQuoteStepCompleted',
  tradeStarted: 'IPhoneTradeInStarted', tradeCompleted: 'IPhoneTradeInCompleted',
  reviewed: 'IPhonePurchaseQuoteReviewed', whatsapp: 'IPhonePurchaseQuoteWhatsAppClick',
} as const
type Event = keyof typeof IPHONE_EVENTS
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'campaign_id', 'adset_id'] as const
type Attribution = Partial<Record<typeof KEYS[number], string>>
const SCREENS: readonly IPhoneScreen[] = ['product', 'payment', 'timing', 'trade', 'device', 'condition', 'history', 'review']
const MILESTONES = new Set([
  'viewed', 'started', 'tradeStarted', 'tradeCompleted', 'reviewed', 'whatsapp',
  ...SCREENS.filter(s => s !== 'review').map(s => `step:${s}`),
])
export const cleanIPhoneAttribution = (params: URLSearchParams): Attribution => {
  const result: Attribution = {}
  for (const key of KEYS) {
    const v = params.get(key)
    if (v && (['utm_content', 'campaign_id', 'adset_id'].includes(key) ? /^\d{5,30}$/ : /^[a-z0-9_-]{1,80}$/).test(v)) result[key] = v
  }
  return result
}
interface State { version: 1; attemptId: string; createdAt: number; initial: IPhoneSelection; attribution: Attribution; sent: string[] }
export interface IPhonePurchaseTracker {
  attemptId: string
  track: (event: Event, selection: IPhoneSelection, screen?: IPhoneScreen) => void
}

export const createIPhonePurchaseTracker = (initial: IPhoneSelection): IPhonePurchaseTracker => {
  if (typeof window === 'undefined') return { attemptId: '', track: () => {} }
  const now = Date.now()
  let incoming: Attribution = {}
  try { incoming = cleanIPhoneAttribution(new URLSearchParams(window.location.search)) } catch { /* Invalid location is ignored. */ }
  let restored: State | null = null
  try {
    const s = JSON.parse(window.sessionStorage.getItem(IPHONE_TRACKING_KEY) ?? 'null')
    if (s?.version === 1 && /^ip_[a-z0-9-]{8,80}$/.test(s.attemptId) && Number.isFinite(s.createdAt) && s.createdAt <= now && now - s.createdAt <= IPHONE_MAX_AGE && s.initial && typeof s.initial === 'object' && s.attribution && typeof s.attribution === 'object' && !Array.isArray(s.attribution) && Array.isArray(s.sent)) {
      const params = new URLSearchParams()
      for (const key of KEYS) if (typeof s.attribution[key] === 'string') params.set(key, s.attribution[key])
      restored = { version: 1, attemptId: s.attemptId, createdAt: s.createdAt, initial: normalizeIPhoneSelection(s.initial), attribution: cleanIPhoneAttribution(params), sent: [...new Set<string>(s.sent.filter((key: unknown) => typeof key === 'string' && MILESTONES.has(key)))] }
    }
  } catch { /* Use memory if persistence is blocked. */ }
  if (restored && KEYS.some(key => incoming[key] && incoming[key] !== restored!.attribution[key])) restored = null
  const state: State = restored ?? {
    version: 1, attemptId: `ip_${window.crypto?.randomUUID?.() ?? `${now.toString(36)}-${Math.random().toString(36).slice(2)}`}`,
    createdAt: now, initial: normalizeIPhoneSelection(initial), attribution: incoming, sent: [],
  }
  const save = () => { try { window.sessionStorage.setItem(IPHONE_TRACKING_KEY, JSON.stringify(state)) } catch { /* No persistent deduplication without storage. */ } }
  save()
  return { attemptId: state.attemptId, track: (event, selection, screen) => {
    const key = event === 'step' ? `step:${screen}` : event
    if (!MILESTONES.has(key) || state.sent.includes(key) || !Object.prototype.hasOwnProperty.call(IPHONE_EVENTS, event)) return
    state.sent.push(key)
    save()
    const cleanSelection = normalizeIPhoneSelection(selection)
    const variant = getIPhoneVariant(cleanSelection)
    const a = state.attribution
    // Explicit allowlist: never spread the draft, triage answers or a message into telemetry.
    // null/empty defaults clear GTM data-model values left by earlier offers.
    const properties = {
      quote_category: 'iphone_purchase', quote_tracking_version: 1, quote_attempt_id: state.attemptId,
      quote_step: screen && SCREENS.includes(screen) ? screen : '',
      quote_initial_product: iPhoneSelectionKey(state.initial), quote_selected_product: iPhoneSelectionKey(cleanSelection),
      quote_variant_id: variant?.id ?? '', catalog_version: IPHONE_CATALOG_VERSION,
      catalog_cash_value: variant ? variant.cashCents / 100 : null,
      catalog_installment_value: variant ? variant.installmentCents / 100 : null,
      catalog_installment_count: variant ? 12 : null,
      catalog_installment_total: variant ? getIPhoneInstallmentPlan(variant.cashCents).totalCents / 100 : null,
      currency: variant ? 'BRL' : '',
      quote_source: a.utm_source ?? 'unattributed', quote_medium: a.utm_medium ?? 'unattributed',
      quote_campaign: a.utm_campaign ?? '', quote_ad_id: a.utm_content ?? '', quote_campaign_id: a.campaign_id ?? '', quote_adset_id: a.adset_id ?? '',
    }
    const eventId = `${state.attemptId}_${key.replace(':', '_')}`
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: IPHONE_EVENTS[event], ...properties, event_id: eventId }) } catch { /* Analytics failures cannot block the flow. */ }
    try { window.fbq?.('trackSingleCustom', IPHONE_PIXEL_ID, IPHONE_EVENTS[event], properties, { eventID: eventId }) } catch { /* Respect blocked/unavailable Pixel. */ }
  } }
}
