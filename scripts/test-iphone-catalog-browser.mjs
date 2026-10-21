// Local-only catalog and handoff regression checks; no analytics or messages leave the browser.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const evidence = resolve('.cache/iphone-hub')
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined })
const report = { checks: [], errors: [] }
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.fulfill({ body: '' }))
await context.addInitScript(() => {
  window.__catalogCopies = []
  window.__catalogCopyFails = false
  window.fbq = () => {}
  window.open = () => null
  Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
    if (window.__catalogCopyFails) throw Error('Clipboard unavailable')
    window.__catalogCopies.push(text)
  } } })
})
const page = await context.newPage()
page.on('pageerror', error => report.errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
const hub = () => page.locator('.iphone-catalog').waitFor()
const quote = () => page.waitForFunction(() => document.querySelector('.quote-next')?.disabled === false)
const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
const controlsFit = () => page.locator('.catalog-filters button').evaluateAll(buttons => buttons.every(button => {
  const rect = button.getBoundingClientRect()
  return rect.left >= 0 && rect.right <= innerWidth && button.scrollWidth <= button.clientWidth + 1
}))
const capture = (name, fullPage = false) => page.screenshot({ path: resolve(evidence, `${name}.png`), fullPage })
try {
  await page.goto(`${base}/orcamento/iphone?utm_source=whatsapp&notes=PRIVATE`, { waitUntil: 'networkidle' })
  await hub()
  assert.equal(await page.locator('h1').count(), 1)
  assert.equal(await page.locator('.catalog-product').count(), 14)
  assert.equal(await page.locator('.catalog-product-used').count(), 12)
  assert.equal(await page.locator('.catalog-product-sealed').count(), 2)
  assert.match(await page.locator('.catalog-product-used').first().textContent(), /2\.300,00/)
  assert.equal(await page.locator('.catalog-product-used img').count(), 12)
  assert(await page.getByText('Disponibilidade e condições confirmadas pela equipe.', { exact: true }).isVisible())
  assert.equal(await page.evaluate(() => (window.dataLayer || []).filter(event => /^IPhonePurchaseQuote/.test(event.event)).length), 0, 'browsing is not a quote conversion')
  report.checks.push('Fourteen catalog groups, twelve used models, sourced prices, explicit availability, no quote milestone on browsing')

  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height })
    await page.evaluate(() => document.fonts.ready)
    assert(await fits(), `${width}px fits`)
    await capture(`hub-${width}`)
    if (width === 390 || width === 1440) await capture(`hub-${width}-full`, true)
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    assert(await fits(), `${width}px with 200% text fits`)
    assert(await controlsFit(), `${width}px with 200% text keeps every filter visible`)
    if (width === 390) await capture('hub-text-200', true)
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  }
  report.checks.push('320, 390, 768 and 1440px with default and 200% text, no horizontal overflow')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Seminovos', exact: true }).click()
  assert.equal(await page.locator('.catalog-product-sealed').count(), 0)
  assert.equal(await page.locator('.catalog-product-used').count(), 12)
  assert.equal(await page.getByRole('button', { name: 'Seminovos', exact: true }).getAttribute('aria-pressed'), 'true')
  await capture('hub-used', true)
  await page.getByRole('button', { name: 'Lacrados', exact: true }).click()
  assert.equal(await page.locator('.catalog-product').count(), 2)
  await page.getByRole('button', { name: 'Todos', exact: true }).click()
  report.checks.push('All, sealed and used filters with accessible selection state')

  await page.getByRole('button', { name: 'Copiar link do catálogo' }).click()
  assert.deepEqual(await page.evaluate(() => window.__catalogCopies), ['https://master-prime.com/orcamento/iphone'])
  await page.getByText('Link do catálogo copiado.', { exact: true }).waitFor()
  await page.evaluate(() => { window.__catalogCopyFails = true })
  await page.getByRole('button', { name: 'Copiar link do catálogo' }).click()
  assert.equal(await page.getByLabel('Link do catálogo', { exact: true }).inputValue(), 'https://master-prime.com/orcamento/iphone')
  await capture('hub-copy-fallback')
  report.checks.push('Clean canonical link copied; clipboard failure exposes a selectable link and truthful feedback')

  await page.getByRole('link', { name: 'Ver opções de iPhone 13 seminovo', exact: true }).click()
  await quote()
  assert.match(page.url(), /model=iphone-13/)
  assert.match(page.url(), /utm_source=whatsapp/)
  assert(!page.url().includes('PRIVATE'))
  assert.equal(await page.locator('.iphone-model-heading h3').textContent(), 'iPhone 13')
  await page.getByRole('button', { name: 'Aceito todas as cores', exact: true }).click()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.getByRole('heading', { name: 'Como pretende pagar?', exact: true }).waitFor()
  await page.getByRole('button', { name: 'À vista', exact: true }).click()
  await page.getByRole('button', { name: 'Pix', exact: true }).click()
  await page.getByRole('button', { name: 'Revisar consulta', exact: true }).click()
  await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
  assert.match(await page.locator('.quote-review').textContent(), /iPhone 13/)
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
  await page.goBack()
  await hub()
  await page.goForward()
  await quote()
  await page.getByRole('link', { name: 'Ver todos os iPhones', exact: true }).click()
  await hub()
  report.checks.push('Hub → chosen used model → payment → review; reload restores draft; browser back/forward and catalog return work; attribution retained without private parameters')

  await page.getByRole('link', { name: 'Ver opções de iPhone 17 Pro Max lacrado', exact: true }).click()
  await quote()
  assert.equal(await page.locator('.iphone-model-heading h3').textContent(), 'iPhone 17 Pro Max')
  assert.equal(await page.locator('.iphone-color[aria-pressed="true"]').count(), 0)
  await page.reload({ waitUntil: 'networkidle' })
  await quote()
  assert.equal(await page.locator('.iphone-model-heading h3').textContent(), 'iPhone 17 Pro Max')
  await page.goto(`${base}/orcamento/iphone?view=quote`, { waitUntil: 'networkidle' })
  await quote()
  report.checks.push('Sealed model links and direct refresh work; no color silently selected; explicit generic quote entry works')

  await page.goto(`${base}/orcamento/iphone`, { waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Pular para os modelos')
  await page.keyboard.press('Enter')
  assert.equal(await page.evaluate(() => document.activeElement.id), 'iphone-catalog-models')
  await page.getByRole('button', { name: 'Seminovos', exact: true }).focus()
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('.catalog-product').count(), 12)
  report.checks.push('Keyboard skip link and filter activation')

  const noJs = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await noJs.newPage()
  await staticPage.goto(`${base}/orcamento/iphone`)
  if (await staticPage.locator('.iphone-catalog').count()) {
    assert.equal(await staticPage.locator('.catalog-product').count(), 14)
    assert(await staticPage.getByRole('link', { name: 'consulte os modelos pelo WhatsApp' }).isVisible())
    report.checks.push('Prerendered catalog and direct WhatsApp alternative available without JavaScript')
  } else {
    assert(!process.env.IPHONE_QA_PRERENDERED, 'built preview must provide catalog HTML without JavaScript')
    report.checks.push('No-JavaScript check deferred until built preview')
  }
  await noJs.close()
  assert.deepEqual(report.errors, [])
  console.log(JSON.stringify(report, null, 2))
} finally {
  await writeFile(resolve(evidence, 'browser-report.json'), JSON.stringify(report, null, 2))
  await browser.close()
}
