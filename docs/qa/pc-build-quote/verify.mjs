import assert from 'node:assert/strict'
import { rename, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { resolve } from 'node:path'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const axeScript = process.env.PLAYWRIGHT_MODULE ? new URL('../axe-core/axe.min.js', process.env.PLAYWRIGHT_MODULE).pathname : new URL(import.meta.resolve('axe-core/axe.min.js')).pathname
const base = process.env.QUOTE_QA_BASE ?? 'http://127.0.0.1:4192'
const dir = import.meta.dirname
const key = 'master-prime:pc-build-quote:v1'
const bundle = await build({ entryPoints: [resolve(dir, '../../../src/data/pc-build-quote.ts')], bundle: true, platform: 'node', format: 'esm', write: false })
const { createPcBuildQuoteDraft } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const engines = process.env.PC_BUILD_QA_CHROMIUM_ONLY ? [['chromium', chromium]] : [['chromium', chromium], ['webkit', webkit]]
const sizes = process.env.PC_BUILD_QA_QUICK ? [[390, 844]] : [[320, 568], [390, 844], [430, 932], [1440, 1000]]
const reports = []
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const stable = (page, screen) => page.waitForFunction(expected => {
  const form = document.querySelector('.quote-form')
  return form?.dataset.screen === expected && form.getAttribute('aria-busy') === 'false' && document.getElementById(`pcb-heading-${expected}`) && !document.querySelector('.quote-next')?.disabled
}, screen)
const next = async (page, target) => { await page.locator('.quote-next').click(); await stable(page, target) }
const pick = (page, name) => page.getByRole('button', { name: new RegExp(`^${escape(name)}`) }).first().click()
const overflow = async page => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow')
const capture = async (page, filename, fullPage = false) => {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))) })
  await page.screenshot({ path: `${dir}/${filename}.png`, fullPage })
}
const axe = async page => {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))) })
  await page.addScriptTag({ path: axeScript })
  const result = await page.evaluate(async () => window.axe.run({ include: ['.quote-header', '.quote-layout'] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }))
  assert.deepEqual(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [])
}
const instrument = context => context.addInitScript(() => {
  window.openedQuotes = []
  window.open = (...args) => { window.openedQuotes.push(args); return null }
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard denied') } } })
  window.quoteMotionFrames = []
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.quote-form')
    if (!form) return
    let recording = false
    new MutationObserver(() => {
      if (form.getAttribute('aria-busy') !== 'true' || recording) return
      recording = true
      const record = () => {
        const node = document.querySelector('.quote-step')
        if (node) {
          const css = getComputedStyle(node)
          window.quoteMotionFrames.push({ screen: form.dataset.screen, x: css.transform === 'none' ? 0 : new DOMMatrixReadOnly(css.transform).m41, opacity: Number(css.opacity) })
        }
        if (form.getAttribute('aria-busy') === 'true') requestAnimationFrame(record)
        else recording = false
      }
      requestAnimationFrame(record)
    }).observe(form, { attributes: true, attributeFilter: ['aria-busy'] })
  })
})
const fixture = changes => ({ ...createPcBuildQuoteDraft(), mode: 'complete', purpose: 'gaming', budgetCents: 500000, budgetScope: 'pc', gameIds: ['valorant'], fulfillment: 'store', ...changes })
const seed = (context, draft, screen, extra = {}) => context.addInitScript(({ key, value }) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* Some tests disable storage. */ }
}, { key, value: { draft, screen, step: 4, editScope: null, savedAt: Date.now(), ...extra } })

