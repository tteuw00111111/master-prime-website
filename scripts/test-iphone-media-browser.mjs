// Local-only media and layout regression checks; no analytics or messages leave the browser.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.IPHONE_QA_URL || 'http://127.0.0.1:4178'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const evidence = resolve('.cache/iphone-refine')
await mkdir(evidence, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--enable-unsafe-swiftshader'] })
const report = { checks: [], errors: [], layouts: [] }
const setup = async (options = {}) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', ...options })
  await context.route('**/*', r => ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.fulfill({ body: '' }))
  await context.addInitScript(() => { window.fbq = () => {}; window.open = () => null })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 })
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 })
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: false, effectiveType: '4g' } })
  })
  const page = await context.newPage()
  page.on('pageerror', e => report.errors.push(e.message))
  return { page, context }
}
const enter = async (p, photos = true) => {
  await p.goto(`${base}/orcamento/iphone?model=iphone-17-pro-max&capacity=256&condition=sealed`, { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => document.querySelector('.quote-next') && !document.querySelector('.quote-next').disabled)
  if (photos) await button(p, 'Voltar às fotos').click()
}
const button = (p, name) => p.getByRole('button', { name, exact: true })
const color = (p, name) => p.locator('.iphone-color').filter({ hasText: name })
const frame = (p, name, view = 'front') => p.waitForFunction(({ name, view }) => {
  const e = document.querySelector('.iphone-gallery-image.active')
  return e?.dataset.color === name && e.dataset.angle === view && e.complete && e.naturalWidth > 0
}, { name, view })
const capture = async (p, name, fullPage = false) => {
  // Allow the renderer's final full-resolution frame after camera/variant updates.
  if (await p.locator('.iphone-model.is-loaded').count()) await p.locator('model-viewer').evaluate(async e => {
    await e.updateComplete; e.jumpCameraToGoal()
    for (let i = 0; i < 15; i++) await new Promise(requestAnimationFrame)
  })
  await p.screenshot({ path: resolve(evidence, `${name}.png`), fullPage })
}
const loaded = p => p.waitForFunction(() => document.querySelector('model-viewer')?.loaded && document.querySelector('.iphone-model.is-loaded'), null, { timeout: 30000 })

try {
  const { page: p, context } = await setup()
  const mediaRequests = []
  p.on('request', r => { if (/\.glb|model-viewer|modelviewer/i.test(r.url())) mediaRequests.push(r.url()) })
  await enter(p, false); await loaded(p)
  assert.equal(mediaRequests.filter(u => u.includes('.glb')).length, 1, 'default 3D loads one model')
  assert.equal(await p.locator('.iphone-color[aria-pressed="true"]').count(), 0)
  for (const [width, height] of [[390, 844], [320, 568], [768, 1024], [1440, 1000]]) {
    await p.setViewportSize({ width, height }); await p.evaluate(() => window.scrollTo(0, 0))
    await capture(p, `after-${width}`)
    const layout = await p.evaluate(() => ({
      width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
      capacityBottom: document.querySelector('.iphone-capacity-choice').getBoundingClientRect().bottom,
      actionTop: document.querySelector('.quote-actions').getBoundingClientRect().top,
    }))
    assert.equal(layout.overflow, false)
    if (width === 390) assert(layout.capacityBottom < layout.actionTop, 'capacity fully visible on entry')
    report.layouts.push(layout)
  }
  await p.setViewportSize({ width: 390, height: 844 })
  await p.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await capture(p, 'text-200', true)
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await p.evaluate(() => { document.documentElement.style.fontSize = '' })
  await capture(p, 'after-full-mobile', true)
  await button(p, 'Voltar às fotos').click()
  // Browser focus must leave each choice above the fixed bottom bar, even after it grows.
  for (const name of ['Laranja', 'Prateado', 'Azul']) {
    await color(p, name).focus()
    await color(p, name).press('Space')
    await p.waitForFunction(() => {
      const e = document.activeElement.getBoundingClientRect()
      return e.top >= 0 && e.bottom <= document.querySelector('.quote-actions').getBoundingClientRect().top
    })
  }
  await p.evaluate(() => {
    const find = text => [...document.querySelectorAll('.iphone-color')].find(e => e.textContent.includes(text))
    find('Laranja').click(); find('Azul').click(); find('Prateado').click()
    const buttons = [...document.querySelectorAll('.iphone-gallery-views button')]
    buttons.find(e => e.textContent === 'Detalhes').click()
    buttons.find(e => e.textContent === 'Visão geral').click()
  })
  await frame(p, 'silver')
  report.checks.push('390/320/tablet/desktop, 200% text, focus above changing action bar; rapid image/color changes settle on the last choice')

  await p.setViewportSize({ width: 1440, height: 1000 })
  const height = await p.locator('.iphone-gallery-stage').evaluate(e => e.clientHeight)
  await button(p, 'Explorar em 3D').click(); await loaded(p)
  assert.equal(await p.locator('.iphone-gallery-stage').evaluate(e => e.clientHeight), height)
  assert.equal(mediaRequests.filter(u => u.includes('.glb')).length, 1)
  await button(p, 'Câmeras').click()
  const orbit = await p.locator('model-viewer').evaluate(e => { e.jumpCameraToGoal(); return { ...e.getCameraOrbit() } })
  for (const [name, variant] of [['Laranja', 'orange'], ['Azul', 'blue'], ['Prateado', 'silver']]) {
    await p.locator('model-viewer').evaluate(e => { window.__variantApplied = new Promise(resolve => e.addEventListener('variant-applied', resolve, { once: true })) })
    await color(p, name).click()
    await p.evaluate(() => window.__variantApplied.then(() => { window.__variantApplied = null }))
    assert.equal(await p.locator('model-viewer').evaluate(e => e.variantName), variant)
    const current = await p.locator('model-viewer').evaluate(e => ({ ...e.getCameraOrbit() }))
    assert.deepEqual(current, orbit, 'finish changes preserve camera position')
    await capture(p, `3d-${variant}-cameras`)
  }
  await button(p, 'Traseira').click(); await capture(p, '3d-silver-back')
  await button(p, 'Frente').click(); await capture(p, '3d-silver-front')
  assert.equal(await p.locator('model-viewer').getAttribute('touch-action'), 'pan-y')
  await p.locator('.quote-next').click()
  await p.waitForFunction(() => document.activeElement?.tagName === 'H2')
  await button(p, 'Voltar').click()
  await loaded(p)
  await button(p, 'Voltar às fotos').click()
  await frame(p, 'silver')
  assert.equal(mediaRequests.filter(u => u.includes('.glb')).length, 1)
  report.checks.push('Default 3D loads one cached GLB; three finishes; presets; camera retained across colors; stable gallery; leaving/re-entering preserves selection')
  await context.close()

  const missing = await setup()
  await missing.context.route('**/*detail*.webp', r => r.abort())
  await enter(missing.page); await button(missing.page, 'Detalhes').click()
  await missing.page.getByText('Esta imagem não está disponível.', { exact: true }).waitFor()
  await button(missing.page, 'Visão geral').click(); await frame(missing.page, 'orange')
  await missing.context.unroute('**/*detail*.webp')
  await button(missing.page, 'Detalhes').click(); await button(missing.page, 'Tentar novamente').click(); await frame(missing.page, 'orange', 'detail')
  await missing.context.close()
  report.checks.push('A failed detail image does not disable overview; retry restores the individual view')

  const slow = await setup()
  let release, requested
  const gate = new Promise(resolve => { release = resolve })
  const requestSeen = new Promise(resolve => { requested = resolve })
  await slow.context.route('**/*.glb', async r => { requested(); await gate; await r.continue() })
  await enter(slow.page, false); await requestSeen
  assert(await slow.page.locator('.iphone-model-poster').isVisible())
  await color(slow.page, 'Azul').click()
  assert(await slow.page.locator('.quote-next').isEnabled())
  release(); await loaded(slow.page)
  assert.equal(await slow.page.locator('model-viewer').evaluate(e => e.variantName), 'blue')
  await slow.context.close()
  report.checks.push('Throttled GLB keeps poster and active configuration; latest finish used after load')

  const touch = await setup({ isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  await enter(touch.page, false); await loaded(touch.page)
  const cdp = await touch.context.newCDPSession(touch.page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 310 }] })
  for (const y of [285, 260, 235, 210, 185]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await touch.page.waitForFunction(() => scrollY > 40)
  await touch.page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  const beforeDrag = await touch.page.locator('model-viewer').evaluate(e => e.getCameraOrbit().theta)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 140, y: 240 }] })
  for (const x of [160, 180, 200, 220, 240]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 240 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await touch.page.waitForFunction(theta => Math.abs(document.querySelector('model-viewer').getCameraOrbit().theta - theta) > .1, beforeDrag)
  await capture(touch.page, 'mobile-touch-3d')
  await touch.context.close()
  report.checks.push('Emulated mobile touch: vertical swipe scrolls page over viewer; horizontal drag rotates phone')

  for (const hint of ['memory', 'cpu', 'connection', 'saveData']) {
    const light = await setup()
    await light.page.addInitScript(hint => {
      if (hint === 'memory') Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 })
      if (hint === 'cpu') Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 2 })
      if (hint === 'connection' || hint === 'saveData') Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: hint === 'saveData', effectiveType: hint === 'connection' ? '3g' : '4g' } })
    }, hint)
    const downloads = []
    light.page.on('request', r => { if (/\.glb|model-viewer/i.test(r.url())) downloads.push(r.url()) })
    await light.page.goto(`${base}/orcamento/iphone?model=iphone-17-pro-max&capacity=256&condition=sealed`, { waitUntil: 'networkidle' })
    await frame(light.page, 'orange')
    assert.deepEqual(downloads, [], `${hint}: no automatic 3D download`)
    assert.equal(await light.page.locator('.iphone-color[aria-pressed="true"]').count(), 0)
    if (hint === 'memory') {
      await capture(light.page, 'low-memory-photos')
      await button(light.page, 'Explorar em 3D').click(); await loaded(light.page)
    }
    await light.context.close()
  }
  report.checks.push('Low memory, two CPU threads, slow connection and Data Saver avoid automatic 3D downloads; manual 3D still works')

  for (const mode of ['model-failure', 'no-webgl']) {
    const fail = await setup()
    if (mode === 'model-failure') await fail.context.route('**/*.glb', r => r.abort())
    else await fail.context.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /webgl/.test(type) ? null : get.call(this, type, ...args) }
    })
    await enter(fail.page, false)
    await fail.page.getByText('3D indisponível. Você pode continuar pelas fotos.', { exact: true }).waitFor({ timeout: 30000 })
    await capture(fail.page, mode)
    await button(fail.page, 'Voltar às fotos').click(); await frame(fail.page, 'orange')
    await color(fail.page, 'Laranja').click(); await fail.page.locator('.quote-next').click()
    await fail.page.getByRole('heading', { name: 'Como pretende pagar?', exact: true }).waitFor()
    await fail.context.close()
    report.checks.push(`${mode}: poster, return-to-photos and qualification remain usable`)
  }
  assert.deepEqual(report.errors, [])
  await writeFile(resolve(evidence, 'media-report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
