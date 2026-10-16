import type { PcBudgetReference, PcBuildQuoteDraft, PcCatalogItem } from '../types/pc-build-quote'

export const PC_BUILD_QUOTE_PATH = '/orcamento/pc-gamer'
export const PC_BUILD_STORAGE_KEY = 'master-prime:pc-build-quote:v1'
export const PC_BUILD_STEPS = ['Seu projeto', 'Investimento', 'Uso e preferências', 'Atendimento', 'Revisar'] as const
export const PC_MODES = [{ id: 'complete', name: 'Quero um PC completo', hint: 'Começar do zero, com orientação para escolher as peças.' }, { id: 'partial', name: 'Já tenho algumas peças', hint: 'Planejar o restante e consultar a montagem.' }, { id: 'assembly', name: 'Já tenho todas as peças', hint: 'Consultar a montagem com as peças que você possui.' }] as const
export const PC_PURPOSES = [{ id: 'gaming', name: 'Jogar', hint: 'Seus jogos e a experiência que procura.' }, { id: 'work', name: 'Trabalhar ou estudar', hint: 'Seus programas e tarefas do dia a dia.' }, { id: 'both', name: 'Jogar e trabalhar', hint: 'Equilibrar os dois usos no mesmo PC.' }] as const
export const PC_BUDGET_SCOPES = [{ id: 'pc', name: 'Só o PC / montagem' }, { id: 'setup', name: 'PC e periféricos' }, { id: 'unsure', name: 'Quero ajuda para definir' }] as const
export const PC_PERIPHERALS = [{ id: 'monitor', name: 'Monitor' }, { id: 'keyboard', name: 'Teclado' }, { id: 'mouse', name: 'Mouse' }, { id: 'headset', name: 'Headset' }] as const
export const PC_PRIORITIES = [{ id: 'value', name: 'Custo-benefício' }, { id: 'performance', name: 'Desempenho' }, { id: 'quiet', name: 'Menos ruído' }, { id: 'appearance', name: 'Visual' }, { id: 'compact', name: 'Tamanho compacto' }, { id: 'upgrade', name: 'Upgrades futuros' }] as const
export const PC_RESOLUTIONS = [{ id: '1080p', name: 'Full HD · 1080p' }, { id: '1440p', name: 'Quad HD · 1440p' }, { id: '4k', name: '4K' }, { id: 'unsure', name: 'Ainda não sei' }] as const
export const PC_FPS = [{ id: '60', name: '60 FPS' }, { id: '120', name: '120 FPS' }, { id: '144', name: '144 FPS' }, { id: '240', name: '240 FPS' }, { id: 'custom', name: 'Outra meta' }, { id: 'unsure', name: 'Quero orientação' }] as const
export const PC_GRAPHICS = [{ id: 'competitive', name: 'Resposta rápida para competir' }, { id: 'balanced', name: 'Equilíbrio entre fluidez e imagem' }, { id: 'quality', name: 'Qualidade visual' }, { id: 'unsure', name: 'Quero orientação' }] as const
export const PC_GPU = [{ id: 'nvidia', name: 'NVIDIA GeForce' }, { id: 'amd', name: 'AMD Radeon' }, { id: 'best-fit', name: 'Melhor opção para meu orçamento' }, { id: 'guidance', name: 'Quero orientação' }] as const
export const PC_CPU = [{ id: 'amd', name: 'AMD Ryzen' }, { id: 'intel', name: 'Intel Core' }, { id: 'best-fit', name: 'Melhor opção para meu orçamento' }, { id: 'guidance', name: 'Quero orientação' }] as const
export const PC_COLORS = [{ id: 'black', name: 'Preto' }, { id: 'white', name: 'Branco' }, { id: 'any', name: 'Sem preferência' }] as const
export const PC_LIGHTING = [{ id: 'rgb', name: 'Com RGB' }, { id: 'none', name: 'Sem iluminação' }, { id: 'any', name: 'Sem preferência' }] as const
export const PC_CONNECTIVITY = [{ id: 'wifi', name: 'Wi-Fi' }, { id: 'bluetooth', name: 'Bluetooth' }] as const
export const PC_HORIZONS = [{ id: 'soon', name: 'Assim que definir a configuração' }, { id: 'month', name: 'Neste mês' }, { id: 'researching', name: 'Estou pesquisando' }, { id: 'unsure', name: 'Ainda não defini' }] as const
export const PC_FULFILLMENT = [{ id: 'store', name: 'Retirar na loja', hint: 'Campo Grande, Rio de Janeiro.' }, { id: 'delivery', name: 'Consultar entrega', hint: 'Disponibilidade e custos a confirmar.' }, { id: 'undecided', name: 'Combinar pelo WhatsApp', hint: 'Decidir com a equipe durante o atendimento.' }] as const

