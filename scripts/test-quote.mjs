import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { build } from 'esbuild'
import { gunzipSync } from 'node:zlib'

const root = resolve(import.meta.dirname, '..')
const result = await build({ entryPoints: [resolve(root, 'src/utils/quote.ts')], bundle: true, platform: 'node', format: 'esm', write: false })
const quote = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
const flowResult = await build({ entryPoints: [resolve(root, 'src/utils/quote-flow.ts')], bundle: true, platform: 'node', format: 'esm', write: false })
const flow = await import(`data:text/javascript;base64,${Buffer.from(flowResult.outputFiles[0].text).toString('base64')}`)
const draft = () => ({ version: 1, category: 'notebook', brandId: 'dell', customBrand: '', model: 'Inspiron 15 3520', modelUnknown: false,
  issueIds: ['power', 'hinge'], answers: { 'power-signs': 'Não dá nenhum sinal' }, notes: 'Parou ontem. Já passou por reparo.', delivery: 'pickup', neighborhood: 'Paciência', city: 'Rio de Janeiro' })

test('unknown brand/model and an unlisted notebook can complete identification', () => {
  assert.equal(quote.getStepError({ ...draft(), brandId: 'unknown', modelUnknown: true, model: '' }, 0), null)
  assert.equal(quote.getStepError({ ...draft(), brandId: 'other', customBrand: 'Marca de fora do catálogo', model: 'Código informado' }, 0), null)
  assert.match(quote.getStepError({ ...draft(), model: '' }, 0), /modelo/)
  assert.match(quote.getStepError({ ...draft(), brandId: 'other', customBrand: '' }, 0), /marca/)
})

test('pickup requires neighborhood/city; switching to store removes them from the message', () => {
  assert.match(quote.getStepError({ ...draft(), neighborhood: ' ' }, 3), /bairro/)
  assert.match(quote.getStepError({ ...draft(), city: '' }, 3), /cidade/)
  const message = quote.buildQuoteMessage(draft())
  assert.match(message, /Bairro: Paciência/)
  assert.match(message, /Cidade: Rio de Janeiro/)
  assert.match(message, /confirmar disponibilidade/)
  const store = quote.buildQuoteMessage({ ...draft(), delivery: 'store' })
  assert.doesNotMatch(store, /Paciência|Bairro:|Cidade:/)
})

test('validation identifies each missing field in the order shown on screen', () => {
  assert.deepEqual(Object.keys(quote.getQuoteFieldErrors({ ...draft(), brandId: '', model: '' }, 0)), ['brand', 'model'])
  assert.deepEqual(quote.getQuoteFieldErrors({ ...draft(), brandId: 'other', customBrand: '' }, 0), { brand: 'Digite o nome da marca.' })
  assert.deepEqual(Object.keys(quote.getQuoteFieldErrors({ ...draft(), issueIds: [] }, 1)), ['issues'])
  assert.deepEqual(Object.keys(quote.getQuoteFieldErrors({ ...draft(), delivery: '' }, 3)), ['delivery'])
  assert.deepEqual(Object.keys(quote.getQuoteFieldErrors({ ...draft(), neighborhood: '', city: '' }, 3)), ['neighborhood', 'city'])
  assert.deepEqual(quote.getQuoteFieldErrors({ ...draft(), delivery: 'store', neighborhood: '', city: '' }, 3), {})
  assert.deepEqual(quote.getQuoteFieldErrors({ ...draft(), answers: {}, notes: '' }, 2), {})
})

test('multiple symptoms and optional details survive; removed symptoms cannot leak stale answers', () => {
  const message = quote.buildQuoteMessage(draft())
  assert.match(message, /Não liga/)
  assert.match(message, /Dobradiça ou carcaça/)
  assert.match(message, /Parou ontem/)
  assert.doesNotMatch(quote.buildQuoteMessage({ ...draft(), issueIds: ['hinge'] }), /Não dá nenhum sinal/)
  assert.match(quote.buildQuoteMessage({ ...draft(), modelUnknown: true, model: 'stale-model' }), /Modelo: Não sei o modelo/)
  assert.doesNotMatch(quote.buildQuoteMessage({ ...draft(), modelUnknown: true, model: 'stale-model' }), /stale-model/)
  assert.equal(quote.getFirstIncompleteStep(draft()), null)
  assert.equal(quote.getFirstIncompleteStep({ ...draft(), issueIds: [] }), 1)
})

