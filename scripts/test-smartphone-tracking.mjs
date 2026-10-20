import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { resolve } from 'node:path'

const result = await build({ entryPoints: [resolve(import.meta.dirname, '../src/utils/smartphone-quote-tracking.ts')], bundle: true, platform: 'node', format: 'esm', write: false })
const tracking = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
const { createSmartphoneQuoteTracker, SMARTPHONE_TRACKING_KEY, SMARTPHONE_PIXEL_ID } = tracking
const query = '?utm_source=ig&utm_medium=paid_social&utm_campaign=p02_site_celular&utm_content=52525703380760&campaign_id=52508866158360&adset_id=52525703381760'

const browser = (search = query) => {
  const values = new Map()
  const calls = []
  return {
    dataLayer: [], location: { search }, fbq: (...args) => calls.push(args), calls,
    crypto: globalThis.crypto,
    sessionStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
  }
}
const withBrowser = (mock, run) => {
  const before = globalThis.window
  globalThis.window = mock
  try { run(mock) } finally { if (before === undefined) delete globalThis.window; else globalThis.window = before }
}

test('funnel milestones use one attempt and one Pixel event per action despite retries', () => withBrowser(browser(), mock => {
  const tracker = createSmartphoneQuoteTracker()
  for (const [event, step] of [['quote_viewed', 0], ['quote_started', 0], ['quote_step_completed', 0], ['quote_step_completed', 1], ['quote_step_completed', 2], ['quote_step_completed', 3], ['quote_reviewed', 4], ['quote_whatsapp_click', 4]]) {
    tracker.track(event, step)
    tracker.track(event, step)
  }
  assert.equal(mock.dataLayer.length, 8)
  assert.equal(mock.calls.length, 8)
  assert.equal(new Set(mock.dataLayer.map(event => event.quote_attempt_id)).size, 1)
  assert.equal(new Set(mock.dataLayer.map(event => event.event_id)).size, 8)
  for (const [index, call] of mock.calls.entries()) {
    assert.equal(call[0], 'trackSingleCustom')
    assert.equal(call[1], SMARTPHONE_PIXEL_ID)
    assert.notEqual(call[2], 'Lead')
    assert.equal(call[4].eventID, mock.dataLayer[index].event_id)
  }
  assert.equal(mock.calls.at(-1)[2], 'SmartphoneQuoteWhatsAppClick')
  tracker.track('quote_whatsapp_click', 1)
  assert.equal(mock.calls.length, 8, 'invalid milestones are ignored')
}))

test('reload and untagged return preserve attribution and do not recount completed milestones', () => withBrowser(browser(), mock => {
  const first = createSmartphoneQuoteTracker()
  first.track('quote_viewed', 0)
  first.track('quote_started', 0)
  const attempt = mock.dataLayer[0].quote_attempt_id
  mock.location.search = ''
  const reloaded = createSmartphoneQuoteTracker()
  reloaded.track('quote_viewed', 0)
  reloaded.track('quote_started', 0)
  reloaded.track('quote_whatsapp_click', 4)
  assert.equal(mock.dataLayer.length, 3)
  assert.equal(mock.dataLayer.at(-1).quote_attempt_id, attempt)
  assert.equal(mock.dataLayer.at(-1).quote_source, 'ig')
  assert.equal(mock.dataLayer.at(-1).quote_ad_id, '52525703380760')
}))

test('a different ad starts a new attempt without attributing it to the previous ad', () => withBrowser(browser(), mock => {
  createSmartphoneQuoteTracker().track('quote_viewed', 0)
  mock.location.search = query.replace('52525703380760', '52525703380761')
  createSmartphoneQuoteTracker().track('quote_viewed', 0)
  const [first, second] = mock.dataLayer
  assert.notEqual(second.quote_attempt_id, first.quote_attempt_id)
  assert.equal(second.quote_ad_id, '52525703380761')
}))

test('malformed, expired and future storage cannot inject tracking properties', () => {
  for (const raw of ['{', 'null', '{}', JSON.stringify({ version: 1, attemptId: 'sq_123456789', createdAt: Date.now() - 7200001, attribution: { utm_source: 'old' }, sent: [] }), JSON.stringify({ version: 1, attemptId: 'sq_123456789', createdAt: Date.now() + 60000, attribution: {}, sent: [] })]) {
    withBrowser(browser(''), mock => {
      mock.sessionStorage.setItem(SMARTPHONE_TRACKING_KEY, raw)
      createSmartphoneQuoteTracker().track('quote_viewed', 0)
      assert.equal(mock.dataLayer[0].quote_source, 'unattributed')
      assert.notEqual(mock.dataLayer[0].quote_attempt_id, 'sq_123456789')
    })
  }
})

test('tracking excludes query PII, messages, URLs and unrecognized parameters', () => withBrowser(browser('?utm_source=ig&utm_medium=paid_social&utm_campaign=alice%40example.com&utm_content=Meu+celular+quebrou&phone=5521999999999&text=privado&fbclid=click_secret&model=iPhone'), mock => {
  createSmartphoneQuoteTracker().track('quote_whatsapp_click', 4)
  const payload = mock.dataLayer[0]
  assert.equal(payload.quote_source, 'ig')
  assert.equal(payload.quote_campaign, '')
  assert.equal(payload.quote_ad_id, '')
  assert.doesNotMatch(JSON.stringify([mock.dataLayer, mock.calls]), /alice|example|privado|999999|secret|iPhone|https|text=/)
  assert.doesNotMatch(mock.sessionStorage.getItem(SMARTPHONE_TRACKING_KEY), /alice|example|privado|999999|secret|iPhone/)
}))

test('storage and unavailable or throwing tags never prevent the caller continuing', () => withBrowser(browser(), mock => {
  mock.sessionStorage = { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('blocked') } }
  mock.fbq = () => { throw Error('pixel blocked') }
  mock.dataLayer = { push: () => { throw Error('tag failed') } }
  const tracker = createSmartphoneQuoteTracker()
  assert.doesNotThrow(() => tracker.track('quote_whatsapp_click', 4))
  delete mock.fbq
  mock.dataLayer = []
  assert.doesNotThrow(() => tracker.track('quote_started', 0))
  assert.equal(mock.dataLayer.length, 1)
}))

test('server rendering does not access browser globals', () => {
  const before = globalThis.window
  delete globalThis.window
  try { assert.doesNotThrow(() => createSmartphoneQuoteTracker().track('quote_viewed', 0)) }
  finally { if (before !== undefined) globalThis.window = before }
})
