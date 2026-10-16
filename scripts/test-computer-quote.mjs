import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const load = async path => {
  const result = await build({ entryPoints: [resolve(root, path)], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}
const computer = await load('src/utils/computer-quote.ts')
const flow = await load('src/utils/computer-quote-flow.ts')
const data = await load('src/data/computer-quote.ts')
const common = await load('src/utils/quote.ts')
const whatsapp = await load('src/utils/whatsapp.ts')
const complete = () => ({ ...data.createComputerQuoteDraft(), kind: 'desktop', issueIds: ['power'], delivery: 'store' })
const save = (draft, savedAt = Date.now()) => JSON.stringify({ draft, screen: 'review', step: 4, editScope: null, savedAt })

test('identification allows all computer kinds and no hardware knowledge', () => {
  assert.equal(flow.getFirstIncompleteComputerScreen(data.createComputerQuoteDraft()), 'kind')
  for (const kind of ['desktop', 'pc-gamer', 'unknown']) {
    const draft = { ...complete(), kind, configuration: '' }
    assert.equal(flow.getFirstIncompleteComputerScreen(draft), null)
    assert.deepEqual(flow.getComputerScreenErrors(draft, 'configuration'), {})
  }
  assert.equal(flow.getFirstIncompleteComputerScreen({ ...complete(), kind: 'laptop' }), 'kind')
})

test('symptoms and service requests can be selected independently or together', () => {
  assert.equal(flow.getFirstIncompleteComputerScreen({ ...complete(), issueIds: [] }), 'issues')
  for (const issue of data.COMPUTER_ISSUES) {
    assert.equal(flow.getFirstIncompleteComputerScreen({ ...complete(), issueIds: [issue.id] }), null, issue.label)
  }
  let draft = complete()
  draft = computer.toggleComputerIssue(draft, 'ssd')
  draft = computer.toggleComputerIssue(draft, 'ram')
  assert.deepEqual(computer.getComputerIssues(draft).map(issue => issue.id), ['power', 'ssd', 'ram'])
  assert.equal(computer.toggleComputerIssue(draft, 'invalid'), draft)
  assert.equal(computer.toggleComputerIssue(draft, 'power').issueIds.includes('power'), false)
})

test('conditional questions and shared upgrade goals are deduplicated', () => {
  const draft = { ...complete(), issueIds: data.COMPUTER_ISSUES.map(issue => issue.id) }
  const questions = computer.getComputerQuestions(draft)
  const screens = flow.getComputerScreens(draft)
  assert.equal(questions.length, 8)
  assert.equal(questions.filter(question => question.id === 'upgrade-goal').length, 1)
  assert.equal(new Set(screens).size, screens.length)
  assert.equal(screens.filter(screen => screen === 'question:upgrade-goal').length, 1)
  for (const question of questions) assert(screens.includes(`question:${question.id}`))
  assert(screens.indexOf('notes') < screens.indexOf('delivery'))
})

test('edits remove obsolete answers and retain shared answers while applicable', () => {
  const goal = data.COMPUTER_ISSUES.find(issue => issue.id === 'ssd').questions[0]
  let draft = { ...complete(), issueIds: ['power', 'ssd', 'ram'], answers: {
    'power-signs': 'Não dá nenhum sinal', 'upgrade-goal': [goal.options[1], goal.options[0], goal.options[0], 'invalid'], invalid: 'discard',
  }, notes: 'Não apagar arquivos.' }
  draft = computer.toggleComputerIssue(draft, 'power')
  assert.equal(draft.answers['power-signs'], undefined)
  assert.equal(draft.answers.invalid, undefined)
  assert.deepEqual(draft.answers['upgrade-goal'], [goal.options[0], goal.options[1]])
  draft = computer.toggleComputerIssue(draft, 'ssd')
  assert(draft.answers['upgrade-goal'])
  draft = computer.toggleComputerIssue(draft, 'ram')
  assert.deepEqual(draft.answers, {})
  assert.equal(draft.notes, 'Não apagar arquivos.')
})

test('optional details may be blank and skipping does not mutate entered answers', () => {
  const draft = { ...complete(), answers: { 'power-signs': 'Não dá nenhum sinal' }, notes: 'Falha intermitente' }
  const before = structuredClone(draft)
  for (const screen of ['question:power-signs', 'notes']) assert.deepEqual(flow.getComputerScreenErrors(draft, screen), {})
  assert.equal(flow.getFirstIncompleteComputerScreen(draft), null)
  assert.deepEqual(draft, before)
  const question = computer.getComputerQuestions(draft)[0]
  assert.deepEqual(common.toggleQuoteAnswer(draft, question, 'Não dá nenhum sinal'), { 'power-signs': '' })
})

test('delivery validates pickup fields only when pickup is selected', () => {
  assert.equal(flow.getFirstIncompleteComputerScreen({ ...complete(), delivery: '' }), 'delivery')
  let draft = { ...complete(), delivery: 'pickup', neighborhood: '', city: '' }
  assert.equal(flow.getFirstIncompleteComputerScreen(draft), 'neighborhood')
  draft.neighborhood = 'Campo Grande'
  assert.equal(flow.getFirstIncompleteComputerScreen(draft), 'city')
  draft.city = 'Rio de Janeiro'
  assert.equal(flow.getFirstIncompleteComputerScreen(draft), null)
  assert(flow.getComputerScreens(draft).includes('city'))
  for (const delivery of ['store', 'undecided']) {
    draft = { ...draft, delivery, neighborhood: '', city: '' }
    assert.equal(flow.getFirstIncompleteComputerScreen(draft), null)
    assert.equal(flow.getComputerScreens(draft).includes('city'), false)
  }
})

test('edit scopes map only their own screens and restoration stops at required gaps', () => {
  const draft = { ...complete(), delivery: 'pickup', neighborhood: 'Campo Grande' }
  for (const screen of flow.getComputerScreens(draft).filter(screen => screen !== 'review')) {
    const scopes = flow.COMPUTER_EDIT_SCOPES.filter(scope => flow.isComputerScreenInScope(screen, scope))
    assert.deepEqual(scopes, [flow.COMPUTER_EDIT_SCOPES[flow.getComputerScreenStep(screen)]])
  }
  assert.equal(flow.restoreComputerScreen(draft, { screen: 'review' }), 'review')
  assert.equal(flow.restoreComputerScreen({ ...draft, neighborhood: '' }, { screen: 'review' }), 'neighborhood')
  assert.equal(flow.restoreComputerScreen({ ...draft, issueIds: [] }, { screen: 'review' }), 'issues')
  assert.equal(flow.restoreComputerScreen(draft, { screen: 'question:removed' }), 'kind')
  assert.equal(flow.restoreComputerScreen(draft, { step: 2 }), 'question:power-signs')
})

test('draft restoration rejects stale, malformed and different-category data', () => {
  const now = Date.now()
  assert.deepEqual(computer.restoreComputerQuoteDraft(save(complete(), now), now), complete())
  assert(computer.restoreComputerQuoteDraft(save(complete(), now - 7200000), now))
  for (const raw of [null, '{', 'null', '[]', save(complete(), now + 1), save(complete(), now - 7200001)]) {
    assert.equal(computer.restoreComputerQuoteDraft(raw, now), null)
  }
  for (const changes of [{ category: 'notebook' }, { category: 'celular' }, { version: 2 }, { configuration: null }, { kind: 'tablet' }, { issueIds: {} }, { answers: [] }]) {
    assert.equal(computer.restoreComputerQuoteDraft(save({ ...complete(), ...changes }, now), now), null)
  }
  const restored = computer.restoreComputerQuoteDraft(save({ ...complete(), configuration: 'x'.repeat(400), notes: 'y'.repeat(700),
    neighborhood: 'z'.repeat(100), city: 'a'.repeat(100), issueIds: ['power', 'invalid', 'power', null],
    answers: { 'power-signs': { bad: 'value' }, invalid: 'discard' }, delivery: 'invalid',
  }, now), now)
  assert.equal(restored.configuration.length, 300)
  assert.equal(restored.notes.length, 600)
  assert.equal(restored.neighborhood.length, 80)
  assert.equal(restored.city.length, 80)
  assert.deepEqual(restored.issueIds, ['power'])
  assert.deepEqual(restored.answers, {})
  assert.equal(restored.delivery, '')
})

test('future assembly intent is rejected by restoration, flow, validation and messages', () => {
  const draft = { ...complete(), intent: 'build' }
  assert.equal(computer.restoreComputerQuoteDraft(save(draft)), null)
  assert.deepEqual(flow.getComputerScreens(draft), [])
  assert.equal(flow.getFirstIncompleteComputerScreen(draft), 'kind')
  assert(flow.getComputerScreenErrors(draft, 'review').kind)
  assert.deepEqual(computer.getComputerIssues(draft), [])
  assert.throws(() => computer.buildComputerQuoteMessage(draft), /indisponível/)
  assert.equal(data.COMPUTER_KINDS.some(kind => kind.id === 'build'), false)
})

test('summary includes only active details, supports accents and omits inapplicable location', () => {
  const draft = { ...complete(), kind: 'pc-gamer', configuration: 'Ryzen, 16 GB de RAM', notes: 'Começou após uma atualização.',
    neighborhood: 'Campo Grande', city: 'Rio de Janeiro', answers: { 'power-signs': 'Não dá nenhum sinal', 'image-signs': 'Desde que liga' } }
  const message = computer.buildComputerQuoteMessage(draft)
  assert(message.includes('Aparelho: PC gamer'))
  assert(message.includes('Ryzen, 16 GB de RAM'))
  assert(message.includes('Não dá nenhum sinal'))
  assert(message.includes(draft.notes))
  assert(!message.includes('Desde que liga'))
  assert(!message.includes('Bairro:'))
  assert(!message.includes('Cidade:'))
  assert(!message.includes('montagem'))
  const url = new URL(whatsapp.getWhatsAppMessageUrl(message))
  assert.equal(url.searchParams.get('phone'), '5521967635340')
  assert.equal(url.searchParams.get('text'), message)
  const pickup = computer.buildComputerQuoteMessage({ ...draft, delivery: 'pickup' })
  assert(pickup.includes('Bairro: Campo Grande') && pickup.includes('Cidade: Rio de Janeiro'))
  assert(pickup.includes('confirmar disponibilidade e condições'))
  const unknown = computer.buildComputerQuoteMessage({ ...complete(), kind: 'unknown' })
  assert(unknown.includes('Computador (tipo a identificar)'))
  assert(!unknown.includes('Marca, modelo ou configuração:'))
})

test('computer analytics contain only allowed event, category and step fields', () => {
  globalThis.window = { dataLayer: [] }
  try {
    for (const event of ['quote_started', 'quote_step_completed', 'quote_reviewed', 'quote_whatsapp_click']) {
      common.trackQuoteEvent(event, 4, 'computador')
      assert.deepEqual(window.dataLayer.at(-1), { event, quote_category: 'computador', quote_step: 5 })
    }
  } finally { delete globalThis.window }
})
