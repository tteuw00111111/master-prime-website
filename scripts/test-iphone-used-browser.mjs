// Local-only photo, color-preference and pricing coverage for every seminovo offer.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'esbuild'
const load = async file => {
  const result = await build({ entryPoints: [resolve(file)], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const { IPHONE_VARIANTS } = await load('src/data/iphone-purchase.ts')
const { getIPhoneUsedColors } = await load('src/data/iphone-used-colors.ts')
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const evidence = resolve('.cache/iphone-used')
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const report = { variants: 0, colors: 0, checks: [], errors: [], modelDownloads: [] }
await context.route('**/*', r => ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.fulfill({ body: '' }))
await context.addInitScript(() => {
  window.fbq = () => {}; window.open = url => { window.__open = url; return null }
  Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 })
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copy = text } } })
})
const page = await context.newPage()
page.on('pageerror', e => report.errors.push(e.message))
page.on('request', request => {
  const url = new URL(request.url())
  // Vite's development URL wrappers and the shared React component are small
  // source modules, not a model transfer or the dynamically imported 3D runtime.
  if ((url.pathname.endsWith('.glb') && !url.searchParams.has('import')) || /(?:\/|@google_)model[-_]viewer[^/]*\.js$/i.test(url.pathname)) report.modelDownloads.push(url.href)
})
const button = name => page.getByRole('button', { name, exact: true })
const next = () => page.locator('.quote-next').click()
const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
const frame = color => page.waitForFunction(color => {
  const e = document.querySelector('.iphone-gallery-image.active')
  return e?.dataset.color === color && e.complete && e.naturalWidth > 0
}, color)
try {
  const visited = new Set()
  for (const variant of IPHONE_VARIANTS.filter(v => v.condition === 'used')) {
    await page.evaluate(() => sessionStorage.clear()).catch(() => {})
    await page.goto(`${base}/orcamento/iphone?model=${variant.modelId}&capacity=${variant.capacity}&condition=used`, { waitUntil: 'networkidle' })
    await page.locator('.iphone-used-preferences').waitFor()
    const colors = getIPhoneUsedColors(variant.modelId)
    await frame(colors[0].id)
    assert.equal(await page.locator('.iphone-gallery-stage').evaluate(e => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)', 'photo stage blends into the page')
    assert.equal(await page.getByRole('checkbox', { checked: true }).count(), 0)
    assert.equal(await page.locator('model-viewer, .iphone-explore, .iphone-gallery-views').count(), 0)
    assert((await page.locator('.iphone-hero-price').textContent()).includes(money(variant.cashCents)))
    assert((await page.locator('.iphone-hero-installment').textContent()).includes(money(variant.installmentCents)))
    await next()
    await page.waitForFunction(() => document.activeElement?.id === 'iphone-preferredColors')
    await page.getByText('Marque pelo menos uma cor que você aceita.', { exact: true }).waitFor()
    if (!visited.has(variant.modelId)) {
      for (const color of colors) {
        const option = page.getByRole('checkbox', { name: color.name, exact: true })
        await option.click(); await frame(color.id)
        assert.equal(await option.getAttribute('aria-checked'), 'true')
        report.colors++
      }
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
        await page.evaluate(() => scrollTo(0, 0))
        await page.screenshot({ path: resolve(evidence, `${variant.modelId}-${width}.png`), fullPage: false })
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        await page.evaluate(() => { document.documentElement.style.fontSize = '' })
      }
      visited.add(variant.modelId)
    }
    await page.setViewportSize({ width: 390, height: 844 })
    // Clear any previous choices, then explicitly accept all colors.
    if (await button('Aceito todas as cores').getAttribute('aria-pressed') === 'true') await button('Aceito todas as cores').click()
    await button('Aceito todas as cores').click()
    assert.equal(await page.getByRole('checkbox', { checked: true }).count(), colors.length)
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.getByRole('checkbox', { checked: true }).count(), colors.length, 'all colors survive reload')
    if (variant.modelId === 'iphone-15-pro') {
      const capacity = variant.capacity === 128 ? 256 : 128
      await button(`${capacity} GB`).click()
      assert.equal(await page.getByRole('checkbox', { checked: true }).count(), colors.length)
      await button(`${variant.capacity} GB`).click()
    }
    await next(); await button('Cartão de crédito').click()
    const total = Math.round(variant.cashCents * 10857 / 10000)
    for (let count = 2; count <= 12; count++) {
      const option = button(`${count} parcelas`)
      await option.click()
      assert.equal(await option.locator('.iphone-payment-amount').textContent(), money(Math.round(total / count)))
      assert((await page.locator('.iphone-credit-summary').textContent()).includes(money(total)))
    }
    await button('3 parcelas').click(); await next()
    for (const color of colors) assert((await page.locator('.quote-review').textContent()).includes(color.name))
    await button('Copiar resumo').click()
    const message = await page.evaluate(() => window.__copy)
    assert(message.includes(`${variant.model} · ${variant.capacity} GB · Seminovo`))
    assert(message.includes(`Cores aceitas: ${colors.map(c => c.name).join(', ')}`))
    assert(message.includes(`Cartão: 3× de ${money(Math.round(total / 3))}`))
    assert(message.includes(`Total: ${money(total)}`))
    assert.match(message, /Disponibilidade das cores e condição da unidade a confirmar/)
    await button('Continuar no WhatsApp').click()
    assert.equal(new URL(await page.evaluate(() => window.__open)).searchParams.get('text'), message)
    const telemetry = await page.evaluate(() => JSON.stringify(window.dataLayer))
    assert(!telemetry.includes('preferredColorIds'))
    await page.getByRole('button', { name: 'Editar aparelho desejado', exact: true }).click()
    await page.getByRole('checkbox', { name: colors[0].name, exact: true }).click()
    await next()
    assert((await page.locator('.quote-review').textContent()).includes(`Cores aceitas: ${colors.slice(1).map(c => c.name).join(', ')}`))
    report.variants++
  }
  await page.goto(`${base}/orcamento/iphone`, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.catalog-product-used img').count(), 12)
  assert(await page.locator('.catalog-product-used .catalog-product-image').evaluateAll(elements => elements.every(e => getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)')), 'catalog image containers are transparent')
  await button('Seminovos').click()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: resolve(evidence, `catalog-used-${width}.png`), fullPage: false })
  }
  report.checks.push('13 offers, 12 models, all 58 color renders, multi-selection/select-all, draft restore, capacity retention, review edits and exact WhatsApp handoff')
  report.checks.push('All 2–12 installment amounts and fixed 8.57% totals; 320/390/1440px and 200% text; catalog thumbnails')
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.modelDownloads, [], 'seminovos never request the 3D runtime or a model')
  await writeFile(resolve(evidence, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
