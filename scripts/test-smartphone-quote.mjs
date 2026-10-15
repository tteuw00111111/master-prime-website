import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const load = async path => {
  const result = await build({ entryPoints: [resolve(root, path)], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const phone = await load('src/utils/smartphone-quote.ts')
const flow = await load('src/utils/smartphone-quote-flow.ts')
const data = await load('src/data/smartphone-quote.ts')
const common = await load('src/utils/quote.ts')
const whatsapp = await load('src/utils/whatsapp.ts')
const notebookData = await load('src/data/notebook-quote.ts')
const gamingData = await load('src/data/gaming-quote.ts')
const complete = () => ({ ...data.createSmartphoneQuoteDraft(), brandId: 'apple', model: 'iPhone 13', issueIds: ['screen', 'battery'],
  answers: { 'screen-signs': ['Está trincada', 'O toque está falhando'], 'battery-signs': ['Descarrega rápido'] }, delivery: 'store' })

test('identification accepts listed, unlisted, other and unknown brands/models', () => {
  for (const values of [
    { brandId: 'apple', model: 'iPhone 13' }, { brandId: 'samsung', model: 'Galaxy A99 digitado' },
    { brandId: 'other', customBrand: 'Marca própria', model: 'X & Y' },
    { brandId: 'unknown', model: 'Modelo digitado' }, { brandId: 'unknown', model: '', modelUnknown: true },
    { brandId: 'tecno', model: '', modelUnknown: true },
  ]) assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...complete(), ...values }), null)
  assert.equal(flow.getFirstIncompleteSmartphoneScreen(data.createSmartphoneQuoteDraft()), 'brand')
  assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...complete(), brandId: 'other', customBrand: '  ' }), 'brand')
  assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...complete(), brandId: 'invented', customBrand: 'Ignored' }), 'brand')
  assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...complete(), model: '  ' }), 'model')
  assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...complete(), issueIds: ['invented'] }), 'issues')
})

test('suggestions filter by brand, support aliases and accept all-brand search only when unknown', () => {
  assert.equal(phone.searchSmartphoneModels('motorola', 'Motorola G54')[0].name, 'moto g54 5G')
  assert.equal(phone.searchSmartphoneModels('samsung', 'a55')[0].name, 'Galaxy A55')
  assert.equal(phone.searchSmartphoneModels('unknown', 'Poco X6 Pro')[0].brandId, 'xiaomi')
  assert.equal(phone.searchSmartphoneModels('apple', 'Galaxy').length, 0)
  assert.equal(phone.searchSmartphoneModels('other', 'iPhone').length, 0)
  assert.equal(phone.searchSmartphoneModels('unknown', 'a').length, 0)
  assert(phone.searchSmartphoneModels('unknown', 'pro').length <= 8)
  assert(data.SMARTPHONE_MODELS.length > 200)
  assert.equal(new Set(data.SMARTPHONE_MODELS.map(model => model.id)).size, data.SMARTPHONE_MODELS.length)
  const sources = new Set(Object.values(data.SMARTPHONE_CATALOG_SOURCES))
  for (const brand of data.SMARTPHONE_BRANDS) {
    assert(data.SMARTPHONE_MODELS.some(model => model.brandId === brand.id), `${brand.name} needs suggestions`)
  }
  for (const model of data.SMARTPHONE_MODELS) {
    assert(sources.has(model.source), `${model.name} needs a documented manufacturer source`)
    assert.equal(phone.searchSmartphoneModels(model.brandId, model.name)[0]?.id, model.id, model.name)
    assert.equal(phone.searchSmartphoneModels('unknown', model.name)[0]?.id, model.id, model.name)
  }
})

