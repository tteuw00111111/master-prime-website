import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const load = async path => {
  const result = await build({ entryPoints: [resolve(root, path)], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const q = await load('src/utils/pc-build-quote.ts')
const flow = await load('src/utils/pc-build-quote-flow.ts')
const data = await load('src/data/pc-build-quote.ts')
const tracking = await load('src/utils/quote.ts')
const whatsapp = await load('src/utils/whatsapp.ts')
const complete = changes => ({ ...data.createPcBuildQuoteDraft(), mode: 'complete', purpose: 'gaming', budgetCents: 500000, budgetScope: 'pc', gameIds: ['valorant'], fulfillment: 'store', ...changes })
const save = (draft, changes = {}) => JSON.stringify({ draft, savedAt: Date.now(), screen: 'review', step: 4, editScope: null, ...changes })

test('new PC request is isolated from all repair flows and starts with request mode', () => {
  assert.equal(data.PC_BUILD_QUOTE_PATH, '/orcamento/pc-gamer')
  assert.equal(flow.getFirstIncompletePcBuildScreen(data.createPcBuildQuoteDraft()), 'mode')
  assert.equal(q.restorePcBuildQuoteDraft(save({ ...complete(), category: 'computador', intent: 'repair' })), null)
  assert.throws(() => q.buildPcBuildQuoteMessage({ ...complete(), intent: 'repair' }))
})

test('all service modes and purposes can finish without optional technical knowledge', () => {
  for (const mode of ['complete', 'partial', 'assembly']) for (const purpose of ['gaming', 'work', 'both']) {
    const d = complete({ mode, purpose, programsUndecided: true })
    assert.equal(flow.getFirstIncompletePcBuildScreen(d), null)
    const screens = flow.getPcBuildScreens(d)
    assert.equal(screens.includes('ownedParts'), mode !== 'complete')
    assert.equal(screens.includes('games'), purpose !== 'work')
    assert.equal(screens.includes('programs'), purpose !== 'gaming')
    assert.equal(screens.includes('gpu'), false)
    assert.equal(new Set(screens).size, screens.length)
  }
})

test('currency parsing accepts BRL and rejects malformed, unsafe and nonpositive values', () => {
  for (const [input, expected] of [['1000', 100000], ['1.000', 100000], ['R$ 5.000,50', 500050], ['  R$\u00a01.234,5 ', 123450], ['0,01', 1], ['90071992547409,91', Number.MAX_SAFE_INTEGER]]) assert.equal(q.parsePcBudget(input), expected, input)
  for (const input of ['', '0', '-1000', '1e3', 'NaN', 'Infinity', '1,000.00', '1.00', '1.000,001', '123abc', '90071992547409,92', 'R$ R$ 100', '+100']) assert.equal(q.parsePcBudget(input), null, input)
  assert.deepEqual(flow.getPcBuildScreenErrors(complete({ budgetCents: 1 }), 'budget'), {})
  assert.deepEqual(flow.getPcBuildScreenErrors(complete({ budgetCents: null, budgetUndecided: true }), 'budget'), {})
  assert(flow.getPcBuildScreenErrors(complete({ budgetCents: null }), 'budget').budget)
  assert.equal(q.formatPcBudget(123456).replace(/\s/g, ''), 'R$1.234,56')
})

test('budget scope includes only active peripherals and indecision clears the amount', () => {
  let d = q.updatePcBuildQuote(complete(), { budgetScope: 'setup', peripheralIds: ['mouse', 'mouse', 'monitor', 'printer'] })
  assert.deepEqual(d.peripheralIds, ['monitor', 'mouse'])
  d = q.updatePcBuildQuote(d, { budgetScope: 'pc', budgetUndecided: true })
  assert.deepEqual(d.peripheralIds, [])
  assert.equal(d.budgetCents, null)
  assert(!q.buildPcBuildQuoteMessage(d).includes('Periféricos:'))
})

test('search includes aliases; additions deduplicate case, accents and exact catalog names', () => {
  assert.equal(q.searchPcCatalog(data.PC_GAMES, 'cs go')[0].id, 'cs2')
  assert.equal(q.searchPcCatalog(data.PC_PROGRAMS, 'programação')[0].id, 'vscode')
  let d = q.addPcCustomSelection(complete(), 'games', 'CS GO')
  assert(d.gameIds.includes('cs2'))
  assert.deepEqual(d.customGames, [])
  d = q.addPcCustomSelection(d, 'games', 'Meu Jógó')
  d = q.addPcCustomSelection(d, 'games', 'meu jogo')
  assert.deepEqual(d.customGames, ['Meu Jógó'])
  assert.equal(q.addPcCustomSelection(d, 'games', 'Valorant'), d)
  assert.equal(q.togglePcSelection(d, 'games', 'not-a-game'), d)
})

test('catalog and custom names share a ten-item cap; undecided and selections are exclusive', () => {
  let d = complete({ gameIds: [] })
  for (let i = 0; i < 12; i++) d = q.addPcCustomSelection(d, 'games', `Jogo ${i}`)
  assert.equal(q.getPcSelections(d, 'games').length, 10)
  assert.equal(q.togglePcSelection(d, 'games', 'valorant'), d)
  d = q.updatePcBuildQuote(d, { gamesUndecided: true })
  assert.deepEqual(d.customGames, [])
  assert.deepEqual(d.gameIds, [])
  d = q.togglePcSelection(d, 'games', 'valorant')
  assert.equal(d.gamesUndecided, false)
  assert.deepEqual(d.gameIds, ['valorant'])
  assert.equal(q.addPcCustomSelection(complete({ gameIds: [] }), 'games', 'x'.repeat(80)).customGames[0].length, 60)
  assert.deepEqual(q.addPcCustomSelection(complete(), 'games', 'Call of Duty').customGames, ['Call of Duty'])
})

test('editing purpose removes inactive answers and all-parts mode preserves identification', () => {
  let d = complete({ mode: 'partial', purpose: 'both', ownedParts: 'Minha GPU', programIds: ['blender'], workload: 'Render', targetFps: '240', resolution: '1440p', graphics: 'quality', personalize: true })
  d = q.updatePcBuildQuote(d, { purpose: 'work', mode: 'assembly' })
  assert.deepEqual(d.gameIds, [])
  assert.equal(d.targetFps, '')
  assert.equal(d.resolution, '')
  assert.equal(d.graphics, '')
  assert.equal(d.ownedParts, 'Minha GPU')
  d = q.updatePcBuildQuote(d, { purpose: 'gaming', mode: 'complete' })
  assert.deepEqual(d.programIds, [])
  assert.equal(d.workload, '')
  assert.equal(d.ownedParts, '')
})

test('optional details persist when bypassed; dependent screens reflect purpose', () => {
  const d = complete({ personalize: true, gpu: 'amd', cpu: 'intel', priorityIds: ['quiet'], caseColor: 'white', lighting: 'rgb', targetFps: 'custom', customFps: '165' })
  assert(flow.getPcBuildScreens(d).includes('fps'))
  assert(!flow.getPcBuildScreens(d).includes('workload'))
  const skipped = q.updatePcBuildQuote(d, { personalize: false })
  assert(!flow.getPcBuildScreens(skipped).includes('fps'))
  assert.equal(skipped.customFps, '165')
  assert.equal(skipped.gpu, 'amd')
  assert(q.buildPcBuildQuoteMessage(skipped).includes('165'))
  assert(flow.getPcBuildScreenErrors(complete({ targetFps: 'custom', customFps: '0' }), 'fps').customFps)
  const invalidHiddenTarget = q.updatePcBuildQuote({ ...d, customFps: 'oops' }, { personalize: false })
  assert.equal(invalidHiddenTarget.targetFps, '')
  assert.equal(flow.getFirstIncompletePcBuildScreen(invalidHiddenTarget), null)
})

test('review groups align to edit scopes; restoration never bypasses an incomplete field', () => {
  const d = complete({ personalize: true })
  assert.equal(q.getPcReviewGroups(d).length, 4)
  for (const [index, scope] of flow.PC_BUILD_EDIT_SCOPES.entries()) {
    const screens = flow.getPcBuildScreens(d).filter(screen => flow.isPcBuildScreenInScope(screen, scope))
    assert(screens.length)
    assert(screens.every(screen => flow.getPcBuildScreenStep(screen) === index))
  }
  assert.equal(flow.restorePcBuildScreen(complete({ fulfillment: '' }), { screen: 'review' }), 'fulfillment')
  assert.equal(flow.restorePcBuildScreen(d, { screen: 'gpu' }), 'gpu')
  assert.equal(flow.restorePcBuildScreen(complete(), { screen: 'gpu' }), 'mode')
  assert.equal(flow.restorePcBuildScreen(d, { step: 1 }), 'budget')
})

test('delivery requires location; store pickup omits previous delivery data from review and message', () => {
  let d = complete({ fulfillment: 'delivery', neighborhood: '', city: '' })
  assert.equal(flow.getFirstIncompletePcBuildScreen(d), 'neighborhood')
  d.neighborhood = 'Campo Grande'
  assert.equal(flow.getFirstIncompletePcBuildScreen(d), 'city')
  d.city = 'Rio de Janeiro'
  assert.equal(flow.getFirstIncompletePcBuildScreen(d), null)
  assert(q.buildPcBuildQuoteMessage(d).includes('Bairro: Campo Grande'))
  d = q.updatePcBuildQuote(d, { fulfillment: 'store' })
  const message = q.buildPcBuildQuoteMessage(d)
  assert(message.includes('Retirar na loja'))
  assert(!message.includes('Bairro:'))
  assert(!message.includes('Cidade:'))
  assert(!flow.getPcBuildScreens(d).includes('neighborhood'))
})

test('restoration rejects malformed, expired, future, wrong-category/version/intent and mistyped drafts', () => {
  const now = Date.now()
  assert.equal(q.restorePcBuildQuoteDraft(null), null)
  for (const raw of ['bad json', 'null', '[]', '{}', save(complete(), { savedAt: now - 7200001 }), save(complete(), { savedAt: now + 10000 }), save(complete(), { savedAt: 'today' })]) assert.equal(q.restorePcBuildQuoteDraft(raw, now), null)
  for (const changes of [{ version: 2 }, { intent: 'repair' }, { category: 'notebook' }, { budgetCents: Number.MAX_SAFE_INTEGER + 1 }, { budgetCents: -1 }, { gameIds: {} }, { customGames: [null] }, { personalize: 'true' }, { notes: 42 }]) assert.equal(q.restorePcBuildQuoteDraft(save(complete(changes))), null)
  const restored = q.restorePcBuildQuoteDraft(save(complete()))
  assert.equal(restored.budgetCents, 500000)
  assert.deepEqual(restored.gameIds, ['valorant'])
})

test('restoration reapplies text limits, known IDs and selection caps', () => {
  const d = complete({ mode: 'partial', personalize: true, objective: 'o'.repeat(350), ownedParts: 'p'.repeat(700), notes: 'n'.repeat(700), city: 'c'.repeat(100), gameIds: ['invalid', 'valorant', 'valorant'], priorityIds: ['quiet', 'appearance', 'performance', 'invalid'], gpu: 'invalid' })
  const restored = q.restorePcBuildQuoteDraft(save(d))
  assert.equal(restored.objective.length, 300)
  assert.equal(restored.ownedParts.length, 600)
  assert.equal(restored.notes.length, 600)
  assert.equal(restored.city.length, 80)
  assert.deepEqual(restored.gameIds, ['valorant'])
  assert.equal(restored.priorityIds.length, 2)
  assert.equal(restored.gpu, '')
})

test('budget warnings use only matching, dated references; high FPS alone produces advisory context', () => {
  const d = complete({ budgetCents: 100000, gameIds: ['warzone'], resolution: '1080p', graphics: 'competitive', targetFps: '240' })
  const now = Date.parse('2026-10-16T12:00:00Z')
  const reference = { id: 'test-only-fixture', gameId: 'warzone', resolution: '1080p', graphics: 'competitive', targetFps: 240, minimumBudgetCents: 200000, source: 'https://example.test/reviewed-benchmark', reviewedAt: '2026-10-15', validUntil: '2026-11-15' }
  assert.deepEqual(data.PC_BUDGET_REFERENCES, [])
  assert.equal(q.getPcFeasibilityNotice(d, [], now).kind, 'context')
  assert.equal(q.getPcFeasibilityNotice(d, [reference], now).kind, 'review')
  for (const change of [{ gameId: 'valorant' }, { resolution: '4k' }, { graphics: 'quality' }, { targetFps: 144 }, { reviewedAt: '2026-12-01' }, { validUntil: '2026-10-01' }, { source: '' }]) assert.equal(q.getPcFeasibilityNotice(d, [{ ...reference, ...change }], now).kind, 'context')
  assert.equal(q.getPcFeasibilityNotice({ ...d, mode: 'assembly' }, [reference], now).kind, 'context')
  assert.equal(q.getPcFeasibilityNotice({ ...d, budgetCents: 1000000 }, [reference], now).kind, 'context')
  assert.equal(q.getPcFeasibilityNotice({ ...d, targetFps: '60' }, [], now), null)
  assert.equal(q.getPcFeasibilityNotice({ ...d, purpose: 'work' }, [reference], now), null)
})

test('WhatsApp preserves accents, includes guidance and records the client investment without automatic claims', () => {
  const d = complete({ purpose: 'both', programIds: ['blender'], objective: 'Edição e diversão & estudo', guidanceRequested: true, gpu: 'nvidia', cpu: 'amd' })
  const message = q.buildPcBuildQuoteMessage(d)
  assert(message.includes('Investimento pretendido: até'))
  assert(message.includes('Edição e diversão & estudo'))
  assert(message.includes('NVIDIA GeForce'))
  assert(message.includes('AMD Ryzen'))
  assert(message.includes('Quero orientação'))
  const url = new URL(whatsapp.getWhatsAppMessageUrl(message))
  assert.equal(url.searchParams.get('phone'), '5521967635340')
  assert.equal(url.searchParams.get('text'), message)
  assert(!message.includes('FPS garantidos'))
})

test('tracking contains only event, category and step, never private quote fields', () => {
  globalThis.window = { dataLayer: [] }
  try {
    for (const event of ['quote_started', 'quote_step_completed', 'quote_reviewed', 'quote_whatsapp_click']) tracking.trackQuoteEvent(event, 2, 'montagem-pc')
    assert.equal(window.dataLayer.length, 4)
    for (const event of window.dataLayer) assert.deepEqual(Object.keys(event).sort(), ['event', 'quote_category', 'quote_step'])
    assert.equal(window.dataLayer[0].quote_category, 'montagem-pc')
    assert.equal(window.dataLayer[0].quote_step, 3)
  } finally { delete globalThis.window }
})
