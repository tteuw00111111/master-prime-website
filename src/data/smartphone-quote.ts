import type { QuoteIssue } from '@/types/quote'
import type { SmartphoneQuoteDraft } from '@/types/smartphone-quote'
export { SMARTPHONE_MODELS, SMARTPHONE_CATALOG_SOURCES } from './smartphone-models'

export const SMARTPHONE_QUOTE_PATH = '/orcamento/celular'
export const SMARTPHONE_STORAGE_KEY = 'master-prime:smartphone-quote:v1'
export const SMARTPHONE_STEPS = ['Seu celular', 'Problemas', 'Detalhes', 'Atendimento', 'Revisar'] as const
export const SMARTPHONE_BRANDS = [
  { id: 'apple', name: 'Apple' },
  { id: 'samsung', name: 'Samsung' },
  { id: 'motorola', name: 'Motorola' },
  { id: 'xiaomi', name: 'Xiaomi' },
  { id: 'asus', name: 'ASUS' },
  { id: 'lg', name: 'LG' },
  { id: 'nokia', name: 'Nokia' },
  { id: 'realme', name: 'Realme' },
  { id: 'oppo', name: 'OPPO' },
  { id: 'huawei', name: 'Huawei' },
  { id: 'infinix', name: 'Infinix' },
  { id: 'tecno', name: 'Tecno' },
] as const

export const SMARTPHONE_UNSURE = 'Não sei dizer'
export const SMARTPHONE_ISSUES: readonly QuoteIssue[] = [
  { id: 'screen', label: 'Tela quebrada, sem imagem ou sem toque', hint: '', kind: 'symptom', questions: [
    { id: 'screen-signs', label: 'O que aconteceu com a tela?', multiple: true, options: ['Está trincada', 'Tem manchas ou linhas', 'Está sem imagem', 'O toque está falhando', SMARTPHONE_UNSURE] },
  ] },
  { id: 'battery', label: 'Bateria descarrega rápido ou está estufada', hint: '', kind: 'symptom', questions: [
    { id: 'battery-signs', label: 'O que você percebe na bateria ou no aparelho?', multiple: true, options: ['Descarrega rápido', 'Desliga mesmo com carga', 'A tela ou tampa está levantando', SMARTPHONE_UNSURE] },
  ] },
  { id: 'charging', label: 'Não carrega ou carrega com dificuldade', hint: '', kind: 'symptom', questions: [
    { id: 'charging-signs', label: 'Como está o carregamento?', options: ['Não reconhece o carregador', 'A carga fica indo e voltando', 'Carrega lentamente', SMARTPHONE_UNSURE] },
  ] },
  { id: 'power', label: 'Não liga ou reinicia sozinho', hint: '', kind: 'symptom', questions: [
    { id: 'power-signs', label: 'O que acontece com o celular?', options: ['Não dá nenhum sinal', 'Vibra ou acende, mas não inicia', 'Fica preso no logo', 'Reinicia sozinho', SMARTPHONE_UNSURE] },
  ] },
  { id: 'heat', label: 'Esquenta muito', hint: '', kind: 'symptom', questions: [
    { id: 'heat-timing', label: 'Quando você percebe o aquecimento?', options: ['Durante o carregamento', 'Durante o uso', 'Mesmo sem usar', SMARTPHONE_UNSURE] },
  ] },
  { id: 'liquid', label: 'Contato com líquido', hint: '', kind: 'symptom', questions: [
    { id: 'liquid-signs', label: 'O que você percebeu após o contato com líquido?', options: ['Parou de funcionar', 'Funciona com falhas', 'Não percebi mudança', SMARTPHONE_UNSURE] },
  ] },
  { id: 'system', label: 'Trava ou apresenta problema de sistema', hint: '', kind: 'symptom', questions: [
    { id: 'system-signs', label: 'Qual problema de sistema você percebe?', options: ['Lentidão ou travamentos', 'Erro ao iniciar', 'Aplicativos fechando sozinhos', SMARTPHONE_UNSURE] },
  ] },
  { id: 'other', label: 'Outro problema', hint: '', kind: 'symptom', questions: [] },
]

export const createSmartphoneQuoteDraft = (): SmartphoneQuoteDraft => ({
  version: 1, category: 'celular', brandId: '', customBrand: '', model: '', modelUnknown: false,
  issueIds: [], answers: {}, notes: '', delivery: '', neighborhood: '', city: 'Rio de Janeiro',
})
