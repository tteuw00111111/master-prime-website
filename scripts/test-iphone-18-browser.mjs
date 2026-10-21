// Local-only verification of the owner-supplied iPhone 18 Pro Max media and offer.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const evidence = resolve('.cache/iphone-18')
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, headless: true, args: ['--enable-unsafe-swiftshader'] })
const report = { checks: [], errors: [] }
const colors = [['black', 'Preto', 990000, 89570, 1074843], ['burgundy', 'Bordô', 1110000, 100427, 1205127], ['silver', 'Prateado', 1050000, 94999, 1139985]]
const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
const setup = async (light = false) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await context.route('**/*', r => ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.fulfill({ body: '' }))
  await context.addInitScript(light => {
    window.fbq = () => {}; window.open = () => null
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: light ? 2 : 8 })
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 })
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: false, effectiveType: '4g' } })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copy = text } } })
  }, light)
  const page = await context.newPage()
  page.on('pageerror', error => report.errors.push(error.message))
  await page.goto(`${base}/orcamento/iphone?model=iphone-18-pro-max&capacity=256&condition=sealed`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'iPhone 18 Pro Max', exact: true }).waitFor()
  await page.waitForFunction(() => !document.querySelector('.quote-next').disabled)
  return { context, page }
}
const button = (page, name) => page.getByRole('button', { name, exact: true })
const choose = (page, name) => page.locator('.iphone-color').filter({ hasText: name }).click()
const loaded = page => page.waitForFunction(() => document.querySelector('model-viewer')?.loaded && document.querySelector('.iphone-model.is-loaded'), null, { timeout: 30000 })
const frame = (page, color, angle) => page.waitForFunction(({ color, angle }) => {
  const img = document.querySelector('.iphone-gallery-image.active')
  return img?.dataset.color === color && img.dataset.angle === angle && img.complete && img.naturalWidth > 0
}, { color, angle })
const capture = async (page, name) => {
  await page.evaluate(() => scrollTo(0, 0))
  if (await page.locator('.iphone-model.is-loaded').count()) await page.locator('model-viewer').evaluate(async e => {
    await e.updateComplete; e.jumpCameraToGoal()
    for (let i = 0; i < 20; i++) await new Promise(requestAnimationFrame)
  })
  await page.screenshot({ path: resolve(evidence, `${name}.png`), fullPage: false })
}
try {
  const { context, page } = await setup()
  await loaded(page)
  const dimensions = await page.locator('model-viewer').evaluate(e => ({ ...e.getDimensions() }))
  assert(dimensions.y > dimensions.x * 1.5 && dimensions.x > dimensions.z * 3, '3D handset is upright')
  assert.equal(await page.locator('.iphone-color[aria-pressed="true"]').count(), 0, 'preview never chooses a commercial color')
  assert.deepEqual(await page.locator('model-viewer').evaluate(e => e.availableVariants), ['black', 'burgundy', 'silver'])
  assert.equal(await page.locator('model-viewer').evaluate(e => e.variantName), 'black')
  assert.equal(await page.locator('.iphone-capacity-choice button').allTextContents().then(values => values.map(v => v.trim())).then(values => values.join(',')), '256 GB')
  for (const [color, name, cash, installment] of colors) {
    await choose(page, name)
    await page.waitForFunction(color => document.querySelector('model-viewer').variantName === color, color)
    await page.locator('model-viewer').evaluate(e => new Promise(resolve => { if (!e.isVariantLoading) resolve(); else e.addEventListener('variant-applied', resolve, { once: true }) }))
    assert((await page.locator('model-viewer').getAttribute('alt')).includes(name))
    const offer = await page.locator('.iphone-color[aria-pressed="true"]').textContent()
    assert(offer.includes(money(cash)) && offer.includes(money(installment)))
    await capture(page, `3d-${color}-390`)
  }
  await button(page, 'Frente').click(); await capture(page, '3d-silver-front')
  await button(page, 'Câmeras').click(); await capture(page, '3d-silver-cameras')
  const orbit = await page.locator('model-viewer').evaluate(e => ({ ...e.getCameraOrbit() }))
  await choose(page, 'Bordô')
  assert.deepEqual(await page.locator('model-viewer').evaluate(e => ({ ...e.getCameraOrbit() })), orbit)
  report.checks.push('Default black 3D, three matching finishes, accessible names, camera presets and preserved camera position')
  await button(page, 'Voltar às fotos').click()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    for (const [color, name] of colors) {
      await choose(page, name)
      await button(page, 'Visão geral').click(); await frame(page, color, 'front')
      await page.evaluate(() => scrollTo(0, 0)); await capture(page, `photo-${color}-${width}`)
      await button(page, 'Detalhes').click(); await frame(page, color, 'detail')
      await capture(page, `detail-${color}-${width}`)
      const centered = await page.locator('.iphone-gallery-image.active').evaluate(e => {
        const r = e.getBoundingClientRect(), stage = e.parentElement.getBoundingClientRect()
        return Math.abs(r.left + r.width * .664 - stage.left - stage.width / 2) < 1
      })
      assert(centered, 'detail handset stays centered')
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  }
  report.checks.push('Overview/details for every color at 320/390/1440px, centered details and 200% text without horizontal overflow')
  await context.close()
  for (const [color, name, , , total] of colors) {
    const { context, page } = await setup(true)
    assert.equal(await page.locator('model-viewer').count(), 0)
    await frame(page, 'black', 'front')
    await choose(page, name); await frame(page, color, 'front')
    await page.locator('.quote-next').click()
    assert((await page.locator('.iphone-recap img').getAttribute('src')).includes(color))
    await button(page, 'Cartão de crédito').click()
    for (let count = 2; count <= 12; count++) {
      const option = button(page, `${count} parcelas`)
      await option.click()
      assert.equal(await option.locator('.iphone-payment-amount').textContent(), money(Math.round(total / count)))
      assert((await page.locator('.iphone-credit-summary').textContent()).includes(money(total)))
    }
    await button(page, '2 parcelas').click()
    await page.locator('.quote-next').click()
    await button(page, 'Copiar resumo').click()
    const message = await page.evaluate(() => window.__copy)
    assert(message.includes(`iPhone 18 Pro Max · 256 GB · Lacrado · ${name}`))
    assert(message.includes(`Cartão: 2× de ${money(Math.round(total / 2))}`))
    assert(message.includes(`Total: ${money(total)}`))
    assert((await page.locator('.iphone-mini-summary img').getAttribute('src')).includes(color))
    await context.close()
  }
  report.checks.push('Low-memory photo fallback, all 2–12 installment values, exact 8.57% totals, thumbnails, review and copied WhatsApp summary for every color')
  const catalog = await setup(true)
  await catalog.page.goto(`${base}/orcamento/iphone`, { waitUntil: 'networkidle' })
  const card = catalog.page.locator('.catalog-product').filter({ has: catalog.page.getByRole('heading', { name: 'iPhone 18 Pro Max', exact: true }) })
  assert((await card.locator('img').getAttribute('src')).includes('black'))
  assert((await card.textContent()).includes(money(89570)))
  await card.getByRole('link', { name: 'Ver opções de iPhone 18 Pro Max lacrado', exact: true }).click()
  await frame(catalog.page, 'black', 'front')
  assert.equal(await catalog.page.locator('.iphone-color[aria-pressed="true"]').count(), 0)
  await catalog.context.close()
  report.checks.push('Catalog thumbnail, price and 18 Pro Max entry link use the matching offer')
  assert.deepEqual(report.errors, [])
  await writeFile(resolve(evidence, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
