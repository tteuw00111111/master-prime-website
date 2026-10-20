import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const base = process.env.QUOTE_QA_BASE ?? 'http://127.0.0.1:4178'
const query = '?utm_source=ig&utm_medium=paid_social&utm_campaign=p02_site_celular&utm_content=52600000000001&campaign_id=52600000000002&adset_id=52600000000003'
const results = []
const trackingKey = 'master-prime:smartphone-quote-tracking:v1'
const draftKey = 'master-prime:smartphone-quote:v1'
const expectedNames = ['quote_viewed', 'quote_started', 'quote_step_completed', 'quote_step_completed', 'quote_step_completed', 'quote_step_completed', 'quote_reviewed', 'quote_whatsapp_click']

const instrument = async (context, blocked = false) => {
  // No analytics requests, external navigation or real messages during QA.
  await context.route('https://**/*', route => route.abort())
  await context.addInitScript(({ blocked }) => {
    window.pixelCalls = []
    window.openedQuotes = []
    window.fbq = (...args) => {
      if (blocked && args[0] === 'trackSingleCustom') throw Error('Tag unavailable')
      window.pixelCalls.push(args)
    }
    window.open = url => { window.openedQuotes.push(url); return null }
    if (blocked) for (const method of ['getItem', 'setItem', 'removeItem']) Storage.prototype[method] = () => { throw Error('Storage unavailable') }
  }, { blocked })
}

const harness = page => {
  const ready = screen => page.waitForFunction(expected => document.querySelector('.quote-form')?.dataset.screen === expected && document.querySelector('.quote-form')?.getAttribute('aria-busy') === 'false', screen)
  const click = name => page.getByRole('button', { name, exact: name !== 'Levar à loja' }).click()
  const next = async screen => { await page.locator('.quote-next:not([disabled])').click(); await ready(screen) }
  const complete = async () => {
    await ready('brand')
    await click('Não sei a marca'); await next('model')
    await page.getByLabel('Não sei o modelo', { exact: true }).check(); await next('issues')
    await click('Outro problema'); await next('notes')
    await page.locator('#quote-notes').fill('Dado privado alice@example.com, telefone 21999999999')
    await page.locator('#quote-notes').evaluate(element => element.blur())
    await click('Pular detalhes'); await ready('delivery')
    await click('Levar à loja'); await next('review')
  }
  const events = () => page.evaluate(() => window.dataLayer.filter(item => typeof item.event === 'string' && item.event.startsWith('quote_')))
  return { ready, click, next, complete, events }
}

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch(name === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await instrument(context)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const h = harness(page)
    await page.goto(`${base}/orcamento/celular${query}`)
    await h.complete()
    assert.equal((await h.events()).filter(event => event.event === 'quote_whatsapp_click').length, 0)
    await h.click('Continuar no WhatsApp')
    const events = await h.events()
    assert.deepEqual(events.map(event => event.event), expectedNames)
    const attempt = events[0].quote_attempt_id
    assert(events.every(event => event.quote_attempt_id === attempt && event.quote_source === 'ig' && event.quote_ad_id === '52600000000001'))
    const calls = await page.evaluate(() => window.pixelCalls.filter(call => call[0] === 'trackSingleCustom'))
    assert.equal(calls.length, events.length)
    assert.equal(calls.at(-1)[2], 'SmartphoneQuoteWhatsAppClick')
    for (const [index, call] of calls.entries()) {
      assert.equal(call[1], '1430740015202870')
      assert.equal(call[4].eventID, events[index].event_id)
    }
    assert.doesNotMatch(JSON.stringify([events, calls]), /alice|example\.com|999999|Dado privado|text=|Lead/)
    const opened = await page.evaluate(() => window.openedQuotes)
    assert.equal(opened.length, 1)
    const url = new URL(opened[0])
    assert.equal(url.searchParams.get('phone'), '5521967635340')
    assert.match(url.searchParams.get('text'), /Dado privado alice@example.com/)
    assert.doesNotMatch(url.searchParams.get('text'), /Ref\.|52600000000001|quote_attempt/)

    // Repeating the final action does not count another conversion.
    await page.locator('.quote-form').evaluate(form => { form.requestSubmit(); form.requestSubmit() })
    assert.equal((await h.events()).length, events.length)
    const stored = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), trackingKey)
    assert.doesNotMatch(JSON.stringify(stored), /alice|example\.com|999999|Dado privado/)

    // Re-entry without UTMs keeps the original source and suppresses replays.
    await page.goto(`${base}/orcamento/celular`); await h.ready('review')
    await h.click('Continuar no WhatsApp')
    assert.deepEqual(await h.events(), [])
    assert.equal(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).attemptId, trackingKey), attempt)

    // A different ad is a separate attempt, even if the draft is restored.
    await page.goto(`${base}/orcamento/celular${query.replace('52600000000001', '52600000000004')}`); await h.ready('review')
    await h.click('Continuar no WhatsApp')
    const newEvents = await h.events()
    assert.notEqual(newEvents[0].quote_attempt_id, attempt)
    assert(newEvents.every(event => event.quote_ad_id === '52600000000004'))
    assert.deepEqual(newEvents.map(event => event.event), ['quote_viewed', 'quote_reviewed', 'quote_whatsapp_click'])

    // Required validation must still stop WhatsApp and its final event.
    await page.evaluate(keys => keys.forEach(key => sessionStorage.removeItem(key)), [draftKey, trackingKey])
    await page.reload(); await h.ready('brand')
    await page.locator('.quote-form').evaluate(form => form.requestSubmit())
    await h.ready('brand')
    assert.equal((await h.events()).filter(event => event.event === 'quote_whatsapp_click').length, 0)
    assert.equal(await page.evaluate(() => window.openedQuotes.length), 0)
    assert.deepEqual(errors, [])
    await context.close()

    const blocked = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await instrument(blocked, true)
    const blockedPage = await blocked.newPage()
    const blockedErrors = []
    blockedPage.on('pageerror', error => blockedErrors.push(error.message))
    const b = harness(blockedPage)
    await blockedPage.goto(`${base}/orcamento/celular${query}`)
    await b.complete(); await b.click('Continuar no WhatsApp')
    await blockedPage.getByText('Continue na conversa do WhatsApp.', { exact: true }).waitFor()
    assert.deepEqual((await b.events()).map(event => event.event), expectedNames)
    assert.equal(await blockedPage.evaluate(() => window.openedQuotes.length), 1)
    assert.deepEqual(blockedErrors, [])
    await blocked.close()
    results.push({ browser: name, status: 'pass', checks: ['full funnel', 'Pixel destination and event IDs', 'no personal responses in analytics', 'original WhatsApp summary and phone', 'repeat suppression', 'refresh attribution', 'new ad starts new attempt', 'required validation', 'blocked tags and storage'] })
    console.log(name, 'tracking checks passed')
  } finally { await browser.close() }
}
await writeFile(new URL('./results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n')