test('variant searches preserve plus and rank exact matches before family matches', () => {
  for (const [brand, query, expected] of [
    ['apple', 'iPhone 16 Pro Max', 'iPhone 16 Pro Max'],
    ['apple', 'iphone12mini', 'iPhone 12 mini'],
    ['apple', 'iPhone 15 Plus', 'iPhone 15 Plus'],
    ['apple', 'iPhone SE 2020', 'iPhone SE (2ª geração)'],
    ['samsung', 'S24', 'Galaxy S24'],
    ['samsung', 'S24+', 'Galaxy S24+'],
    ['samsung', 'Samsung S24 Plus', 'Galaxy S24+'],
    ['samsung', 'S24 Ultra', 'Galaxy S24 Ultra'],
    ['motorola', 'Motorola Edge 50 Ultra', 'motorola edge 50 ultra'],
    ['xiaomi', 'Redmi Note 13 Pro', 'Redmi Note 13 Pro'],
    ['xiaomi', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro+ 5G'],
    ['xiaomi', 'Redmi Note 13 Pro Plus 5G', 'Redmi Note 13 Pro+ 5G'],
    ['asus', 'ROG Phone 8 Pro', 'ROG Phone 8 Pro'],
    ['lg', 'LG G8X ThinQ', 'LG G8X ThinQ'],
    ['nokia', 'G11 Plus', 'Nokia G11 Plus'],
    ['realme', '12 Pro+', 'realme 12 Pro+ 5G'],
    ['oppo', 'A5 Pro 5G', 'OPPO A5 Pro 5G'],
    ['huawei', 'P40 Pro+', 'HUAWEI P40 Pro+'],
    ['infinix', 'HOT 40 Pro', 'Infinix HOT 40 Pro'],
    ['tecno', 'CAMON 30 Premier', 'TECNO CAMON 30 Premier 5G'],
  ]) {
    assert.equal(phone.searchSmartphoneModels(brand, query)[0]?.name, expected, query)
  }
  for (const [brand, query, base] of [
    ['samsung', 'S24+', 'Galaxy S24'],
    ['xiaomi', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro'],
    ['huawei', 'P40 Pro+', 'HUAWEI P40 Pro'],
  ]) assert(!phone.searchSmartphoneModels(brand, query).some(model => model.name === base), query)
})

test('brand changes clear identification and retain symptoms, details and notes', () => {
  const draft = { ...complete(), notes: 'Começou após queda' }
  const changed = phone.updateSmartphoneQuote(draft, { brandId: 'motorola' })
  assert.equal(changed.model, '')
  assert.equal(changed.modelUnknown, false)
  assert.deepEqual(changed.answers, draft.answers)
  assert.deepEqual(changed.issueIds, draft.issueIds)
  assert.equal(changed.notes, draft.notes)
  assert.equal(phone.updateSmartphoneQuote(draft, { brandId: 'apple' }).model, 'iPhone 13')
  assert.equal(phone.updateSmartphoneQuote(draft, { modelUnknown: true }).model, '')
  assert.equal(draft.model, 'iPhone 13', 'updates do not mutate the original')
})

test('removing a symptom discards only its dependent answers', () => {
  const changed = phone.toggleSmartphoneIssue(complete(), 'screen')
  assert.deepEqual(changed.issueIds, ['battery'])
  assert.deepEqual(changed.answers, { 'battery-signs': ['Descarrega rápido'] })
  assert.deepEqual(phone.toggleSmartphoneIssue(changed, 'screen').answers, changed.answers)
  assert.equal(phone.toggleSmartphoneIssue(changed, 'invented'), changed)
})

test('unsure answers are exclusive and can be replaced, toggled off or sanitized', () => {
  const question = data.SMARTPHONE_ISSUES[0].questions[0]
  let draft = complete()
  draft = { ...draft, answers: phone.toggleSmartphoneAnswer(draft, question, data.SMARTPHONE_UNSURE) }
  assert.deepEqual(phone.getSmartphoneAnswerValues(draft, question), [data.SMARTPHONE_UNSURE])
  const selected = { ...draft, answers: phone.toggleSmartphoneAnswer(draft, question, 'Está trincada') }
  assert.deepEqual(phone.getSmartphoneAnswerValues(selected, question), ['Está trincada'])
  assert.deepEqual(phone.toggleSmartphoneAnswer(draft, question, data.SMARTPHONE_UNSURE)[question.id], [])
  assert.equal(phone.toggleSmartphoneAnswer(draft, question, 'invented'), draft.answers)
  assert.deepEqual(phone.getSmartphoneAnswerValues({ answers: { [question.id]: ['Está trincada', data.SMARTPHONE_UNSURE] } }, question), [data.SMARTPHONE_UNSURE])
  assert(data.SMARTPHONE_ISSUES.every(issue => issue.questions.every(item => item.options.includes(data.SMARTPHONE_UNSURE))))
})

test('screen and battery accept multiple defined answers while single questions reject arrays', () => {
  const draft = complete()
  const screen = data.SMARTPHONE_ISSUES[0].questions[0]
  assert.deepEqual(phone.getSmartphoneAnswerValues(draft, screen), ['Está trincada', 'O toque está falhando'])
  const charging = data.SMARTPHONE_ISSUES.find(issue => issue.id === 'charging').questions[0]
  assert.deepEqual(phone.getSmartphoneAnswerValues({ answers: { [charging.id]: ['Carrega lentamente'] } }, charging), [])
  const cleaned = phone.sanitizeSmartphoneQuote({ ...draft, issueIds: ['screen', 'screen', 'invented'], answers: { 'screen-signs': ['O toque está falhando', 'invented', 'O toque está falhando'], 'liquid-signs': 'Parou de funcionar' } })
  assert.deepEqual(cleaned.issueIds, ['screen'])
  assert.deepEqual(cleaned.answers, { 'screen-signs': ['O toque está falhando'] })
})

test('screen sequence contains only selected optional questions and pickup fields', () => {
  const draft = complete()
  assert.deepEqual(flow.getSmartphoneScreens(draft), ['brand', 'model', 'issues', 'question:screen-signs', 'question:battery-signs', 'notes', 'delivery', 'review'])
  assert.deepEqual(flow.getSmartphoneScreens({ ...draft, issueIds: ['other'], delivery: 'pickup' }), ['brand', 'model', 'issues', 'notes', 'delivery', 'neighborhood', 'city', 'review'])
  assert.deepEqual(flow.getSmartphoneScreenErrors(draft, 'question:screen-signs'), {})
  assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...draft, answers: {} }), null)
  for (const [scope, screen] of [['identity', 'model'], ['issues', 'issues'], ['details', 'notes'], ['delivery', 'city']]) assert(flow.isSmartphoneScreenInScope(screen, scope))
  assert(!flow.isSmartphoneScreenInScope('review', 'delivery'))
})