export const PC_GAMES: readonly PcCatalogItem[] = [
  { id: 'valorant', name: 'Valorant', tone: '#ff6570' }, { id: 'cs2', name: 'Counter-Strike 2', aliases: ['CS', 'CS2', 'CS GO'], tone: '#dfa957' },
  { id: 'fortnite', name: 'Fortnite', tone: '#b69cfa' }, { id: 'minecraft', name: 'Minecraft', tone: '#94c878' },
  { id: 'lol', name: 'League of Legends', aliases: ['LoL'], tone: '#d0b36a' }, { id: 'dota2', name: 'Dota 2', tone: '#df8d7c' },
  { id: 'gtav', name: 'GTA V', aliases: ['GTA 5', 'Grand Theft Auto V'], tone: '#8eb99e' }, { id: 'roblox', name: 'Roblox', tone: '#b5c3d5' },
  { id: 'warzone', name: 'Call of Duty: Warzone', aliases: ['CoD Warzone', 'Warzone'], tone: '#aabb82' },
]
export const PC_PROGRAMS: readonly PcCatalogItem[] = [
  { id: 'photoshop', name: 'Photoshop', tone: '#73bded' }, { id: 'premiere', name: 'Premiere Pro', tone: '#c5a9f7' },
  { id: 'resolve', name: 'DaVinci Resolve', tone: '#a6c7e9' }, { id: 'blender', name: 'Blender', tone: '#edb27e' },
  { id: 'autocad', name: 'AutoCAD', tone: '#ed8e9a' }, { id: 'revit', name: 'Revit', tone: '#9bbce9' },
  { id: 'vscode', name: 'Visual Studio Code', aliases: ['VS Code', 'Programação'], tone: '#8dc9f0' }, { id: 'office', name: 'Microsoft Office', aliases: ['Word', 'Excel', 'PowerPoint', 'Microsoft 365'], tone: '#efa78b' },
]

// Populate only with company-reviewed builds, dated BRL prices and matching
// benchmarks. An empty list must never manufacture a price/FPS assessment.
export const PC_BUDGET_REFERENCES: readonly PcBudgetReference[] = []

// Reserved for approved photographs of actual Master Prime work, never stock evidence.
export const PC_EXPERIENCE_IMAGE: { src?: string; alt?: string; width?: number; height?: number; brief: string } = {
  brief: 'Montagem real de PC na bancada da Master Prime, com autorização de uso da imagem.',
}

export const createPcBuildQuoteDraft = (): PcBuildQuoteDraft => ({
  version: 1, category: 'montagem-pc', intent: 'build', mode: '', purpose: '', ownedParts: '',
  budgetCents: null, budgetUndecided: false, budgetScope: '', peripheralIds: [], gameIds: [], customGames: [], gamesUndecided: false,
  programIds: [], customPrograms: [], programsUndecided: false, objective: '', personalize: false,
  resolution: '', targetFps: '', customFps: '', guidanceRequested: false, graphics: '', workload: '', priorityIds: [], gpu: '', cpu: '', caseColor: '', lighting: '',
  connectivityIds: [], horizon: '', notes: '', fulfillment: '', neighborhood: '', city: 'Rio de Janeiro',
})
