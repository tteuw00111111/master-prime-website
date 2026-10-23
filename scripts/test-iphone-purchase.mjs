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
const complete = () => ({ ...data.createIPhonePurchaseDraft(), selection: { modelId: 'iphone-17-pro-max', capacity: 256, condition: 'sealed', colorId: 'orange' }, payment: 'À vista', paymentDetail: 'Pix' })
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
test('three-step purchase has a natural site-origin message without uncollected answers', () => {
  const d = complete()
  assert.equal(q.firstIncompleteIPhoneScreen(d), null)
  assert.deepEqual(q.getIPhoneScreens(d), ['product', 'payment', 'review'])
  const message = q.buildIPhonePurchaseMessage(d)
  assert.match(message, /APARELHO DESEJADO/)
  assert.match(message, /8\.359,88/)
  assert(message.startsWith('Olá! Fiz uma consulta de iPhone no site da Master Prime e quero confirmar disponibilidade e condições.'))
  assert.doesNotMatch(message, /OFERECIDO NA TROCA|bateria|Quando|prazo|sem oferecer|UTM|UUID|Ref\.|sem juros|crédito|margem/)
  assert.throws(() => q.buildIPhonePurchaseMessage(data.createIPhonePurchaseDraft()))
})
test('v1 drafts on removed screens migrate only valid collected choices to a current screen', () => {
  for (const screen of ['timing', 'trade', 'device', 'condition', 'history', 'review']) {
    for (const trade of [undefined, null, { notes: 'PRIVATE_LEGACY_NOTE', battery: '87', repairParts: ['Tela'] }]) {
      const legacy = { ...complete(), version: 1, timing: 'Nos próximos dias', tradeChoice: 'yes', trade }
      const restored = q.restoreIPhonePurchase(envelope(legacy, { screen }))
      assert.equal(restored.screen, 'review')
      assert.deepEqual(restored.draft, complete())
      assert.doesNotMatch(JSON.stringify(restored.draft), /PRIVATE|timing|trade|battery|repairParts/)
      assert.doesNotMatch(q.buildIPhonePurchaseMessage(restored.draft), /PRIVATE|troca|Nos próximos dias|bateria/)
      assert.equal(q.restoreIPhonePurchase(envelope({ ...legacy, paymentDetail: '' }, { screen })).screen, 'payment')
      assert.equal(q.restoreIPhonePurchase(envelope({ ...legacy, selection: { ...legacy.selection, colorId: '' } }, { screen })).screen, 'product')
    }
  }
  const injected = { ...complete(), trade: { notes: 'PRIVATE' }, timing: 'imediata' }
  assert.deepEqual(q.updateIPhonePurchase(injected, {}), complete())
  assert.equal(q.restoreIPhonePurchase(envelope(complete(), { screen: 'invented' })).screen, 'product')
})
test('restore validates TTL, malformed storage, current screen and payment', () => {
  assert.equal(q.restoreIPhonePurchase(envelope(complete())).screen, 'review')
  assert.equal(q.restoreIPhonePurchase(envelope(complete(), { savedAt: Date.now() - data.IPHONE_MAX_AGE - 1000 })), null)
  assert.equal(q.restoreIPhonePurchase(envelope(complete(), { savedAt: Date.now() + 10000 })), null)
  for (const raw of ['null', '[]', '{', '', '{}', envelope({ ...complete(), version: 3 })]) assert.equal(q.restoreIPhonePurchase(raw), null)
  assert.equal(q.restoreIPhonePurchase(envelope({ ...complete(), paymentDetail: '' })).screen, 'payment')
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
  const fbq = (...args) => calls.push(args)
  fbq.callMethod = fbq
  return { values, calls, dataLayer: [], location: { search }, crypto: globalThis.crypto,
    fbq, addEventListener: () => {}, removeEventListener: () => {},
    setTimeout: () => 1, clearTimeout: () => {}, sessionStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } }
}
const withBrowser = run => { const priorDocument = globalThis.document; globalThis.document = { addEventListener() {}, removeEventListener() {} }; const previous = globalThis.window; const mock = browser(); globalThis.window = mock; try { run(mock) } finally { if (priorDocument === undefined) delete globalThis.document; else globalThis.document = priorDocument; if (previous === undefined) delete globalThis.window; else globalThis.window = previous } }
test('purchase namespace is exact, deduplicated across edits, review, reload and reopening', () => withBrowser(mock => {
  let tracker = tracking.createIPhonePurchaseTracker(complete().selection)
  const milestones = [['viewed'], ['started'], ...['product', 'payment'].map(s => ['step', s]), ['reviewed'], ['whatsapp']]
  for (const [event, screen] of milestones) { tracker.track(event, complete().selection, screen); tracker.track(event, complete().selection, screen) }
  mock.location.search = ''
  tracker = tracking.createIPhonePurchaseTracker(complete().selection)
  for (const [event, screen] of milestones) tracker.track(event, complete().selection, screen)
  assert.equal(mock.dataLayer.length, 6)
  assert.equal(mock.calls.length, 6)
  assert.equal(new Set(mock.dataLayer.map(v => v.event_id)).size, 6)
  for (const [index, call] of mock.calls.entries()) {
    assert.equal(call[0], 'trackSingleCustom'); assert.equal(call[1], '1430740015202870')
    assert.equal(call[2], mock.dataLayer[index].event)
    assert.equal(call[4].eventID, mock.dataLayer[index].event_id)
    assert.equal(call[3].quote_category, 'iphone_purchase')
    assert.equal(call[3].quote_tracking_version, 1)
    assert(!['Lead', 'Purchase', 'SmartphoneQuoteWhatsAppClick'].includes(call[2]))
  }
  tracker.track('step', complete().selection, 'invented')
  assert.equal(mock.calls.length, 6)
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
const simulateTemplate = (pathname, search = `${attribution}&notes=PRIVATE&fbclid=IwQA_MixedCase-123&color=orange&price=1`) => {
  const template = readFileSync(resolve(import.meta.dirname, '../index.html'), 'utf8')
  const inline = [...template.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(Boolean)
  const loaded = [], history = [], pixelLocations = []
  const location = { pathname, search, hash: '#PRIVATE' }
  const context = {
    URLSearchParams, location,
    history: { state: null, replaceState: (_, __, value) => {
      history.push(value)
      const url = new URL(value, 'https://master-prime.com')
      Object.assign(location, { pathname: url.pathname, search: url.search, hash: url.hash })
    } },
    document: { createElement: () => ({}), getElementsByTagName: () => [{ parentNode: { insertBefore: node => {
      loaded.push(node.src)
      if (/fbevents/.test(node.src)) pixelLocations.push(location.pathname + location.search + location.hash)
    } } }] },
  }
  context.window = context
  vm.createContext(context)
  for (const source of inline) vm.runInContext(source, context)
  return { loaded, history, pixelLocations, calls: context.fbq.queue }
}
test('global transport guards isolate purchase while preserving repair; query is sanitized before Pixel', () => {
  const purchase = simulateTemplate('/orcamento/iphone')
  assert(!purchase.loaded.some(url => /googletagmanager|clarity/.test(url)))
  assert.equal(purchase.loaded.filter(url => /fbevents/.test(url)).length, 1)
  assert.equal(purchase.calls.filter(args => args[0] === 'init').length, 1)
  assert(purchase.calls.some(args => args[0] === 'set' && args[1] === 'autoConfig' && args[2] === false))
  assert.doesNotMatch(purchase.history[0], /PRIVATE|notes|price|color=/)
  assert.equal(new URL(purchase.pixelLocations[0], 'https://master-prime.com').searchParams.get('fbclid'), 'IwQA_MixedCase-123')
  const repair = simulateTemplate('/orcamento/celular')
  assert(repair.loaded.some(url => /googletagmanager/.test(url)))
  assert(repair.loaded.some(url => /clarity/.test(url)))
  assert.equal(repair.history.length, 0)
})

test('the template and catalog navigation preserve opaque click IDs intact without inventing them', () => {
  const base = '?utm_source=ig&utm_content=99000000000001&notes=PRIVATE'
  for (const clickId of ['IwQA_MixedCase-123', `IwQA_${'aB9_-'.repeat(500)}`]) {
    const search = `${base}&fbclid=${encodeURIComponent(clickId)}`
    for (const pathname of ['/orcamento/iphone', '/orcamento/iphone/']) {
      const template = simulateTemplate(pathname, search)
      const url = new URL(template.pixelLocations[0], 'https://master-prime.com')
      assert.equal(url.searchParams.get('fbclid'), clickId)
      assert.equal(url.searchParams.get('utm_source'), 'ig')
      assert.equal(url.hash, '')
      assert(!url.searchParams.has('notes'))
    }
    for (const link of [catalog.getIPhoneCatalogLink(data.IPHONE_VARIANTS[0], search), catalog.getIPhoneCatalogHomeLink(search)]) {
      const params = new URL(link, 'https://master-prime.com').searchParams
      assert.equal(params.get('fbclid'), clickId)
      assert.equal(params.get('utm_content'), '99000000000001')
      assert(!params.has('notes'))
    }
  }
  for (const suffix of ['', '&fbclid=', '&fbclid={{fbclid}}', '&fbclid=person%40mail.com', '&fbclid=PRIVATE%20NOTE', '&fbclid=%0Aprivate', '&fbclid=%3Cscript%3E']) {
    const search = base + suffix
    const template = simulateTemplate('/orcamento/iphone', search)
    for (const url of [template.pixelLocations[0], catalog.getIPhoneCatalogLink(data.IPHONE_VARIANTS[0], search), catalog.getIPhoneCatalogHomeLink(search)]) {
      assert(!new URL(url, 'https://master-prime.com').searchParams.has('fbclid'))
    }
  }
})

test('fbclid stays outside custom events, drafts and WhatsApp, without changing attempt deduplication', () => withBrowser(mock => {
  const clickId = 'IwQA_OriginalCase-987'
  mock.location.search = `${attribution}&fbclid=${clickId}`
  const initial = tracking.createIPhonePurchaseTracker(complete().selection)
  initial.track('viewed', complete().selection)
  mock.location.search = `${attribution}&fbclid=IwQA_AnotherClick-123`
  const restored = tracking.createIPhonePurchaseTracker(complete().selection)
  assert.equal(restored.attemptId, initial.attemptId)
  restored.track('viewed', complete().selection)
  assert.equal(mock.dataLayer.length, 1)
  assert.doesNotMatch(JSON.stringify([...mock.values]), /fbclid|IwQA/)
  assert.doesNotMatch(JSON.stringify(mock.calls), /fbclid|IwQA/)
  assert.doesNotMatch(q.buildIPhonePurchaseMessage(complete()), /fbclid|IwQA/)
}))


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
test('legacy payment requirements still apply without collecting timing or trade', () => {
  const old = { ...complete(), version: 1 }; delete old.paymentDetail
  assert.equal(q.restoreIPhonePurchase(envelope(old)).screen, 'payment')
  for (const payment of ['Decidir pelo WhatsApp', 'Cartão em 12 parcelas']) {
    assert.equal(q.restoreIPhonePurchase(envelope({ ...old, payment })).screen, 'payment')
  }
  assert.deepEqual(['product', 'payment', 'review'].map(q.getIPhoneStep), [0, 1, 2])
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

test('legacy tracker keeps compatible milestones and source but cannot emit removed events', () => withBrowser(mock => {
  const state = { version: 1, attemptId: 'ip_legacy12345678', createdAt: Date.now(), initial: complete().selection,
    attribution: { utm_source: 'ig' }, sent: ['viewed', 'started', 'step:product', 'step:payment', 'step:timing', 'step:trade', 'step:device', 'step:condition', 'step:history', 'tradeStarted', 'tradeCompleted', 'reviewed', 'whatsapp'] }
  mock.values.set(tracking.IPHONE_TRACKING_KEY, JSON.stringify(state))
  mock.location.search = ''
  const tracker = tracking.createIPhonePurchaseTracker(complete().selection)
  assert.equal(tracker.attemptId, state.attemptId)
  for (const event of ['viewed', 'started', 'reviewed', 'whatsapp', 'tradeStarted', 'tradeCompleted']) tracker.track(event, complete().selection, 'review')
  for (const screen of ['product', 'payment', 'timing', 'trade', 'device', 'condition', 'history', 'review']) tracker.track('step', complete().selection, screen)
  assert.deepEqual(mock.calls, [])
  assert.deepEqual(JSON.parse(mock.values.get(tracking.IPHONE_TRACKING_KEY)).sent, ['viewed', 'started', 'step:product', 'step:payment', 'reviewed', 'whatsapp'])
}))
test('every product finishes without timing or trade and legacy preferences survive migration', () => {
  for (const variant of data.IPHONE_VARIANTS) {
    let draft = q.updateIPhonePurchase(complete(), { selection: { modelId: variant.modelId, capacity: variant.capacity, condition: variant.condition, colorId: variant.colorId } })
    if (variant.condition === 'used') draft = q.updateIPhonePurchase(draft, { preferredColorIds: [usedColors.getIPhoneUsedColors(variant.modelId)[0].id] })
    assert.deepEqual(q.getIPhoneScreens(), ['product', 'payment', 'review'])
    assert.equal(q.firstIncompleteIPhoneScreen(draft), null)
    const restored = q.restoreIPhonePurchase(envelope({ ...draft, version: 1, trade: { notes: 'PRIVATE_LEGACY_NOTE' }, timing: 'Nos próximos dias' }, { screen: 'history' }))
    assert.deepEqual(restored.draft, draft)
    assert.equal(restored.screen, 'review')
    const message = q.buildIPhonePurchaseMessage(restored.draft)
    assert.doesNotMatch(message, /PRIVATE|Quando|Nos próximos dias|troca|bateria|Ref\.|utm_|fbclid/)
    assert(message.includes(variant.model))
  }
})
