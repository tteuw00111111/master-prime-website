// Exercise the original trade-in checklist through the current purchase interface.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const evidence = resolve('.cache/iphone-trade-all')
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, headless: true })
const report = { checks: [], errors: [] }
const cases = [
  { model: 'iphone-17-pro-max', condition: 'sealed', capacity: 256, color: 'Laranja', offered: 'iPhone 15 Pro', pending: false },
  { model: 'iphone-18-pro-max', condition: 'sealed', capacity: 256, color: 'Preto', offered: 'iPhone 14', pending: true },
  { model: 'iphone-15-pro', condition: 'used', capacity: 128, offered: 'iPhone 13 Pro Max', pending: true },
]
try {
  for (const scenario of cases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await context.route('**/*', r => ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.fulfill({ body: '' }))
    await context.addInitScript(() => {
      window.fbq = () => {}; window.open = url => { window.__opened = url; return null }
      Object.defineProperty(navigator, 'deviceMemory', { value: 2 })
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copy = text } } })
    })
    const page = await context.newPage()
    page.on('pageerror', e => report.errors.push(e.message))
    const button = name => page.getByRole('button', { name, exact: true })
    const next = () => page.locator('.quote-next').click()
    const capture = async name => {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
        await page.evaluate(() => scrollTo(0, 0))
        await page.screenshot({ path: resolve(evidence, `${scenario.model}-${name}-${width}.png`), fullPage: true })
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        await page.evaluate(() => { document.documentElement.style.fontSize = '' })
      }
      await page.setViewportSize({ width: 390, height: 844 })
    }
    await page.goto(`${base}/orcamento/iphone?model=${scenario.model}&condition=${scenario.condition}&capacity=${scenario.capacity}`, { waitUntil: 'networkidle' })
    if (scenario.condition === 'used') await button('Aceito todas as cores').click()
    else await page.locator('.iphone-color').filter({ hasText: scenario.color }).click()
    await next(); await button('À vista').click(); await button('Pix').click(); await next()
    await button('Nos próximos dias').click(); await next()
    await button('Quero oferecer um usado').click(); await next()
    if (!scenario.pending) {
      await page.locator('#iphone-modelId').selectOption({ label: 'iPhone 14' }); await next()
      await page.getByText('Para comprar o 17 Pro Max, a triagem começa na linha iPhone 15. Você pode continuar sem troca.').waitFor()
    }
    await page.locator('#iphone-modelId').selectOption({ label: scenario.offered })
    await page.locator('#iphone-capacity').selectOption('unknown')
    await page.locator('#iphone-color').selectOption('Azul')
    await page.locator('#iphone-battery').fill('101'); await next()
    await page.getByText('Informe de 0 a 100 ou marque “Não sei”.', { exact: true }).waitFor()
    await page.locator('#iphone-battery').fill('87')
    await capture('device')
    await next()
    for (const id of ['screen', 'back', 'sides']) await page.locator(`#iphone-${id}`).getByRole('button', { name: 'Não sei', exact: true }).click()
    await capture('condition'); await next()
    await button('Houve troca ou reparo').click(); await next()
    await page.getByText('Indique o que foi reparado ou escolha “Não sei qual”.').waitFor()
    await page.locator('#iphone-repairParts').getByRole('checkbox', { name: 'Tela', exact: true }).click()
    await page.locator('#iphone-repairParts').getByRole('checkbox', { name: 'Bateria', exact: true }).click()
    await page.locator('#iphone-faults').getByRole('checkbox', { name: 'Nenhuma falha conhecida', exact: true }).click()
    await page.locator('#iphone-liquid').getByRole('button', { name: 'Não sei', exact: true }).click()
    await page.locator('#iphone-activation').getByRole('button', { name: 'Sem bloqueio conhecido', exact: true }).click()
    await page.locator('#iphone-notes').fill('NOTA_PRIVADA_CHECKLIST')
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('#iphone-repairParts').getByRole('checkbox', { name: 'Tela', exact: true }).getAttribute('aria-checked'), 'true')
    assert.equal(await page.locator('#iphone-notes').inputValue(), 'NOTA_PRIVADA_CHECKLIST')
    await capture('history'); await next()
    await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
    await button('Copiar resumo').click()
    const message = await page.evaluate(() => window.__copy)
    assert(message.includes(scenario.offered))
    assert.match(message, /Saúde da bateria: 87%/)
    assert.match(message, /Reparos: Houve troca ou reparo — Tela, Bateria/)
    assert.match(message, /NOTA_PRIVADA_CHECKLIST/)
    assert.equal(message.includes('política a confirmar pela equipe'), scenario.pending)
    await capture('review')
    await button('Editar aparelho e bateria').click()
    assert.equal(await page.locator('#iphone-battery').inputValue(), '87')
    await page.getByLabel('Não sei a saúde da bateria').check(); await next()
    await button('Editar funcionamento').click()
    await button('Não conheço reparos anteriores').click()
    assert.equal(await page.locator('#iphone-repairParts').count(), 0)
    await next(); await button('Copiar resumo').click()
    const edited = await page.evaluate(() => window.__copy)
    assert.match(edited, /Saúde da bateria: Não sei/)
    assert.doesNotMatch(edited, /— Tela, Bateria/)
    await button('Continuar no WhatsApp').click()
    assert.equal(new URL(await page.evaluate(() => window.__opened)).searchParams.get('text'), edited)
    const tracking = await page.evaluate(() => JSON.stringify(window.dataLayer))
    assert.doesNotMatch(tracking, /NOTA_PRIVADA_CHECKLIST|repairParts|87%/)
    await context.close()
    report.checks.push(`${scenario.model}: original battery, appearance and repair checklist; validation; refresh restore; review edits; exact WhatsApp summary; policy ${scenario.pending ? 'pending' : 'preserved'}`)
  }
  assert.deepEqual(report.errors, [])
  await writeFile(resolve(evidence, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
