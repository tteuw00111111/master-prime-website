import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const axeScript = process.env.PLAYWRIGHT_MODULE ? new URL('../axe-core/axe.min.js', process.env.PLAYWRIGHT_MODULE).pathname : new URL(import.meta.resolve('axe-core/axe.min.js')).pathname
const base = process.env.QUOTE_QA_BASE ?? 'http://localhost:4178'
const dir = import.meta.dirname
const reports = []
const engines = process.env.GAMING_QA_CHROMIUM_ONLY ? [['chromium', chromium]] : [['chromium', chromium], ['webkit', webkit]]
const sizes = process.env.GAMING_QA_SMALL ? [[320, 568, true]] : process.env.GAMING_QA_QUICK ? [[390, 844, false]] : [[320, 568, true], [390, 844, false], [430, 932, false], [1440, 1000, false]]

for (const [name, engine] of engines) {
  const browser = await engine.launch(name === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
  try {
    for (const [width, height, reduced] of sizes) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 800, hasTouch: width < 800, reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await context.route('https://**/*', route => route.abort())
      await context.addInitScript(() => {
        window.openedQuotes = []
        window.open = url => { window.openedQuotes.push(url); return null }
        window.quoteScrolls = []
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
        const original = window.scrollTo.bind(window)
        window.scrollTo = (...args) => { window.quoteScrolls.push(args); return original(...args) }
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard unavailable') } } })
      })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error' && /hydration|did not match|Minified React error/i.test(message.text())) errors.push(message.text()) })
      const ready = async screen => {
        await page.waitForFunction(expected => document.querySelector('.quote-form')?.dataset.screen === expected && document.querySelector('.quote-form')?.getAttribute('aria-busy') === 'false', screen)
        await page.locator('.quote-next:not([disabled])').waitFor()
        if (process.env.GAMING_QA_DEBUG) console.log(name, width, screen)
      }
      const next = async screen => { await page.locator('.quote-next:not([disabled])').click(); await ready(screen) }
      const click = label => page.getByRole('button', { name: label, exact: label !== 'Levar à loja' }).click()
      const axe = async () => {
        await page.addScriptTag({ path: axeScript })
        const result = await page.evaluate(() => window.axe.run({ include: [['main'], ['.quote-header']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }))
        assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [])
      }
      const overflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      const shot = async label => {
        if (label !== 'suggestions') await page.locator('.quote-form-heading h2').evaluate(element => element.focus({ preventScroll: true }))
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.waitForFunction(() => document.querySelector('.quote-page').getAnimations({ subtree: true }).every(animation => animation.playState !== 'running'))
        await page.screenshot({ path: `${dir}/${name}-${label}-${width}.png` })
      }
      const blur = id => page.locator(id).evaluate(element => element.blur())

      await page.goto(base + '/orcamento/videogame')
      await ready('mode')
      await axe(); await overflow(); await shot('entry')
      if (width < 800) {
        const lastChoice = await page.getByRole('button', { name: 'Videogame e controle', exact: true }).boundingBox()
        const actionBar = await page.locator('.quote-actions').boundingBox()
        assert(lastChoice.y + lastChoice.height <= actionBar.y - 8, 'all opening choices fit above the fixed actions')
      }
      await page.locator('.quote-next').click()
      assert.match(await page.getByRole('alert').innerText(), /Escolha/)
      await page.waitForFunction(() => document.activeElement.id === 'quote-mode')
      await click('Videogame e controle'); await next('console:platform')
      await click('PlayStation'); await next('console:model')
      assert.equal(await page.getByLabel('Não sei o modelo', { exact: true }).count(), 0)
      await page.locator('#gaming-console-model').fill('PS3')
      await page.getByText('Não atendemos PS3 nem controles dessa geração.', { exact: false }).waitFor()
      if (width === 390) await shot('unsupported-console')
      await next('console:model')
      assert.match(await page.getByRole('alert').innerText(), /Não atendemos PS3/)

      await page.locator('#gaming-console-model').fill('ps5')
      const suggestion = page.getByRole('button', { name: 'PS5 Slim', exact: true })
      await suggestion.waitFor()
      await axe()
      if (width === 390) await shot('suggestions')
      const before = await page.locator('#gaming-console-model').boundingBox()
      await page.evaluate(() => { window.quoteScrolls = [] })
      await suggestion.click()
      assert.deepEqual(await page.evaluate(() => window.quoteScrolls), [])
      assert.notEqual(await page.evaluate(() => document.activeElement.id), 'gaming-console-model')
      const after = await page.locator('#gaming-console-model').boundingBox()
      assert(Math.abs(before.y - after.y) < 1)
      await next('controller:platform')
      await click('Xbox'); await next('controller:model')
      await page.locator('#gaming-controller-model').fill('Controle Xbox 360')
      await page.getByText('Não atendemos Xbox 360 nem controles dessa geração.', { exact: false }).waitFor()
      if (width === 390) await shot('unsupported-controller')
      await next('controller:model')
      assert.match(await page.getByRole('alert').innerText(), /Não atendemos Xbox 360/)

      await page.locator('#gaming-controller-model').fill('Elite 2')
      await click('Xbox Elite Series 2')
      await next('console:issues')
      await click('Não liga'); await click('Esquenta ou faz muito barulho')
      await axe(); await shot('console-issues'); await overflow()
      await next('controller:issues')
      await click('Analógico mexendo sozinho / drift'); await click('Botões ou direcional falhando'); await click('Analógico Hall Effect')
      await axe(); await shot('controller-issues')
      await next('console:question:power-signs')
      await click('Acende luz ou emite bipe')
      await next('console:question:heat-signs')
      await page.getByRole('checkbox', { name: 'A ventoinha faz muito barulho', exact: true }).click()
      await next('controller:question:drift-side')
      await click('Esquerdo')
      await next('controller:question:buttons-affected')
      await page.getByRole('checkbox', { name: 'Botões da frente', exact: true }).click()
      await page.getByRole('checkbox', { name: 'Direcional', exact: true }).click()
      await axe()
      await next('notes')
      await page.locator('#quote-notes').fill('Começou após uma queda. Manutenção & diagnóstico.')
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
      await next('delivery')
      await click('Consultar retirada e entrega')
      await next('neighborhood')
      await page.locator('.quote-next').click()
      await page.waitForFunction(() => document.activeElement.id === 'quote-neighborhood')
      await page.locator('#quote-neighborhood').fill('Paciência'); await blur('#quote-neighborhood')
      await next('city')
      await next('review')
      await axe(); await overflow(); await shot('review'); console.log(name, width, 'review reached')
      let review = await page.locator('.quote-review').innerText()
      assert.match(review, /PS5 Slim/); assert.match(review, /Xbox Elite Series 2/); assert.match(review, /Paciência/)
      await page.reload(); await ready('review')
      await page.getByRole('button', { name: 'Editar problemas do controle', exact: true }).click(); await ready('controller:issues')
      await click('Analógico mexendo sozinho / drift')
      await page.reload(); await ready('controller:issues')
      await next('review')
      review = await page.locator('.quote-review').innerText()
      assert.doesNotMatch(review, /Qual analógico|Esquerdo|drift/)
      await page.getByRole('button', { name: 'Editar aparelhos', exact: true }).click(); await ready('mode')
      await click('Videogame'); await next('console:platform'); await next('console:model'); await next('review')
      assert.equal(await page.getByRole('button', { name: 'Editar controle', exact: true }).count(), 0)
      await page.getByRole('button', { name: 'Editar aparelhos', exact: true }).click(); await ready('mode')
      await click('Videogame e controle'); await next('console:platform'); await next('console:model'); await next('controller:platform'); await next('controller:model'); await next('review')
      assert.match(await page.locator('.quote-review').innerText(), /Xbox Elite Series 2/)
      await page.getByRole('button', { name: 'Editar atendimento', exact: true }).click(); await ready('delivery')
      await click('Levar à loja'); await next('review')
      await click('Copiar resumo')
      await page.getByRole('textbox', { name: 'Resumo para copiar', exact: true }).waitFor()
      const copied = await page.getByRole('textbox', { name: 'Resumo para copiar', exact: true }).inputValue()
      assert.doesNotMatch(copied, /Paciência|Bairro:|Cidade:|Esquerdo/)
      await page.evaluate(() => { navigator.clipboard.writeText = async value => { window.copiedQuote = value } })
      await click('Copiar resumo')
      await page.waitForFunction(() => document.querySelector('.quote-review').textContent.includes('Resumo copiado!'))
      assert.equal(await page.evaluate(() => window.copiedQuote), copied)
      await click('Continuar no WhatsApp')
      const opened = await page.evaluate(() => window.openedQuotes)
      assert.equal(opened.length, 1)
      const url = new URL(opened[0])
      assert.equal(url.searchParams.get('phone'), '5521967635340')
      assert.equal(url.searchParams.get('text'), copied)
      assert.match(copied, /Videogame:\nPlataforma: PlayStation/)
      assert.match(copied, /Controle:\nPlataforma: Xbox/)
      assert.equal(await page.locator('a[href*="Come%C3%A7ou"]').count(), 0)
      const events = await page.evaluate(() => window.dataLayer.filter(event => String(event.event).startsWith('quote_')))
      assert(events.some(event => event.event === 'quote_whatsapp_click'))
      for (const event of events) {
        assert.deepEqual(Object.keys(event).sort(), ['event', 'quote_category', 'quote_step'])
        assert.equal(event.quote_category, 'videogame')
      }
      assert.doesNotMatch(JSON.stringify(events), /Paciência|Elite|PlayStation|diagnóstico|text=/)
      const motionFrames = await page.evaluate(() => window.quoteMotionFrames)
      if (reduced) assert(motionFrames.every(frame => Math.abs(frame.x) < 0.01), 'reduced motion has no slide')
      else assert(motionFrames.some(frame => Math.abs(frame.x) > 0.1 && frame.opacity > 0 && frame.opacity < 1), 'normal motion includes intermediate slide/fade frames')
      if (width === 320 || width === 390) await writeFile(`${dir}/${name}-motion-${width}.json`, JSON.stringify(motionFrames, null, 2) + '\n')
      // An existing draft wins over entry presets.
      await page.goto(base + '/orcamento/videogame?aparelho=controle'); await ready('review')
      assert.match(await page.locator('.quote-review').innerText(), /PS5 Slim/)
      // Independent notebook storage and presentation regression after extraction.
      await page.goto(base + '/orcamento/notebook')
      await page.locator('.quote-next:not([disabled])').waitFor()
      await click('Dell'); await page.locator('.quote-next').click()
      await page.getByRole('heading', { name: 'E o modelo?', exact: true }).waitFor()
      await page.waitForFunction(() => document.querySelector('.quote-form').getAttribute('aria-busy') === 'false')
      await page.getByLabel('Não sei o modelo', { exact: true }).check()
      await page.locator('.quote-next').click()
      await page.getByRole('heading', { name: 'O que está acontecendo?', exact: true }).waitFor()
      await page.waitForFunction(() => document.querySelector('.quote-form').getAttribute('aria-busy') === 'false')
      await click('Limpeza e manutenção')
      await page.locator('.quote-next').click()
      await page.getByRole('heading', { name: 'Quer acrescentar algo?', exact: true }).waitFor()
      await page.waitForFunction(() => document.querySelector('.quote-form').getAttribute('aria-busy') === 'false')
      await click('Pular detalhes')
      await page.getByRole('heading', { name: 'Como prefere ser atendido?', exact: true }).waitFor()
      await page.waitForFunction(() => document.querySelector('.quote-form').getAttribute('aria-busy') === 'false')
      await click('Levar à loja'); await page.locator('.quote-next').click()
      await page.getByRole('heading', { name: 'Confira seu pedido.', exact: true }).waitFor()
      await page.waitForFunction(() => document.querySelector('.quote-form').getAttribute('aria-busy') === 'false')
      assert.match(await page.locator('.quote-review').innerText(), /Dell/)
      await axe(); await overflow()
      assert(await page.evaluate(() => !!sessionStorage.getItem('master-prime:notebook-quote:v1') && !!sessionStorage.getItem('master-prime:gaming-quote:v1')))
      assert.deepEqual(errors, [])
      reports.push({ browser: name, width, reducedMotion: reduced, status: 'pass', checks: ['combined request', 'platform/model suggestions', 'PS3/Xbox 360 rejected', 'no unknown-model bypass', 'multiple symptoms', 'optional questions', 'pickup validation', 'review and edit recovery', 'remove/re-add device', 'inactive answers excluded', 'store removes location', 'copy success and fallback', 'slide/fade frame sampling', 'WhatsApp encoding and privacy', 'draft takes priority', 'notebook regression', 'Axe WCAG AA', 'overflow', ...(width === 390 ? ['keyboard geometry'] : [])] })
      console.log(name, width, 'combined and notebook passed')
      await context.close()
    }

    // Fresh direct entry, console-only, then adding a previously empty controller.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await context.route('https://**/*', route => route.abort())
    const p = await context.newPage()
    const ready = screen => p.waitForFunction(s => document.querySelector('.quote-form')?.dataset.screen === s && document.querySelector('.quote-form')?.getAttribute('aria-busy') === 'false', screen)
    const next = async screen => { await p.locator('.quote-next:not([disabled])').click(); await ready(screen) }
    const click = label => p.getByRole('button', { name: label, exact: label !== 'Levar à loja' }).click()
    await p.goto(base + '/orcamento/videogame?aparelho=videogame'); await ready('mode')
    assert.equal(await p.getByRole('button', { name: 'Videogame', exact: true }).getAttribute('aria-pressed'), 'true')
    await next('console:platform'); await click('Não sei'); await next('console:model')
    await p.locator('#gaming-console-model').fill('PS4'); await click('PS4'); await next('console:issues')
    await click('Limpeza e manutenção'); await next('notes'); await click('Pular detalhes'); await ready('delivery')
    await click('Levar à loja'); await next('review')
    await p.getByRole('button', { name: 'Editar aparelhos', exact: true }).click(); await ready('mode')
    await click('Videogame e controle'); await next('console:platform'); await next('console:model'); await next('controller:platform')
    await p.locator('.quote-next').click(); assert.match(await p.getByRole('alert').innerText(), /plataforma/)
    await click('PlayStation'); await next('controller:model')
    await p.locator('#gaming-controller-model').fill('DS4'); await click('DualShock 4')
    await next('controller:issues')
    assert.match(await p.getByRole('alert').innerText(), /pelo menos uma/)
    await click('Outro problema'); await next('review')
    assert.match(await p.locator('.quote-review').innerText(), /DualShock 4/)
    await context.close()
    // Storage unavailable and controller-only entry must still complete.
    const blocked = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await blocked.route('https://**/*', route => route.abort())
    await blocked.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('disabled') }; Storage.prototype.setItem = () => { throw new Error('disabled') } })
    const b = await blocked.newPage()
    await b.goto(base + '/orcamento/videogame?aparelho=controle')
    const bReady = screen => b.waitForFunction(s => document.querySelector('.quote-form')?.dataset.screen === s && document.querySelector('.quote-form')?.getAttribute('aria-busy') === 'false', screen)
    const bNext = async screen => { await b.locator('.quote-next:not([disabled])').click(); await bReady(screen) }
    await bReady('mode')
    assert.equal(await b.getByRole('button', { name: 'Controle', exact: true }).getAttribute('aria-pressed'), 'true')
    await bNext('controller:platform'); await b.getByRole('button', { name: 'Xbox', exact: true }).click(); await bNext('controller:model')
    await b.locator('#gaming-controller-model').fill('Controle Xbox One'); await b.getByRole('button', { name: 'Controle Xbox One', exact: true }).click(); await bNext('controller:issues')
    await b.getByRole('button', { name: 'Outro problema', exact: true }).click(); await bNext('notes')
    await b.getByRole('button', { name: 'Pular detalhes', exact: true }).click(); await bReady('delivery')
    await b.getByRole('button', { name: 'Combinar pelo WhatsApp', exact: true }).click(); await bNext('review')
    assert.equal(await b.getByRole('button', { name: 'Editar videogame', exact: true }).count(), 0)
    await blocked.close()
    // HTML and metadata stay meaningful without JavaScript on both quote routes.
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
    await noJs.route('https://**/*', route => route.abort())
    const n = await noJs.newPage()
    for (const [path, heading] of [['/orcamento/videogame', 'O que precisa de atendimento?'], ['/orcamento/notebook', 'Qual é a marca?']]) {
      const response = await n.goto(base + path)
      assert.equal(response.status(), 200)
      await n.getByRole('heading', { name: heading, exact: true }).waitFor()
      assert.equal(await n.locator('h1').count(), 1)
      assert.equal(await n.locator('link[rel="canonical"]').getAttribute('href'), 'https://master-prime.com' + path)
      await n.getByRole('link', { name: 'solicitar seu orçamento pelo WhatsApp', exact: true }).waitFor()
    }
    await n.goto(base + '/orcamento/videogame'); await n.screenshot({ path: `${dir}/${name}-no-javascript.png` })
    await noJs.close()
    reports.push({ browser: name, status: 'pass', checks: ['fresh console entry', 'add new controller from review', 'missing identification and symptoms enforced', 'unknown platform with supported model', 'controller-only without storage', 'entry preset', 'prerendered HTML without JS on both routes'] })
    console.log(name, 'edge cases and no-JS passed')
  } finally { await browser.close() }
}
await writeFile(`${dir}/${process.env.GAMING_QA_RESULTS ?? 'results.json'}`, JSON.stringify({ status: 'pass', base, reports, limitation: 'Keyboard geometry is simulated. Native iOS/Android keyboard animation requires physical-device confirmation. No WhatsApp messages were sent.' }, null, 2) + '\n')