test('SSD and RAM are independent requests with one shared optional goals question', () => {
  const both = { ...draft(), issueIds: ['ssd', 'ram'], answers: {} }
  assert.deepEqual(quote.getQuoteIssues(both).map(issue => issue.label), ['Consultar upgrade de SSD', 'Consultar upgrade de memória RAM'])
  assert.equal(quote.getQuoteQuestions(both).length, 1)
  assert.equal(quote.getQuoteQuestions(both)[0].multiple, true)
  assert.equal(flow.getQuoteScreens(both).filter(screen => screen === 'question:upgrade-goal').length, 1)
  assert.equal(quote.getStepError(both, 2), null, 'upgrade details remain optional')
  for (const id of ['ssd', 'ram']) assert.equal(quote.getQuoteQuestions({ ...both, issueIds: [id] })[0].id, 'upgrade-goal')
})

test('upgrade goals toggle independently while symptom answers remain single-choice', () => {
  const question = quote.getQuoteQuestions({ ...draft(), issueIds: ['ssd'] })[0]
  let value = { ...draft(), issueIds: ['ssd'], answers: {} }
  value.answers = quote.toggleQuoteAnswer(value, question, 'Velocidade para iniciar e abrir programas')
  value.answers = quote.toggleQuoteAnswer(value, question, 'Mais espaço para arquivos')
  assert.deepEqual(quote.getQuoteAnswerValues(value, question), ['Velocidade para iniciar e abrir programas', 'Mais espaço para arquivos'])
  value.answers = quote.toggleQuoteAnswer(value, question, 'Velocidade para iniciar e abrir programas')
  assert.deepEqual(quote.getQuoteAnswerValues(value, question), ['Mais espaço para arquivos'])
  assert.equal(quote.toggleQuoteAnswer(value, question, 'Invented option'), value.answers)
  value.answers = quote.toggleQuoteAnswer(value, question, 'Mais espaço para arquivos')
  assert.deepEqual(quote.getQuoteAnswerValues(value, question), [])
  assert.doesNotMatch(quote.buildQuoteMessage(value), /O que você gostaria de melhorar\?/)

  const symptom = quote.getQuoteQuestions(draft())[0]
  let single = draft()
  single.answers = quote.toggleQuoteAnswer(single, symptom, 'Acende luz ou faz barulho')
  assert.equal(single.answers['power-signs'], 'Acende luz ou faz barulho')
  single.answers = quote.toggleQuoteAnswer(single, symptom, 'Liga e apaga em seguida')
  assert.equal(single.answers['power-signs'], 'Liga e apaga em seguida')
  single.answers = quote.toggleQuoteAnswer(single, symptom, 'Liga e apaga em seguida')
  assert.deepEqual(quote.getQuoteAnswerValues(single, symptom), [])
})

test('both goals reach WhatsApp once and survive removing one upgrade, but not both', () => {
  let value = { ...draft(), issueIds: ['ssd', 'ram'], answers: { 'upgrade-goal': ['Velocidade para iniciar e abrir programas', 'Mais espaço para arquivos'] } }
  const message = quote.buildQuoteMessage(value)
  for (const phrase of ['Consultar upgrade de SSD', 'Consultar upgrade de memória RAM', 'Velocidade para iniciar e abrir programas', 'Mais espaço para arquivos', 'O que você gostaria de melhorar?']) {
    assert.equal(message.split(phrase).length - 1, 1)
  }
  assert.doesNotMatch(message, /Usar vários programas ao mesmo tempo/)
  value = { ...value, ...quote.toggleQuoteIssue(value, 'ssd') }
  assert.deepEqual(value.issueIds, ['ram'])
  assert.equal(quote.getQuoteQuestions(value).length, 1)
  assert.deepEqual(value.answers['upgrade-goal'], ['Velocidade para iniciar e abrir programas', 'Mais espaço para arquivos'])
  assert.doesNotMatch(quote.buildQuoteMessage(value), /Consultar upgrade de SSD/)
  value = { ...value, ...quote.toggleQuoteIssue(value, 'ram') }
  assert.deepEqual(value.answers, {})
  assert.doesNotMatch(quote.buildQuoteMessage(value), /Mais espaço para arquivos|O que você gostaria de melhorar\?/)
})

