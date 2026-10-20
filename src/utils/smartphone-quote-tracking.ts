import type { QuoteStep } from '@/types/quote'
import type {} from './metaTracking'
import type {} from './whatsapp'

// Use the Pixel already initialized by index.html; do not install a second one.
export const SMARTPHONE_PIXEL_ID = '1430740015202870'
export const SMARTPHONE_TRACKING_KEY = 'master-prime:smartphone-quote-tracking:v1'
const MAX_AGE = 2 * 60 * 60 * 1000

export const SMARTPHONE_META_EVENTS = {
  quote_viewed: 'SmartphoneQuoteViewed',
  quote_started: 'SmartphoneQuoteStarted',
  quote_step_completed: 'SmartphoneQuoteStepCompleted',
  quote_reviewed: 'SmartphoneQuoteReviewed',
  quote_whatsapp_click: 'SmartphoneQuoteWhatsAppClick',
} as const

type TrackingEvent = keyof typeof SMARTPHONE_META_EVENTS
const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'campaign_id', 'adset_id'] as const
type Attribution = Partial<Record<typeof ATTRIBUTION_KEYS[number], string>>
interface TrackingState {
  version: 1
  attemptId: string
  createdAt: number
  attribution: Attribution
  sent: string[]
}

const cleanAttribution = (params: URLSearchParams): Attribution => {
  const result: Attribution = {}
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key)
    // Campaign slugs and numeric Meta IDs only. Never forward arbitrary query
    // parameters, fbclid, free text, personal details or the WhatsApp message.
    const valid = key === 'utm_content' || key === 'campaign_id' || key === 'adset_id'
      ? /^\d{5,30}$/ : /^[a-z0-9_-]{1,80}$/
    if (value && valid.test(value)) result[key] = value
  }
  return result
}

const eventKey = (event: TrackingEvent, step: QuoteStep) => `${event}:${step + 1}`
const validEventKeys = new Set([
  eventKey('quote_viewed', 0), eventKey('quote_started', 0),
  ...([0, 1, 2, 3] as const).map(step => eventKey('quote_step_completed', step)),
  eventKey('quote_reviewed', 4), eventKey('quote_whatsapp_click', 4),
])

const restoreState = (raw: string | null, now: number): TrackingState | null => {
  if (!raw) return null
  try {
    const state = JSON.parse(raw)
    if (!state || state.version !== 1 || typeof state.attemptId !== 'string' ||
      !/^sq_[a-z0-9-]{8,80}$/.test(state.attemptId) || !Number.isFinite(state.createdAt) ||
      now - state.createdAt > MAX_AGE || state.createdAt > now ||
      !state.attribution || typeof state.attribution !== 'object' || Array.isArray(state.attribution) ||
      !Array.isArray(state.sent)) return null
    const params = new URLSearchParams()
    for (const key of ATTRIBUTION_KEYS) if (typeof state.attribution[key] === 'string') params.set(key, state.attribution[key])
    return { version: 1, attemptId: state.attemptId, createdAt: state.createdAt,
      attribution: cleanAttribution(params), sent: [...new Set<string>(state.sent.filter((key: unknown) => typeof key === 'string' && validEventKeys.has(key)))] }
  } catch { return null }
}

export interface SmartphoneQuoteTracker {
  track: (event: TrackingEvent, step: QuoteStep) => void
}

/** Count each funnel milestone once per attempt, including across refreshes.
 * Storage, tags and ad blockers must never prevent completing the form.
 * No Lead or CAPI event: opening WhatsApp is only an intent to contact.
 */
export const createSmartphoneQuoteTracker = (): SmartphoneQuoteTracker => {
  if (typeof window === 'undefined') return { track: () => {} }
  let state: TrackingState | null = null
  let incoming: Attribution = {}
  const now = Date.now()
  try { state = restoreState(window.sessionStorage.getItem(SMARTPHONE_TRACKING_KEY), now) } catch { /* Storage can be disabled. */ }
  try { incoming = cleanAttribution(new URLSearchParams(window.location.search)) } catch { /* Ignore invalid location data. */ }
  // An explicit new campaign/ad starts its own attempt. An untagged refresh or
  // return to this form keeps the original attribution for at most two hours.
  if (state && ATTRIBUTION_KEYS.some(key => incoming[key] && incoming[key] !== state!.attribution[key])) state = null
  const current: TrackingState = state ?? {
    version: 1, attemptId: `sq_${window.crypto?.randomUUID?.() ?? `${now.toString(36)}-${Math.random().toString(36).slice(2)}`}`,
    createdAt: now, attribution: incoming, sent: [],
  }
  const save = () => {
    try { window.sessionStorage.setItem(SMARTPHONE_TRACKING_KEY, JSON.stringify(current)) } catch { /* Memory-only tracking still works. */ }
  }
  save()

  return { track: (event, step) => {
    const key = eventKey(event, step)
    if (!validEventKeys.has(key) || current.sent.includes(key)) return
    current.sent.push(key)
    save()
    const attribution = current.attribution
    // Empty defaults also clear stale GTM data-model values from other events.
    const properties = {
      quote_category: 'celular', quote_step: step + 1,
      quote_attempt_id: current.attemptId,
      quote_source: attribution.utm_source ?? 'unattributed',
      quote_medium: attribution.utm_medium ?? 'unattributed',
      quote_campaign: attribution.utm_campaign ?? '',
      quote_ad_id: attribution.utm_content ?? '',
      quote_campaign_id: attribution.campaign_id ?? '',
      quote_adset_id: attribution.adset_id ?? '',
    }
    const eventId = `${current.attemptId}_${event}_${step + 1}`
    try {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event, ...properties, event_id: eventId, quote_tracking_version: 1 })
    } catch { /* An unavailable analytics tag must not block WhatsApp. */ }
    try {
      window.fbq?.('trackSingleCustom', SMARTPHONE_PIXEL_ID, SMARTPHONE_META_EVENTS[event], properties, { eventID: eventId })
    } catch { /* Pixel may be blocked or disabled. */ }
  } }
}
