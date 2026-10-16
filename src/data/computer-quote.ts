import type { ComputerQuoteDraft } from '../types/computer-quote'
import type { QuoteIssue, QuoteQuestion } from '../types/quote'

export const COMPUTER_QUOTE_PATH = '/orcamento/computador'
export const COMPUTER_STORAGE_KEY = 'master-prime:computer-quote:v1'
export const COMPUTER_STEPS = ['Seu computador', 'O problema', 'Os detalhes', 'Atendimento', 'Revisar'] as const
export const COMPUTER_KINDS = [
  { id: 'desktop', name: 'Computador' },
  { id: 'pc-gamer', name: 'PC gamer' },
  { id: 'unknown', name: 'Não sei dizer' },
] as const

const unsure = 'Não sei dizer'
const upgradeQuestion: QuoteQuestion = {
  id: 'upgrade-goal', label: 'O que você gostaria de melhorar?', multiple: true,
  options: ['Iniciar e abrir programas mais rápido', 'Mais espaço para arquivos', 'Usar vários programas ao mesmo tempo', 'Jogos ou programas pesados', 'Quero uma orientação'],
}

export const COMPUTER_ISSUES: readonly QuoteIssue[] = [
  { id: 'power', label: 'Não liga', hint: '', kind: 'symptom', questions: [
    { id: 'power-signs', label: 'Quando tenta ligar, o que acontece?', options: ['Não dá nenhum sinal', 'Acende luzes ou gira as ventoinhas', 'Liga e apaga em seguida', unsure] },
  ] },
  { id: 'image', label: 'Liga, mas fica sem imagem', hint: '', kind: 'symptom', questions: [
    { id: 'image-signs', label: 'Quando fica sem imagem?', options: ['Desde que liga', 'A imagem aparece e some', 'Perde a imagem durante o uso', unsure] },
  ] },
  { id: 'shutdown', label: 'Desliga ou reinicia sozinho', hint: '', kind: 'symptom', questions: [
    { id: 'shutdown-timing', label: 'Quando desliga ou reinicia?', options: ['Ao ligar', 'Depois de um tempo usando', 'Em jogos ou programas pesados', unsure] },
  ] },
  { id: 'heat', label: 'Esquenta ou faz muito barulho', hint: '', kind: 'symptom', questions: [
    { id: 'heat-signs', label: 'O que você percebe no computador?', options: ['Muito calor', 'Ventoinhas barulhentas', 'Calor e barulho', unsure] },
  ] },
  { id: 'slow', label: 'Está lento ou travando', hint: '', kind: 'symptom', questions: [
    { id: 'slow-timing', label: 'Quando a lentidão ou os travamentos aparecem?', options: ['Ao iniciar', 'Ao abrir programas', 'Em jogos ou programas pesados', 'Durante todo o uso', unsure] },
  ] },
  { id: 'system', label: 'Não inicia o sistema / tela azul', hint: '', kind: 'symptom', questions: [
    { id: 'system-signs', label: 'O que acontece ao iniciar o sistema?', options: ['Não entra no sistema', 'Aparece uma tela azul', 'Reinicia ao iniciar', unsure] },
  ] },
  { id: 'other', label: 'Outro problema', hint: '', kind: 'symptom', questions: [] },
  { id: 'cleaning', label: 'Limpeza e manutenção', hint: '', kind: 'request', questions: [] },
  { id: 'ssd', label: 'Upgrade de SSD', hint: '', kind: 'request', questions: [upgradeQuestion] },
  { id: 'ram', label: 'Upgrade de memória RAM', hint: '', kind: 'request', questions: [upgradeQuestion] },
  { id: 'upgrade', label: 'Outro upgrade', hint: '', kind: 'request', questions: [upgradeQuestion] },
  { id: 'formatting', label: 'Formatação / sistema', hint: '', kind: 'request', questions: [
    { id: 'preserve-files', label: 'Há arquivos que você precisa preservar?', options: ['Sim', 'Não', unsure] },
  ] },
]

export const createComputerQuoteDraft = (): ComputerQuoteDraft => ({
  version: 1, category: 'computador', intent: 'repair', kind: '', configuration: '',
  issueIds: [], answers: {}, notes: '', delivery: '', neighborhood: '', city: 'Rio de Janeiro',
})
