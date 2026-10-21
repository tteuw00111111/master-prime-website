// Local-only regression: Meta is replaced with an observer, never a real Pixel.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'QA must use localhost')
const evidence = resolve('.cache/iphone-fbclid')
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined })
const clickId = 'IwQA_MixedCase-Click_99000000000001'
const report = { checks: [], errors: [] }
const observer = `(() => {
  window.__qaMetaLoaded = true;
  const observe = () => {
    if (window.__qaConsentGranted) window.__qaObserved.push(location.href);
  };
  window.__qaGrantConsent = () => { window.__qaConsentGranted = true; observe(); };
  window.fbq.callMethod = (...args) => { window.__qaPixelCalls.push(args); observe(); };
  const queued = window.fbq.queue.splice(0);
  for (const args of queued) window.fbq.callMethod(...args);
})();`
const attribution = { utm_source: 'ig', utm_medium: 'paid_social', utm_campaign: 'qa_iphone_site', utm_content: '99000000000001', campaign_id: '99000000000002', adset_id: '99000000000003' }
const cases = [
  { name: 'catalog-navigation', clickId, hub: true },
  { name: 'slow-pixel', clickId, delayed: true },
  { name: 'delayed-consent', clickId, consent: true },
  { name: 'blocked-pixel-and-storage', clickId, blocked: true, storageBlocked: true },
  { name: 'no-click-id', clickId: null },
  { name: 'invalid-click-id', clickId: 'private@example.com' },
]
try {
  for (const scenario of cases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    let releasePixel
    const gate = new Promise(resolve => { releasePixel = resolve })
    const pixelRequests = []
    await context.route('**/*', async route => {
      const url = new URL(route.request().url())
      if (['localhost', '127.0.0.1'].includes(url.hostname)) return route.continue()
      if (url.hostname === 'connect.facebook.net' && url.pathname.endsWith('/fbevents.js')) {
        pixelRequests.push(url.href)
        if (scenario.blocked) return route.abort('blockedbyclient')
        if (scenario.delayed) await gate
        return route.fulfill({ contentType: 'application/javascript', body: observer })
      }
      return route.fulfill({ contentType: 'application/javascript', body: '' })
    })
    await context.addInitScript(({ consent, storageBlocked }) => {
      window.__qaConsentGranted = !consent
      window.__qaObserved = []; window.__qaPixelCalls = []; window.__qaCookieWrites = []
      window.open = url => { window.__qaOpened = url; return null }
      Object.defineProperty(navigator, 'deviceMemory', { value: 2 })
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__qaCopied = text } } })
      const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
      Object.defineProperty(document, 'cookie', { get: () => cookie.get.call(document), set: value => { window.__qaCookieWrites.push(value); cookie.set.call(document, value) } })
      if (storageBlocked) Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('QA blocked storage', 'SecurityError') } })
    }, { consent: !!scenario.consent, storageBlocked: !!scenario.storageBlocked })
    const page = await context.newPage()
    page.on('pageerror', error => report.errors.push(`${scenario.name}: ${error.message}`))
    const params = new URLSearchParams({ ...attribution, notes: 'PRIVATE_TRIAGE_NOTE', battery: '87', repairs: 'PRIVATE_REPAIR', email: 'private@example.com', message: 'PRIVATE_MESSAGE' })
    if (!scenario.hub) { params.set('model', 'iphone-17-pro-max'); params.set('capacity', '256'); params.set('condition', 'sealed') }
    if (scenario.clickId !== null) params.set('fbclid', scenario.clickId)
    const expectedClickId = scenario.clickId === clickId ? clickId : null
    const assertURL = async () => {
      const url = new URL(page.url())
      assert.equal(url.searchParams.get('fbclid'), expectedClickId)
      for (const [key, value] of Object.entries(attribution)) assert.equal(url.searchParams.get(key), value)
      assert.equal(url.hash, '')
      assert.doesNotMatch(url.search, /PRIVATE|battery|repairs|email|message/)
    }
    const ready = () => page.waitForFunction(() => document.querySelector('.quote-next')?.disabled === false)
    const button = name => page.getByRole('button', { name, exact: true })
    const next = () => page.locator('.quote-next').click()
    await page.goto(`${base}/orcamento/iphone?${params}#PRIVATE_HASH`, { waitUntil: 'domcontentloaded' })
    if (scenario.hub) {
      const offer = page.getByRole('link', { name: 'Ver opções de iPhone 17 Pro Max lacrado', exact: true })
      await page.waitForFunction(id => [...document.querySelectorAll('.catalog-product-action')].every(link => new URL(link.href).searchParams.get('fbclid') === id), clickId)
      // The real href also retains the ID for opening an offer in another tab.
      assert.equal(new URL(await offer.getAttribute('href'), base).searchParams.get('fbclid'), clickId)
      await button('Copiar link do catálogo').click()
      assert.equal(await page.evaluate(() => window.__qaCopied), 'https://master-prime.com/orcamento/iphone')
      await offer.click(); await ready(); await assertURL()
      await page.getByRole('link', { name: 'Ver todos os iPhones', exact: true }).click()
      await page.locator('.iphone-catalog').waitFor(); await assertURL()
      await page.getByRole('link', { name: 'Ver opções de iPhone 17 Pro Max lacrado', exact: true }).click()
    }
    await ready(); await assertURL()
    await page.locator('.iphone-color').filter({ hasText: 'Laranja' }).click()
    await next(); await button('À vista').click(); await button('Pix').click(); await next()
    await button('Copiar resumo').click()
    const message = await page.evaluate(() => window.__qaCopied)
    assert.doesNotMatch(message, /fbclid|IwQA|PRIVATE|utm_/)
    if (scenario.delayed) {
      assert.equal(await page.evaluate(() => window.__qaMetaLoaded), undefined)
      releasePixel()
    }
    if (!scenario.blocked) {
      await page.waitForFunction(() => window.__qaMetaLoaded)
      if (scenario.consent) {
        assert.deepEqual(await page.evaluate(() => window.__qaObserved), [])
        await assertURL()
        // Simulate deferred permission only; this is not a real CMP/Meta test.
        await page.evaluate(() => window.__qaGrantConsent())
      }
      const observed = await page.evaluate(() => window.__qaObserved)
      assert(observed.length > 0)
      for (const observedURL of observed) {
        const parsed = new URL(observedURL)
        assert.equal(parsed.searchParams.get('fbclid'), expectedClickId)
        assert.doesNotMatch(parsed.search, /PRIVATE|battery|repairs|email|message/)
      }
      const pixel = await page.evaluate(() => window.__qaPixelCalls)
      assert(pixel.some(args => args[0] === 'set' && args[1] === 'autoConfig' && args[2] === false))
      assert.equal(pixel.filter(args => args[0] === 'init').length, 1)
    }
    await button('Continuar no WhatsApp').click()
    await button('Abrir novamente').click()
    const opened = await page.evaluate(() => window.__qaOpened)
    assert.equal(new URL(opened).searchParams.get('text'), message)
    assert.doesNotMatch(opened, /fbclid|IwQA|PRIVATE/)
    const events = await page.evaluate(() => window.dataLayer.filter(event => /^IPhonePurchaseQuote|^IPhoneTradeIn/.test(event.event)))
    assert.equal(events.filter(event => event.event === 'IPhonePurchaseQuoteWhatsAppClick').length, 1)
    assert.equal(new Set(events.map(event => event.event_id)).size, events.length)
    assert(events.every(event => event.quote_initial_product === 'iphone-17-pro-max:256:sealed' && event.quote_source === 'ig' && !('value' in event)))
    const customCalls = await page.evaluate(() => (window.__qaPixelCalls || []).filter(args => args[0] === 'trackSingleCustom'))
    assert.doesNotMatch(JSON.stringify({ events, customCalls }), /fbclid|IwQA|PRIVATE|Lead"|Purchase"/)
    assert.deepEqual(await page.evaluate(() => window.__qaCookieWrites), [])
    assert.equal((await context.cookies()).some(cookie => cookie.name === '_fbc'), false)
    if (!scenario.storageBlocked) {
      assert.doesNotMatch(await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage))), /fbclid|IwQA|PRIVATE/)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
      const restored = await page.evaluate(() => window.dataLayer.filter(event => /^IPhonePurchaseQuote/.test(event.event)))
      assert.deepEqual(restored, [], 'refresh preserves milestone deduplication')
      await assertURL()
    }
    assert.equal(pixelRequests.length > 0, true)
    await context.close()
    report.checks.push(`${scenario.name}: intact URL attribution, private-query removal, usable quote/WhatsApp, no synthetic cookies or custom-ID payload, deduplication`)
  }
  assert.deepEqual(report.errors, [])
  await writeFile(resolve(evidence, 'attribution-report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
