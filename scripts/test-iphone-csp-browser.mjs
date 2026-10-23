// Exercise the actual deployment CSP against both self-contained 3D models.
import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'QA must use localhost')
await mkdir('.cache/iphone-final-check', { recursive: true })
const config = JSON.parse(await readFile('vercel.json', 'utf8'))
const csp = config.headers.find(item => item.source === '/orcamento/iphone/:path*').headers.find(header => header.key === 'Content-Security-Policy').value
assert(csp, 'Deployment must define a CSP')
const browser = await chromium.launch({headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--enable-unsafe-swiftshader']})
try {
  for (const model of ['iphone-17-pro-max', 'iphone-18-pro-max']) {
    const context = await browser.newContext({viewport: {width: 390, height: 844}})
    await context.route('**/*', async route => {
      const request = route.request()
      if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname)) return route.fulfill({body: ''})
      if (request.resourceType() !== 'document') return route.continue()
      const response = await route.fetch()
      return route.fulfill({response, headers: {...response.headers(), 'content-security-policy': csp}})
    })
    await context.addInitScript(() => {
      window.fbq = () => {}
      window.__violations = []
      document.addEventListener('securitypolicyviolation', event => window.__violations.push({directive: event.violatedDirective, uri: event.blockedURI}))
      Object.defineProperty(navigator, 'deviceMemory', {value: 8})
      Object.defineProperty(navigator, 'hardwareConcurrency', {value: 8})
      Object.defineProperty(navigator, 'connection', {value: {saveData: false, effectiveType: '4g'}})
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/orcamento/iphone?model=${model}&capacity=256&condition=sealed`)
    await page.waitForFunction(() => document.querySelector('model-viewer')?.loaded && document.querySelector('.iphone-model.is-loaded'), null, {timeout: 30000})
    assert.deepEqual(await page.evaluate(() => window.__violations), [])
    assert.deepEqual(errors, [])
    await page.screenshot({path: `.cache/iphone-final-check/${model}-production-csp.png`})
    console.log(`${model}: production CSP, 3D renderer and model load passed`)
    await context.close()
  }
} finally {await browser.close()}
