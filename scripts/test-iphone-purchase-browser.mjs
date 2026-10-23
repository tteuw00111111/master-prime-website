// Run against a local preview (all third-party requests, Pixel and WhatsApp are intercepted).
// PLAYWRIGHT_MODULE can point to an existing local Playwright installation.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
const configuredBase = process.env.IPHONE_QA_CONFIGURED_URL || base
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'QA must use localhost')
assert(['127.0.0.1', 'localhost'].includes(new URL(configuredBase).hostname), 'QA must use localhost')
const evidence = resolve(import.meta.dirname, '../.cache/iphone-purchase-qa')
await mkdir(evidence, { recursive: true })
const report = { browser: 'Chromium', checks: [], thirdPartyBlocked: 0, errors: [], measures: {} }
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined })
report.browserVersion = browser.version()
const setup = async (options = {}) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', ...options })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (['localhost', '127.0.0.1'].includes(url.hostname)) return route.continue()
    report.thirdPartyBlocked++
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  })
  await context.addInitScript(() => {
    window.__qaPixel = []; window.__qaOpen = []; window.__qaCopy = []; window.__qaCopyFails = false
    window.fbq = (...args) => window.__qaPixel.push(args)
    window.fbq.callMethod = window.fbq
    window.open = (...args) => { window.__qaOpen.push(args); return null }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { if (window.__qaCopyFails) throw Error('QA clipboard blocked'); window.__qaCopy.push(text) } } })
  })
  const page = await context.newPage()
  page.on('pageerror', error => report.errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
  return { context, page }
}
const enter = async (page, origin = base, query = '') => {
  await page.goto(`${origin}/orcamento/iphone${query || '?model=iphone-17-pro-max&capacity=256&condition=sealed'}`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Continuar', exact: true }).waitFor()
  await page.waitForFunction(() => !document.querySelector('.quote-next').disabled)
}
const next = page => page.locator('.quote-next').click()
const chooseColor = (page, name = 'Laranja') => page.locator('.iphone-color').filter({ hasText: name.replace('Silver/', '') }).click()
const heading = (page, text) => page.getByRole('heading', { level: 2, name: text }).waitFor()
const validPayment = async (page, credit = false) => {
  await next(page); await heading(page, 'Como pretende pagar?')
  assert.equal(await page.getByRole('button', { name: 'Decidir pelo WhatsApp', exact: true }).count(), 0)
  assert.equal(await page.locator('#iphone-timing').count(), 0, 'timing is no longer collected')
  await page.getByRole('button', { name: credit ? 'Cartão de crédito' : 'À vista', exact: true }).click()
  await next(page)
  await page.waitForFunction(() => document.activeElement.id === 'iphone-paymentDetail')
  if (credit) {
    const cashCents = Number((await page.locator('#iphone-payment .iphone-payment-amount').first().textContent()).replace(/\D/g, ''))
    const totalCents = Math.round(cashCents * 10857 / 10000)
    const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
    assert.deepEqual(await page.locator('#iphone-paymentDetail button > span:first-child').allTextContents(), Array.from({ length: 11 }, (_, i) => `${i + 2} parcelas`))
    for (let count = 2; count <= 12; count++) {
      const option = page.getByRole('button', { name: `${count} parcelas`, exact: true })
      await option.click()
      assert.equal(await option.getAttribute('aria-pressed'), 'true')
      const amount = money(Math.round(totalCents / count))
      assert.equal(await option.locator('.iphone-payment-amount').textContent(), amount)
      assert((await page.locator('.iphone-credit-summary').textContent()).includes(money(totalCents)))
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'installment choices fit the viewport')
      assert.equal(await page.locator('#iphone-paymentDetail button[aria-pressed="true"]').count(), 1)
    }
  }
  await page.getByRole('button', { name: credit ? '12 parcelas' : 'Pix', exact: true }).click()
  await next(page); await heading(page, 'Confira sua consulta.')
}
const events = page => page.evaluate(() => window.dataLayer.filter(e => /^(IPhonePurchaseQuote|IPhoneTradeIn)/.test(e.event)))
const fresh = async () => { const ctx = await setup(); return ctx }

