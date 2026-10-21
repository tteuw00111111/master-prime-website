import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const load = async file => {
  const result = await build({ entryPoints: [resolve(import.meta.dirname, '../', file)], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const data = await load('src/data/iphone-purchase.ts')
const usedColors = await load('src/data/iphone-used-colors.ts')
const catalog = await load('src/utils/iphone-catalog.ts')
const pricing = await load('src/utils/iphone-pricing.ts')
const q = await load('src/utils/iphone-purchase.ts')
const tracking = await load('src/utils/iphone-purchase-tracking.ts')
const whatsapp = await load('src/utils/whatsapp.ts')
const complete = () => ({ ...data.createIPhonePurchaseDraft(), selection: { modelId: 'iphone-17-pro-max', capacity: 256, condition: 'sealed', colorId: 'orange' }, payment: 'À vista', paymentDetail: 'Pix', timing: 'Nos próximos dias', tradeChoice: 'no' })
const tradeModel = name => data.IPHONE_TRADE_MODELS.find(v => v.name === name).id
const withTrade = () => ({ ...complete(), tradeChoice: 'yes', trade: { ...data.createIPhoneTrade(), modelId: tradeModel('iPhone 15 Pro'), capacity: 'unknown', batteryUnknown: true, screen: 'Não sei', back: 'Marcas ou riscos', sides: 'Não sei', repairs: 'Houve troca ou reparo', repairParts: ['Tela'], faults: ['Face ID'], liquid: 'Não sei', activation: 'Não sei', notes: 'NOTA_PRIVADA_QA', color: 'Azul' } })
const envelope = (draft, overrides = {}) => JSON.stringify({ draft, screen: 'review', savedAt: Date.now(), attemptId: 'ip_12345678', entryKey: q.iPhoneSelectionKey(draft.selection), catalogFingerprint: q.iPhoneCatalogFingerprint(), ...overrides })

test('catalog groups comparable conditions and excludes unavailable prices and models', () => {
  const groups = catalog.getIPhoneCatalogGroups()
  assert.equal(groups.length, 14)
  const pro = groups.find(group => group.modelId === 'iphone-15-pro')
  assert.deepEqual(pro.variants.map(variant => variant.capacity), [128, 256])
  assert.equal(pro.cheapest.cashCents, 395000)
  const sample = [
    { ...data.IPHONE_VARIANTS[0], availability: 'unavailable' },
    data.IPHONE_VARIANTS[1],
    { ...data.IPHONE_VARIANTS[0], id: 'used', condition: 'used', cashCents: 100000, colorId: '' },
  ]
  const filtered = catalog.getIPhoneCatalogGroups(sample)
  assert.equal(filtered.length, 2, 'condition has its own group')
  assert.equal(filtered[0].cheapest.id, data.IPHONE_VARIANTS[1].id, 'unavailable minimum never advertised')
  assert.equal(catalog.getIPhoneCatalogGroups(sample.map(variant => ({ ...variant, availability: 'unavailable' }))).length, 0)
  assert.equal(catalog.getIPhoneCatalogGroups([]).length, 0)
})
test('hub entry and model links preserve the existing quote URL contract', () => {
  assert.equal(catalog.isIPhoneQuoteEntry(''), false)
  assert.equal(catalog.isIPhoneQuoteEntry('?utm_source=whatsapp'), false)
  assert.equal(catalog.isIPhoneQuoteEntry('?view=quote'), true)
  assert.equal(catalog.isIPhoneQuoteEntry('?model=iphone-13&condition=used'), true)
  for (const group of catalog.getIPhoneCatalogGroups()) {
    const url = catalog.getIPhoneCatalogLink(group.cheapest)
    const selection = q.parseIPhoneEntry(new URL(url, 'https://master-prime.com').search)
    assert.equal(selection.modelId, group.modelId)
    assert.equal(selection.condition, group.condition)
    assert.equal(selection.capacity, group.cheapest.capacity)
    assert.equal(selection.colorId, '', 'a catalog preview never chooses a sealed color')
    assert(!url.includes('price='))
  }
})

test('all 22 commercial rows preserve cash prices and use the confirmed 8.57% markup', () => {
  assert.equal(data.IPHONE_VARIANTS.length, 22)
  assert.equal(new Set(data.IPHONE_VARIANTS.map(v => v.id)).size, 22)
  const expected = [
    [769999, 69666], [810000, 73285], [799999, 72380], [979999, 88665], [979999, 88665], [1030000, 93189], [990000, 89570], [1110000, 100427], [1050000, 94999],
    [230000, 20809], [380000, 34381], [245000, 22166], [270000, 24428], [320000, 28952], [370000, 33476], [320000, 28952], [335000, 30309], [395000, 35738], [405000, 36642], [440000, 39809], [410000, 37095], [540000, 48857],
  ]
  assert.deepEqual(data.IPHONE_VARIANTS.map(v => [v.cashCents, v.installmentCents]), expected)
  assert.deepEqual(data.IPHONE_VARIANTS.slice(0, 3).map(v => pricing.getIPhoneInstallmentPlan(v.cashCents).totalCents), [835988, 879417, 868559])
  for (const v of data.IPHONE_VARIANTS) assert.equal(v.availability, 'consult')
})
test('direct entry is catalog validated and never selects a color or accepts URL prices', () => {
  const selection = q.parseIPhoneEntry('?model=iphone-17-pro-max&capacity=256&condition=sealed&color=orange&price=1&credit=9000')
  assert.equal(selection.colorId, '')
  assert.equal(q.getIPhoneVariant(selection), undefined)
  assert.deepEqual(q.parseIPhoneEntry(''), selection)
  assert.equal(q.parseIPhoneEntry('?model=iphone-17-pro-max&capacity=512').capacity, 512)
  assert.equal(q.parseIPhoneEntry('?model=iphone-13&capacity=512&condition=sealed').condition, 'used')
  assert.equal(q.parseIPhoneEntry('?model=iphone-999&capacity=-4&condition=bad').modelId, 'iphone-17-pro-max')
})
test('selection changes retain compatible colors and capacities and remove incompatible choices', () => {
  let d = complete()
  d = q.updateIPhonePurchase(d, { selection: { ...d.selection, colorId: 'silver', capacity: 512 } })
  assert.equal(q.getIPhoneVariant(d.selection).cashCents, 979999)
  d = q.updateIPhonePurchase(d, { selection: { ...d.selection, modelId: 'iphone-18-pro-max' } })
  assert.equal(d.selection.colorId, 'silver')
  assert.equal(d.selection.capacity, 256)
  d = q.updateIPhonePurchase(d, { selection: { ...d.selection, modelId: 'iphone-15-pro' } })
  assert.equal(d.selection.condition, 'used')
  assert.equal(d.selection.capacity, 256)
  assert.equal(d.selection.colorId, '')
})
test('purchase without trade has a short path and a natural complete message', () => {
  const d = complete()
  assert.equal(q.firstIncompleteIPhoneScreen(d), null)
  assert.deepEqual(q.getIPhoneScreens(d), ['product', 'payment', 'timing', 'trade', 'review'])
  const message = q.buildIPhonePurchaseMessage(d)
  assert.match(message, /APARELHO DESEJADO/)
  assert.match(message, /8\.359,88/)
  assert.match(message, /Compra sem oferecer usado/)
  assert.doesNotMatch(message, /OFERECIDO NA TROCA|bateria|UTM|UUID|Ref\.|sem juros|crédito|margem/)
  assert.throws(() => q.buildIPhonePurchaseMessage(data.createIPhonePurchaseDraft()))
})
test('eligible, incompatible and unknown models never rely on a typed model number', () => {
  const d = withTrade()
  assert.equal(q.getIPhoneTradeEligibility(d), 'eligible')
  assert.equal(q.getIPhoneTradeEligibility({ ...d, trade: { ...d.trade, modelId: tradeModel('iPhone 14 Pro') } }), 'incompatible')
  const unknown = { ...d, trade: { ...data.createIPhoneTrade(), modelId: 'other', otherModel: 'iPhone 999 inventado' } }
  assert.equal(q.getIPhoneTradeEligibility(unknown), 'unknown')
  assert.equal(q.firstIncompleteIPhoneScreen(unknown), null)
  assert.match(q.buildIPhonePurchaseMessage(unknown), /Modelo não reconhecido/)
  assert(!q.getIPhoneScreens(unknown).includes('history'))
  const incompatible = { ...d, trade: { ...d.trade, modelId: tradeModel('iPhone 13') } }
  assert.equal(q.firstIncompleteIPhoneScreen(incompatible), 'device')
  assert.equal(q.firstIncompleteIPhoneScreen(q.updateIPhonePurchase(incompatible, { tradeChoice: 'no' })), null)
})
test('trade descriptions stay complete for other purchase products while policy remains pending', () => {
  let changed = q.updateIPhonePurchase(withTrade(), { selection: { modelId: 'iphone-15-pro', capacity: 256, condition: 'used', colorId: '' } })
  changed = q.updateIPhonePurchase(changed, { preferredColorIds: ['naturaltitanium'] })
  assert.equal(q.getIPhoneTradeEligibility(changed), 'pending')
  assert.equal(changed.trade.screen, withTrade().trade.screen)
  assert(q.canDescribeIPhoneTrade(changed))
  assert(q.getIPhoneScreens(changed).includes('history'))
  assert.equal(q.firstIncompleteIPhoneScreen(changed), null)
  assert.match(q.buildIPhonePurchaseMessage(changed), /política a confirmar/)
})
test('unknown battery and appearance are valid; percent accepts zero and 100, rejects malformed/range', () => {
  const d = withTrade()
  assert.equal(q.firstIncompleteIPhoneScreen(d), null)
  assert.match(q.buildIPhonePurchaseMessage(d), /Saúde da bateria: Não sei/)
  for (const battery of ['0', '100', '87']) assert.deepEqual(q.getIPhoneErrors({ ...d, trade: { ...d.trade, battery, batteryUnknown: false } }, 'device'), {})
  for (const battery of ['', '-1', '101', '1.5', '1e2', 'NaN']) assert(q.getIPhoneErrors({ ...d, trade: { ...d.trade, battery, batteryUnknown: false } }, 'device').battery)
})
test('trade history has conditional requirements, exclusive unknowns and clears hidden fields', () => {
  let d = withTrade()
  assert(q.getIPhoneErrors({ ...d, trade: { ...d.trade, repairParts: [] } }, 'history').repairParts)
  assert(q.getIPhoneErrors({ ...d, trade: { ...d.trade, repairParts: ['Outro'] } }, 'history').repairOther)
  d = q.updateIPhonePurchase(d, { trade: { ...d.trade, repairs: 'Não sei', faults: ['Não sei'], faultOther: 'stale', repairOther: 'stale' } })
  assert.deepEqual(d.trade.repairParts, [])
  assert.equal(d.trade.repairOther, '')
  assert.equal(d.trade.faultOther, '')
  assert.deepEqual(q.toggleIPhoneChoice(['Face ID'], 'Não sei', ['Não sei']), ['Não sei'])
  assert.deepEqual(q.toggleIPhoneChoice(['Não sei'], 'Carga', ['Não sei']), ['Carga'])
  assert.equal(q.sanitizeIPhoneTrade({ notes: 'x'.repeat(900) }).notes.length, 600)
  assert.deepEqual(q.updateIPhonePurchase(d, { tradeChoice: 'no' }).trade, data.createIPhoneTrade())
})
test('trade review distinctly names both devices, reports repairs without inferring approval', () => {
  const message = q.buildIPhonePurchaseMessage(withTrade())
  assert.match(message, /APARELHO DESEJADO[\s\S]*iPhone 17 Pro Max[\s\S]*APARELHO OFERECIDO NA TROCA[\s\S]*iPhone 15 Pro/)
  assert.match(message, /Tela/)
  assert.match(message, /dependem de avaliação técnica/)
  assert.doesNotMatch(message, /crédito|diferença a pagar|aprovado|originalidade|500,00/)
})
test('restore preserves complete answers, validates TTL, malformed storage and screen position', () => {
  const restored = q.restoreIPhonePurchase(envelope(withTrade()))
  assert.equal(restored.screen, 'review')
  assert.equal(restored.draft.trade.notes, 'NOTA_PRIVADA_QA')
  assert.equal(restored.draft.trade.screen, 'Não sei')
  assert.equal(q.restoreIPhonePurchase(envelope(complete(), { savedAt: Date.now() - data.IPHONE_MAX_AGE - 1000 })), null)
  assert.equal(q.restoreIPhonePurchase(envelope(complete(), { savedAt: Date.now() + 10000 })), null)
  for (const raw of ['null', '[]', '{', '', '{}']) assert.equal(q.restoreIPhonePurchase(raw), null)
  const d = withTrade(); d.trade.capacity = ''
  assert.equal(q.restoreIPhonePurchase(envelope(d)).screen, 'device')
})
test('catalog change, removal or unavailability returns to product with explicit notice state', () => {
  const changed = data.IPHONE_VARIANTS.map(v => ({ ...v, cashCents: v.cashCents + 100, installmentCents: v.installmentCents + 1 }))
  const restored = q.restoreIPhonePurchase(envelope(complete()), Date.now(), changed)
  assert.equal(restored.catalogChanged, true)
  assert.equal(restored.screen, 'product')
  assert.equal(q.getIPhoneVariant(restored.draft.selection, changed).cashCents, 770099)
  const unavailable = data.IPHONE_VARIANTS.map(v => ({ ...v, availability: 'unavailable' }))
  assert(q.getIPhoneErrors(complete(), 'product', unavailable).product)
  const removed = data.IPHONE_VARIANTS.filter(v => v.colorId !== 'orange')
  assert.equal(q.restoreIPhonePurchase(envelope(complete()), Date.now(), removed).draft.selection.colorId, '')
})
test('sales URL validates destination and shares the confirmed cellphone quote number', () => {
  for (const value of [undefined, '', '5521967635340wrong', '+55 21 99999-9999', 'javascript:alert(1)']) assert.equal(q.buildIPhoneSalesUrl('hello', value), null)
  assert.equal(q.buildIPhoneSalesUrl('Resumo & texto\nlinha', whatsapp.WHATSAPP_PHONE), whatsapp.getWhatsAppMessageUrl('Resumo & texto\nlinha'))
  assert.equal(whatsapp.WHATSAPP_PHONE, '5521967635340')
  const url = new URL(q.buildIPhoneSalesUrl('Resumo & texto\nlinha', whatsapp.WHATSAPP_PHONE))
  assert.equal(url.searchParams.get('text'), 'Resumo & texto\nlinha')
  assert.equal(url.hostname, 'api.whatsapp.com')
})

const attribution = '?utm_source=ig&utm_medium=paid_social&utm_campaign=qa_iphone_site&utm_content=99000000000001&campaign_id=99000000000002&adset_id=99000000000003'
const browser = (search = attribution) => {
  const values = new Map(), calls = []
  return { values, calls, dataLayer: [], location: { search }, crypto: globalThis.crypto,
    fbq: (...args) => calls.push(args), sessionStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } }
}
const withBrowser = run => { const previous = globalThis.window; const mock = browser(); globalThis.window = mock; try { run(mock) } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous } }
test('purchase namespace is exact, deduplicated across edits, review, reload and reopening', () => withBrowser(mock => {
  let tracker = tracking.createIPhonePurchaseTracker(complete().selection)
  const milestones = [['viewed'], ['started'], ...['product', 'payment', 'timing', 'trade', 'device', 'condition', 'history'].map(s => ['step', s]), ['tradeStarted'], ['tradeCompleted'], ['reviewed'], ['whatsapp']]
  for (const [event, screen] of milestones) { tracker.track(event, complete().selection, screen); tracker.track(event, complete().selection, screen) }
  mock.location.search = ''
  tracker = tracking.createIPhonePurchaseTracker(complete().selection)
  for (const [event, screen] of milestones) tracker.track(event, complete().selection, screen)
  assert.equal(mock.dataLayer.length, 13)
  assert.equal(mock.calls.length, 13)
  assert.equal(new Set(mock.dataLayer.map(v => v.event_id)).size, 13)
  for (const [index, call] of mock.calls.entries()) {
    assert.equal(call[0], 'trackSingleCustom'); assert.equal(call[1], '1430740015202870')
    assert.equal(call[2], mock.dataLayer[index].event)
    assert.equal(call[4].eventID, mock.dataLayer[index].event_id)
    assert.equal(call[3].quote_category, 'iphone_purchase')
    assert.equal(call[3].quote_tracking_version, 1)
    assert(!['Lead', 'Purchase', 'SmartphoneQuoteWhatsAppClick'].includes(call[2]))
  }
  tracker.track('step', complete().selection, 'invented')
  assert.equal(mock.calls.length, 13)
}))
test('payload allows only catalog values and attribution, never triage, free text, personal data or value', () => withBrowser(mock => {
  const malicious = { ...complete().selection, notes: 'NOTA_PRIVADA_QA', battery: '87', phone: 'PRIVATE_PHONE', cashCents: 1 }
  tracking.createIPhonePurchaseTracker(malicious).track('whatsapp', malicious, 'review')
  const payload = mock.dataLayer[0]
  assert.equal(payload.catalog_cash_value, 7699.99)
  assert.equal(payload.catalog_installment_value, 696.66)
  assert.equal(payload.catalog_installment_total, 8359.88)
  assert.equal(payload.currency, 'BRL')
  assert(!('value' in payload))
  assert.doesNotMatch(JSON.stringify(mock.calls), /NOTA_PRIVADA|PRIVATE_PHONE|battery|notes|whatsapp_url|fbclid|repair|margin/)
  tracking.createIPhonePurchaseTracker(complete().selection).track('started', { ...complete().selection, colorId: '' })
  assert.equal(mock.dataLayer.at(-1).catalog_cash_value, null)
}))
test('initial product and original source survive a different final choice and reload', () => withBrowser(mock => {
  const first = tracking.createIPhonePurchaseTracker(complete().selection)
  first.track('viewed', complete().selection)
  const alternative = { modelId: 'iphone-13', capacity: 128, condition: 'used', colorId: '' }
  first.track('reviewed', alternative, 'review')
  const payload = mock.dataLayer.at(-1)
  assert.equal(payload.quote_initial_product, 'iphone-17-pro-max:256:sealed')
  assert.equal(payload.quote_selected_product, 'iphone-13:128:used')
  assert.equal(payload.quote_ad_id, '99000000000001')
  mock.location.search = ''
  assert.equal(tracking.createIPhonePurchaseTracker(alternative).attemptId, first.attemptId)
  mock.location.search = attribution.replace('99000000000001', '99000000000004')
  assert.notEqual(tracking.createIPhonePurchaseTracker(alternative).attemptId, first.attemptId)
}))
test('unresolved Meta placeholders and injected URL text are not valid attribution', () => {
  assert.deepEqual(tracking.cleanIPhoneAttribution(new URLSearchParams('utm_source=ig&utm_content={{ad.id}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&utm_medium=person%40mail.com&fbclid=PRIVATE&notes=PRIVATE')), { utm_source: 'ig' })
})
test('blocked storage and throwing tags keep the quote usable and deduplicate within mount', () => withBrowser(mock => {
  mock.sessionStorage = { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('blocked') } }
  mock.fbq = () => { throw Error('blocked') }
  const tracker = tracking.createIPhonePurchaseTracker(complete().selection)
  tracker.track('viewed', complete().selection); tracker.track('viewed', complete().selection)
  assert.equal(mock.dataLayer.length, 1)
  mock.dataLayer = { push: () => { throw Error('blocked') } }
  assert.doesNotThrow(() => tracker.track('whatsapp', complete().selection))
  assert.match(q.buildIPhonePurchaseMessage(complete()), /APARELHO DESEJADO/)
}))
test('global transport guards isolate purchase while preserving repair; query is sanitized before Pixel', () => {
  const template = readFileSync(resolve(import.meta.dirname, '../index.html'), 'utf8')
  const inline = [...template.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(Boolean)
  const simulate = pathname => {
    const loaded = [], history = []
    const context = { URLSearchParams, location: { pathname, search: `${attribution}&notes=PRIVATE&fbclid=PRIVATE&color=orange&price=1`, hash: '#PRIVATE' }, history: { state: null, replaceState: (_, __, value) => history.push(value) }, document: { createElement: () => ({}), getElementsByTagName: () => [{ parentNode: { insertBefore: node => loaded.push(node.src) } }] } }
    context.window = context
    vm.createContext(context)
    for (const source of inline) vm.runInContext(source, context)
    return { loaded, history, calls: context.fbq.queue }
  }
  const purchase = simulate('/orcamento/iphone')
  assert(!purchase.loaded.some(url => /googletagmanager|clarity/.test(url)))
  assert.equal(purchase.loaded.filter(url => /fbevents/.test(url)).length, 1)
  assert.equal(purchase.calls.filter(args => args[0] === 'init').length, 1)
  assert(purchase.calls.some(args => args[0] === 'set' && args[1] === 'autoConfig' && args[2] === false))
  assert.doesNotMatch(purchase.history[0], /PRIVATE|notes|fbclid|price|color=/)
  const repair = simulate('/orcamento/celular')
  assert(repair.loaded.some(url => /googletagmanager/.test(url)))
  assert(repair.loaded.some(url => /clarity/.test(url)))
  assert.equal(repair.history.length, 0)
})


test('payment quotes the chosen installment count in the summary and WhatsApp message', () => {
  for (const paymentDetail of ['Pix', 'Cartão']) assert.deepEqual(q.getIPhoneErrors({ ...complete(), paymentDetail }, 'payment'), {})
  assert.deepEqual(data.IPHONE_INSTALLMENTS, Array.from({ length: 11 }, (_, i) => `${i + 2} parcelas`))
  for (let count = 2; count <= 12; count++) {
    const paymentDetail = `${count} parcelas`
    const credit = q.updateIPhonePurchase(complete(), { payment: 'Cartão de crédito' })
    const draft = q.updateIPhonePurchase(credit, { paymentDetail })
    assert.deepEqual(q.getIPhoneErrors(draft, 'payment'), {})
    assert.equal(q.restoreIPhonePurchase(envelope(draft)).draft.paymentDetail, paymentDetail)
    assert(q.buildIPhonePurchaseMessage(draft).includes(`Pagamento pretendido: Cartão de crédito · ${paymentDetail}`))
    const plan = q.getIPhonePaymentPlan(draft)
    assert.equal(plan.count, count)
    assert.equal(plan.totalCents, 835988)
    assert(q.getIPhonePaymentSummary(draft).includes(`${count}× de ${q.formatIPhoneMoney(plan.installmentCents)}`))
    assert(q.buildIPhonePurchaseMessage(draft).includes(`Cartão: ${count}× de ${q.formatIPhoneMoney(plan.installmentCents)}`))
    assert(!q.getIPhonePaymentSummary(draft).includes('Valores das parcelas a confirmar'))
  }
  for (const payment of ['Decidir pelo WhatsApp', 'Cartão em 12 parcelas', 'Boleto', '']) assert(q.getIPhoneErrors({ ...complete(), payment }, 'payment').payment)
  for (const paymentDetail of ['', 'Boleto', '12 parcelas']) assert(q.getIPhoneErrors({ ...complete(), paymentDetail }, 'payment').paymentDetail)
  for (const paymentDetail of ['', 'Pix', '1 parcela', '13 parcelas', '24 parcelas']) assert(q.getIPhoneErrors({ ...complete(), payment: 'Cartão de crédito', paymentDetail }, 'payment').paymentDetail)
  const changed = q.updateIPhonePurchase(complete(), { payment: 'Cartão de crédito' })
  assert.equal(changed.paymentDetail, '')
  const credit = q.updateIPhonePurchase(changed, { paymentDetail: '12 parcelas' })
  assert.match(q.buildIPhonePurchaseMessage(credit), /Cartão de crédito · 12 parcelas/)
  assert.match(q.buildIPhonePurchaseMessage(complete()), /À vista · Pix/)
})
test('purchase timing is a required separate step and restored drafts cannot bypass new payment requirements', () => {
  const d = { ...complete(), timing: '' }
  assert.equal(q.firstIncompleteIPhoneScreen(d), 'timing')
  assert(q.getIPhoneErrors(d, 'timing').timing)
  assert(q.getIPhoneErrors({ ...d, timing: 'Prefiro não informar' }, 'timing').timing)
  assert.equal(q.restoreIPhonePurchase(envelope(d)).screen, 'timing')
  const old = complete(); delete old.paymentDetail
  assert.equal(q.restoreIPhonePurchase(envelope(old)).screen, 'payment')
  for (const payment of ['Decidir pelo WhatsApp', 'Cartão em 12 parcelas']) {
    assert.equal(q.restoreIPhonePurchase(envelope({ ...complete(), payment })).screen, 'payment')
  }
  assert.equal(q.restoreIPhonePurchase(envelope(complete())).draft.paymentDetail, 'Pix')
  assert.deepEqual(['product','payment','timing','trade','review'].map(q.getIPhoneStep), [0,1,2,3,4])
})
test('used color is a bounded reported-color choice without changing trade eligibility', () => {
  assert.equal(q.sanitizeIPhoneTrade({ color: 'Azul' }).color, 'Azul')
  assert.equal(q.sanitizeIPhoneTrade({ color: 'Outra cor' }).color, 'Outra cor')
  assert.equal(q.sanitizeIPhoneTrade({ color: 'cor digitada livre' }).color, '')
  assert.equal(q.getIPhoneTradeEligibility(withTrade()), 'eligible')
  assert.match(q.buildIPhonePurchaseMessage(withTrade()), /Cor informada: Azul/)
})

test('the one-time markup keeps the total fixed from 2 to 12 and reconciles cents', () => {
  assert.deepEqual(pricing.getIPhoneInstallmentPlan(100000, 2), { count: 2, totalCents: 108570, installmentCents: 54285, lastInstallmentCents: 54285 })
  assert.deepEqual(pricing.getIPhoneInstallmentPlan(100000, 12), { count: 12, totalCents: 108570, installmentCents: 9048, lastInstallmentCents: 9042 })
  assert.equal(pricing.getIPhoneInstallmentPlan(245000).totalCents, 265997, 'half-cent rounds up')
  for (const variant of data.IPHONE_VARIANTS) {
    const total = pricing.getIPhoneInstallmentPlan(variant.cashCents).totalCents
    for (let count = 2; count <= 12; count++) {
      const plan = pricing.getIPhoneInstallmentPlan(variant.cashCents, count)
      assert.equal(plan.totalCents, total)
      assert.equal(plan.installmentCents * (count - 1) + plan.lastInstallmentCents, total)
      assert(Number.isSafeInteger(plan.installmentCents) && plan.lastInstallmentCents > 0)
    }
  }
  for (const count of [1, 13, 2.5, NaN]) assert.throws(() => pricing.getIPhoneInstallmentPlan(100000, count), RangeError)
  for (const cash of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => pricing.getIPhoneInstallmentPlan(cash), RangeError)
})

test('seminovos require multiple-choice color preferences without changing commercial variants or prices', () => {
  for (const variant of data.IPHONE_VARIANTS.filter(v => v.condition === 'used')) {
    const colors = usedColors.getIPhoneUsedColors(variant.modelId)
    assert(colors.length >= 4)
    let draft = q.updateIPhonePurchase(complete(), { selection: { modelId: variant.modelId, capacity: variant.capacity, condition: 'used', colorId: '' } })
    assert.deepEqual(draft.preferredColorIds, [])
    assert(q.getIPhoneErrors(draft, 'product').preferredColors)
    const before = q.getIPhoneVariant(draft.selection)
    draft = q.updateIPhonePurchase(draft, { preferredColorIds: [colors[0].id, colors[1].id, colors[0].id, 'invented'] })
    assert.deepEqual(draft.preferredColorIds, [colors[0].id, colors[1].id])
    assert.deepEqual(q.getIPhoneErrors(draft, 'product'), {})
    assert.deepEqual(q.getIPhoneVariant(draft.selection), before)
    assert(q.getIPhonePreferredColorSummary(draft).includes(colors[0].name))
    const message = q.buildIPhonePurchaseMessage(draft)
    assert(message.includes(`Cores aceitas: ${colors[0].name}, ${colors[1].name}`))
    assert.match(message, /Disponibilidade das cores e condição da unidade a confirmar/)
    const restored = q.restoreIPhonePurchase(envelope(draft))
    assert.deepEqual(restored.draft.preferredColorIds, draft.preferredColorIds)
    assert.equal(restored.screen, 'review')
    const legacy = { ...draft }; delete legacy.preferredColorIds
    assert.equal(q.restoreIPhonePurchase(envelope(legacy)).screen, 'product')
    const tampered = { ...draft, preferredColorIds: ['invented', { id: colors[0].id }] }
    assert.equal(q.restoreIPhonePurchase(envelope(tampered)).screen, 'product')
    const all = q.updateIPhonePurchase(draft, { preferredColorIds: colors.map(color => color.id) })
    assert.equal(q.getIPhonePreferredColors(all).length, colors.length)
  }
})
test('color preferences survive capacity changes, reset across models/conditions and never enter ad telemetry', () => {
  let draft = q.updateIPhonePurchase(complete(), { selection: { modelId: 'iphone-15-pro', capacity: 128, condition: 'used', colorId: '' } })
  draft = q.updateIPhonePurchase(draft, { preferredColorIds: ['naturaltitanium', 'bluetitanium'] })
  const larger = q.updateIPhonePurchase(draft, { selection: { ...draft.selection, capacity: 256 } })
  assert.deepEqual(larger.preferredColorIds, draft.preferredColorIds)
  for (const selection of [{ ...draft.selection, modelId: 'iphone-15-pro-max' }, complete().selection]) {
    assert.deepEqual(q.updateIPhonePurchase(draft, { selection }).preferredColorIds, [])
  }
  withBrowser(mock => {
    tracking.createIPhonePurchaseTracker(draft.selection).track('reviewed', draft.selection, 'review')
    assert.doesNotMatch(JSON.stringify(mock.dataLayer), /preferredColorIds|naturaltitanium|bluetitanium/)
  })
})

test('the original battery, condition and repair checklist is available for every purchase model', () => {
  for (const variant of data.IPHONE_VARIANTS) {
    let draft = q.updateIPhonePurchase(withTrade(), { selection: { modelId: variant.modelId, capacity: variant.capacity, condition: variant.condition, colorId: variant.colorId } })
    if (variant.condition === 'used') draft = q.updateIPhonePurchase(draft, { preferredColorIds: [usedColors.getIPhoneUsedColors(variant.modelId)[0].id] })
    assert(q.canDescribeIPhoneTrade(draft), variant.id)
    assert(q.getIPhoneScreens(draft).includes('condition'))
    assert(q.getIPhoneScreens(draft).includes('history'))
    assert.equal(q.firstIncompleteIPhoneScreen(draft), null)
    const message = q.buildIPhonePurchaseMessage(draft)
    assert.match(message, /Saúde da bateria: Não sei/)
    assert.match(message, /Reparos: Houve troca ou reparo — Tela/)
    assert.match(message, /Falhas conhecidas: Face ID/)
    assert.match(message, /NOTA_PRIVADA_QA/)
    if (variant.modelId !== 'iphone-17-pro-max') {
      assert.equal(q.getIPhoneTradeEligibility(draft), 'pending')
      assert.match(message, /política a confirmar pela equipe/)
    }
    const restored = q.restoreIPhonePurchase(envelope(draft))
    assert.equal(restored.screen, 'review')
    assert.deepEqual(restored.draft.trade, draft.trade)
    const incomplete = { ...draft, trade: { ...draft.trade, capacity: '', batteryUnknown: false, battery: '' } }
    assert.equal(q.firstIncompleteIPhoneScreen(incomplete), 'device')
    assert(q.getIPhoneErrors(incomplete, 'device').battery)
    assert(q.getIPhoneErrors({ ...draft, trade: { ...draft.trade, repairParts: [] } }, 'history').repairParts)
    assert(!q.getIPhoneScreens(q.updateIPhonePurchase(draft, { tradeChoice: 'no' })).includes('history'))
  }
})
test('collecting an older recognized trade phone for another purchase does not change the confirmed 17 policy', () => {
  let draft = q.updateIPhonePurchase(withTrade(), { selection: { modelId: 'iphone-18-pro-max', capacity: 256, condition: 'sealed', colorId: 'black' } })
  draft = q.updateIPhonePurchase(draft, { trade: { ...draft.trade, modelId: tradeModel('iPhone 13') } })
  assert(q.canDescribeIPhoneTrade(draft))
  assert.equal(q.getIPhoneTradeEligibility(draft), 'pending')
  assert.equal(q.firstIncompleteIPhoneScreen(draft), 'device')
  assert.equal(draft.trade.repairs, '', 'changing offered phones clears the earlier condition answers')
  const for17 = q.updateIPhonePurchase(draft, { selection: complete().selection })
  assert.equal(q.getIPhoneTradeEligibility(for17), 'incompatible')
  assert(!q.canDescribeIPhoneTrade(for17))
  assert(q.getIPhoneErrors(for17, 'device').modelId)
  let unknown = q.updateIPhonePurchase(draft, { trade: { ...draft.trade, modelId: 'other' } })
  unknown = q.updateIPhonePurchase(unknown, { trade: { ...unknown.trade, otherModel: 'Modelo a esclarecer', notes: 'PRIVATE_TRADE_NOTE' } })
  assert(!q.canDescribeIPhoneTrade(unknown))
  assert(!q.getIPhoneScreens(unknown).includes('history'))
  assert.match(q.buildIPhonePurchaseMessage(unknown), /PRIVATE_TRADE_NOTE/)
  withBrowser(mock => {
    tracking.createIPhonePurchaseTracker(draft.selection).track('reviewed', draft.selection, 'review')
    assert.doesNotMatch(JSON.stringify(mock.dataLayer), /PRIVATE_TRADE_NOTE|battery|repairParts|faults/)
  })
})
