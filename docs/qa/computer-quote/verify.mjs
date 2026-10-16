import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const axeScript = process.env.PLAYWRIGHT_MODULE ? new URL('../axe-core/axe.min.js', process.env.PLAYWRIGHT_MODULE).pathname : new URL(import.meta.resolve('axe-core/axe.min.js')).pathname
const base = process.env.QUOTE_QA_BASE ?? 'http://127.0.0.1:4186'
const dir = import.meta.dirname
const key = 'master-prime:computer-quote:v1'
const reports = []
const engines = process.env.COMPUTER_QA_CHROMIUM_ONLY ? [['chromium', chromium]] : [['chromium', chromium], ['webkit', webkit]]
const sizes = process.env.COMPUTER_QA_QUICK ? [[390, 844, false]] : [[320, 568, true], [390, 844, false], [430, 932, false], [1440, 1000, false]]

const instrument = context => context.addInitScript(() => {
  window.openedQuotes = []
  window.open = (...args) => { window.openedQuotes.push(args); return null }
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard unavailable') } } })
  window.quoteMotionFrames = []
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.quote-form')
    if (!form) return
    let recording = false
    new MutationObserver(() => {
      if (form.getAttribute('aria-busy') !== 'true' || recording) return
      recording = true
      const record = () => {
        const element = document.querySelector('.quote-step')
        if (element) {
          const style = getComputedStyle(element)
          window.quoteMotionFrames.push({ screen: form.dataset.screen, x: style.transform === 'none' ? 0 : new DOMMatrixReadOnly(style.transform).m41, opacity: Number(style.opacity) })
        }
        if (form.getAttribute('aria-busy') === 'true') requestAnimationFrame(record)
        else recording = false
      }
      requestAnimationFrame(record)
    }).observe(form, { attributes: true, attributeFilter: ['aria-busy'] })
  })
})
const stable = (page, screen) => page.waitForFunction(expected => {
  const form = document.querySelector('.quote-form')
  return form?.dataset.screen === expected && form.getAttribute('aria-busy') === 'false' && !document.querySelector('.quote-next').disabled && document.querySelector('.quote-step h2') === document.activeElement
}, screen)
const next = async (page, screen) => { await page.locator('.quote-next').click(); await stable(page, screen) }
const pick = (page, name) => page.getByRole('button', { name, exact: true }).click()
const assertNoOverflow = async page => assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'horizontal overflow')
const capture = async (page, path, fullPage = false) => {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})))
  })
  await page.screenshot({ path, fullPage })
}
const axe = async page => {
  await page.addScriptTag({ path: axeScript })
  const result = await page.evaluate(async () => window.axe.run({ include: ['.quote-header', '.quote-layout'] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }))
  assert.deepEqual(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })), [])
}

