// Migrate the previous journey in isolated browsers; never contact Meta or WhatsApp.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'
const load = async file => {
  const result = await build({ entryPoints: [resolve(file)], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const data = await load('src/data/iphone-purchase.ts')
const q = await load('src/utils/iphone-purchase.ts')
const colors = await load('src/data/iphone-used-colors.ts')
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const evidence = resolve('.cache/iphone-reduced')
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, headless: true })
const report = { checks: [], errors: [] }
const cases = [
  { modelId: 'iphone-17-pro-max', condition: 'sealed', capacity: 256, colorId: 'orange' },
  { modelId: 'iphone-18-pro-max', condition: 'sealed', capacity: 256, colorId: 'black' },
  { modelId: 'iphone-15-pro', condition: 'used', capacity: 128, colorId: '' },
]
try {
  for (const selection of cases) for (const screen of ['timing', 'trade', 'device', 'condition', 'history', 'review', 'payment-incomplete']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await context.route('**/*', r => ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.fulfill({ body: '' }))
    const attemptId = 'ip_legacy-browser-12345678'
    const sent = ['viewed', 'started', 'step:product', 'step:payment', 'step:timing', 'step:trade', 'step:device', 'step:condition', 'step:history', 'tradeStarted', 'tradeCompleted', ...(screen === 'review' ? ['reviewed', 'whatsapp'] : [])]
    const legacy = {
      draft: { version: 1, selection, preferredColorIds: selection.condition === 'used' ? [colors.getIPhoneUsedColors(selection.modelId)[0].id] : [], payment: 'À vista', paymentDetail: screen === 'payment-incomplete' ? '' : 'Pix',
        timing: 'Nos próximos dias', tradeChoice: 'yes', trade: { modelId: 'apple-iphone-15-pro', battery: '87', notes: 'PRIVATE_LEGACY_NOTE', repairParts: ['Tela'] } },
      screen: screen === 'payment-incomplete' ? 'history' : screen, savedAt: Date.now(), attemptId, entryKey: q.iPhoneSelectionKey(selection), catalogFingerprint: q.iPhoneCatalogFingerprint(),
    }
    const tracker = { version: 1, attemptId, createdAt: Date.now(), initial: selection, attribution: { utm_source: 'ig' }, sent }
    await context.addInitScript(({ legacy, tracker }) => {
      window.fbq = () => {}; window.open = url => { window.__opened = url; return null }
      Object.defineProperty(navigator, 'deviceMemory', { value: 2 })
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copy = text } } })
      if (!sessionStorage.getItem('qa:seeded')) {
        sessionStorage.setItem('master-prime:iphone-purchase:v1', JSON.stringify(legacy))
        sessionStorage.setItem('master-prime:iphone-purchase-tracking:v1', JSON.stringify(tracker))
        sessionStorage.setItem('qa:seeded', 'true')
      }
    }, { legacy, tracker })
    const page = await context.newPage()
    page.on('pageerror', e => report.errors.push(e.message))
    const params = new URLSearchParams({ model: selection.modelId, condition: selection.condition, capacity: String(selection.capacity), fbclid: 'IwQA_Legacy-MixedCase_99000000000001' })
    await page.goto(`${base}/orcamento/iphone?${params}`, { waitUntil: 'networkidle' })
    const button = name => page.getByRole('button', { name, exact: true })
    if (screen === 'payment-incomplete') {
      await page.getByRole('heading', { name: 'Como pretende pagar?', exact: true }).waitFor()
      await button('Pix').click(); await page.locator('.quote-next').click()
    }
    await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
    assert.equal(await page.locator('.quote-review-block').count(), 2)
    assert.equal(await page.locator('#iphone-timing, #iphone-tradeChoice, #iphone-battery, #iphone-notes').count(), 0)
    await button('Copiar resumo').click()
    const message = await page.evaluate(() => window.__copy)
    assert(message.startsWith('Olá! Fiz uma consulta de iPhone no site da Master Prime e quero confirmar disponibilidade e condições.'))
    assert(message.includes(selection.condition === 'used' ? 'Cores aceitas:' : 'Lacrado'))
    assert.doesNotMatch(message, /PRIVATE|Nos próximos dias|Quando|troca|87%|Ref\.|utm_|fbclid|IwQA/)
    await button('Continuar no WhatsApp').click(); await button('Abrir novamente').click()
    assert.equal(new URL(await page.evaluate(() => window.__opened)).searchParams.get('text'), message)
    const events = await page.evaluate(() => window.dataLayer.filter(e => /^IPhone/.test(e.event)))
    assert.deepEqual(events.map(e => e.event), screen === 'review' ? [] : ['IPhonePurchaseQuoteReviewed', 'IPhonePurchaseQuoteWhatsAppClick'])
    assert(events.every(e => e.quote_attempt_id === attemptId && e.quote_source === 'ig' && e.quote_journey_version === data.IPHONE_JOURNEY_VERSION))
    const state = await page.evaluate(() => ({ draft: JSON.parse(sessionStorage.getItem('master-prime:iphone-purchase:v1')), tracker: JSON.parse(sessionStorage.getItem('master-prime:iphone-purchase-tracking:v1')) }))
    assert.equal(state.draft.draft.version, 2)
    assert.doesNotMatch(JSON.stringify(state), /PRIVATE|timing|tradeChoice|battery|repairParts|tradeStarted|step:history|fbclid|IwQA/)
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
    assert.deepEqual(await page.evaluate(() => window.dataLayer.filter(e => /^IPhone/.test(e.event))), [])
    assert.equal(new URL(page.url()).searchParams.get('fbclid'), 'IwQA_Legacy-MixedCase_99000000000001')
    if (screen === 'history' && selection.modelId === 'iphone-17-pro-max') {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        await page.screenshot({ path: resolve(evidence, `review-${width}.png`), fullPage: true })
      }
    }
    await context.close()
    report.checks.push(`${selection.modelId}/${screen}: migrate valid choices, discard removed answers/milestones, preserve compatible deduplication and attribution, exact copied/opened message, reload`)
  }
  assert.deepEqual(report.errors, [])
  await writeFile(resolve(evidence, 'migration-report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