for (const [engineName, engine] of engines) {
  const browser = await engine.launch(engineName === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
  try {
    for (const [width, height] of sizes) {
      const label = `${engineName}-${width}`
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: width === 320 ? 'reduce' : 'no-preference', ...(width === 390 ? { recordVideo: { dir, size: { width, height } } } : {}) })
      await context.route('https://**/*', route => route.abort())
      await instrument(context)
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        assert.equal((await page.goto(`${base}/orcamento/pc-gamer`)).status(), 200)
        await stable(page, 'mode')
        assert.equal(await page.locator('h1').count(), 1)
        await capture(page, `${label}-entry`)
        await overflow(page)
        await axe(page)
        await page.locator('.quote-next').click()
        await page.waitForFunction(() => document.activeElement?.id === 'pcb-mode')
        await pick(page, 'Já tenho algumas peças')
        await next(page, 'purpose')
        await pick(page, 'Jogar e trabalhar')
        await next(page, 'ownedParts')
        await page.locator('#pcb-ownedParts').fill('Ryzen 5, placa-mãe e memória — avaliar compatibilidade')
        await next(page, 'budget')
        await page.locator('#pcb-budget').fill('-1000')
        await page.locator('.quote-next').click()
        await page.waitForFunction(() => document.activeElement?.id === 'pcb-budget')
        await page.locator('#pcb-budget').fill('R$ 1.000,00')
        await next(page, 'budgetScope')
        await pick(page, 'PC e periféricos')
        await pick(page, 'Monitor')
        await pick(page, 'Mouse')
        await next(page, 'games')
        if (width <= 430) await page.waitForFunction(() => document.querySelector('.pcb-catalog-card').getBoundingClientRect().bottom <= document.querySelector('.quote-actions').getBoundingClientRect().top + 1)
        await pick(page, 'Call of Duty: Warzone')
        await page.getByRole('textbox', { name: 'Buscar ou adicionar jogo' }).fill('Meu Jogo de Estratégia')
        await pick(page, 'Adicionar “Meu Jogo de Estratégia”')
        await pick(page, 'Ver escolhas')
        await pick(page, 'Remover Meu Jogo de Estratégia')
        await page.getByRole('textbox', { name: 'Buscar ou adicionar jogo' }).fill('Meu Jogo de Estratégia')
        await pick(page, 'Adicionar “Meu Jogo de Estratégia”')
        await pick(page, 'Ver escolhas')
        await page.getByRole('textbox', { name: 'Buscar ou adicionar jogo' }).fill('cs go')
        await pick(page, 'Counter-Strike 2')
        await page.getByRole('textbox', { name: 'Buscar ou adicionar jogo' }).fill('')
        await page.locator('.quote-form-heading').scrollIntoViewIfNeeded()
        if (width === 320) await page.evaluate(() => {
          const heading = document.querySelector('.quote-form-heading')
          const progress = document.querySelector('.quote-progress')
          window.scrollTo({ top: Math.max(0, scrollY + heading.getBoundingClientRect().top - progress.getBoundingClientRect().height - 12), behavior: 'instant' })
        })
        await capture(page, `${label}-games`)
        if (width <= 430) assert(await page.evaluate(() => document.querySelector('.pcb-catalog-card').getBoundingClientRect().bottom <= document.querySelector('.quote-actions').getBoundingClientRect().top + 1), 'first game row is obscured by the fixed actions')
        await overflow(page)
        await axe(page)
        await next(page, 'programs')
        await pick(page, 'Blender')
        await next(page, 'objective')
        await page.locator('#pcb-objective').fill('Jogar com amigos e editar projetos para trabalho.')
        await next(page, 'personalize')
        await pick(page, 'Quero personalizar')
        await next(page, 'monitor')
        await pick(page, 'Full HD')
        await next(page, 'fps')
        await pick(page, '240 FPS')
        await page.locator('.pcb-feasibility').waitFor()
        assert((await page.locator('.pcb-feasibility').innerText()).includes('1.000,00'))
        await page.locator('.pcb-feasibility').getByRole('button', { name: 'Quero orientação', exact: true }).click()
        await next(page, 'graphics')
        await pick(page, 'Resposta rápida')
        await next(page, 'workload')
        await page.locator('#pcb-workload').fill('Modelagem e renderização no Blender.')
        await next(page, 'priorities')
        await pick(page, 'Menos ruído')
        await pick(page, 'Desempenho')
        assert.equal(await page.getByRole('button', { name: 'Visual', exact: true }).isDisabled(), true)
        await next(page, 'gpu')
        await pick(page, 'NVIDIA GeForce')
        await pick(page, 'NVIDIA ou AMD: o que comparar?')
        await page.locator('.pcb-learn-content').waitFor()
        await axe(page)
        if (width === 390) await capture(page, `${label}-gpu-guidance`, true)
        await next(page, 'cpu')
        await pick(page, 'AMD Ryzen')
        await next(page, 'appearance')
        await pick(page, 'Branco')
        await pick(page, 'Com RGB')
        assert.equal(await page.locator('.pcb-case-white.pcb-case-rgb').count(), 1)
        await page.locator('.quote-form-heading').scrollIntoViewIfNeeded()
        await capture(page, `${label}-appearance`)
        await overflow(page)
        await axe(page)
        await next(page, 'connectivity')
        await pick(page, 'Wi-Fi')
        await next(page, 'timing')
        await pick(page, 'Estou pesquisando')
        await page.locator('#pcb-notes').fill('Preferência por gabinete compacto. Sem promessa de FPS.')
        await next(page, 'fulfillment')
        await pick(page, 'Consultar entrega')
        await next(page, 'neighborhood')
        await page.locator('.quote-next').click()
        await page.waitForFunction(() => document.activeElement?.id === 'pcb-neighborhood')
        await page.locator('#pcb-neighborhood').fill('Campo Grande')
        await next(page, 'city')
        assert.equal(await page.locator('#pcb-city').inputValue(), 'Rio de Janeiro')
        await next(page, 'review')
        assert((await page.locator('.quote-review').innerText()).includes('Blender'))
        await page.reload()
        await stable(page, 'review')
        await overflow(page)
        await axe(page)
        await capture(page, `${label}-review`, true)
        await pick(page, 'Copiar resumo')
        await page.getByText('Selecione e copie o resumo abaixo.', { exact: true }).waitFor()
        assert((await page.getByRole('textbox', { name: 'Resumo para copiar' }).inputValue()).includes('Meta de FPS: 240 FPS'))
        await page.locator('.quote-next').click()
        const opened = await page.evaluate(() => window.openedQuotes)
        assert.equal(opened.length, 1)
        const url = new URL(opened[0][0])
        assert.equal(url.searchParams.get('phone'), '5521967635340')
        assert(url.searchParams.get('text').includes('Bairro: Campo Grande'))
        assert(url.searchParams.get('text').includes('NVIDIA GeForce'))
        assert(url.searchParams.get('text').includes('Quero orientação'))
        const events = await page.evaluate(() => (window.dataLayer ?? []).filter(event => event.quote_category === 'montagem-pc'))
        assert(events.length)
        assert(events.every(event => Object.keys(event).sort().join(',') === 'event,quote_category,quote_step'))
        await pick(page, 'Editar atendimento')
        await stable(page, 'fulfillment')
        await pick(page, 'Retirar na loja')
        await next(page, 'review')
        assert(!(await page.locator('.quote-review').innerText()).includes('Bairro:'))
        await pick(page, 'Editar seu projeto')
        await stable(page, 'mode')
        await pick(page, 'Quero um PC completo')
        await next(page, 'purpose')
        await pick(page, 'Trabalhar ou estudar')
        await next(page, 'review')
        assert(!(await page.locator('.quote-review').innerText()).includes('Jogos:'))
        assert(!(await page.locator('.quote-review').innerText()).includes('Peças que já tenho:'))
        const frames = await page.evaluate(() => window.quoteMotionFrames)
        if (width !== 320) assert(frames.some(frame => Math.abs(frame.x) > 1 && frame.opacity > 0 && frame.opacity < 1), 'motion not observed')
        assert.deepEqual(errors, [])
        reports.push({ label, passed: true, checks: ['full mixed flow', 'validation/focus', 'catalog/custom search', '240 FPS advisory', 'GPU guidance', 'appearance', 'delivery', 'refresh', 'clipboard fallback', 'WhatsApp', 'privacy', 'review edits', 'conditional pruning', 'axe', 'overflow', 'motion'] })
        console.log(`${label}: passed`)
      } catch (error) {
        await page.screenshot({ path: `${dir}/${label}-failure.png`, fullPage: true })
        throw error
      } finally { const video = page.video(); await context.close(); if (video) await rename(await video.path(), `${dir}/${label}-flow.webm`) }
    }

    // Repeat race/failure cases three times per browser with independent contexts.
    for (let repetition = 1; repetition <= 3; repetition++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
      await context.route('https://**/*', route => route.abort())
      await instrument(context)
      const page = await context.newPage()
      await seed(context, fixture({ mode: 'assembly', purpose: 'work', budgetCents: null, budgetUndecided: true, gameIds: [], programsUndecided: true, ownedParts: 'Peças do cliente' }), 'review')
      await page.goto(`${base}/orcamento/pc-gamer`)
      await stable(page, 'review')
      await page.locator('.quote-next').click()
      assert((await page.evaluate(() => window.openedQuotes[0][0])).includes('api.whatsapp.com'))
      await context.close()

      const denied = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
      await denied.route('https://**/*', route => route.abort())
      await instrument(denied)
      await denied.addInitScript(() => { Object.defineProperty(window, 'sessionStorage', { configurable: true, get() { throw new Error('Storage denied') } }) })
      const p = await denied.newPage()
      await p.goto(`${base}/orcamento/pc-gamer`)
      await stable(p, 'mode')
      await p.getByRole('button', { name: /^Quero um PC completo/ }).focus()
      await p.keyboard.press('Space')
      await p.locator('.quote-next').evaluate(button => { button.click(); button.click(); button.click() })
      await stable(p, 'purpose')
      await pick(p, 'Trabalhar ou estudar')
      await next(p, 'budget')
      await p.locator('#pcb-budget').focus()
      await p.evaluate(() => {
        Object.defineProperty(window.visualViewport, 'height', { configurable: true, get: () => 450 })
        window.visualViewport.dispatchEvent(new Event('resize'))
      })
      await p.waitForFunction(() => document.querySelector('.quote-page').dataset.keyboard === 'open')
      assert.equal(await p.locator('.quote-actions').isVisible(), false)
      await p.evaluate(() => {
        delete window.visualViewport.height
        window.visualViewport.dispatchEvent(new Event('resize'))
      })
      await p.waitForFunction(() => document.querySelector('.quote-page').dataset.keyboard === 'closed')
      await p.getByRole('checkbox', { name: 'Ainda não defini' }).check()
      await next(p, 'budgetScope')
      await pick(p, 'Só o PC / montagem')
      await next(p, 'programs')
      await p.getByRole('checkbox', { name: 'Ainda não sei', exact: true }).check()
      await next(p, 'objective')
      await next(p, 'personalize')
      await next(p, 'fulfillment')
      await pick(p, 'Retirar na loja')
      await next(p, 'review')
      await p.locator('.quote-next').click()
      assert.equal((await p.evaluate(() => window.openedQuotes)).length, 1)
      await denied.close()

      const missing = await browser.newContext({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' })
      await missing.route('https://**/*', route => route.abort())
      await missing.route('**/images/pc-games/**', route => route.abort())
      await instrument(missing)
      await seed(missing, fixture(), 'games')
      const m = await missing.newPage()
      await m.goto(`${base}/orcamento/pc-gamer`)
      await stable(m, 'games')
      await pick(m, 'Fortnite')
      await overflow(m)
      await next(m, 'objective')
      await missing.close()

      const expired = await browser.newContext({ reducedMotion: 'reduce' })
      await expired.route('https://**/*', route => route.abort())
      await seed(expired, fixture(), 'review', { savedAt: Date.now() - 7200001 })
      const e = await expired.newPage()
      await e.goto(`${base}/orcamento/pc-gamer`)
      await stable(e, 'mode')
      await expired.close()
      reports.push({ label: `${engineName}-edgecases-${repetition}`, passed: true, checks: ['assembly only', 'unknown budget/programs', 'storage denied', 'rapid navigation', 'keyboard viewport simulation', 'missing covers', 'expired draft'] })
      console.log(`${engineName} edgecases ${repetition}: passed`)
    }

    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
    await noJs.route('https://**/*', route => route.abort())
    const n = await noJs.newPage()
    assert.equal((await n.goto(`${base}/orcamento/pc-gamer`)).status(), 200)
    assert(await n.locator('h1').isVisible())
    assert(await n.locator('noscript a').isVisible())
    await noJs.close()
  } finally { await browser.close() }
}
await writeFile(`${dir}/results.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), reports }, null, 2) + '\n')
console.log(`Passed ${reports.length} browser scenarios plus no-JavaScript checks.`)
