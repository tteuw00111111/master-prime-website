import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const axeScript = process.env.PLAYWRIGHT_MODULE ? new URL('../axe-core/axe.min.js', process.env.PLAYWRIGHT_MODULE).pathname : new URL(import.meta.resolve('axe-core/axe.min.js')).pathname
const base = process.env.QUOTE_QA_BASE ?? 'http://localhost:4178'
const dir = import.meta.dirname, reports = []
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
 const browser = await engine.launch(name === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {})
 try {
 for (const [width, height, reduced] of [[320,568,true],[390,844,false],[1440,1000,false]]) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 800, hasTouch: width < 800, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await context.route('https://**/*', r => r.abort()); await context.route('**/catalog/**', r => r.abort())
  await context.addInitScript(() => { window.opened = []; window.open = url => { window.opened.push(url); return null } })
  const p = await context.newPage(), errors = []; p.on('pageerror', e => errors.push(e.message))
  const next = () => p.locator('.quote-next:not([disabled])').click()
  const ready = async title => { await p.getByRole('heading', { name: title, exact: true }).waitFor(); await p.waitForFunction(() => document.querySelector('.quote-form').getAttribute('aria-busy') === 'false') }
  const axe = async () => {
   await p.addScriptTag({ path: axeScript })
   const result = await p.evaluate(() => window.axe.run({ include: [['main'], ['.quote-header']] }, { runOnly: { type:'tag', values:['wcag2a','wcag2aa','wcag21aa'] } }))
   assert.deepEqual(result.violations.map(v => ({ id:v.id, nodes:v.nodes.map(n => n.target) })), [])
  }
  const speed = () => p.getByRole('checkbox', { name:'Velocidade para iniciar e abrir programas', exact:true })
  const space = () => p.getByRole('checkbox', { name:'Mais espaço para arquivos', exact:true })
  const ssd = () => p.getByRole('button', { name:'Upgrade de SSD', exact:true })
  const ram = () => p.getByRole('button', { name:'Upgrade de memória RAM', exact:true })
  await p.goto(base + '/orcamento/notebook'); await p.locator('.quote-next:not([disabled])').waitFor()
  await p.getByRole('button', { name:'Dell', exact:true }).click(); await next(); await ready('E o modelo?')
  await p.getByLabel('Não sei o modelo', { exact:true }).check(); await next(); await ready('O que está acontecendo?')
  assert.equal(await p.getByRole('button', { name:'SSD ou memória RAM', exact:true }).count(), 0, 'fresh drafts only show separate hardware choices')
  await ssd().click(); await ram().click()
  assert.equal(await ssd().getAttribute('aria-pressed'), 'true'); assert.equal(await ram().getAttribute('aria-pressed'), 'true')
  const icons = await p.locator('.quote-issue:has-text("Upgrade de") .quote-issue-icon').evaluateAll(es => es.map(e => e.innerHTML))
  assert.equal(new Set(icons).size, 2, 'SSD and RAM use distinct icons')
  await axe(); await p.screenshot({ path:`${dir}/${name}-services-${width}.png` })
  await next(); await ready('O que você gostaria de melhorar?')
  assert.equal(await p.getByRole('checkbox').count(), 4)
  await speed().click(); await space().click()
  assert.equal(await speed().getAttribute('aria-checked'), 'true'); assert.equal(await space().getAttribute('aria-checked'), 'true')
  await speed().focus(); await p.keyboard.press('Space'); assert.equal(await speed().getAttribute('aria-checked'), 'false')
  assert.equal(await space().getAttribute('aria-checked'), 'true'); await p.keyboard.press('Space')
  assert.equal(await speed().getAttribute('aria-checked'), 'true')
  await axe(); await p.screenshot({ path:`${dir}/${name}-goals-${width}.png` })
  await next(); await ready('Quer acrescentar algo?')
  await p.locator('.quote-back').click(); await ready('O que você gostaria de melhorar?')
  assert.equal(await speed().getAttribute('aria-checked'), 'true'); assert.equal(await space().getAttribute('aria-checked'), 'true')
  await p.waitForFunction(() => JSON.parse(sessionStorage.getItem('master-prime:notebook-quote:v1')).draft.answers['upgrade-goal'].length === 2)
  await p.reload(); await ready('O que você gostaria de melhorar?')
  assert.equal(await speed().getAttribute('aria-checked'), 'true'); assert.equal(await space().getAttribute('aria-checked'), 'true')
  await next(); await ready('Quer acrescentar algo?'); await next(); await ready('Como prefere ser atendido?')
  await p.getByRole('button', { name:/Levar à loja/ }).click(); await next(); await ready('Confira seu pedido.')
  let review = await p.locator('.quote-review').innerText()
  for (const text of ['Consultar upgrade de SSD','Consultar upgrade de memória RAM','Velocidade para iniciar e abrir programas','Mais espaço para arquivos','O que você gostaria de melhorar?']) assert.equal(review.split(text).length-1, 1)
  assert.doesNotMatch(review, /Usar vários programas ao mesmo tempo/)
  await axe(); await p.screenshot({ path:`${dir}/${name}-review-${width}.png` })
  // Verify both goals in the actual handoff, then exercise corrections.
  await next(); let message = new URL((await p.evaluate(() => window.opened))[0]).searchParams.get('text')
  for (const text of ['Consultar upgrade de SSD','Consultar upgrade de memória RAM','Velocidade para iniciar e abrir programas','Mais espaço para arquivos']) assert.equal(message.split(text).length-1,1)
  await p.getByRole('button', { name:'Editar detalhes', exact:true }).click(); await ready('O que você gostaria de melhorar?')
  await space().click(); assert.equal(await speed().getAttribute('aria-checked'),'true')
  await next(); await ready('Quer acrescentar algo?'); await next(); await ready('Confira seu pedido.')
  review = await p.locator('.quote-review').innerText(); assert.match(review,/Velocidade para iniciar/); assert.doesNotMatch(review,/Mais espaço para arquivos/)
  await p.getByRole('button', { name:'Editar o que você precisa', exact:true }).click(); await ready('O que está acontecendo?')
  await ssd().click(); assert.equal(await ram().getAttribute('aria-pressed'),'true'); await next(); await ready('Confira seu pedido.')
  review = await p.locator('.quote-review').innerText(); assert.doesNotMatch(review,/Consultar upgrade de SSD/); assert.match(review,/Consultar upgrade de memória RAM/); assert.match(review,/Velocidade para iniciar/)
  await p.getByRole('button', { name:'Editar o que você precisa', exact:true }).click(); await ready('O que está acontecendo?')
  await ram().click(); await p.getByRole('button', { name:'Limpeza e manutenção', exact:true }).click(); await next(); await ready('Confira seu pedido.')
  review = await p.locator('.quote-review').innerText(); assert.doesNotMatch(review,/upgrade|Velocidade para iniciar|Mais espaço para arquivos|O que você gostaria de melhorar/)
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),false)
  assert.deepEqual(errors,[])
  reports.push({ browser:name,width,reducedMotion:reduced,status:'pass',checks:['independent SSD/RAM choices','distinct hardware icons','multiple goals','Space toggles one goal','single shared question','back/reload preservation','review and WhatsApp include every selected goal once','editing details','removing one hardware preserves goals','removing last hardware removes stale goals','Axe WCAG AA','overflow'] })
  console.log(name,width,'passed'); await context.close()
 }
 // Original single-value drafts retain the unspecified hardware request and goal.
 const legacy = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'})
 await legacy.route('https://**/*',r=>r.abort()); await legacy.route('**/catalog/**',r=>r.abort())
 await legacy.addInitScript(()=>sessionStorage.setItem('master-prime:notebook-quote:v1',JSON.stringify({savedAt:Date.now(),screen:'question:upgrade-goal',draft:{version:1,category:'notebook',brandId:'dell',customBrand:'',model:'Inspiron 15 3520',modelUnknown:false,issueIds:['upgrade'],answers:{'upgrade-goal':'Mais espaço para arquivos'},notes:'',delivery:'store',neighborhood:'',city:'Rio de Janeiro'}})))
 const p=await legacy.newPage(); await p.goto(base+'/orcamento/notebook'); await p.getByRole('heading',{name:'O que você gostaria de melhorar?',exact:true}).waitFor(); await p.locator('.quote-next:not([disabled])').waitFor(); assert.equal(await p.getByRole('checkbox',{name:'Mais espaço para arquivos',exact:true}).getAttribute('aria-checked'),'true')
 await p.locator('.quote-back').click(); await p.getByRole('heading',{name:'O que está acontecendo?',exact:true}).waitFor(); await p.locator('.quote-next:not([disabled])').waitFor(); assert.equal(await p.getByRole('button',{name:'SSD ou memória RAM',exact:true}).getAttribute('aria-pressed'),'true'); await p.getByRole('button',{name:'Upgrade de SSD',exact:true}).click(); assert.equal(await p.getByRole('button',{name:'SSD ou memória RAM',exact:true}).count(),0); await p.locator('.quote-next').click(); await p.getByRole('heading',{name:'O que você gostaria de melhorar?',exact:true}).waitFor(); assert.equal(await p.getByRole('checkbox',{name:'Mais espaço para arquivos',exact:true}).getAttribute('aria-checked'),'true')
 reports.push({browser:name,scenario:'legacy draft',status:'pass'}); await legacy.close()
 } finally { await browser.close() }
}
await writeFile(`${dir}/results.json`,JSON.stringify({status:'pass',reports},null,2)+'\n')
