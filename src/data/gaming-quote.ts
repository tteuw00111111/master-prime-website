import type { QuoteIssue } from '@/types/quote'
import type { GamingCatalogModel, GamingDeviceDraft, GamingQuoteDraft } from '@/types/gaming-quote'

export const GAMING_QUOTE_PATH = '/orcamento/videogame'
export const GAMING_STORAGE_KEY = 'master-prime:gaming-quote:v1'
export const GAMING_STEPS = ['Aparelhos', 'Problemas', 'Detalhes', 'Atendimento', 'Revisar'] as const
export const GAMING_DEVICE_LABELS = { console: 'Videogame', controller: 'Controle' } as const
export const GAMING_PLATFORMS = [
  { id: 'playstation', name: 'PlayStation' },
  { id: 'xbox', name: 'Xbox' },
  { id: 'unknown', name: 'Não sei' },
] as const
export const GAMING_MODES = [
  { id: 'console', name: 'Videogame' },
  { id: 'controller', name: 'Controle' },
  { id: 'both', name: 'Videogame e controle' },
] as const

// Identification only: these suggestions are not a claim of repair availability,
// parts in stock, manufacturer authorization, or controller/console compatibility.
export const GAMING_CATALOG_SOURCES = {
  playstation: 'https://www.playstation.com/pt-br/support/hardware/manuals/',
  xbox: 'https://www.xbox.com/en-US/accessories/controllers',
  xboxConsoles: 'https://www.xbox.com/pt-BR/consoles/compare',
} as const

const model = (id: string, name: string, brandId: 'playstation' | 'xbox', device: GamingCatalogModel['device'], aliases: string[] = [], discDrive?: false): GamingCatalogModel => ({
  id, name, brandId, device, aliases, source: brandId === 'xbox' && device === 'console' ? GAMING_CATALOG_SOURCES.xboxConsoles : GAMING_CATALOG_SOURCES[brandId],
  ...(discDrive === false ? { discDrive } : {}),
})

export const GAMING_MODELS: GamingCatalogModel[] = [
  model('ps4', 'PS4', 'playstation', 'console', ['PlayStation 4', 'PS4 original', 'PS4 Fat']),
  model('ps4-slim', 'PS4 Slim', 'playstation', 'console', ['PlayStation 4 Slim']),
  model('ps4-pro', 'PS4 Pro', 'playstation', 'console', ['PlayStation 4 Pro']),
  model('ps5', 'PS5', 'playstation', 'console', ['PlayStation 5', 'PS5 original']),
  model('ps5-digital', 'PS5 Digital (original)', 'playstation', 'console', ['PS5 Digital original', 'CFI-1014B', 'CFI-1114B', 'CFI-1214B'], false),
  model('ps5-slim', 'PS5 Slim', 'playstation', 'console', ['PlayStation 5 Slim']),
  // Slim and Pro can have an attached drive; do not infer drive absence.
  model('ps5-pro', 'PS5 Pro', 'playstation', 'console', ['PlayStation 5 Pro']),
  model('xbox-one', 'Xbox One', 'xbox', 'console', ['Xbox One original', 'Xbox One Fat']),
  model('xbox-one-s', 'Xbox One S', 'xbox', 'console'),
  model('xbox-one-s-digital', 'Xbox One S All-Digital', 'xbox', 'console', ['Xbox One S All Digital Edition'], false),
  model('xbox-one-x', 'Xbox One X', 'xbox', 'console'),
  model('xbox-series-x', 'Xbox Series X', 'xbox', 'console', ['Series X']),
  model('xbox-series-x-digital', 'Xbox Series X Digital', 'xbox', 'console', ['Series X All Digital', 'Xbox Series X All-Digital'], false),
  model('xbox-series-s', 'Xbox Series S', 'xbox', 'console', ['Series S'], false),
  model('dualshock4', 'DualShock 4', 'playstation', 'controller', ['DS4', 'Controle PS4', 'Controle de PS4']),
  model('dualsense', 'DualSense', 'playstation', 'controller', ['Controle PS5', 'Controle de PS5']),
  model('dualsense-edge', 'DualSense Edge', 'playstation', 'controller', ['Controle PS5 Edge']),
  model('xbox-one-controller', 'Controle Xbox One', 'xbox', 'controller', ['Xbox One Wireless Controller']),
  model('xbox-series-controller', 'Controle Xbox Series X|S', 'xbox', 'controller', ['Xbox Wireless Controller', 'Controle Xbox Series', 'Controle Series X', 'Controle Series S']),
  model('xbox-elite', 'Xbox Elite', 'xbox', 'controller', ['Xbox Elite Series 1', 'Elite Wireless Controller']),
  model('xbox-elite-2', 'Xbox Elite Series 2', 'xbox', 'controller', ['Elite 2', 'Elite Series 2 Core']),
]

