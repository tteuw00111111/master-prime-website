import { CONSOLE_ISSUES, CONTROLLER_ISSUES, GAMING_DEVICE_LABELS, GAMING_MODELS, GAMING_PLATFORMS, createGamingDevice, createGamingQuoteDraft } from '@/data/gaming-quote'
import { DELIVERY_LABELS } from '@/data/notebook-quote'
import type { GamingDeviceDraft, GamingDeviceKind, GamingPlatform, GamingQuoteDraft } from '@/types/gaming-quote'
import { getQuoteAnswerValues, normalizeCatalogSearch, searchCatalogModels } from './quote'

export const getGamingDevices = (draft: GamingQuoteDraft): GamingDeviceKind[] =>
  draft.mode === 'both' ? ['console', 'controller'] : draft.mode === 'console' || draft.mode === 'controller' ? [draft.mode] : []

export const getGamingPlatformLabel = (platform: GamingPlatform) =>
  platform === 'unknown' ? 'Plataforma a identificar' : GAMING_PLATFORMS.find(item => item.id === platform)?.name ?? ''

export const getGamingModels = (kind: GamingDeviceKind, platform: GamingPlatform) =>
  GAMING_MODELS.filter(model => model.device === kind && (platform === 'unknown' || model.brandId === platform))

/** Exact catalog names/aliases only: typing PS3 or Xbox 360 cannot submit. */
export const getSupportedGamingModel = (kind: GamingDeviceKind, device: GamingDeviceDraft) =>
  !device.modelUnknown ? getGamingModels(kind, device.platform).find(model =>
    [model.name, ...model.aliases].some(name => normalizeCatalogSearch(name) === normalizeCatalogSearch(device.model))) : undefined

export const getLegacyGamingModelError = (value: string): string | undefined => {
  const normalized = normalizeCatalogSearch(value)
  const playstation = normalized.match(/(?:playstation|ps|dualshock|ds)([123])(?!\d)/)
  const legacy = playstation ? `PS${playstation[1]}`
    : /(?:xbox|x)360/.test(normalized) ? 'Xbox 360'
      : /xbox(?:original|classic)/.test(normalized) ? 'Xbox original'
        : /(?:ps|playstation)vita/.test(normalized) ? 'PS Vita'
          : /psp/.test(normalized) ? 'PSP' : null
  return legacy ? `Não atendemos ${legacy} nem controles dessa geração. Este formulário é para PS4, PS5, Xbox One e Xbox Series X|S e seus controles.` : undefined
}

export const searchGamingModels = (kind: GamingDeviceKind, platform: GamingPlatform, query: string) => {
  if (normalizeCatalogSearch(query).length < 2) return []
  const models = getGamingModels(kind, platform)
  return platform === 'unknown'
    ? [...searchCatalogModels(models, 'playstation', query), ...searchCatalogModels(models, 'xbox', query)].slice(0, 8)
    : searchCatalogModels(models, platform, query)
}

export const getGamingIssues = (kind: GamingDeviceKind, device: GamingDeviceDraft) => {
  const exactModel = getSupportedGamingModel(kind, device)
  return (kind === 'console' ? CONSOLE_ISSUES : CONTROLLER_ISSUES).filter(issue => !(issue.id === 'disc' && exactModel && exactModel.discDrive === false))
}

export const getSelectedGamingIssues = (kind: GamingDeviceKind, device: GamingDeviceDraft) =>
  getGamingIssues(kind, device).filter(issue => device.issueIds.includes(issue.id))

export const getGamingQuestions = (kind: GamingDeviceKind, device: GamingDeviceDraft) =>
  [...new Map(getSelectedGamingIssues(kind, device).flatMap(issue => issue.questions).map(question => [question.id, question])).values()]

/** Shared by edits and restoration so hidden symptoms cannot leak into output. */
export const sanitizeGamingDevice = (kind: GamingDeviceKind, device: GamingDeviceDraft): GamingDeviceDraft => {
  const issueIds = getSelectedGamingIssues(kind, device).map(issue => issue.id)
  const answers: GamingDeviceDraft['answers'] = {}
  for (const question of getGamingQuestions(kind, { ...device, issueIds })) {
    const values = getQuoteAnswerValues(device, question)
    if (values.length) answers[question.id] = question.multiple ? values : values[0]
  }
  return { ...device, issueIds, answers }
}

