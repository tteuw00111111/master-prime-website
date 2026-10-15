import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const load = async path => {
  const result = await build({ entryPoints: [resolve(root, path)], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const gaming = await load('src/utils/gaming-quote.ts')
const flow = await load('src/utils/gaming-quote-flow.ts')
const data = await load('src/data/gaming-quote.ts')
const common = await load('src/utils/quote.ts')
const complete = (mode = 'both') => ({ ...data.createGamingQuoteDraft(), mode, delivery: 'store',
  console: { platform: 'playstation', model: 'PS5 Slim', modelUnknown: false, issueIds: ['power', 'image'], answers: { 'power-signs': 'Acende luz ou emite bipe' } },
  controller: { platform: 'xbox', model: 'Xbox Elite Series 2', modelUnknown: false, issueIds: ['drift', 'hall'], answers: { 'drift-side': 'Esquerdo' } },
})

test('console, controller and combined routes validate only active devices', () => {
  assert.equal(flow.getFirstIncompleteGamingScreen(data.createGamingQuoteDraft()), 'mode')
  for (const mode of ['console', 'controller', 'both']) {
    const draft = complete(mode)
    assert.equal(flow.getFirstIncompleteGamingScreen(draft), null)
    const screens = flow.getGamingScreens(draft)
    assert.equal(screens.includes('console:model'), mode !== 'controller')
    assert.equal(screens.includes('controller:model'), mode !== 'console')
    if (mode === 'both') assert(screens.indexOf('console:model') < screens.indexOf('controller:platform'))
    assert.equal(new Set(screens).size, screens.length)
  }
  const draft = complete('console')
  draft.controller = data.createGamingDevice()
  assert.equal(flow.getFirstIncompleteGamingScreen(draft), null)
  assert.equal(flow.getFirstIncompleteGamingScreen({ ...draft, mode: 'both' }), 'controller:platform')
})

test('only supported model names or exact aliases can complete identification', () => {
  for (const [kind, platform, accepted, rejected] of [
    ['console', 'playstation', ['PS4', 'PlayStation 4', 'PS5 Slim', 'PS5 Pro'], ['PS3', 'PS2', 'PS Vita', 'Nintendo Switch', 'PS5 or PS3', 'PS5 custom']],
    ['console', 'xbox', ['Xbox One', 'Xbox One S', 'Xbox One X', 'Xbox Series X', 'Series S'], ['Xbox 360', 'Xbox original', 'PS5', 'Unknown model']],
    ['controller', 'playstation', ['DS4', 'Controle PS4', 'DualSense', 'DualSense Edge'], ['DualShock 3', 'Controle PS3', 'Controle PS2', 'PS4']],
    ['controller', 'xbox', ['Controle Xbox One', 'Xbox Wireless Controller', 'Elite 2'], ['Controle Xbox 360', 'Xbox 360', 'DualSense', 'Xbox One']],
  ]) {
    const draft = complete(kind)
    for (const model of accepted) {
      draft[kind] = { ...draft[kind], platform, model }
      assert.equal(flow.getFirstIncompleteGamingScreen(draft), null, model)
    }
    for (const model of rejected) {
      draft[kind] = { ...draft[kind], platform, model }
      assert.equal(flow.getFirstIncompleteGamingScreen(draft), `${kind}:model`, model)
    }
  }
  const draft = complete('controller')
  draft.controller = { ...draft.controller, platform: 'unknown', model: 'DS4' }
  assert.equal(flow.getFirstIncompleteGamingScreen(draft), null, 'unknown platform still requires a supported model')
  draft.controller.modelUnknown = true
  assert.equal(flow.getFirstIncompleteGamingScreen(draft), 'controller:model', 'unknown-model flag cannot bypass the supported list')
})

test('old generations receive an explicit refusal while supported generations do not', () => {
  for (const value of ['PS3', 'PlayStation 3 Slim', 'Controle de PS 3', 'DualShock 3', 'DS3', 'PS2', 'PS1', 'Xbox 360', 'Controle Xbox 360', 'X360', 'Xbox original', 'PS Vita', 'PSP']) {
    assert.match(gaming.getLegacyGamingModelError(value), /Não atendemos/, value)
  }
  for (const model of data.GAMING_MODELS) {
    for (const value of [model.name, ...model.aliases]) assert.equal(gaming.getLegacyGamingModelError(value), undefined, value)
  }
  const draft = complete('console')
  draft.console.model = 'PS3'
  assert.match(flow.getGamingScreenErrors(draft, 'console:model').model, /Não atendemos PS3/)
})

test('model search filters device/platform, accepts aliases and limits results', () => {
  assert.equal(gaming.searchGamingModels('controller', 'playstation', 'DS4')[0].name, 'DualShock 4')
  assert.equal(gaming.searchGamingModels('console', 'xbox', 'Series S')[0].name, 'Xbox Series S')
  assert(gaming.searchGamingModels('controller', 'unknown', 'DualSense').some(model => model.name === 'DualSense'))
  assert.equal(gaming.searchGamingModels('console', 'playstation', 'Xbox').length, 0)
  assert.equal(gaming.searchGamingModels('console', 'playstation', 'p').length, 0)
  assert(data.GAMING_MODELS.every(model => /^https:\/\/www\.(playstation|xbox)\.com\//.test(model.source)))
  assert.equal(new Set(data.GAMING_MODELS.map(model => model.id)).size, data.GAMING_MODELS.length)
})

test('disc symptoms are hidden only for exact, confirmed drive-less models', () => {
  const base = complete().console
  const hasDisc = (model, platform = 'xbox', modelUnknown = false) => gaming.getGamingIssues('console', { ...base, platform, model, modelUnknown }).some(issue => issue.id === 'disc')
  for (const model of ['Xbox Series S', 'Series S', 'Xbox One S All-Digital', 'Xbox Series X Digital']) assert.equal(hasDisc(model), false, model)
  for (const model of ['Xbox Series X', 'Xbox One S', 'Xbox custom model']) assert.equal(hasDisc(model), true, model)
  for (const model of ['PS5', 'PS5 Slim', 'PS5 Pro', 'PS4']) assert.equal(hasDisc(model, 'playstation'), true, model)
  assert.equal(hasDisc('CFI-1214B', 'playstation'), false)
  assert.equal(hasDisc('Xbox Series S', 'xbox', true), true)
})

test('changing model or platform clears incompatible data without affecting the other device', () => {
  const draft = complete()
  const withDisc = { ...draft.console, platform: 'xbox', model: 'Xbox One S', issueIds: ['disc', 'power'], answers: { 'disc-signs': 'Não é lido', 'power-signs': 'Não dá nenhum sinal' } }
  const changed = gaming.updateGamingDevice('console', withDisc, { model: 'Xbox Series S' })
  assert.deepEqual(changed.issueIds, ['power'])
  assert.deepEqual(changed.answers, { 'power-signs': 'Não dá nenhum sinal' })
  const platform = gaming.updateGamingDevice('console', withDisc, { platform: 'playstation' })
  assert.equal(platform.model, '')
  assert.equal(platform.modelUnknown, false)
  assert.deepEqual(platform.answers, {})
  assert.deepEqual(draft.controller.answers, { 'drift-side': 'Esquerdo' })
})

test('removed symptoms discard dependent answers and unknown issue IDs are rejected', () => {
  const device = complete().controller
  const next = gaming.toggleGamingIssue('controller', device, 'drift')
  assert.deepEqual(next.issueIds, ['hall'])
  assert.deepEqual(next.answers, {})
  assert.equal(gaming.toggleGamingIssue('controller', device, 'invented'), device)
  const malformed = { ...device, issueIds: ['drift', 'drift', 'invented'], answers: { 'drift-side': 'Invented', 'disc-signs': 'Não é lido' } }
  assert.deepEqual(gaming.sanitizeGamingDevice('controller', malformed).issueIds, ['drift'])
  assert.deepEqual(gaming.sanitizeGamingDevice('controller', malformed).answers, {})
})

test('all optional questions include unsure and multi-select answers are sanitized', () => {
  for (const issue of [...data.CONSOLE_ISSUES, ...data.CONTROLLER_ISSUES]) {
    for (const question of issue.questions) assert(question.options.includes('Não sei dizer'))
  }
  const question = data.CONTROLLER_ISSUES.find(issue => issue.id === 'buttons').questions[0]
  let device = { ...complete().controller, issueIds: ['buttons'], answers: {} }
  device.answers = common.toggleQuoteAnswer(device, question, 'Botões da frente')
  device.answers = common.toggleQuoteAnswer(device, question, 'Direcional')
  assert.deepEqual(common.getQuoteAnswerValues(device, question), ['Botões da frente', 'Direcional'])
  const sanitized = gaming.sanitizeGamingDevice('controller', { ...device, answers: { [question.id]: ['Direcional', 'invalid', 'Direcional', 'Botões da frente'] } })
  assert.deepEqual(sanitized.answers[question.id], ['Botões da frente', 'Direcional'])
})

test('combined summary separates devices, retains accents and omits inactive or hidden data', () => {
  const draft = { ...complete(), notes: 'Começou após uma queda. Manutenção & diagnóstico.' }
  const message = gaming.buildGamingQuoteMessage(draft)
  assert.match(message, /Videogame:\nPlataforma: PlayStation\nModelo: PS5 Slim/)
  assert.match(message, /Controle:\nPlataforma: Xbox\nModelo: Xbox Elite Series 2/)
  assert.match(message, /Manutenção & diagnóstico/)
  assert.equal(message.split('Atendimento:').length - 1, 1)
  assert.match(message, /Hall Effect/)
  const consoleOnly = gaming.buildGamingQuoteMessage({ ...draft, mode: 'console' })
  assert.doesNotMatch(consoleOnly, /Xbox Elite|Hall Effect|Esquerdo|Controle:/)
  assert.deepEqual(draft.controller, complete().controller, 'changing mode does not destroy inactive inputs')
  assert.doesNotMatch(gaming.buildGamingQuoteMessage({ ...draft, controller: { ...draft.controller, modelUnknown: true } }), /Xbox Elite/)
  const digital = { ...complete('console'), console: { ...draft.console, platform: 'xbox', model: 'Xbox Series S', issueIds: ['power', 'disc'], answers: { 'disc-signs': 'Não é lido' } } }
  assert.doesNotMatch(gaming.buildGamingQuoteMessage(digital), /disco|Não é lido/)
})

test('pickup requires location and store/undecided messages never include it', () => {
  const draft = { ...complete(), delivery: 'pickup', neighborhood: 'Paciência', city: 'Rio de Janeiro' }
  assert.equal(flow.getFirstIncompleteGamingScreen(draft), null)
  assert.equal(flow.getFirstIncompleteGamingScreen({ ...draft, neighborhood: '' }), 'neighborhood')
  assert.equal(flow.getFirstIncompleteGamingScreen({ ...draft, city: '' }), 'city')
  assert.match(gaming.buildGamingQuoteMessage(draft), /Bairro: Paciência/)
  for (const delivery of ['store', 'undecided']) assert.doesNotMatch(gaming.buildGamingQuoteMessage({ ...draft, delivery }), /Paciência|Bairro:|Cidade:/)
})

test('draft recovery rejects stale, malformed, future and notebook data', () => {
  const now = 100000000
  const raw = (draft, savedAt = now) => JSON.stringify({ draft, savedAt })
  assert(gaming.restoreGamingQuoteDraft(raw(complete()), now))
  for (const value of [null, '{', '{}', 'null', raw(complete(), now + 1), raw(complete(), now - 7200001), raw({ ...complete(), category: 'notebook' }), raw({ ...complete(), controller: null })]) assert.equal(gaming.restoreGamingQuoteDraft(value, now), null)
  const malformed = complete()
  malformed.console.issueIds.push('invented')
  malformed.controller.answers['drift-side'] = 'invented'
  malformed.notes = 'x'.repeat(800)
  const restored = gaming.restoreGamingQuoteDraft(raw(malformed), now)
  assert.equal(restored.notes.length, 600)
  assert(!restored.console.issueIds.includes('invented'))
  assert.deepEqual(restored.controller.answers, {})
  const previouslyUnknown = complete()
  previouslyUnknown.console.modelUnknown = true
  const restoredUnknown = gaming.restoreGamingQuoteDraft(raw(previouslyUnknown), now)
  assert.equal(restoredUnknown.console.modelUnknown, false)
  assert.equal(restoredUnknown.console.model, '')
  assert.equal(flow.restoreGamingScreen(restoredUnknown, { screen: 'review' }), 'console:model')
  const oldConsole = complete('console')
  oldConsole.console.model = 'PS3'
  assert.equal(flow.restoreGamingScreen(gaming.restoreGamingQuoteDraft(raw(oldConsole), now), { screen: 'review' }), 'console:model')
  assert.doesNotMatch(gaming.buildGamingQuoteMessage(oldConsole), /PS3/)

})

test('restored navigation cannot skip required fields or point at removed questions', () => {
  const draft = complete()
  assert.equal(flow.restoreGamingScreen(draft, { screen: 'review' }), 'review')
  draft.controller.model = ''
  assert.equal(flow.restoreGamingScreen(draft, { screen: 'review' }), 'controller:model')
  assert.equal(flow.restoreGamingScreen(draft, { screen: 'controller:question:missing' }), 'mode')
  assert.equal(flow.restoreGamingScreen(draft, { step: 4 }), 'controller:model')
  assert.equal(flow.restoreGamingScreen(draft, { screen: 'console:model' }), 'console:model')
})

test('quote analytics retain an explicit allowlist with notebook as the default', () => {
  globalThis.window = { dataLayer: [] }
  try {
    common.trackQuoteEvent('quote_started', 0)
    common.trackQuoteEvent('quote_whatsapp_click', 4, 'videogame')
    assert.deepEqual(window.dataLayer, [
      { event: 'quote_started', quote_category: 'notebook', quote_step: 1 },
      { event: 'quote_whatsapp_click', quote_category: 'videogame', quote_step: 5 },
    ])
  } finally { delete globalThis.window }
})