test('restoration sanitizes multi-select goals and preserves older upgrade drafts without guessing hardware', () => {
  const now = 100000000
  const restore = value => quote.restoreQuoteDraft(JSON.stringify({ savedAt: now, draft: value }), now)
  const restored = restore({ ...draft(), issueIds: ['ssd', 'ram', 'power'], answers: {
    'upgrade-goal': ['Mais espaço para arquivos', 'invalid', 'Mais espaço para arquivos', null, 17, 'Velocidade para iniciar e abrir programas'],
    'power-signs': ['Não dá nenhum sinal'],
  } })
  assert.deepEqual(restored.answers, { 'upgrade-goal': ['Velocidade para iniciar e abrir programas', 'Mais espaço para arquivos'] })
  const old = restore({ ...draft(), issueIds: ['upgrade'], answers: { 'upgrade-goal': 'Mais espaço para arquivos' } })
  assert.deepEqual(old.issueIds, ['upgrade'])
  assert.deepEqual(old.answers['upgrade-goal'], ['Mais espaço para arquivos'])
  assert.equal(flow.restoreQuoteScreen(old, { screen: 'question:upgrade-goal' }), 'question:upgrade-goal')
  assert.match(quote.buildQuoteMessage(old), /Consultar SSD ou memória RAM/)
  assert.doesNotMatch(quote.buildQuoteMessage(old), /Consultar upgrade de SSD|Consultar upgrade de memória RAM/)
  const specified = { ...old, ...quote.toggleQuoteIssue(old, 'ssd') }
  assert.deepEqual(specified.issueIds, ['ssd'])
  assert.deepEqual(specified.answers['upgrade-goal'], ['Mais espaço para arquivos'])
  assert.deepEqual(restore({ ...draft(), issueIds: ['ram'], answers: { 'upgrade-goal': 'Quero uma orientação' } }).answers['upgrade-goal'], ['Quero uma orientação'])
})

test('restoration rejects expired/invalid drafts and filters untrusted choices', () => {
  const now = 100000000
  assert.equal(quote.restoreQuoteDraft('{'), null)
  assert.equal(quote.restoreQuoteDraft(JSON.stringify({ savedAt: now - 7200001, draft: draft() }), now), null)
  assert.equal(quote.restoreQuoteDraft(JSON.stringify({ savedAt: now + 1, draft: draft() }), now), null)
  const saved = quote.restoreQuoteDraft(JSON.stringify({ savedAt: now, draft: { ...draft(), issueIds: ['power', 'invented'], answers: { 'power-signs': 'not an option', 'heat-timing': 'Depois de um tempo usando' }, notes: 'a'.repeat(900) } }), now)
  assert.deepEqual(saved.issueIds, ['power'])
  assert.deepEqual(saved.answers, {})
  assert.equal(saved.notes.length, 600)
  const imported = quote.restoreQuoteDraft(JSON.stringify({ savedAt: now, draft: { ...draft(), brandId: 'fujitsu', customBrand: 'Fujitsu' } }), now)
  assert.equal(quote.getQuoteBrand(imported), 'Fujitsu')
})

test('search matches aliases without accents, spaces, case or punctuation and stays inside the brand', () => {
  const models = [
    { id: 'a', brandId: 'dell', name: 'Inspiron 15 3520', aliases: ['i15-3520-A30P'], source: 'https://example.org' },
    { id: 'b', brandId: 'lenovo', name: 'IdeaPad 3 15ITL6', aliases: [], source: 'https://example.org' },
  ]
  assert.equal(quote.searchCatalogModels(models, 'dell', 'I15 3520 a30p')[0].id, 'a')
  assert.equal(quote.searchCatalogModels(models, 'dell', 'Inspirón153520')[0].id, 'a')
  assert.equal(quote.searchCatalogModels(models, 'lenovo', '3520').length, 0)
  assert.throws(() => quote.parseNotebookCatalog({ version: 1, models: [{ id: 'broken' }] }))
})