export const updateGamingDevice = (kind: GamingDeviceKind, device: GamingDeviceDraft, changes: Partial<GamingDeviceDraft>) => {
  const platformChanged = changes.platform !== undefined && changes.platform !== device.platform
  return sanitizeGamingDevice(kind, {
    ...device, ...changes,
    ...(platformChanged ? { model: '', modelUnknown: false, answers: {} } : {}),
  })
}

export const toggleGamingIssue = (kind: GamingDeviceKind, device: GamingDeviceDraft, id: string) => {
  if (!getGamingIssues(kind, device).some(issue => issue.id === id)) return device
  return sanitizeGamingDevice(kind, { ...device, issueIds: device.issueIds.includes(id) ? device.issueIds.filter(value => value !== id) : [...device.issueIds, id] })
}

export const buildGamingQuoteMessage = (draft: GamingQuoteDraft) => {
  const lines = ['Olá! Vim da área de orçamento de videogame e controle do site Master Prime.']
  for (const kind of getGamingDevices(draft)) {
    const device = sanitizeGamingDevice(kind, draft[kind])
    lines.push('', `${GAMING_DEVICE_LABELS[kind]}:`, `Plataforma: ${getGamingPlatformLabel(device.platform) || 'Não informada'}`,
      `Modelo: ${getSupportedGamingModel(kind, device)?.name ?? 'Modelo não selecionado'}`, 'Problemas / solicitações:',
      ...getSelectedGamingIssues(kind, device).map(issue => `• ${issue.label}`))
    for (const question of getGamingQuestions(kind, device)) {
      const values = getQuoteAnswerValues(device, question)
      if (values.length) lines.push(`${question.label} ${values.join('; ')}`)
    }
  }
  if (draft.notes.trim()) lines.push('', `Observações: ${draft.notes.trim()}`)
  if (draft.delivery) lines.push('', `Atendimento: ${DELIVERY_LABELS[draft.delivery]}`)
  if (draft.delivery === 'pickup') lines.push(`Bairro: ${draft.neighborhood.trim()}`, `Cidade: ${draft.city.trim()}`, 'Gostaria de confirmar disponibilidade e condições de retirada e entrega.')
  lines.push('', 'Gostaria de consultar a possibilidade de atendimento e orçamento.')
  return lines.join('\n')
}

export const restoreGamingQuoteDraft = (raw: string | null, now = Date.now()): GamingQuoteDraft | null => {
  if (!raw) return null
  try {
    const saved = JSON.parse(raw)
    if (!saved || !Number.isFinite(saved.savedAt) || saved.savedAt > now || now - saved.savedAt > 2 * 60 * 60 * 1000) return null
    const value = saved.draft
    if (!value || value.version !== 1 || value.category !== 'videogame') return null
    const result = createGamingQuoteDraft()
    result.mode = ['console', 'controller', 'both'].includes(value.mode) ? value.mode : ''
    for (const kind of ['console', 'controller'] as const) {
      const device = value[kind]
      if (!device || typeof device !== 'object' || typeof device.model !== 'string') return null
      const clean = createGamingDevice()
      clean.platform = ['playstation', 'xbox', 'unknown'].includes(device.platform) ? device.platform : ''
      // Older local drafts could bypass model selection. Ask them to identify
      // a supported model instead of silently using text from a disabled field.
      clean.model = device.modelUnknown === true ? '' : device.model.slice(0, 120)
      clean.modelUnknown = false
      clean.issueIds = Array.isArray(device.issueIds) ? device.issueIds : []
      clean.answers = device.answers && typeof device.answers === 'object' && !Array.isArray(device.answers) ? device.answers : {}
      result[kind] = sanitizeGamingDevice(kind, clean)
    }
    for (const key of ['notes', 'neighborhood', 'city'] as const) {
      if (typeof value[key] !== 'string') return null
      result[key] = value[key].slice(0, key === 'notes' ? 600 : 80)
    }
    result.delivery = ['store', 'pickup', 'undecided'].includes(value.delivery) ? value.delivery : ''
    return result
  } catch { return null }
}
