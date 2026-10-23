// Local-only QA: no real Clarity/Pixel/GTM SDK, collect, API or WhatsApp traffic.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = new URL(process.env.IPHONE_QA_URL || 'http://127.0.0.1:4186')
assert(['localhost', '127.0.0.1'].includes(base.hostname), 'QA must use localhost')
const evidence = resolve(process.env.IPHONE_CLARITY_EVIDENCE || '.cache/iphone-clarity')
await mkdir(evidence, { recursive: true })
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
const globalCsp = config.headers.find(rule => rule.source === '/(.*)').headers.find(h => h.key === 'Content-Security-Policy').value
const purchaseCsp = config.headers.find(rule => rule.source === '/orcamento/iphone/:path*').headers.find(h => h.key === 'Content-Security-Policy').value
assert.equal(purchaseCsp, globalCsp.replace('https://www.clarity.ms;', 'https://www.clarity.ms https://scripts.clarity.ms;').replace('https://*.ggpht.com;', 'https://*.ggpht.com https://c.clarity.ms;'))
const report = { checks: [], requests: [], errors: [], realExternalAllowed: 0, realApiAllowed: 0 }
const tag = 'https://www.clarity.ms/tag/v6kk9ke9ye'
const runtime = 'https://scripts.clarity.ms/qa-stub/clarity.js'
const tagStub = `window.__qaClarityTagUrl = location.href;
const s = document.createElement('script'); s.src = '${runtime}'; document.head.appendChild(s);`
const runtimeStub = `window.__qaClarityCalls = [...(window.clarity.q || [])].map(a => [...a]);
window.clarity = (...args) => window.__qaClarityCalls.push(args);
window.__qaClarityRuntime = true;
fetch('https://k.clarity.ms/collect', {method:'POST',body:'QA_STUB_NO_SESSION'});
const pixel = new Image(); pixel.src = 'https://c.clarity.ms/c.gif';`
const contextFor = async engine => {
  const context = await engine.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' })
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    const record = { host: url.hostname, path: url.pathname, method: request.method(), action: '' }
    report.requests.push(record)
    if (url.origin === base.origin && request.method() === 'GET' && !url.pathname.startsWith('/api/')) {
      record.action = 'local-get'
      if (request.resourceType() !== 'document') return route.continue()
      const response = await route.fetch()
      const csp = /^\/orcamento\/iphone(?:\/|$)/.test(url.pathname) ? purchaseCsp : globalCsp
      return route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } })
    }
    record.action = 'stub-or-block'
    if (url.href === tag) return route.fulfill({ contentType: 'application/javascript', body: tagStub })
    if (url.href === runtime) return route.fulfill({ contentType: 'application/javascript', body: runtimeStub })
    if (url.href === 'https://c.clarity.ms/c.gif') return route.fulfill({ contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') })
    if (url.hostname === 'k.clarity.ms' && url.pathname === '/collect') {
      assert.equal(request.postData(), 'QA_STUB_NO_SESSION')
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  })
  await context.addInitScript(() => {
    window.__qaPixel = []; window.__qaOpen = []; window.__qaViolations = []
    const fbq = (...args) => window.__qaPixel.push(args)
    fbq.callMethod = fbq
    window.fbq = fbq
    window.open = (...args) => { window.__qaOpen.push(args); return null }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('QA copy fallback') } } })
    Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } })
    document.addEventListener('securitypolicyviolation', event => window.__qaViolations.push({ directive: event.violatedDirective, uri: event.blockedURI }))
  })
  const page = await context.newPage()
  page.on('pageerror', error => report.errors.push(error.message))
  return { context, page }
}
const load = async (page, path, expectRuntime = true) => {
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' })
  if (expectRuntime) await page.waitForFunction(() => window.__qaClarityRuntime)
  else await page.waitForFunction(() => window.__qaClarityTagUrl)
  assert.equal(await page.locator(`script[src="${tag}"]`).count(), 1)
  assert.equal(await page.locator(`script[src="${runtime}"]`).count(), 1)
}
const assertMask = async page => {
  assert.equal(await page.locator('form.quote-form[data-clarity-mask="true"].clarity-mask').count(), 1)
  assert.equal(await page.locator('[data-clarity-unmask]').count(), 0)
  assert.equal(await page.locator('form input, form select, form textarea, form button').evaluateAll(nodes => nodes.every(el => !!el.closest('[data-clarity-mask="true"]'))), true)
  assert.equal(await page.locator('input[name="name"], input[type="tel"], input[type="email"], [contenteditable="true"]').count(), 0)
  assert.deepEqual(await page.evaluate(() => window.__qaClarityCalls), [], 'no custom Clarity calls or personal identifiers')
  assert.deepEqual(await page.evaluate(() => window.__qaViolations), [])
}
const assertPurchaseTags = async page => {
  const result = await page.evaluate(() => ({
    scripts: [...document.scripts].map(s => s.src), pixel: window.__qaPixel,
    noscript: [...document.querySelectorAll('noscript')].map(el => el.textContent).join(''),
    tagUrl: window.__qaClarityTagUrl,
  }))
  assert(!result.scripts.some(s => /googletagmanager/.test(s)))
  assert.doesNotMatch(result.noscript, /googletagmanager|facebook\.com\/tr/)
  const setIndex = result.pixel.findIndex(a => a[0] === 'set' && a[1] === 'autoConfig' && a[2] === false && a[3] === '1430740015202870')
  assert(setIndex >= 0 && setIndex < result.pixel.findIndex(a => a[0] === 'init'))
  assert.equal(result.pixel.filter(a => a[0] === 'init').length, 1)
  assert.doesNotMatch(result.tagUrl, /QA_PRIVATE|name=|phone=|notes=|#/)
  assert.doesNotMatch(await page.evaluate(() => JSON.stringify({ pixel: window.__qaPixel, dataLayer: window.dataLayer })), /QA_PRIVATE/)
}
const goReview = async page => {
  await page.getByRole('button', { name: 'Continuar', exact: true }).waitFor()
  await assertMask(page)
  await page.locator('.iphone-color').filter({ hasText: 'Laranja' }).click()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.getByRole('heading', { name: 'Como pretende pagar?', exact: true }).waitFor()
  await assertMask(page)
  await page.getByRole('button', { name: 'À vista', exact: true }).click()
  await page.getByRole('button', { name: 'Pix', exact: true }).click()
  await page.getByRole('button', { name: 'Revisar consulta', exact: true }).click()
  await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
  await assertMask(page)
  await page.getByRole('button', { name: 'Copiar resumo', exact: true }).click()
  await page.locator('#iphone-copy').waitFor()
  assert.equal(await page.locator('#iphone-copy').evaluate(el => !!el.closest('[data-clarity-mask="true"]')), true)
  await page.getByRole('button', { name: 'Continuar no WhatsApp', exact: true }).click()
  assert.equal(await page.evaluate(() => window.__qaOpen.length), 1)
  await assertPurchaseTags(page)
}
const chromiumBrowser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined })
try {
  const { context, page } = await contextFor(chromiumBrowser)
  await load(page, '/orcamento/iphone?name=QA_PRIVATE_NAME&phone=QA_PRIVATE_PHONE&notes=QA_PRIVATE_NOTE#QA_PRIVATE_HASH')
  await page.getByRole('heading', { level: 1, name: 'Seu próximo iPhone.' }).waitFor()
  await assertPurchaseTags(page)
  await page.getByRole('link', { name: 'Ver opções de iPhone 17 Pro Max lacrado', exact: true }).click()
  await goReview(page)
  await page.screenshot({ path: resolve(evidence, 'review-masked.png') })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
  await assertMask(page)
  await page.getByRole('link', { name: 'Ver todos os iPhones' }).click()
  await page.goBack()
  await page.getByRole('heading', { name: 'Confira sua consulta.', exact: true }).waitFor()
  await assertMask(page)
  await assertPurchaseTags(page)
  report.checks.push('Chromium: catalog, form steps, review, copy fallback, intercepted handoff, reload/back; masks, one loader, GTM off, autoConfig false, private query/hash removed before Clarity')
  await context.close()
  const direct = await contextFor(chromiumBrowser)
  await load(direct.page, '/orcamento/iphone/?model=iphone-17-pro-max&capacity=256&condition=sealed&name=QA_PRIVATE_NAME&notes=QA_PRIVATE_NOTE')
  await goReview(direct.page)
  await direct.context.close()
  report.checks.push('Chromium: direct link and trailing slash preserve protections')
  for (const path of ['/', '/orcamento/celular']) {
    const repair = await contextFor(chromiumBrowser)
    await load(repair.page, path, false)
    assert.equal(await repair.page.locator('script[src*="googletagmanager.com/gtm.js"]').count(), 1)
    assert.equal(await repair.page.evaluate(() => window.__qaPixel.some(a => a[0] === 'set' && a[1] === 'autoConfig')), false)
    const violations = await repair.page.evaluate(() => window.__qaViolations)
    assert(violations.every(v => [runtime, 'https://c.clarity.ms/c.gif'].includes(v.uri)), 'outside purchase, only pre-existing Clarity CSP blocks may occur')
    await repair.context.close()
  }
  report.checks.push('Home and repair: original GTM/Pixel/Clarity bootstrap and global CSP preserved')
} finally { await chromiumBrowser.close() }
const safari = await webkit.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE || undefined })
try {
  const { context, page } = await contextFor(safari)
  await load(page, '/orcamento/iphone?model=iphone-17-pro-max&capacity=256&condition=sealed&phone=QA_PRIVATE_PHONE')
  await goReview(page)
  report.checks.push('WebKit: direct flow, Clarity tag/runtime/collect/image stubs under purchase CSP; form/review/copy masks, GTM off')
  await context.close()
} finally { await safari.close() }
assert.deepEqual(report.errors, [])
await writeFile(resolve(evidence, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ checks: report.checks, errors: report.errors, interceptedRequests: report.requests.length, realExternalAllowed: 0, realApiAllowed: 0 }, null, 2))
