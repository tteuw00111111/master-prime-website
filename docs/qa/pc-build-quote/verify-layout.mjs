import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { resolve } from 'node:path'

// Focused verification of the final CSS refinements after the full interaction
// matrix: first game row, first appearance choice and opaque short-screen progress.
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const axeScript = process.env.PLAYWRIGHT_MODULE ? new URL('../axe-core/axe.min.js', process.env.PLAYWRIGHT_MODULE).pathname : new URL(import.meta.resolve('axe-core/axe.min.js')).pathname
const base = process.env.QUOTE_QA_BASE ?? 'http://127.0.0.1:4192'
const dir = import.meta.dirname
const bundle = await build({ entryPoints: [resolve(dir, '../../../src/data/pc-build-quote.ts')], bundle: true, platform: 'node', format: 'esm', write: false })
const { createPcBuildQuoteDraft } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const reports = []
for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch(engineName === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
  try {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [1440, 1000]]) {
      for (const screen of ['games', 'appearance']) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
        try {
          await context.route('https://**/*', route => route.abort())
          const draft = { ...createPcBuildQuoteDraft(), mode: 'complete', purpose: 'both', budgetCents: 100000, budgetScope: 'pc', gameIds: ['warzone', 'cs2'], customGames: ['Meu Jogo de Estratégia'], programIds: ['blender'], personalize: true, caseColor: 'white', lighting: 'rgb', fulfillment: 'store' }
          await context.addInitScript(({ draft, screen }) => sessionStorage.setItem('master-prime:pc-build-quote:v1', JSON.stringify({ draft, screen, step: 2, editScope: null, savedAt: Date.now() })), { draft, screen })
          const page = await context.newPage()
          assert.equal((await page.goto(`${base}/orcamento/pc-gamer`)).status(), 200)
          await page.waitForFunction(screen => document.getElementById(`pcb-heading-${screen}`) && !document.querySelector('.quote-next').disabled, screen)
          await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))) })
          if (width === 320) await page.evaluate(() => window.scrollTo({ top: Math.max(0, scrollY + document.querySelector('.quote-form-heading').getBoundingClientRect().top - document.querySelector('.quote-progress').getBoundingClientRect().height - 12), behavior: 'instant' }))
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
          if (width <= 430) {
            const selector = screen === 'games' ? '.pcb-catalog-card' : '.quote-step fieldset .quote-answer'
            assert(await page.evaluate(selector => document.querySelector(selector).getBoundingClientRect().bottom <= document.querySelector('.quote-actions').getBoundingClientRect().top + 1, selector), `${engineName}-${width}-${screen}: first choice hidden`)
          }
          if (width === 320) assert.equal(await page.locator('.quote-progress').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(10, 10, 10)')
          await page.addScriptTag({ path: axeScript })
          const violations = await page.evaluate(async () => (await window.axe.run({ include: ['.quote-header', '.quote-layout'] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id))
          assert.deepEqual(violations, [])
          await page.screenshot({ path: `${dir}/${engineName}-${width}-${screen}.png` })
          reports.push({ engine: engineName, width, screen, passed: true })
        } finally { await context.close() }
      }
    }
  } finally { await browser.close() }
}
await writeFile(`${dir}/layout-results.json`, JSON.stringify({ checkedAt: new Date().toISOString(), reports }, null, 2) + '\n')
console.log(`Passed ${reports.length} final layout/accessibility scenarios.`)