test('tracking never sends free text, location or message URLs', () => {
  globalThis.window = { dataLayer: [] }
  quote.trackQuoteEvent('quote_whatsapp_click', 4)
  assert.deepEqual(globalThis.window.dataLayer, [{ event: 'quote_whatsapp_click', quote_category: 'notebook', quote_step: 5 }])
  delete globalThis.window
})

test('guided questions validate only the visible field and keep details optional', () => {
  const empty = { ...draft(), brandId: '', model: '', delivery: '', neighborhood: '', city: '' }
  assert.deepEqual(Object.keys(flow.getScreenErrors(empty, 'brand')), ['brand'])
  assert.deepEqual(Object.keys(flow.getScreenErrors(empty, 'model')), ['model'])
  assert.deepEqual(Object.keys(flow.getScreenErrors(empty, 'delivery')), ['delivery'])
  assert.deepEqual(flow.getScreenErrors(empty, 'notes'), {})
  assert.equal(flow.getFirstIncompleteScreen(empty), 'brand')
  assert.equal(flow.getFirstIncompleteScreen({ ...draft(), model: '' }), 'model')
  assert.equal(flow.getFirstIncompleteScreen({ ...draft(), city: '' }), 'city')
})

test('guided flow follows selected symptoms and removes pickup questions after changing to store', () => {
  const screens = flow.getQuoteScreens(draft())
  assert.ok(screens.indexOf('question:power-signs') < screens.indexOf('question:hinge-signs'))
  assert.ok(screens.indexOf('notes') < screens.indexOf('delivery'))
  assert.ok(screens.indexOf('neighborhood') < screens.indexOf('city'))
  const changed = flow.getQuoteScreens({ ...draft(), issueIds: ['other'], delivery: 'store' })
  assert.deepEqual(changed, ['brand', 'model', 'issues', 'notes', 'delivery', 'review'])
  assert.equal(flow.getFirstIncompleteScreen(draft()), null)
})

test('question restoration supports legacy drafts and cannot skip incomplete identification or location', () => {
  assert.equal(flow.restoreQuoteScreen(draft(), { step: 2 }), 'question:power-signs')
  assert.equal(flow.restoreQuoteScreen(draft(), { screen: 'question:hinge-signs', step: 2 }), 'question:hinge-signs')
  assert.equal(flow.restoreQuoteScreen({ ...draft(), model: '' }, { screen: 'review' }), 'model')
  assert.equal(flow.restoreQuoteScreen({ ...draft(), neighborhood: '' }, { screen: 'city' }), 'neighborhood')
  assert.equal(flow.restoreQuoteScreen(draft(), { screen: '<script>', step: 99 }), 'brand')
  assert.equal(flow.restoreQuoteScreen({ ...draft(), delivery: 'store' }, { screen: 'city', step: 3 }), 'delivery')
})

test('catalog manifest and brand files are complete, consistent and contain identification data only', () => {
  const manifest = quote.parseNotebookCatalog(JSON.parse(readFileSync(resolve(root, 'public/catalog/notebooks.json'), 'utf8')))
  assert.ok(manifest.brands.length > 0)
  const ids = new Set()
  for (const brand of manifest.brands) {
    assert.match(brand.file, /^\/catalog\/notebooks\/[a-z0-9-]+\.json$/)
    const raw = readFileSync(resolve(root, 'public', brand.file.slice(1)), 'utf8')
    if (brand.compressedFile) assert.equal(gunzipSync(readFileSync(resolve(root, 'public', brand.compressedFile.slice(1)))).toString(), raw)
    const payload = JSON.parse(raw)
    const models = quote.parseNotebookCatalog(payload).models
    assert.equal(models.length, brand.count)
    for (const model of models) {
      assert.equal(model.brandId, brand.id)
      assert.doesNotMatch(model.name, /\b(?:test|autotest|dummy|placeholder|impressora|printer|toner|cartridge|cartucho|scanner)\b/i)
      assert.ok(!ids.has(model.id), `Duplicate model ID ${model.id}`)
      ids.add(model.id)
      assert.deepEqual(Object.keys(model).sort(), ['aliases', 'brandId', 'id', 'name', 'source'])
    }
  }
})
