import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const base = process.env.QUOTE_QA_BASE ?? 'http://127.0.0.1:4186'
const dir = import.meta.dirname
const key = 'master-prime:computer-quote:v1'
const reports = []
const stable = (page, screen) => page.waitForFunction(expected => {
  const form = document.querySelector('.quote-form')
  return form?.dataset.screen === expected && form.getAttribute('aria-busy') === 'false' && !document.querySelector('.quote-next').disabled
}, screen)
const next = async (page, screen) => { await page.locator('.quote-next').click(); await stable(page, screen) }
const pick = (page, name) => page.getByRole('button', { name, exact: true }).click()

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch(name === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
  try {
    for (let repetition = 1; repetition <= 3; repetition++) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
      await context.route('https://**/*', route => route.abort())
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        await page.goto(base + '/orcamento/computador')
        await stable(page, 'kind')
        await page.evaluate(key => sessionStorage.setItem(key, JSON.stringify({
          savedAt: Date.now(), screen: 'review', step: 4, editScope: null,
          draft: { version: 1, category: 'computador', intent: 'repair', kind: 'desktop', configuration: 'Dell',
            issueIds: ['power', 'ssd', 'ram'], answers: { 'power-signs': 'Não dá nenhum sinal', 'upgrade-goal': ['Mais espaço para arquivos'] },
            notes: 'Observações que devem ser preservadas.', delivery: 'store', neighborhood: '', city: 'Rio de Janeiro' },
        })), key)
        await page.reload()
        await stable(page, 'review')

        await pick(page, 'Editar computador')
        await stable(page, 'kind')
        await pick(page, 'Não sei dizer')
        await next(page, 'configuration')
        await page.locator('#quote-configuration').fill('')
        await next(page, 'review')
        assert((await page.locator('.quote-review').innerText()).includes('Computador (tipo a identificar)'))
        assert(!(await page.locator('.quote-review').innerText()).includes('Dell'))

        await pick(page, 'Editar detalhes')
        await stable(page, 'question:power-signs')
        await pick(page, 'Acende luzes ou gira as ventoinhas')
        await next(page, 'question:upgrade-goal')
        await page.getByRole('checkbox', { name: 'Usar vários programas ao mesmo tempo', exact: true }).click()
        await next(page, 'notes')
        await page.locator('#quote-notes').fill('Atualização das observações — manter.')
        await pick(page, 'Pular detalhes')
        await stable(page, 'review')
        assert((await page.locator('.quote-review').innerText()).includes('Acende luzes ou gira as ventoinhas'))

        await pick(page, 'Editar problemas e solicitações')
        await stable(page, 'issues')
        await pick(page, 'Não liga')
        await pick(page, 'Upgrade de SSD')
        await next(page, 'review')
        const saved = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key)
        assert.equal(saved.draft.answers['power-signs'], undefined)
        assert.equal(saved.draft.answers['upgrade-goal'].length, 2)
        await pick(page, 'Editar detalhes')
        await stable(page, 'question:upgrade-goal')
        await pick(page, 'Pular detalhes')
        await stable(page, 'review')
        assert((await page.locator('.quote-review').innerText()).includes('Atualização das observações — manter.'))
        assert((await page.locator('.quote-review').innerText()).includes('Usar vários programas ao mesmo tempo'))
        await pick(page, 'Editar problemas e solicitações')
        await stable(page, 'issues')
        await pick(page, 'Upgrade de memória RAM')
        await page.locator('.quote-next').click()
        await page.waitForFunction(() => document.activeElement?.id === 'quote-issues')
        await pick(page, 'Outro problema')
        await next(page, 'review')
        assert.deepEqual(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).draft.answers, key), {})

        // Progress navigation and repeated clicks keep the same answers and never skip screens.
        await page.getByRole('button', { name: 'Voltar para a etapa 1 de 5: Seu computador, concluída' }).click()
        await stable(page, 'kind')
        await page.locator('.quote-next').evaluate(button => { button.click(); button.click(); button.click() })
        await stable(page, 'configuration')
        await next(page, 'issues')
        assert.equal(await page.getByRole('button', { name: 'Outro problema', exact: true }).getAttribute('aria-pressed'), 'true')
        await page.locator('.quote-back').click()
        await stable(page, 'configuration')

        if (repetition === 1) {
          await page.locator('#quote-configuration').focus()
          await page.setViewportSize({ width: 390, height: 430 })
          await page.waitForFunction(() => document.querySelector('.quote-page').dataset.keyboard === 'open' && getComputedStyle(document.querySelector('.quote-actions')).visibility === 'hidden')
          await page.screenshot({ path: `${dir}/${name}-keyboard-simulated.png` })
          await page.setViewportSize({ width: 390, height: 844 })
          await page.locator('#quote-configuration').blur()
          await page.waitForFunction(() => document.querySelector('.quote-page').dataset.keyboard === 'closed' && getComputedStyle(document.querySelector('.quote-actions')).visibility === 'visible')
          await page.setViewportSize({ width: 1280, height: 1000 })
          await page.evaluate(() => { document.documentElement.style.zoom = '2' })
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
          await page.screenshot({ path: `${dir}/${name}-zoom-200.png` })
          await page.evaluate(() => { document.documentElement.style.zoom = '' })
        }

        for (const scenario of ['malformed', 'expired', 'build']) {
          await page.evaluate(({ key, scenario }) => {
            const saved = JSON.parse(sessionStorage.getItem(key))
            if (scenario === 'malformed') sessionStorage.setItem(key, '{')
            else {
              if (scenario === 'expired') saved.savedAt = Date.now() - 7200001
              if (scenario === 'build') saved.draft.intent = 'build'
              sessionStorage.setItem(key, JSON.stringify(saved))
            }
          }, { key, scenario })
          await page.reload()
          await stable(page, 'kind')
          assert.equal(await page.locator('.quote-answer[aria-pressed="true"]').count(), 0)
        }
        assert.deepEqual(errors, [])
        reports.push({ engine: name, repetition, status: 'pass', checks: ['identity editing', 'detail editing', 'shared upgrade retention and removal', 'skip preserves existing details', 'required selection after edit', 'progress and back navigation', 'rapid clicks', 'malformed/expired/build drafts rejected', ...(repetition === 1 ? ['simulated keyboard', '200% zoom'] : [])] })
        console.log(`${name} edge cases ${repetition}/3 passed`)
      } finally { await context.close() }
    }
  } finally { await browser.close() }
}

await writeFile(`${dir}/edgecases.json`, JSON.stringify({ status: 'pass', base, reports }, null, 2) + '\n')