test('pickup requires location; store and undecided exclude old pickup data', () => {
  const draft = { ...complete(), delivery: 'pickup', neighborhood: 'Paciência', city: 'Rio de Janeiro' }
  assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...draft, neighborhood: '' }), 'neighborhood')
  assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...draft, city: '' }), 'city')
  assert.equal(flow.getFirstIncompleteSmartphoneScreen({ ...draft, delivery: 'invented' }), 'delivery')
  assert.match(phone.buildSmartphoneQuoteMessage(draft), /Bairro: Paciência\nCidade: Rio de Janeiro/)
  for (const delivery of ['store', 'undecided']) assert.doesNotMatch(phone.buildSmartphoneQuoteMessage({ ...draft, delivery }), /Paciência|Bairro:|Cidade:/)
})

test('WhatsApp uses the existing phone, preserves accents and omits hidden or invalid data', () => {
  const draft = { ...complete(), notes: 'Após queda. Avaliação & diagnóstico + dúvidas?', answers: { ...complete().answers, 'liquid-signs': 'Parou de funcionar' } }
  const message = phone.buildSmartphoneQuoteMessage(draft)
  const url = new URL(whatsapp.getWhatsAppMessageUrl(message))
  assert.equal(url.searchParams.get('phone'), '5521967635340')
  assert.equal(url.searchParams.get('text'), message)
  assert.match(message, /Aparelho: Celular\nMarca: Apple\nModelo: iPhone 13/)
  assert.match(message, /Avaliação & diagnóstico \+ dúvidas\?/)
  assert.doesNotMatch(message, /Parou de funcionar|Bairro:|Cidade:/)
  assert.doesNotMatch(phone.buildSmartphoneQuoteMessage({ ...draft, modelUnknown: true }), /iPhone 13/)
})