try {
  const missing = await fresh()
  await enter(missing.page, base, '?model=iphone-13&capacity=128&condition=used')
  assert(await missing.page.locator('.iphone-gallery-image.active').isVisible())
  assert.equal(await missing.page.locator('model-viewer').count(), 0)
  await missing.page.getByText('Imagem de referência. Fotos da unidade no WhatsApp.', { exact: true }).waitFor()
  await missing.context.close()
  const { page, context } = await fresh()
  await enter(page, base, '?model=iphone-17-pro-max&capacity=256&condition=sealed&utm_source=ig&utm_medium=paid_social&utm_campaign=qa_iphone_site&utm_content=99000000000001&campaign_id=99000000000002&adset_id=99000000000003&notes=PRIVATE_QA&price=1')
  assert.equal(await page.locator('.iphone-color[aria-pressed="true"]').count(), 0)
  assert.equal((await events(page)).length, 1, 'deep link is viewed, not started')
  assert.equal(await page.getByText('Total parcelado:', { exact: false }).count(), 0, 'product screen shows only cash and installment amounts')
  assert(!page.url().includes('PRIVATE_QA'))
  await page.screenshot({ path: resolve(evidence, 'mobile-product.png'), fullPage: false })
  // Gallery views never make a commercial color selection or restart an attempt.
  await page.getByRole('button', { name: 'Voltar às fotos', exact: true }).click()
  await page.getByRole('button', { name: 'Visão geral', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.iphone-gallery-image.active[data-angle="front"]').length === 1)
  assert.equal(await page.locator('.iphone-color[aria-pressed="true"]').count(), 0)
  await page.getByRole('button', { name: 'Visão geral', exact: true }).click()
  await next(page)
  await page.getByText('Escolha a cor para conferir o valor exato.').waitFor()
  await page.waitForFunction(() => document.activeElement.id === 'iphone-color')
  await chooseColor(page)
  assert.equal(await page.locator('.iphone-gallery-image.active[data-color="orange"]').count(), 1)
  await page.getByRole('button', { name: 'Detalhes', exact: true }).click()
  await page.locator('.iphone-gallery-stage.is-detail').waitFor()
  await page.getByRole('button', { name: '512 GB', exact: true }).click()
  assert.equal(await page.locator('.iphone-gallery-stage.is-detail').count(), 1, 'capacity preserves gallery view')
  await page.getByRole('button', { name: '256 GB', exact: true }).click()
  await page.getByRole('button', { name: 'Visão geral', exact: true }).click()
  await validPayment(page)
  assert.equal(await page.getByRole('button', { name: 'Continuar no WhatsApp', exact: true }).count(), 1)
  await page.getByRole('button', { name: 'Copiar resumo', exact: true }).click()
  let copies = await page.evaluate(() => window.__qaCopy)
  assert.match(copies[0], /8\.359,88/)
  assert.doesNotMatch(copies[0], /APARELHO OFERECIDO|UTM|Ref\.|990000|ip_/)
  await page.screenshot({ path: resolve(evidence, 'mobile-review.png'), fullPage: false })
  await page.evaluate(() => { window.__qaCopyFails = true })
  await page.getByRole('button', { name: 'Copiar resumo', exact: true }).click()
  await page.locator('#iphone-copy').waitFor()
  assert.match(await page.locator('#iphone-copy').inputValue(), /Fiz uma consulta de iPhone no site da Master Prime/)
  assert.equal(await page.locator('#iphone-copy').evaluate(el => !!el.closest('[data-clarity-mask="true"]')), true)
  await page.setViewportSize({ width: 320, height: 568 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '320 px has no horizontal overflow')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: resolve(evidence, 'mobile-copy-fallback.png'), fullPage: true })
  await page.reload({ waitUntil: 'networkidle' }); await heading(page, 'Confira sua consulta.')
  assert.equal((await events(page)).length, 0, 'refresh does not recount review or viewed')
  await page.getByRole('button', { name: 'Editar aparelho desejado' }).click()
  await heading(page, 'Seu próximo iPhone.')
  await page.getByRole('button', { name: '512 GB', exact: true }).click()
  assert.equal(await page.locator('.iphone-color[aria-pressed="true"]').count(), 1)
  assert.match(await page.locator('.iphone-color[aria-pressed="true"]').innerText(), /9\.799,99/)
  await next(page); await heading(page, 'Confira sua consulta.')
  assert.equal((await events(page)).length, 0, 'editing keeps milestone deduplication')
  report.checks.push('Deep link, no automatic color/start, exact total, required field focus, three-step summary, copy success/failure, 320px, restore/edit/512GB and milestone deduplication')

  await page.goto(`${base}/orcamento/iphone?model=iphone-17-pro-max&capacity=256&condition=sealed&utm_source=fb&utm_medium=paid_social&utm_campaign=qa_new_campaign&utm_content=99000000000009`, { waitUntil: 'networkidle' })
  await heading(page, 'Seu próximo iPhone.')
  assert.equal((await events(page)).filter(e => e.event === 'IPhonePurchaseQuoteViewed').length, 1)
  const source = (await events(page))[0]
  assert.equal(source.quote_ad_id, '99000000000009')
  assert.equal(await page.locator('.iphone-color[aria-pressed="true"]').count(), 0)
  report.checks.push('A changed campaign resets purchase attempt and draft; original source is not overwritten by final product')
  await context.close()

  const credit = await fresh()
  await enter(credit.page, configuredBase)
  await chooseColor(credit.page, 'Silver/Prateado')
  await validPayment(credit.page, true)
  await credit.page.getByRole('button', { name: 'Continuar no WhatsApp', exact: true }).click()
  await credit.page.getByRole('button', { name: 'Abrir novamente', exact: true }).click()
  const telemetry = await events(credit.page)
  assert.equal(telemetry.filter(e => e.event === 'IPhonePurchaseQuoteWhatsAppClick').length, 1)
  assert(!telemetry.some(e => /^IPhoneTradeIn/.test(e.event)))
  assert.deepEqual(telemetry.filter(e => e.event === 'IPhonePurchaseQuoteStepCompleted').map(e => e.quote_step), ['product', 'payment'])
  const opens = await credit.page.evaluate(() => window.__qaOpen)
  assert.equal(opens.length, 2)
  const outgoing = new URL(opens[0][0]).searchParams.get('text')
  assert.match(outgoing, /Cartão de crédito · 12 parcelas/)
  assert(outgoing.startsWith('Olá! Fiz uma consulta de iPhone no site da Master Prime e quero confirmar disponibilidade e condições.'))
  assert.doesNotMatch(outgoing, /troca|Quando|bateria|Ref\.|990000|ip_|utm_|fbclid/)
  assert.equal(new URL(opens[0][0]).searchParams.get('phone'), '5521967635340')
  assert.equal(await credit.page.evaluate(() => window.__qaPixel.some(a => a[1] === 'Lead' || a[2] === 'Lead' || a[2] === 'Purchase')), false)
  await credit.page.getByRole('button', { name: 'Voltar', exact: true }).click()
  await heading(credit.page, 'Como pretende pagar?')
  await credit.page.getByRole('button', { name: '2 parcelas', exact: true }).click(); await next(credit.page)
  await heading(credit.page, 'Confira sua consulta.')
  assert.equal((await events(credit.page)).length, telemetry.length)
  await credit.page.getByRole('button', { name: 'Editar pagamento' }).click()
  await credit.page.getByRole('button', { name: 'À vista', exact: true }).click()
  await credit.page.getByRole('button', { name: 'Cartão', exact: true }).click(); await next(credit.page)
  await credit.page.getByRole('button', { name: 'Copiar resumo', exact: true }).click()
  assert.match((await credit.page.evaluate(() => window.__qaCopy)).at(-1), /Pagamento pretendido: À vista · Cartão/)
  report.checks.push('Credit 2–12 installments, last-payment rounding, back/edit, cash card, WhatsApp intercepted twice with one intent event; only product/payment milestones, no trade/Lead/Purchase')
  await credit.context.close()

  const storage = await setup()
  await storage.context.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { configurable: true, get: () => { throw Error('QA blocked storage') } })
    window.fbq = () => {}
  })
  await enter(storage.page)
  await chooseColor(storage.page); await validPayment(storage.page)
  await storage.page.getByRole('button', { name: 'Copiar resumo', exact: true }).click()
  assert((await storage.page.evaluate(() => window.__qaCopy)).length > 0)
  await storage.context.setOffline(true)
  await storage.page.getByText('Você está sem conexão.', { exact: false }).waitFor()
  await storage.page.getByRole('button', { name: 'Copiar resumo', exact: true }).click()
  await storage.context.setOffline(false)
  report.checks.push('Blocked storage and offline form/copy remain usable')
  await storage.context.close()

  const changed = await fresh()
  await enter(changed.page); await chooseColor(changed.page); await validPayment(changed.page)
  await changed.page.evaluate(() => {
    const key = 'master-prime:iphone-purchase:v1'
    const saved = JSON.parse(sessionStorage.getItem(key)); saved.catalogFingerprint = 'old-catalog'; sessionStorage.setItem(key, JSON.stringify(saved))
  })
  await changed.page.reload({ waitUntil: 'networkidle' })
  await changed.page.getByText('A tabela mudou desde o seu rascunho.').waitFor()
  await next(changed.page)
  await heading(changed.page, 'Seu próximo iPhone.')
  await changed.page.reload({ waitUntil: 'networkidle' })
  await changed.page.getByText('A tabela mudou desde o seu rascunho.').waitFor()
  await changed.page.getByRole('button', { name: 'Entendi, vou conferir os valores atuais' }).click()
  await next(changed.page)
  await heading(changed.page, 'Como pretende pagar?')
  report.checks.push('Catalog change notice persists over refresh until acknowledged; stale review cannot open WhatsApp')
  await changed.context.close()

  const generic = await fresh()
  await enter(generic.page)
  await generic.page.getByText('Consultar outros modelos e condições', { exact: true }).click()
  await generic.page.locator('#iphone-model').selectOption('iphone-15-pro')
  await generic.page.getByRole('button', { name: '256 GB', exact: true }).click()
  assert.match(await generic.page.locator('.iphone-hero-price').innerText(), /4\.050,00/)
  await generic.page.getByRole('checkbox', { name: 'Titânio natural', exact: true }).click()
  await validPayment(generic.page)
  await heading(generic.page, 'Confira sua consulta.')
  await generic.page.getByRole('button', { name: 'Copiar resumo', exact: true }).click()
  copies = await generic.page.evaluate(() => window.__qaCopy)
  assert.match(copies[0], /iPhone 15 Pro · 256 GB · Seminovo/)
  assert.match(copies[0], /Cores aceitas: Titânio natural/)
  assert.doesNotMatch(copies[0], /troca|Quando|bateria/)
  await generic.page.setViewportSize({ width: 1440, height: 1000 })
  await generic.page.screenshot({ path: resolve(evidence, 'desktop-review.png'), fullPage: false })
  report.checks.push('Generic entry and seminovo/256GB complete in three steps with color preferences')
  await generic.context.close()

  const perf = await fresh()
  await enter(perf.page)
  await perf.page.keyboard.press('Tab')
  assert.equal(await perf.page.evaluate(() => document.activeElement.className), 'quote-skip')
  await perf.page.keyboard.press('Enter')
  await perf.page.keyboard.press('Tab')
  assert(['BUTTON', 'MODEL-VIEWER'].includes(await perf.page.evaluate(() => document.activeElement.tagName)), 'skip link reaches a gallery control or the interactive 3D viewer')
  report.measures = await perf.page.evaluate(() => ({
    navigation: performance.getEntriesByType('navigation').map(e => ({ domContentLoadedMs: Math.round(e.domContentLoadedEventEnd), loadMs: Math.round(e.loadEventEnd), encodedBodyBytes: e.encodedBodySize })),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    controlsBelowMinimum: [...document.querySelectorAll('.iphone-purchase button, .iphone-purchase select, .iphone-purchase summary')].filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height < (el.closest('.iphone-gallery-views, .iphone-model-controls') ? 44 : 48)).map(el => el.textContent.trim()),
    externalScripts: [...document.scripts].filter(el => el.src && !el.src.startsWith(location.origin)).map(el => el.src),
  }))
  assert.deepEqual(report.measures.controlsBelowMinimum, [])
  assert.equal(report.measures.horizontalOverflow, false)
  assert(!report.measures.externalScripts.some(s => /clarity|googletagmanager/.test(s)))
  await perf.page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  assert(await perf.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '200% text has no horizontal overflow')
  await perf.page.evaluate(() => { document.documentElement.style.fontSize = '' })
  report.checks.push('Cash Pix/card and credit from 2 to 12 installments, three-step flow, color preferences and confirmed repair WhatsApp destination')
  report.checks.push('Keyboard-only skip link/first action and 200% text without horizontal overflow')
  await perf.page.setViewportSize({ width: 1440, height: 1000 })
  await perf.page.screenshot({ path: resolve(evidence, 'desktop-product.png'), fullPage: false })
  await perf.context.close()

  // Check hydration/rendering with WebKit when the local browser runtime exists.
  let safari
  try { safari = await webkit.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE || undefined }) }
  catch (error) { report.webkitUnavailable = error.message }
  if (safari) {
    try {
    const ctx = await safari.newContext({ viewport: { width: 375, height: 667 }, reducedMotion: 'reduce' })
    await ctx.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.fulfill({ body: '' }))
    await ctx.addInitScript(() => { window.fbq = () => {}; window.open = () => null })
    const page = await ctx.newPage()
    page.on('pageerror', err => report.errors.push(`WebKit: ${err.message}`))
    await enter(page); await chooseColor(page); await validPayment(page)
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    report.checks.push('WebKit 375×667: hydration and three-step journey')
    } finally { await safari.close() }
  }

  assert.deepEqual(report.errors, [])
  await writeFile(resolve(evidence, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