for (const [engineName, engine] of engines) {
  const browser = await engine.launch(engineName === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
  try {
    for (const [width, height, reduced] of sizes) {
      const label = `${engineName}-${width}`
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await context.route('https://**/*', route => route.abort())
      await instrument(context)
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        const response = await page.goto(base + '/orcamento/computador')
        assert.equal(response.status(), 200)
        await page.locator('.quote-next:not([disabled])').waitFor()
        assert.equal(await page.locator('h1').count(), 1)
        assert.equal(await page.getByText('Montar PC gamer', { exact: true }).count(), 0)
        await assertNoOverflow(page)
        await capture(page, `${dir}/${label}-entry.png`)
        await page.locator('.quote-next').click()
        await page.waitForFunction(() => document.activeElement?.id === 'quote-kind')
        await pick(page, width === 320 || width === 430 ? 'Computador' : 'PC gamer')
        await next(page, 'configuration')
        assert.equal(await page.locator('#quote-configuration').getAttribute('maxlength'), '300')
        if (width !== 320) await page.locator('#quote-configuration').fill('Ryzen, 16 GB de RAM — configuração informada')
        await capture(page, `${dir}/${label}-configuration.png`)
        await next(page, 'issues')
        await page.locator('.quote-next').click()
        await page.waitForFunction(() => document.activeElement?.id === 'quote-issues')
        for (const name of ['Não liga', 'Upgrade de SSD', 'Upgrade de memória RAM', 'Formatação / sistema']) await pick(page, name)
        await page.locator('.quote-form-heading').scrollIntoViewIfNeeded()
        await assertNoOverflow(page)
        await capture(page, `${dir}/${label}-issues.png`)
        await axe(page)
        await next(page, 'question:power-signs')
        await pick(page, 'Acende luzes ou gira as ventoinhas')
        await next(page, 'question:upgrade-goal')
        await page.getByRole('checkbox', { name: 'Mais espaço para arquivos', exact: true }).click()
        await page.getByRole('checkbox', { name: 'Usar vários programas ao mesmo tempo', exact: true }).click()
        assert.equal(await page.getByRole('checkbox', { checked: true }).count(), 2)
        await next(page, 'question:preserve-files')
        await pick(page, 'Sim')
        await next(page, 'notes')
        await page.locator('#quote-notes').fill('Começou após atualização. Preservar os arquivos.')
        await page.reload()
        await page.locator('.quote-next:not([disabled])').waitFor()
        assert.equal(await page.locator('.quote-form').getAttribute('data-screen'), 'notes')
        assert.equal(await page.locator('#quote-notes').inputValue(), 'Começou após atualização. Preservar os arquivos.')
        await pick(page, 'Pular detalhes')
        await stable(page, 'delivery')
        await pick(page, 'Consultar retirada e entrega')
        await next(page, 'neighborhood')
        await page.locator('.quote-next').click()
        await page.waitForFunction(() => document.activeElement?.id === 'quote-neighborhood')
        await page.locator('#quote-neighborhood').fill('Campo Grande')
        await next(page, 'city')
        assert.equal(await page.locator('#quote-city').inputValue(), 'Rio de Janeiro')
        await page.locator('#quote-city').fill('')
        await page.locator('.quote-next').click()
        await page.waitForFunction(() => document.activeElement?.id === 'quote-city')
        await page.locator('#quote-city').fill('Rio de Janeiro')
        await next(page, 'review')
        await assertNoOverflow(page)
        await axe(page)
        await capture(page, `${dir}/${label}-review.png`, true)
        assert((await page.locator('.quote-review').innerText()).includes('Acende luzes ou gira as ventoinhas'))
        assert.equal(await page.locator('.quote-review-question').filter({ hasText: 'O que você gostaria de melhorar?' }).count(), 1)
        await pick(page, 'Copiar resumo')
        const fallback = page.getByRole('textbox', { name: 'Resumo para copiar' })
        await fallback.waitFor()
        assert((await fallback.inputValue()).includes('Campo Grande'))
        await fallback.focus()
        assert(await fallback.evaluate(element => element.selectionEnd === element.value.length && element.selectionStart === 0))
        await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedQuote = text } } }))
        await pick(page, 'Copiar resumo')
        await page.getByText('Resumo copiado!', { exact: true }).waitFor()
        assert((await page.evaluate(() => window.copiedQuote)).includes('Formatação / sistema'))

        await pick(page, 'Editar problemas e solicitações')
        await stable(page, 'issues')
        await pick(page, 'Não liga')
        await next(page, 'review')
        assert(!(await page.locator('.quote-review').innerText()).includes('Acende luzes ou gira as ventoinhas'))
        await pick(page, 'Editar atendimento')
        await stable(page, 'delivery')
        await page.reload()
        await page.locator('.quote-next:not([disabled])').waitFor()
        assert.equal(await page.locator('.quote-form').getAttribute('data-screen'), 'delivery')
        assert.equal(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).editScope, key), 'delivery')
        await pick(page, 'Levar à loja Campo Grande, Rio de Janeiro')
        assert.equal(await page.locator('.quote-next').innerText(), 'Salvar e ver resumo')
        await next(page, 'review')
        assert(!(await page.locator('.quote-review').innerText()).includes('Campo Grande · Rio de Janeiro'))
        assert.equal(await page.evaluate(() => window.openedQuotes.length), 0)
        assert.equal(await page.locator('a[href*="Come%C3%A7ou"]').count(), 0)
        await page.locator('.quote-next').click()
        await page.getByText('Continue na conversa do WhatsApp.', { exact: true }).waitFor()
        const opened = await page.evaluate(() => window.openedQuotes)
        assert.equal(opened.length, 1)
        assert.deepEqual(opened[0].slice(1), ['_blank', 'noopener,noreferrer'])
        const url = new URL(opened[0][0])
        const message = url.searchParams.get('text')
        assert.equal(url.searchParams.get('phone'), '5521967635340')
        assert(message.includes('Começou após atualização. Preservar os arquivos.'))
        assert(!message.includes('Bairro:') && !message.includes('Cidade:'))
        assert(!message.includes('Acende luzes ou gira as ventoinhas'))
        await page.locator('.quote-next').click()
        assert.equal(await page.evaluate(() => window.openedQuotes.length), 2)
        const events = await page.evaluate(() => (window.dataLayer ?? []).filter(event => String(event.event).startsWith('quote_')))
        assert(events.some(event => event.event === 'quote_whatsapp_click'))
        for (const event of events) {
          assert.deepEqual(Object.keys(event).sort(), ['event', 'quote_category', 'quote_step'])
          assert.equal(event.quote_category, 'computador')
        }
        assert.equal(await page.locator('.quote-private[data-clarity-mask="true"]').count(), 1)
        const frames = await page.evaluate(() => window.quoteMotionFrames)
        if (reduced) assert(frames.every(frame => Math.abs(frame.x) < 0.1))
        else assert(frames.some(frame => Math.abs(frame.x) > 0.5 && Math.abs(frame.x) < 28), 'animated transition missing')
        await writeFile(`${dir}/${label}-motion.json`, JSON.stringify({ reduced, frames }, null, 2) + '\n')
        assert.deepEqual(errors, [])
        reports.push({ engine: engineName, width, reducedMotion: reduced, status: 'pass', checks: ['full journey', 'validation focus', 'optional hardware', 'multiple requests', 'shared upgrade question', 'draft and edit restoration', 'scoped edits', 'obsolete answers removed', 'pickup and store', 'copy success and fallback', 'WhatsApp intercepted', 'private tracking', 'motion', 'axe', 'no overflow'] })
        console.log(`${label}: full journey passed`)
      } catch (error) {
        await page.screenshot({ path: `${dir}/${label}-failure.png`, fullPage: true })
        throw error
      } finally { await context.close() }
    }

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await context.route('https://**/*', route => route.abort())
    await instrument(context)
    const page = await context.newPage()
    for (const [path, label, selected] of [
      ['/conserto-de-computador-campo-grande-rj', 'Orçamento de computador', false],
      ['/manutencao-de-pc-gamer', 'Orçamento de PC gamer', true],
      ['/upgrade-de-pc-gamer', 'Orçamento de PC gamer', true],
    ]) {
      await page.goto(base + path)
      // Clear on the service page, where no quote hydration can rewrite storage.
      await page.evaluate(key => sessionStorage.removeItem(key), key)
      assert.equal(await page.getByRole('link', { name: 'Falar pelo WhatsApp', exact: true }).getAttribute('target'), '_blank')
      await page.getByRole('link', { name: label, exact: true }).click()
      await page.locator('.quote-next:not([disabled])').waitFor()
      assert.equal(new URL(page.url()).pathname, '/orcamento/computador')
      assert.equal(await page.getByRole('button', { name: 'PC gamer', exact: true }).getAttribute('aria-pressed'), String(selected))
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://master-prime.com/orcamento/computador')
    }
    // Saved answers take precedence over URL presets, and all quote keys remain isolated.
    await pick(page, 'Computador')
    await next(page, 'configuration')
    await page.evaluate(() => {
      sessionStorage.setItem('master-prime:notebook-quote:v1', 'notebook-marker')
      sessionStorage.setItem('master-prime:gaming-quote:v1', 'gaming-marker')
      sessionStorage.setItem('master-prime:smartphone-quote:v1', 'smartphone-marker')
    })
    await page.goto(base + '/orcamento/computador?tipo=pc-gamer')
    await page.locator('.quote-next:not([disabled])').waitFor()
    assert.equal(await page.locator('.quote-form').getAttribute('data-screen'), 'configuration')
    const saved = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key)
    assert.equal(saved.draft.kind, 'desktop')
    assert.equal(await page.evaluate(() => sessionStorage.getItem('master-prime:smartphone-quote:v1')), 'smartphone-marker')
    assert.equal(await page.evaluate(() => sessionStorage.getItem('master-prime:notebook-quote:v1')), 'notebook-marker')
    assert.equal(await page.evaluate(() => sessionStorage.getItem('master-prime:gaming-quote:v1')), 'gaming-marker')
    // Unknown computer and request-only path, using the keyboard.
    await page.evaluate(key => sessionStorage.removeItem(key), key)
    await page.goto(base + '/orcamento/computador')
    await page.locator('.quote-next:not([disabled])').waitFor()
    await page.getByRole('button', { name: 'Não sei dizer', exact: true }).focus()
    await page.keyboard.press('Space')
    await next(page, 'configuration')
    await next(page, 'issues')
    await pick(page, 'Limpeza e manutenção')
    await next(page, 'notes')
    await pick(page, 'Pular detalhes')
    await stable(page, 'delivery')
    await pick(page, 'Combinar pelo WhatsApp')
    await next(page, 'review')
    assert((await page.locator('.quote-review').innerText()).includes('Computador (tipo a identificar)'))
    reports.push({ engine: engineName, status: 'pass', checks: ['real entry links', 'PC gamer preset', 'saved draft wins preset', 'draft key isolation', 'keyboard unknown kind', 'request-only path'] })
    await context.close()

    const storageContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
    await storageContext.route('https://**/*', route => route.abort())
    await instrument(storageContext)
    await storageContext.addInitScript(() => {
      for (const method of ['getItem', 'setItem', 'removeItem']) Storage.prototype[method] = () => { throw new Error('Storage unavailable') }
    })
    const storagePage = await storageContext.newPage()
    await storagePage.goto(base + '/orcamento/computador?tipo=pc-gamer')
    await storagePage.locator('.quote-next:not([disabled])').waitFor()
    assert.equal(await storagePage.getByRole('button', { name: 'PC gamer', exact: true }).getAttribute('aria-pressed'), 'true')
    await storagePage.locator('.quote-next').evaluate(button => { button.click(); button.click(); button.click() })
    await stable(storagePage, 'configuration')
    await next(storagePage, 'issues')
    await pick(storagePage, 'Outro problema')
    await next(storagePage, 'notes')
    await next(storagePage, 'delivery')
    await pick(storagePage, 'Combinar pelo WhatsApp')
    await next(storagePage, 'review')
    await storagePage.locator('.quote-next').click()
    assert.equal(await storagePage.evaluate(() => window.openedQuotes.length), 1)
    reports.push({ engine: engineName, status: 'pass', checks: ['unavailable storage', 'preset without storage', 'rapid transition clicks', 'WhatsApp without persistence'] })
    await storageContext.close()

    const noJs = await browser.newContext({ javaScriptEnabled: false })
    await noJs.route('https://**/*', route => route.abort())
    for (const path of ['/orcamento/computador', '/orcamento/computador?tipo=pc-gamer', '/orcamento/notebook', '/orcamento/videogame']) {
      const page = await noJs.newPage()
      const response = await page.goto(base + path)
      assert.equal(response.status(), 200)
      assert.equal(await page.locator('h1').count(), 1)
      await page.getByRole('link', { name: 'solicitar seu orçamento pelo WhatsApp', exact: true }).waitFor()
      await page.close()
    }
    const redirect = await noJs.request.get(base + '/orcamento?source=computer-qa', { maxRedirects: 0 })
    assert.equal(redirect.status(), 302)
    assert.equal(redirect.headers().location, '/orcamento/notebook?source=computer-qa')
    const missing = await noJs.request.get(base + '/computer-quote-does-not-exist')
    // Vite's existing SPA preview fallback returns 200 for unknown documents.
    // Production has no catch-all rewrite; validate-seo checks that configuration.
    assert([200, 404].includes(missing.status()))
    const unknownContext = await browser.newContext()
    await unknownContext.route('https://**/*', route => route.abort())
    const unknownPage = await unknownContext.newPage()
    await unknownPage.goto(base + '/computer-quote-does-not-exist')
    await unknownPage.getByRole('heading', { name: 'Página não encontrada', exact: true }).waitFor()
    await unknownContext.close()
    reports.push({ engine: engineName, status: 'pass', unknownPreviewStatus: missing.status(), checks: ['four clean/parameterized routes without JavaScript', 'legacy redirect unchanged', 'unknown route renders existing not-found page'] })
    await noJs.close()
  } finally { await browser.close() }
}

await writeFile(`${dir}/results.json`, JSON.stringify({ status: 'pass', base, reports }, null, 2) + '\n')
console.log('Computer quote browser verification passed.')
