import type { QuoteDraft, QuoteIssue, QuoteQuestion } from '../types/quote'

export const NOTEBOOK_QUOTE_PATH = '/orcamento/notebook'
export const QUOTE_STORAGE_KEY = 'master-prime:notebook-quote:v1'
export const QUOTE_STEPS = ['Seu notebook', 'O problema', 'Os detalhes', 'Atendimento', 'Revisar'] as const

// Identification suggestions, not a claim of brand authorization or repair availability.
export const NOTEBOOK_BRANDS = [
  { id: 'dell', name: 'Dell' },
  { id: 'lenovo', name: 'Lenovo' },
  { id: 'samsung', name: 'Samsung' },
  { id: 'acer', name: 'Acer' },
  { id: 'asus', name: 'ASUS' },
  { id: 'hp', name: 'HP' },
  { id: 'apple', name: 'Apple' },
  { id: 'positivo', name: 'Positivo' },
  { id: 'avell', name: 'Avell' },
  { id: 'vaio', name: 'VAIO' },
  { id: 'lg', name: 'LG' },
  { id: 'multilaser', name: 'Multilaser / Multi' },
  { id: 'philco', name: 'Philco' },
  { id: 'toshiba', name: 'Toshiba / Dynabook' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'msi', name: 'MSI' },
  { id: 'gigabyte', name: 'Gigabyte' },
  { id: 'razer', name: 'Razer' },
  { id: 'huawei', name: 'Huawei' },
  { id: 'alienware', name: 'Alienware' },
  { id: 'sony', name: 'Sony' },
  { id: 'cce', name: 'CCE' },
] as const

const unsure = 'Não sei dizer'
export const NOTEBOOK_UPGRADE_QUESTION: QuoteQuestion = {
  id: 'upgrade-goal', label: 'O que você gostaria de melhorar?', multiple: true,
  options: ['Velocidade para iniciar e abrir programas', 'Mais espaço para arquivos', 'Usar vários programas ao mesmo tempo', 'Quero uma orientação'],
}

// Restore the original, unspecified upgrade request without guessing SSD or RAM.
// This choice is only displayed when it already exists in a saved draft.
export const LEGACY_NOTEBOOK_UPGRADE: QuoteIssue = {
  id: 'upgrade', label: 'Consultar SSD ou memória RAM', hint: 'Quero conversar sobre um upgrade', kind: 'request', questions: [NOTEBOOK_UPGRADE_QUESTION],
}

export const NOTEBOOK_ISSUES: readonly QuoteIssue[] = [
  { id: 'power', label: 'Não liga', hint: 'Não inicia ou apaga logo ao ligar', kind: 'symptom', questions: [
    { id: 'power-signs', label: 'Quando tenta ligar, o que acontece?', options: ['Não dá nenhum sinal', 'Acende luz ou faz barulho', 'Liga e apaga em seguida', unsure] },
  ] },
  { id: 'image', label: 'Liga, mas fica sem imagem', hint: 'A tela fica preta ou muito escura', kind: 'symptom', questions: [
    { id: 'image-signs', label: 'Como a tela fica?', options: ['Totalmente preta', 'Com imagem bem escura', 'A imagem aparece e some', unsure] },
  ] },
  { id: 'screen', label: 'Tela quebrada ou com falhas', hint: 'Trincas, manchas, linhas ou piscando', kind: 'symptom', questions: [
    { id: 'screen-signs', label: 'O que você percebe na tela?', options: ['Está trincada ou quebrada', 'Tem manchas ou linhas', 'Fica piscando', unsure] },
  ] },
  { id: 'keyboard', label: 'Teclado falhando', hint: 'Teclas sem resposta, soltas ou repetindo', kind: 'symptom', questions: [
    { id: 'keyboard-signs', label: 'O que acontece com as teclas?', options: ['Algumas não funcionam', 'Nenhuma funciona', 'Digitam sozinhas ou repetem', 'Tem tecla solta ou quebrada', unsure] },
  ] },
  { id: 'hinge', label: 'Dobradiça ou carcaça', hint: 'Tampa dura, solta ou abrindo a estrutura', kind: 'symptom', questions: [
    { id: 'hinge-signs', label: 'Como está a tampa do notebook?', options: ['Dura ou estalando ao abrir', 'Solta ou sem sustentação', 'Carcaça ou moldura se separando', unsure] },
  ] },
  { id: 'heat', label: 'Esquenta ou desliga', hint: 'Aquece, faz muito ruído ou apaga em uso', kind: 'symptom', questions: [
    { id: 'heat-timing', label: 'Quando isso acontece?', options: ['Logo depois de ligar', 'Depois de um tempo usando', 'Em jogos ou programas pesados', unsure] },
  ] },
  { id: 'slow', label: 'Está lento ou travando', hint: 'Demora para iniciar ou abrir programas', kind: 'symptom', questions: [
    { id: 'slow-timing', label: 'Quando a lentidão aparece mais?', options: ['Ao ligar o notebook', 'Ao abrir programas', 'Durante todo o uso', unsure] },
  ] },
  { id: 'battery', label: 'Bateria ou carregamento', hint: 'Não carrega ou descarrega muito rápido', kind: 'symptom', questions: [
    { id: 'battery-signs', label: 'Qual situação descreve melhor?', options: ['Não carrega', 'Só funciona na tomada', 'Descarrega muito rápido', unsure] },
  ] },
  { id: 'other', label: 'Outro problema', hint: 'Pode contar do seu jeito', kind: 'symptom', questions: [] },
  { id: 'cleaning', label: 'Consultar limpeza e manutenção', hint: 'Quero avaliar o estado do notebook', kind: 'request', questions: [] },
  { id: 'ssd', label: 'Consultar upgrade de SSD', hint: 'Quero consultar um upgrade de armazenamento', kind: 'request', questions: [NOTEBOOK_UPGRADE_QUESTION] },
  { id: 'ram', label: 'Consultar upgrade de memória RAM', hint: 'Quero consultar um upgrade de memória', kind: 'request', questions: [NOTEBOOK_UPGRADE_QUESTION] },
]

export const DELIVERY_LABELS = {
  store: 'Vou levar à loja',
  pickup: 'Quero consultar retirada e entrega',
  undecided: 'Ainda não sei, quero orientação',
} as const

export const createQuoteDraft = (): QuoteDraft => ({
  version: 1,
  category: 'notebook',
  brandId: '',
  customBrand: '',
  model: '',
  modelUnknown: false,
  issueIds: [],
  answers: {},
  notes: '',
  delivery: '',
  neighborhood: '',
  city: 'Rio de Janeiro',
})
