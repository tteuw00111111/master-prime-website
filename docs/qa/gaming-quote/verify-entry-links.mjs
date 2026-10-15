import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const base = process.env.QUOTE_QA_BASE ?? 'http://localhost:4178'
const browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
const reports = []
try {
  for (const [path, label, mode] of [
    ['/videogame/ps5-sem-imagem', 'Orçamento de videogame', 'Videogame'],
    ['/controle/correcao-de-drift-e-hall-effect', 'Orçamento de controle', 'Controle'],
  ]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await context.route('https://**/*', route => route.abort())
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    const response = await page.goto(base + path)
    assert.equal(response.status(), 200)
    assert.equal(await page.getByRole('link', { name: 'Falar pelo WhatsApp', exact: true }).getAttribute('target'), '_blank')
    await page.getByRole('link', { name: label, exact: true }).click()
    await page.locator('.quote-next:not([disabled])').waitFor()
    assert.equal(new URL(page.url()).pathname, '/orcamento/videogame')
    assert.equal(await page.getByRole('button', { name: mode, exact: true }).getAttribute('aria-pressed'), 'true')
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://master-prime.com/orcamento/videogame')
    await page.getByRole('button', { name: 'Videogame e controle', exact: true }).click()
    await page.locator('.quote-next').click()
    await page.waitForFunction(() => document.querySelector('.quote-form').dataset.screen === 'console:platform' && document.querySelector('.quote-form').getAttribute('aria-busy') === 'false')
    assert.deepEqual(errors, [])
    reports.push({ path, status: 'pass', checks: ['real service-page entry', 'category preselection', 'customer can change to both', 'same-tab navigation', 'canonical excludes parameters', 'direct WhatsApp preserved'] })
    await context.close()
  }
  const context = await browser.newContext({ javaScriptEnabled: false })
  const response = await context.request.get(base + '/orcamento?source=gaming-qa', { maxRedirects: 0 })
  assert.equal(response.status(), 302)
  assert.equal(response.headers().location, '/orcamento/notebook?source=gaming-qa')
  for (const path of ['/orcamento/videogame?aparelho=controle', '/orcamento/notebook']) {
    const page = await context.newPage()
    await context.route('https://**/*', route => route.abort())
    const result = await page.goto(base + path)
    assert.equal(result.status(), 200)
    assert.equal(await page.locator('h1').count(), 1)
    await page.getByRole('link', { name: 'solicitar seu orçamento pelo WhatsApp', exact: true }).waitFor()
    await page.close()
  }
  await context.close()
  reports.push({ status: 'pass', checks: ['302 preserves query string', 'parameterized gaming route without JavaScript', 'notebook route without JavaScript'] })
} finally { await browser.close() }
await writeFile(`${import.meta.dirname}/entry-links.json`, JSON.stringify({ status: 'pass', base, reports }, null, 2) + '\n')
console.log('Service-page entries, entry presets, canonical, no-JS and legacy redirect passed.')