const unsure = 'Não sei dizer'
export const CONSOLE_ISSUES: readonly QuoteIssue[] = [
  { id: 'power', label: 'Não liga', hint: '', kind: 'symptom', questions: [
    { id: 'power-signs', label: 'Quando tenta ligar o videogame, o que acontece?', options: ['Não dá nenhum sinal', 'Acende luz ou emite bipe', 'Liga e apaga em seguida', unsure] },
  ] },
  { id: 'shutdown', label: 'Liga e desliga', hint: '', kind: 'symptom', questions: [
    { id: 'shutdown-timing', label: 'Quando o videogame desliga?', options: ['Logo depois de ligar', 'Depois de um tempo usando', 'Durante os jogos', unsure] },
  ] },
  { id: 'image', label: 'Sem imagem ou imagem falhando', hint: '', kind: 'symptom', questions: [
    { id: 'image-signs', label: 'Como fica a imagem do videogame?', options: ['A TV fica sem sinal', 'A imagem aparece e some', 'A imagem tem linhas, pontos ou distorções', unsure] },
  ] },
  { id: 'heat', label: 'Esquenta ou faz muito barulho', hint: '', kind: 'symptom', questions: [
    { id: 'heat-signs', label: 'O que você percebe no videogame?', multiple: true, options: ['Esquenta mais que o habitual', 'A ventoinha faz muito barulho', 'Aparece aviso de temperatura', unsure] },
  ] },
  { id: 'freeze', label: 'Trava ou apresenta erro', hint: '', kind: 'symptom', questions: [
    { id: 'freeze-timing', label: 'Quando o videogame trava ou mostra erro?', options: ['Ao iniciar', 'No menu', 'Durante os jogos', unsure] },
  ] },
  { id: 'disc', label: 'Problema com disco', hint: '', kind: 'symptom', questions: [
    { id: 'disc-signs', label: 'O que acontece com o disco?', options: ['Não entra', 'Não é lido', 'Não sai', unsure] },
  ] },
  { id: 'other', label: 'Outro problema', hint: '', kind: 'symptom', questions: [] },
  { id: 'cleaning', label: 'Consultar limpeza e manutenção', hint: '', kind: 'request', questions: [] },
]

export const CONTROLLER_ISSUES: readonly QuoteIssue[] = [
  { id: 'drift', label: 'Analógico mexendo sozinho / drift', hint: '', kind: 'symptom', questions: [
    { id: 'drift-side', label: 'Qual analógico apresenta o problema?', options: ['Esquerdo', 'Direito', 'Os dois', unsure] },
  ] },
  { id: 'buttons', label: 'Botões ou direcional falhando', hint: '', kind: 'symptom', questions: [
    { id: 'buttons-affected', label: 'Quais comandos estão falhando?', multiple: true, options: ['Botões da frente', 'Direcional', 'Clique dos analógicos', 'Outros comandos', unsure] },
  ] },
  { id: 'triggers', label: 'Gatilhos ou botões superiores falhando', hint: '', kind: 'symptom', questions: [
    { id: 'triggers-side', label: 'Qual lado do controle está falhando?', options: ['Esquerdo', 'Direito', 'Os dois', unsure] },
  ] },
  { id: 'connection', label: 'Não conecta ou desconecta', hint: '', kind: 'symptom', questions: [
    { id: 'connection-mode', label: 'Em qual conexão o controle apresenta a falha?', options: ['Com cabo', 'Sem fio', 'Nas duas', unsure] },
  ] },
  { id: 'battery', label: 'Não liga / alimentação ou carregamento', hint: '', kind: 'symptom', questions: [
    { id: 'battery-signs', label: 'O que acontece com a alimentação do controle?', options: ['Não liga', 'Só funciona com cabo', 'Pilhas ou bateria duram pouco', 'Bateria recarregável não carrega', unsure] },
  ] },
  { id: 'other', label: 'Outro problema', hint: '', kind: 'symptom', questions: [] },
  { id: 'hall', label: 'Consultar analógico Hall Effect', hint: '', kind: 'request', questions: [] },
]

export const createGamingDevice = (): GamingDeviceDraft => ({ platform: '', model: '', modelUnknown: false, issueIds: [], answers: {} })
export const createGamingQuoteDraft = (): GamingQuoteDraft => ({
  version: 1, category: 'videogame', mode: '', console: createGamingDevice(), controller: createGamingDevice(),
  notes: '', delivery: '', neighborhood: '', city: 'Rio de Janeiro',
})
