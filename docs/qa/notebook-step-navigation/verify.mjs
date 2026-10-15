import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const base = process.env.QUOTE_QA_BASE ?? 'http://localhost:4178'
const axeScript = process.env.PLAYWRIGHT_MODULE ? new URL('../axe-core/axe.min.js', process.env.PLAYWRIGHT_MODULE).pathname : new URL(import.meta.resolve('axe-core/axe.min.js')).pathname
const reports = []
const sizes = process.env.QUOTE_SCROLL_QUICK ? [[390, 844, false]] : [[320, 568, true], [390, 844, false], [430, 932, false], [390, 844, true], [768, 1024, false], [1440, 900, false]]
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch(name === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
  try {
    for (const [width, height, reduced] of sizes) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 800, hasTouch: width < 800, reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await context.route('https://**/*', route => route.abort())
      await context.route('**/catalog/**', route => route.abort())
      await context.addInitScript(() => {
        window.navigationScrolls = []
        const original = window.scrollTo.bind(window)
        window.scrollTo = (...args) => { window.navigationScrolls.push(args); return original(...args) }
      })
      const page = await context.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      const ready = async (title) => {
        await page.getByRole('heading', { name: title, exact: true }).waitFor()
        await page.waitForFunction(() => document.querySelector('.quote-form').getAttribute('aria-busy') === 'false')
      }
      const next = () => page.locator('.quote-next:not([disabled])').click()
      const visibleQuestion = async () => {
        await page.evaluate(() => { window.navigationScrollSample = { scroll: scrollY, stable: 0 } })
        await page.waitForFunction(() => {
          const heading = document.querySelector('h2').getBoundingClientRect(), viewport = window.visualViewport
          const top = viewport?.offsetTop ?? 0
          const bottom = top + (viewport?.height ?? innerHeight) - (innerWidth <= 800 ? document.querySelector('.quote-actions').getBoundingClientRect().height : 0)
          const previous = window.navigationScrollSample
          window.navigationScrollSample = { scroll: scrollY, stable: Math.abs(previous.scroll - scrollY) < 0.5 ? previous.stable + 1 : 0 }
          return heading.top >= top + 16 && heading.bottom < bottom - 16 && window.navigationScrollSample.stable >= 6
        }, null, { timeout: 4000 }).catch(async error => {
          console.log('Navigation failure', name, width, await page.evaluate(() => ({ title: document.querySelector('h2').textContent, top: document.querySelector('h2').getBoundingClientRect().top, scroll: scrollY, commands: window.navigationScrolls })))
          await page.screenshot({ path: `${import.meta.dirname}/failure-${name}-${width}.png` })
          throw error
        })
      }
      const goDown = async () => page.evaluate(() => {
        const target = document.querySelector('.quote-actions').previousElementSibling
        window.scrollTo({ top: Math.min(document.documentElement.scrollHeight - innerHeight, scrollY + target.getBoundingClientRect().top - 200), behavior: 'instant' })
        window.navigationScrolls = []
      })
      await page.goto(base + '/orcamento/notebook')
      await page.locator('.quote-next:not([disabled])').waitFor()
      await page.getByRole('button', { name: 'Dell', exact: true }).click()
      await next(); await ready('E o modelo?')
      await page.getByLabel('Não sei o modelo', { exact: true }).check()
      await next(); await ready('O que está acontecendo?')
      const cleaning = page.getByRole('button', { name: 'Limpeza e manutenção', exact: true })
      await cleaning.scrollIntoViewIfNeeded()
      await page.evaluate(() => { window.navigationScrolls = [] })
      await cleaning.click()
      assert.deepEqual(await page.evaluate(() => window.navigationScrolls), [], 'selection alone does not scroll')
      await goDown()
      const before = await page.locator('.quote-form-heading h2').boundingBox()
      assert.ok(before.y < 0, 'arrange the reported scrolled-down condition')
      await next(); await ready('Quer acrescentar algo?'); await visibleQuestion()
      const notes = await page.locator('#quote-notes').boundingBox()
      const actions = await page.locator('.quote-actions').boundingBox()
      assert.ok(notes.y > 0 && notes.y + notes.height < Math.min(height, actions.y) - 8, 'textarea is visible above the action bar')
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'H2', 'announce the question without opening the keyboard')
      const calls = await page.evaluate(() => window.navigationScrolls)
      assert.equal(calls.length, 1, 'one scroll per committed transition')
      assert.equal(calls[0][0].behavior, reduced ? 'instant' : 'smooth')
      await page.locator('#quote-notes').focus()
      await page.evaluate(() => { window.navigationScrolls = [] })
      await page.locator('#quote-notes').fill('Observação mantida durante a navegação.')
      assert.deepEqual(await page.evaluate(() => window.navigationScrolls), [], 'typing never invokes navigation scroll')
      if (width === 390 && !reduced) await page.screenshot({ path: `${import.meta.dirname}/${name}-notes-390.png` })
      await goDown()
      await page.locator('.quote-back').click(); await ready('O que está acontecendo?'); await visibleQuestion()
      assert.equal(await cleaning.getAttribute('aria-pressed'), 'true', 'back preserves the selected service')
      await page.getByRole('button', { name: 'Upgrade de SSD', exact: true }).click()
      await goDown(); await next(); await ready('O que você gostaria de melhorar?'); await visibleQuestion()
      await page.getByRole('button', { name: 'Pular detalhes', exact: true }).click(); await ready('Como prefere ser atendido?'); await visibleQuestion()
      await page.getByRole('button', { name: /Levar à loja/ }).click(); await next(); await ready('Confira seu pedido.'); await visibleQuestion()
      await page.getByRole('button', { name: 'Editar seu notebook', exact: true }).click(); await ready('Qual é a marca?'); await visibleQuestion()
      await next(); await ready('E o modelo?'); await next(); await ready('Confira seu pedido.'); await visibleQuestion()
      assert.match(await page.locator('.quote-review').innerText(), /Observação mantida/)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await page.addScriptTag({ path: axeScript })
      const axe = await page.evaluate(() => window.axe.run({ include: [['main'], ['.quote-header']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }))
      assert.deepEqual(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [])
      assert.deepEqual(errors, [])
      reports.push({ browser: name, width, height, reducedMotion: reduced, status: 'pass', checks: ['scrolled service to notes', 'heading and textarea in reading area', 'heading focus without keyboard', 'selection and typing do not scroll', 'one native navigation scroll', 'Back retains choice', 'upgrade follow-up', 'skip details', 'review edit and return', 'notes persist', 'overflow', 'Axe WCAG AA'] })
      console.log(name, width, reduced ? 'reduced' : 'smooth', 'passed')
      await context.close()
    }
  } finally { await browser.close() }
}
await writeFile(`${import.meta.dirname}/results.json`, JSON.stringify({ status: 'pass', reports }, null, 2) + '\n')