test('draft restoration rejects malformed, stale, future and other-category drafts', () => {
  const now = 100000000
  const raw = (draft, savedAt = now) => JSON.stringify({ draft, savedAt })
  assert(phone.restoreSmartphoneQuoteDraft(raw(complete()), now))
  for (const value of [null, '{', '{}', 'null', raw(complete(), now + 1), raw(complete(), now - 7200001),
    raw(notebookData.createQuoteDraft()), raw(gamingData.createGamingQuoteDraft()), raw({ ...complete(), version: 2 }),
    raw({ ...complete(), answers: [] }), raw({ ...complete(), notes: null }), raw({ ...complete(), issueIds: null }), raw({ ...complete(), modelUnknown: 'yes' })]) assert.equal(phone.restoreSmartphoneQuoteDraft(value, now), null)
  assert(phone.restoreSmartphoneQuoteDraft(raw(complete(), now - 7200000), now), 'two-hour boundary remains valid')
})

test('restoration filters unknown options, clamps text and cannot bypass incomplete fields', () => {
  const now = Date.now()
  const saved = { ...complete(), brandId: 'invented', notes: 'x'.repeat(800), model: 'y'.repeat(150), neighborhood: 'z'.repeat(90),
    issueIds: ['screen', 'screen', 'invented'], answers: { 'screen-signs': ['Está trincada', 'invented'], 'battery-signs': ['Descarrega rápido'] } }
  const restored = phone.restoreSmartphoneQuoteDraft(JSON.stringify({ draft: saved, savedAt: now }), now)
  assert.equal(restored.brandId, '')
  assert.equal(restored.notes.length, 600)
  assert.equal(restored.model.length, 120)
  assert.equal(restored.neighborhood.length, 80)
  assert.deepEqual(restored.issueIds, ['screen'])
  assert.deepEqual(restored.answers, { 'screen-signs': ['Está trincada'] })
  assert.equal(flow.restoreSmartphoneScreen(restored, { screen: 'review' }), 'brand')
  assert.equal(flow.restoreSmartphoneScreen({ ...complete(), model: '' }, { screen: 'review' }), 'model')
  assert.equal(flow.restoreSmartphoneScreen(complete(), { screen: 'review' }), 'review')
  assert.equal(flow.restoreSmartphoneScreen(complete(), { screen: 'question:removed' }), 'brand')
})

test('three quote categories keep independent draft keys', () => {
  assert.equal(new Set([data.SMARTPHONE_STORAGE_KEY, notebookData.QUOTE_STORAGE_KEY, gamingData.GAMING_STORAGE_KEY]).size, 3)
  assert.equal(data.createSmartphoneQuoteDraft().category, 'celular')
  assert.equal(notebookData.createQuoteDraft().category, 'notebook')
  assert.equal(gamingData.createGamingQuoteDraft().category, 'videogame')
})

test('tracking allows category and stage only and preserves existing category defaults', () => {
  const originalWindow = globalThis.window
  globalThis.window = { dataLayer: [] }
  try {
    common.trackQuoteEvent('quote_started', 0, 'celular')
    common.trackQuoteEvent('quote_whatsapp_click', 4, 'celular')
    common.trackQuoteEvent('quote_started', 0)
    assert.deepEqual(globalThis.window.dataLayer, [
      { event: 'quote_started', quote_category: 'celular', quote_step: 1 },
      { event: 'quote_whatsapp_click', quote_category: 'celular', quote_step: 5 },
      { event: 'quote_started', quote_category: 'notebook', quote_step: 1 },
    ])
  } finally { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow }
})
