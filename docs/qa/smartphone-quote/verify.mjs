import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const axeScript = process.env.PLAYWRIGHT_MODULE ? new URL('../axe-core/axe.min.js', process.env.PLAYWRIGHT_MODULE).pathname : new URL(import.meta.resolve('axe-core/axe.min.js')).pathname
const base = process.env.QUOTE_QA_BASE ?? 'http://localhost:4178'
const dir = import.meta.dirname
const key = 'master-prime:smartphone-quote:v1'
const reports = []
const engines = process.env.SMARTPHONE_QA_CHROMIUM_ONLY ? [['chromium', chromium]] : [['chromium', chromium], ['webkit', webkit]]
const sizes = process.env.SMARTPHONE_QA_QUICK ? [[390, 844, false]] : [[320, 568, true], [390, 844, false], [430, 932, false], [1440, 1000, false]]
const screenLabel = 'Tela quebrada, sem imagem ou sem toque'
const batteryLabel = 'Bateria descarrega rápido ou está estufada'

const instrument = context => context.addInitScript(() => {
  window.openedQuotes = []
  window.open = url => { window.openedQuotes.push(url); return null }
  window.quoteScrolls = []
  window.quoteMotionFrames = []
  const original = window.scrollTo.bind(window)
  window.scrollTo = (...args) => { window.quoteScrolls.push(args); return original(...args) }
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard unavailable') } } })
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

const harness = page => {
  const ready = async screen => {
    // Notebook predates data-screen; observe its actual heading without changing
    // the existing page merely to accommodate this test harness.
    if (new URL(page.url()).pathname === '/orcamento/notebook') {
      const headings = { brand: 'Qual é a marca?', model: 'E o modelo?', issues: 'O que está acontecendo?', notes: 'Quer acrescentar algo?', delivery: 'Como prefere ser atendido?', review: 'Confira seu pedido.' }
      await page.getByRole('heading', { name: headings[screen], exact: true }).waitFor()
      await page.waitForFunction(() => document.querySelector('.quote-form')?.getAttribute('aria-busy') === 'false')
    } else await page.waitForFunction(expected => document.querySelector('.quote-form')?.dataset.screen === expected && document.querySelector('.quote-form')?.getAttribute('aria-busy') === 'false', screen)
    await page.locator('.quote-next:not([disabled])').waitFor()
  }
  const next = async screen => { await page.locator('.quote-next:not([disabled])').click(); await ready(screen) }
  const click = label => page.getByRole('button', { name: label, exact: label !== 'Levar à loja' }).click()
  const blur = id => page.locator(id).evaluate(element => element.blur())
  const axe = async () => {
    await page.addScriptTag({ path: axeScript })
    const result = await page.evaluate(() => window.axe.run({ include: [['main'], ['.quote-header']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }))
    assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [])
  }
  return { ready, next, click, blur, axe }
}

for (const [name, engine] of engines) {
  const browser = await engine.launch(name === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
  try {
    for (const [width, height, reduced] of sizes) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 800, hasTouch: width < 800, reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await context.route('https://**/*', route => route.abort())
      await instrument(context)
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error' && /hydration|did not match|Minified React error/i.test(message.text())) errors.push(message.text()) })
      const { ready, next, click, blur, axe } = harness(page)
      const shot = async label => {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.waitForFunction(() => document.querySelector('.quote-page').getAnimations({ subtree: true }).every(animation => animation.playState !== 'running'))
        await page.screenshot({ path: `${dir}/${name}-${label}-${width}.png` })
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      }

      await page.goto(base + '/orcamento/celular'); await ready('brand')
      await axe(); await shot('entry')
      assert.equal(await page.getByRole('button', { name: 'Apple', exact: true }).count(), 1)
      assert.equal(await page.getByRole('button', { name: 'ASUS', exact: true }).count(), 0)
      if (width < 800) {
        const choice = await page.getByRole('button', { name: 'Não sei a marca', exact: true }).boundingBox()
        const actions = await page.locator('.quote-actions').boundingBox()
        assert(choice.y + choice.height <= actions.y, 'initial brand choices must fit above fixed actions')
      }
      await next('brand')
      await page.waitForFunction(() => document.activeElement.id === 'quote-brand')
      await click('Ver todas as marcas')
      await page.getByLabel('Buscar marca').fill('tecno')
      await page.getByRole('button', { name: 'Tecno', exact: true }).waitFor()
      await blur('[aria-label="Buscar marca"]')
      await click('Mostrar menos marcas')
      await click('Samsung'); await ready('brand')
      assert.equal(await page.getByRole('button', { name: 'Samsung', exact: true }).getAttribute('aria-pressed'), 'true')
      await next('model'); await next('model')
      await page.waitForFunction(() => document.activeElement.id === 'smartphone-model')
      await page.evaluate(() => { window.quoteScrolls = [] })
      await page.locator('#smartphone-model').fill('galaxy a')
      const suggestion = page.getByRole('button', { name: 'Galaxy A55', exact: true })
      await suggestion.waitFor()
      assert.deepEqual(await page.evaluate(() => window.quoteScrolls), [])
      await axe()
      if (width === 390) await shot('suggestions')
      await page.evaluate(() => { window.quoteScrolls = [] })
      await suggestion.click()
      assert.deepEqual(await page.evaluate(() => window.quoteScrolls), [])
      assert.notEqual(await page.evaluate(() => document.activeElement.id), 'smartphone-model')
      assert.equal(await page.locator('#smartphone-model').inputValue(), 'Galaxy A55')
      await next('issues'); await next('issues')
      await page.waitForFunction(() => document.activeElement.id === 'quote-issues')
      await click(screenLabel); await click(batteryLabel); await click('Contato com líquido')
      await page.getByText('Se houve contato com líquido, mantenha o celular desligado e não carregue até a avaliação.', { exact: true }).waitFor()
      await axe(); await shot('issues')
      await next('question:screen-signs')
      await page.getByRole('checkbox', { name: 'Está trincada', exact: true }).click()
      await page.getByRole('checkbox', { name: 'O toque está falhando', exact: true }).click()
      await page.getByRole('checkbox', { name: 'Não sei dizer', exact: true }).click()
      assert.equal(await page.getByRole('checkbox', { name: 'Está trincada', exact: true }).getAttribute('aria-checked'), 'false')
      await page.getByRole('checkbox', { name: 'Está trincada', exact: true }).click()
      assert.equal(await page.getByRole('checkbox', { name: 'Não sei dizer', exact: true }).getAttribute('aria-checked'), 'false')
      await next('question:battery-signs')
      await page.getByRole('checkbox', { name: 'Descarrega rápido', exact: true }).click()
      await page.getByRole('checkbox', { name: 'A tela ou tampa está levantando', exact: true }).click()
      await page.getByText('Se a tela ou tampa está levantando, não pressione para fechar e evite carregar até a inspeção.', { exact: true }).waitFor()
      await axe(); await shot('details')
      await next('question:liquid-signs'); await click('Funciona com falhas'); await next('notes')
      await page.locator('#quote-notes').fill('Começou após queda. Avaliação & diagnóstico + dúvidas?')
      await blur('#quote-notes')
      if (width === 390) {
        await page.locator('#quote-notes').focus()
        await page.setViewportSize({ width, height: 450 })
        await page.waitForFunction(() => document.querySelector('.quote-page').dataset.keyboard === 'open')
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.quote-actions')).visibility === 'hidden')
        await page.screenshot({ path: `${dir}/${name}-keyboard-${width}.png` })
        await blur('#quote-notes')
        await page.setViewportSize({ width, height })
        await page.waitForFunction(() => document.querySelector('.quote-page').dataset.keyboard === 'closed')
      }
      await click('Pular detalhes'); await ready('delivery')
      await next('delivery')
      await click('Consultar retirada e entrega'); await next('neighborhood'); await next('neighborhood')
      await page.waitForFunction(() => document.activeElement.id === 'quote-neighborhood')
      await page.locator('#quote-neighborhood').fill('Paciência'); await blur('#quote-neighborhood')
      await next('city')
      await page.locator('#quote-city').fill(''); await blur('#quote-city'); await next('city')
      await page.locator('#quote-city').fill('Rio de Janeiro'); await blur('#quote-city'); await next('review')
      await axe(); await shot('review')
      assert.match(await page.locator('.quote-review').innerText(), /Galaxy A55/)
      assert.match(await page.locator('.quote-review').innerText(), /Paciência/)
      await page.reload(); await ready('review')
      await click('Editar seu celular'); await ready('brand')
      await click('Apple'); await next('model')
      assert.equal(await page.locator('#smartphone-model').inputValue(), '')
      await next('model')
      await page.locator('#smartphone-model').fill('iPhone não listado Pro Max'); await blur('#smartphone-model')
      await next('review')
      assert.match(await page.locator('.quote-review').innerText(), /Está trincada/)
      await click('Editar problemas'); await ready('issues')
      await click(screenLabel); await click('Contato com líquido')
      await page.reload(); await ready('issues'); await next('review')
      assert.doesNotMatch(await page.locator('.quote-review').innerText(), /Está trincada|Funciona com falhas/)
      await click('Editar detalhes'); await ready('question:battery-signs')
      await click('Pular detalhes'); await ready('review')
      assert.match(await page.locator('.quote-review').innerText(), /Avaliação & diagnóstico \+ dúvidas\?/)
      await click('Editar atendimento'); await ready('delivery')
      await click('Levar à loja'); await next('review')
      assert.doesNotMatch(await page.locator('.quote-review').innerText(), /Paciência/)
      await click('Copiar resumo')
      const fallback = page.getByRole('textbox', { name: 'Resumo para copiar', exact: true })
      await fallback.waitFor()
      await axe()
      const copied = await fallback.inputValue()
      assert.match(copied, /Aparelho: Celular\nMarca: Apple\nModelo: iPhone não listado Pro Max/)
      assert.doesNotMatch(copied, /Paciência|Bairro:|Cidade:|Está trincada|Funciona com falhas/)
      await page.evaluate(() => { navigator.clipboard.writeText = async value => { window.copiedQuote = value } })
      await click('Copiar resumo')
      await page.getByText('Resumo copiado!', { exact: true }).waitFor()
      assert.equal(await page.evaluate(() => window.copiedQuote), copied)
      assert.deepEqual(await page.evaluate(() => window.openedQuotes), [])
      await click('Continuar no WhatsApp')
      const opened = await page.evaluate(() => window.openedQuotes)
      assert.equal(opened.length, 1)
      const url = new URL(opened[0])
      assert.equal(url.searchParams.get('phone'), '5521967635340')
      assert.equal(url.searchParams.get('text'), copied)
      const events = await page.evaluate(() => window.dataLayer.filter(event => String(event.event).startsWith('quote_')))
      assert(events.some(event => event.event === 'quote_whatsapp_click'))
      for (const event of events) {
        assert.deepEqual(Object.keys(event).sort(), ['event', 'quote_category', 'quote_step'])
        assert.equal(event.quote_category, 'celular')
      }
      assert.doesNotMatch(JSON.stringify(events), /Paciência|Apple|Galaxy|diagnóstico|text=/)
      assert.equal(await page.locator('a[href*="Come%C3%A7ou"]').count(), 0)
      const frames = await page.evaluate(() => window.quoteMotionFrames)
      if (reduced) assert(frames.every(frame => Math.abs(frame.x) < 0.01), 'reduced motion has no slide')
      else assert(frames.some(frame => Math.abs(frame.x) > 0.1 && frame.opacity > 0 && frame.opacity < 1), 'normal motion includes intermediate slide/fade frames')
      if (width === 320 || width === 390) await writeFile(`${dir}/${name}-motion-${width}.json`, JSON.stringify(frames, null, 2) + '\n')
      assert.deepEqual(errors, [])
      reports.push({ browser: name, width, reducedMotion: reduced, status: 'pass', checks: ['brand expansion', 'model suggestions', 'unlisted model', 'no auto-advance', 'required validation', 'multiple symptoms', 'exclusive unsure', 'conditional guidance', 'skip preserves answers', 'pickup validation', 'review editing and refresh', 'brand clears model only', 'removed symptoms excluded', 'store excludes location', 'copy success and fallback', 'click-only WhatsApp and encoding', 'privacy-safe analytics', 'motion sampling', 'Axe WCAG AA', 'no overflow', ...(width === 390 ? ['keyboard geometry'] : [])] })
      console.log(name, width, 'main flow passed')
      await context.close()
    }

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await context.route('https://**/*', route => route.abort())
    await instrument(context)
    const page = await context.newPage()
    const { ready, next, click, blur, axe } = harness(page)
    // All remaining symptom branches, custom brand and free model.
    await page.goto(base + '/orcamento/celular'); await ready('brand')
    await click('Outra marca'); await next('brand')
    await page.waitForFunction(() => document.activeElement.id === 'quote-custom-brand')
    await page.locator('#quote-custom-brand').fill('Minha marca'); await blur('#quote-custom-brand'); await next('model')
    await page.locator('#smartphone-model').fill('Modelo & especial'); await blur('#smartphone-model'); await next('issues')
    for (const label of ['Não carrega ou carrega com dificuldade', 'Não liga ou reinicia sozinho', 'Esquenta muito', 'Trava ou apresenta problema de sistema', 'Outro problema']) await click(label)
    for (const screen of ['question:charging-signs', 'question:power-signs', 'question:heat-timing', 'question:system-signs']) { await next(screen); await click('Não sei dizer') }
    await next('notes'); await click('Pular detalhes'); await ready('delivery'); await click('Combinar pelo WhatsApp'); await next('review')
    assert.match(await page.locator('.quote-review').innerText(), /Minha marca/)
    await axe()
    // Unknown brand searches every catalog; unknown model clears old text.
    await page.evaluate(storageKey => sessionStorage.removeItem(storageKey), key)
    await page.reload(); await ready('brand'); await click('Não sei a marca'); await next('model')
    await page.locator('#smartphone-model').fill('Poco X6 Pro')
    await click('POCO X6 Pro 5G')
    assert.equal(await page.locator('#smartphone-model').inputValue(), 'POCO X6 Pro 5G')
    await page.getByLabel('Não sei o modelo', { exact: true }).check()
    assert.equal(await page.locator('#smartphone-model').inputValue(), '')
    await next('issues'); await click('Outro problema'); await next('notes'); await click('Pular detalhes'); await ready('delivery'); await click('Levar à loja'); await next('review')
    assert.match(await page.locator('.quote-review').innerText(), /Não sei a marca|Modelo a identificar/)
    // All three routes must retain independent session drafts.
    await page.goto(base + '/orcamento/videogame'); await ready('mode')
    await click('Controle'); await next('controller:platform'); await click('PlayStation'); await next('controller:model')
    await page.locator('#gaming-controller-model').fill('DS4'); await click('DualShock 4'); await next('controller:issues'); await click('Outro problema'); await next('notes'); await click('Pular detalhes'); await ready('delivery'); await click('Levar à loja'); await next('review')
    assert.match(await page.locator('.quote-review').innerText(), /DualShock 4/)
    await page.goto(base + '/orcamento/notebook'); await ready('brand')
    await click('Dell'); await next('model'); await page.getByLabel('Não sei o modelo', { exact: true }).check(); await next('issues'); await click('Limpeza e manutenção'); await next('notes'); await click('Pular detalhes'); await ready('delivery'); await click('Levar à loja'); await next('review')
    assert.match(await page.locator('.quote-review').innerText(), /Dell/)
    assert(await page.evaluate(() => ['master-prime:smartphone-quote:v1', 'master-prime:gaming-quote:v1', 'master-prime:notebook-quote:v1'].every(storageKey => !!sessionStorage.getItem(storageKey))))
    await page.goto(base + '/orcamento/celular'); await ready('review')
    assert.match(await page.locator('.quote-review').innerText(), /Modelo a identificar/)
    await context.close()

    const blocked = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await blocked.route('https://**/*', route => route.abort())
    await blocked.addInitScript(() => {
      for (const method of ['getItem', 'setItem', 'removeItem']) Storage.prototype[method] = () => { throw new Error('Storage unavailable') }
      window.open = () => null
    })
    const blockedPage = await blocked.newPage()
    const b = harness(blockedPage)
    await blockedPage.goto(base + '/orcamento/celular'); await b.ready('brand'); await b.click('Não sei a marca'); await b.next('model'); await blockedPage.getByLabel('Não sei o modelo', { exact: true }).check(); await b.next('issues'); await b.click('Outro problema'); await b.next('notes'); await b.click('Pular detalhes'); await b.ready('delivery'); await b.click('Levar à loja'); await b.next('review'); await b.click('Continuar no WhatsApp')
    await blockedPage.getByText('Continue na conversa do WhatsApp.', { exact: true }).waitFor()
    await blocked.close()

    const entryContext = await browser.newContext({ reducedMotion: 'reduce' })
    await entryContext.route('https://**/*', route => route.abort())
    const entryPage = await entryContext.newPage()
    for (const path of ['/conserto-de-celular-campo-grande-rj', '/celular/troca-de-tela', '/celular/troca-de-bateria', '/celular/reparo-de-placa']) {
      const response = await entryPage.goto(base + path)
      assert.equal(response.status(), 200)
      assert.equal(await entryPage.getByRole('link', { name: 'Falar pelo WhatsApp', exact: true }).count(), 1)
      await entryPage.getByRole('link', { name: 'Orçamento de celular', exact: true }).first().click()
      await harness(entryPage).ready('brand')
      assert.equal(new URL(entryPage.url()).pathname, '/orcamento/celular')
      assert.equal(await entryPage.locator('link[rel="canonical"]').getAttribute('href'), 'https://master-prime.com/orcamento/celular')
    }
    for (const path of ['/orcamento', '/orcamento/', '/orcamento/index.html']) {
      const response = await entryContext.request.get(base + path + '?origem=teste', { maxRedirects: 0 })
      assert.equal(response.status(), 302)
      assert.equal(response.headers().location, '/orcamento/notebook?origem=teste')
    }
    await entryContext.close()

    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
    await noJS.route('https://**/*', route => route.abort())
    const staticPage = await noJS.newPage()
    await staticPage.goto(base + '/orcamento/celular')
    await staticPage.getByRole('heading', { name: 'Qual é a marca?', exact: true }).waitFor()
    await staticPage.getByRole('link', { name: 'solicitar seu orçamento pelo WhatsApp', exact: true }).waitFor()
    await staticPage.screenshot({ path: `${dir}/${name}-no-javascript.png` })
    await noJS.close()
    reports.push({ browser: name, status: 'pass', checks: ['all other symptom branches', 'custom brand and free model', 'unknown brand catalog search', 'unknown model clears text', 'three independent drafts', 'gaming and notebook smoke tests', 'storage unavailable', 'four real service-entry clicks', 'canonical', 'legacy redirects', 'no-JavaScript fallback'] })
    console.log(name, 'variants, regression and entries passed')
  } finally { await browser.close() }
}
await writeFile(`${dir}/results.json`, JSON.stringify(reports, null, 2) + '\n')
console.log(`Passed ${reports.length} smartphone browser scenarios.`)
