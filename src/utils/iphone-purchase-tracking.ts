import { IPHONE_CATALOG_VERSION, IPHONE_JOURNEY_VERSION, IPHONE_MAX_AGE } from '@/data/iphone-purchase'
import type { IPhoneScreen, IPhoneSelection } from '@/types/iphone-purchase'
import { getIPhoneVariant, iPhoneSelectionKey, normalizeIPhoneSelection } from './iphone-purchase'
import { getIPhoneInstallmentPlan } from './iphone-pricing'
import type {} from './metaTracking'
import type {} from './whatsapp'

export const IPHONE_PIXEL_ID = '1430740015202870'
export const IPHONE_TRACKING_KEY = 'master-prime:iphone-purchase-tracking:v1'
export const IPHONE_EVENTS = {
  viewed: 'IPhonePurchaseQuoteViewed', started: 'IPhonePurchaseQuoteStarted', step: 'IPhonePurchaseQuoteStepCompleted',
  reviewed: 'IPhonePurchaseQuoteReviewed', whatsapp: 'IPhonePurchaseQuoteWhatsAppClick',
} as const
type Event = keyof typeof IPHONE_EVENTS
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'campaign_id', 'adset_id'] as const
type Attribution = Partial<Record<typeof KEYS[number], string>>
const SCREENS: readonly IPhoneScreen[] = ['product', 'payment', 'review']
const MILESTONES = new Set([
  'viewed', 'started', 'reviewed', 'whatsapp',
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
interface PendingPixel { event: Event; selection: IPhoneSelection; screen?: IPhoneScreen; catalogVersion: string }
interface State { version: 1; attemptId: string; createdAt: number; initial: IPhoneSelection; attribution: Attribution; sent: string[]; pixelPending: Record<string, PendingPixel> }
export interface IPhonePurchaseTracker {
  attemptId: string
  resume: () => void
  dispose: () => void
  track: (event: Event, selection: IPhoneSelection, screen?: IPhoneScreen) => void
}

export const createIPhonePurchaseTracker = (initial: IPhoneSelection): IPhonePurchaseTracker => {
  if (typeof window === 'undefined') return { attemptId: '', track: () => {}, resume: () => {}, dispose: () => {} }
  const now = Date.now()
  let incoming: Attribution = {}
  try { incoming = cleanIPhoneAttribution(new URLSearchParams(window.location.search)) } catch { /* Invalid location is ignored. */ }
  // Persist only normalized milestone descriptors. Rebuild allowlisted telemetry on replay.
  const restorePending = (raw: unknown): Record<string, PendingPixel> => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const result: Record<string, PendingPixel> = {}
    for (const [key, entry] of Object.entries(raw)) {
      const p = entry as Partial<PendingPixel> | null
      if (!p || !Object.prototype.hasOwnProperty.call(IPHONE_EVENTS, p.event ?? '') || !p.selection || typeof p.selection !== 'object' || Array.isArray(p.selection) || p.catalogVersion !== IPHONE_CATALOG_VERSION) continue
      const screen = SCREENS.includes(p.screen as IPhoneScreen) ? p.screen : undefined
      if (!MILESTONES.has(key) || key !== (p.event === 'step' ? `step:${screen}` : p.event)) continue
      result[key] = { event: p.event as Event, selection: normalizeIPhoneSelection(p.selection), screen, catalogVersion: IPHONE_CATALOG_VERSION }
    }
    return result
  }
  let restored: State | null = null
  try {
    const s = JSON.parse(window.sessionStorage.getItem(IPHONE_TRACKING_KEY) ?? 'null')
    if (s?.version === 1 && /^ip_[a-z0-9-]{8,80}$/.test(s.attemptId) && Number.isFinite(s.createdAt) && s.createdAt <= now && now - s.createdAt <= IPHONE_MAX_AGE && s.initial && typeof s.initial === 'object' && s.attribution && typeof s.attribution === 'object' && !Array.isArray(s.attribution) && Array.isArray(s.sent)) {
      const params = new URLSearchParams()
      for (const key of KEYS) if (typeof s.attribution[key] === 'string') params.set(key, s.attribution[key])
      restored = { version: 1, attemptId: s.attemptId, createdAt: s.createdAt, initial: normalizeIPhoneSelection(s.initial), attribution: cleanIPhoneAttribution(params), pixelPending: restorePending(s.pixelPending), sent: [...new Set<string>(s.sent.filter((key: unknown) => typeof key === 'string' && MILESTONES.has(key)))] }
    }
  } catch { /* Use memory if persistence is blocked. */ }
  if (restored && KEYS.some(key => incoming[key] && incoming[key] !== restored!.attribution[key])) restored = null
  const state: State = restored ?? {
    version: 1, attemptId: `ip_${window.crypto?.randomUUID?.() ?? `${now.toString(36)}-${Math.random().toString(36).slice(2)}`}`,
    createdAt: now, initial: normalizeIPhoneSelection(initial), attribution: incoming, sent: [], pixelPending: {},
  }
  const save = () => { try { window.sessionStorage.setItem(IPHONE_TRACKING_KEY, JSON.stringify(state)) } catch { /* No persistent deduplication without storage. */ } }
  save()
  let timer: number | undefined
  let retries = 0
  let active = false
  let replaying = false
  const clearTimer = () => { if (timer !== undefined) window.clearTimeout(timer); timer = undefined }
  const sdkReady = () => typeof (window.fbq as (NonNullable<typeof window.fbq> & { callMethod?: unknown }) | undefined)?.callMethod === 'function'
  const flush = () => {
    if (!active || !sdkReady()) return
    replaying = true
    try { for (const p of Object.values(state.pixelPending)) tracker.track(p.event, p.selection, p.screen) }
    finally { replaying = false }
  }
  const schedule = () => {
    if (!active || timer !== undefined || retries >= 40 || !Object.keys(state.pixelPending).length) return
    timer = window.setTimeout(() => { timer = undefined; retries++; flush(); schedule() }, 500)
  }
  const tracker: IPhonePurchaseTracker = { attemptId: state.attemptId, resume: () => resume(), dispose: () => dispose(), track: (event, selection, screen) => {
    if (!active) return
    const key = event === 'step' ? `step:${screen}` : event
    if (!MILESTONES.has(key) || !Object.prototype.hasOwnProperty.call(IPHONE_EVENTS, event)) return
    // Each actual interaction gets a fresh bounded retry window. Timer retries do not reset it.
    if (!replaying) { clearTimer(); retries = 0 }
    const recorded = state.sent.includes(key)
    const pending = state.pixelPending[key]
    if (recorded && !pending) { schedule(); return }
    const cleanSelection = normalizeIPhoneSelection(pending?.selection ?? selection)
    screen = pending?.screen ?? screen
    if (!recorded) state.sent.push(key) // dataLayer deduplication, NOT proof of Meta receipt.
    state.pixelPending[key] = { event, selection: cleanSelection, screen, catalogVersion: IPHONE_CATALOG_VERSION }
    save()
    const variant = getIPhoneVariant(cleanSelection)
    const a = state.attribution
    // Explicit allowlist: never spread the draft, triage answers or a message into telemetry.
    // null/empty defaults clear GTM data-model values left by earlier offers.
    const properties = {
      quote_category: 'iphone_purchase', quote_tracking_version: 1, quote_journey_version: IPHONE_JOURNEY_VERSION, quote_attempt_id: state.attemptId,
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
    if (!recorded) try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: IPHONE_EVENTS[event], ...properties, event_id: eventId }) } catch { /* Analytics failures cannot block the flow. */ }
    if (sdkReady()) {
      try {
        window.fbq!('trackSingleCustom', IPHONE_PIXEL_ID, IPHONE_EVENTS[event], properties, { eventID: eventId })
        delete state.pixelPending[key] // Accepted by SDK; receipt remains unknown.
        save()
      } catch { /* Leave pending, without blocking the WhatsApp handoff. */ }
    }
    schedule()
  } }
  const onVisible = () => { if (document.visibilityState === 'visible') resume() }
  const resume = () => {
    if (!active) {
      active = true
      window.addEventListener('pageshow', resume)
      document.addEventListener('visibilitychange', onVisible)
      window.addEventListener('pagehide', clearTimer)
    }
    clearTimer(); retries = 0; flush(); schedule()
  }
  const dispose = () => {
    active = false
    clearTimer()
    window.removeEventListener('pageshow', resume)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('pagehide', clearTimer)
  }
  resume()
  return tracker
}
