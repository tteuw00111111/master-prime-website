// Local-only QA. Configuration is replaced in Vite responses, never in source.
// All external transports, including the entire Tally form, are stubbed.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cspFor } from './qa/iphone-csp.mjs'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4188'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'QA must use localhost')
const evidence = resolve('.cache/iphone-contact-popup')
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined })
const sessionKey = 'master-prime:iphone-contact-popup:shown:v1'
const report = { checks: [], errors: [] }
const enabled = { formId: 'QAonly7', integrationVerified: true }

async function fixture({ configuration = enabled, storageBlocked = false, viewport = { width: 390, height: 844 } } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  const requests = []
  await context.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      if (url.hostname === 'tally.so') {
        requests.push(url.href)
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
          *{box-sizing:border-box}body{margin:0;padding:8px 24px 20px;background:#151515;color:#f5f5f7;font:14px/1.5 system-ui,sans-serif}p{font-size:11px;color:#a5a5ad;margin:0 0 16px}label{display:block;margin:0 0 18px}input:not([type=checkbox]){display:block;width:100%;margin-top:7px;height:45px;border:1px solid #555;border-radius:8px;background:#202020;color:#fff;font-size:16px;padding:8px}label:has([type=checkbox]){font-size:12px;color:#bdbdc4}button{width:100%;height:46px;border:0;border-radius:9px;background:#ffd700;color:#0a0a0a;font-weight:600;font-size:14px}
        </style></head><body><p>QA · Formulário simulado · Não envia dados</p><label>Nome<input name="nome"></label><label>WhatsApp<input name="whatsapp"></label><label><input type="checkbox"> Quero que a equipe Master Prime entre em contato comigo pelo WhatsApp para falar sobre iPhones.</label><button>Solicitar contato</button></body></html>` })
      }
      return route.fulfill({ contentType: 'application/javascript', body: '' })
    }
    if (configuration && url.pathname === '/src/data/iphone-contact-popup.ts') return route.fulfill({ contentType: 'application/javascript', body: `export const IPHONE_CONTACT_POPUP = ${JSON.stringify(configuration)}` })
    if (request.resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    return route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': cspFor(url.href) } })
  })
  await context.addInitScript(({ storageBlocked }) => {
    window.fbq = () => {}
    window.open = () => null
    window.__popupHidden = false
    Object.defineProperty(document, 'hidden', { get: () => window.__popupHidden })
    window.__setHidden = hidden => { window.__popupHidden = hidden; document.dispatchEvent(new Event('visibilitychange')) }
    Object.defineProperty(navigator, 'deviceMemory', { value: 2 })
    window.__csp = []
    document.addEventListener('securitypolicyviolation', event => window.__csp.push({ directive: event.violatedDirective, uri: event.blockedURI }))
    if (storageBlocked) Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked in QA', 'SecurityError') } })
  }, { storageBlocked })
  const page = await context.newPage()
  page.on('pageerror', error => report.errors.push(error.message))
  await page.clock.install()
  await page.clock.pauseAt(new Date(Date.now() + 100))
  await page.goto(`${base}/orcamento/iphone?fbclid=QAonlyPrivateClick_990000&email=private@example.com`, { waitUntil: 'networkidle' })
  await page.locator('.iphone-catalog').waitFor()
  const dialog = page.locator('.iphone-contact-popup')
  if (configuration?.integrationVerified && /^[a-zA-Z0-9]{6,32}$/.test(configuration.formId)) await dialog.waitFor({ state: 'attached' })
  const tick = ms => page.clock.runFor(ms)
  const isOpen = () => dialog.evaluate(node => node.open)
  const scroll = () => page.evaluate(() => {
    const root = document.documentElement
    window.scrollTo(0, Math.ceil((root.scrollHeight - root.clientHeight) * .21))
    window.dispatchEvent(new Event('scroll'))
  })
  return { context, page, dialog, tick, isOpen, scroll, requests }
}

try {
  for (const [name, configuration] of [
    ['inactive-configuration', { formId: '', integrationVerified: false }],
    ['missing-form-id', { formId: '', integrationVerified: true }],
    ['unverified-integration', { formId: 'QAonly7', integrationVerified: false }],
    ['invalid-form-id', { formId: 'https://example.test/private', integrationVerified: true }],
  ]) {
    const f = await fixture({ configuration })
    await f.scroll(); await f.tick(9000)
    assert.equal(await f.dialog.count(), 0)
    assert.deepEqual(f.requests, [], 'Disabled configuration makes zero Tally requests')
    await f.context.close(); report.checks.push(name)
  }
  {
    const f = await fixture()
    assert.equal(await f.isOpen(), false)
    assert.deepEqual(f.requests, [])
    await f.tick(6999); assert.equal(await f.isOpen(), false)
    await f.tick(1); assert.equal(await f.isOpen(), true)
    await f.page.locator('iframe').waitFor()
    await f.page.frameLocator('.iphone-contact-popup-frame').getByRole('button', { name: 'Solicitar contato' }).waitFor()
    assert.deepEqual(f.requests, ['https://tally.so/embed/QAonly7?origin=site_iphone_popup'])
    assert.equal(await f.page.locator('iframe').getAttribute('referrerpolicy'), 'no-referrer')
    assert.equal(await f.page.getByRole('button', { name: 'Fechar convite de contato' }).evaluate(node => node === document.activeElement), true)
    const before = await f.page.evaluate(() => JSON.stringify(window.dataLayer))
    await f.page.evaluate(() => window.postMessage(JSON.stringify({ event: 'Tally.FormSubmitted', payload: { formId: 'QAonly7', fields: [{ answer: { value: 'PRIVATE_PHONE' } }] } }), '*'))
    assert.equal(await f.page.evaluate(() => JSON.stringify(window.dataLayer)), before)
    assert.doesNotMatch(await f.dialog.textContent(), /salvo|recebido|sucesso/i)
    assert.equal(await f.page.evaluate(key => sessionStorage.getItem(key), sessionKey), '1')
    // Vite's development-only HMR websocket is not in the production CSP.
    assert.deepEqual(await f.page.evaluate(() => window.__csp.filter(item => !item.uri.startsWith('ws://127.0.0.1:'))), [])
    await f.page.screenshot({ path: resolve(evidence, 'mobile-390.png') })
    for (let index = 0; index < 8; index++) {
      await f.page.keyboard.press('Tab')
      assert(await f.dialog.evaluate(node => node.contains(document.activeElement) || document.activeElement === document.body), 'Keyboard focus cannot reach the inert page behind the dialog')
    }
    await f.page.frameLocator('.iphone-contact-popup-frame').getByRole('textbox', { name: 'Nome', exact: true }).fill('QA_CONTACT_PRIVATE')
    assert.doesNotMatch(await f.page.evaluate(() => JSON.stringify({ events: window.dataLayer, session: Object.entries(sessionStorage) })), /QA_CONTACT_PRIVATE/)
    // Chromium does not deliver an iframe's Escape to its parent dialog. This
    // cross-origin limitation must be validated with the real form before release.
    await f.page.keyboard.press('Escape'); await f.tick(32); assert.equal(await f.isOpen(), true)
    await f.page.getByRole('button', { name: 'Fechar convite de contato' }).focus()
    await f.page.keyboard.press('Escape'); await f.tick(32); assert.equal(await f.isOpen(), false)
    assert.equal(await f.page.evaluate(() => document.documentElement.style.overflow), '')
    await f.tick(15000); await f.scroll(); assert.equal(await f.isOpen(), false)
    await f.page.reload({ waitUntil: 'networkidle' }); await f.tick(9000)
    assert.equal(await f.isOpen(), false)
    assert.equal(f.requests.length, 1)
    await f.context.close(); report.checks.push('7s visible time, StrictMode, exact static embed URL, CSP, autofocus, keyboard containment, Escape on host, no claimed save/events, session suppression and refresh; Chromium iframe Escape limitation reproduced')
  }
  {
    const f = await fixture()
    const trigger = f.page.getByRole('button', { name: 'Copiar link do catálogo' })
    await trigger.focus()
    await f.scroll(); assert.equal(await f.isOpen(), true)
    await f.page.getByRole('button', { name: 'Fechar convite de contato' }).click()
    assert.equal(await trigger.evaluate(node => node === document.activeElement), true)
    assert.equal(await f.isOpen(), false)
    await f.page.getByRole('link', { name: 'Ver opções de iPhone 17 Pro Max lacrado', exact: true }).click()
    await f.page.locator('.quote-next').waitFor()
    await f.tick(9000); await f.scroll(); assert.equal(await f.isOpen(), false)
    await f.page.goBack(); await f.tick(9000); assert.equal(await f.isOpen(), false)
    await f.context.close(); report.checks.push('20% actual scroll before timer, close button, restored keyboard focus, suppression across catalog/configurator/back')
  }
  {
    const f = await fixture()
    await f.tick(3000)
    await f.page.evaluate(() => window.__setHidden(true))
    await f.tick(60000); assert.equal(await f.isOpen(), false)
    await f.page.evaluate(() => window.__setHidden(false))
    await f.tick(3999); assert.equal(await f.isOpen(), false)
    await f.tick(1); assert.equal(await f.isOpen(), true)
    await f.context.close(); report.checks.push('hidden-tab time excluded; accumulated visible time resumes')
  }
  for (const kind of ['input', 'select', 'textarea', 'contenteditable']) {
    const f = await fixture()
    await f.page.evaluate(kind => {
      const field = document.createElement(kind === 'contenteditable' ? 'div' : kind)
      field.id = 'qa-editing'
      if (kind === 'contenteditable') field.contentEditable = 'true'
      document.body.appendChild(field); field.focus()
    }, kind)
    await f.tick(7000); assert.equal(await f.isOpen(), false)
    await f.scroll(); assert.equal(await f.isOpen(), false)
    await f.page.evaluate(() => {
      const field = document.createElement('input'); field.id = 'qa-second'; document.body.appendChild(field); field.focus()
    })
    await f.tick(1); assert.equal(await f.isOpen(), false)
    await f.page.evaluate(() => document.activeElement.blur())
    await f.tick(1); assert.equal(await f.isOpen(), true)
    await f.context.close(); report.checks.push(`typing deferred for ${kind}, waits through next field then opens after blur`)
  }
  {
    const f = await fixture({ storageBlocked: true, viewport: { width: 320, height: 568 } })
    await f.scroll(); assert.equal(await f.isOpen(), true)
    await f.page.frameLocator('.iphone-contact-popup-frame').getByRole('button', { name: 'Solicitar contato' }).waitFor()
    assert(await f.dialog.evaluate(node => node.scrollWidth <= node.clientWidth))
    assert(await f.dialog.evaluate(node => node.getBoundingClientRect().right <= innerWidth))
    assert(await f.dialog.evaluate(node => node.getBoundingClientRect().bottom <= innerHeight))
    await f.page.screenshot({ path: resolve(evidence, 'mobile-320.png') })
    await f.page.keyboard.press('Escape'); await f.tick(9000); await f.scroll(); assert.equal(await f.isOpen(), false)
    await f.page.getByRole('link', { name: 'Ver opções de iPhone 17 Pro Max lacrado', exact: true }).click()
    await f.tick(9000); assert.equal(await f.isOpen(), false)
    await f.context.close(); report.checks.push('blocked storage uses document memory, 320px viewport no horizontal overflow, navigable after dismissal')
  }
  {
    const f = await fixture({ viewport: { width: 1440, height: 10000 } })
    assert.equal(await f.page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight), 0)
    await f.page.evaluate(() => window.dispatchEvent(new Event('scroll')))
    await f.tick(1); assert.equal(await f.isOpen(), false)
    await f.tick(6999); assert.equal(await f.isOpen(), true)
    await f.context.close(); report.checks.push('short page and stationary scroll do not trigger; visible-time fallback remains')
  }
  {
    const f = await fixture()
    await f.tick(3500)
    await f.page.getByRole('link', { name: 'Ver opções de iPhone 17 Pro Max lacrado', exact: true }).click()
    await f.tick(3499); assert.equal(await f.isOpen(), false)
    await f.tick(1); assert.equal(await f.isOpen(), true)
    await f.context.close(); report.checks.push('catalog-to-configurator retains the same mounted timer')
  }
  assert.deepEqual(report.errors, [])
  await writeFile(resolve(evidence, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
