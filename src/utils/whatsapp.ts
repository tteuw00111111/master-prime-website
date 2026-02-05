import { trackLeadEvent } from './metaTracking'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

interface WhatsAppClickEvent {
  event: 'whatsapp_click'
  whatsapp_action: 'quote' | 'service' | 'visit' | 'custom'
  whatsapp_service?: string
  whatsapp_location: string
  whatsapp_url: string
}

const WHATSAPP_PHONE = '5521967635340'
const WHATSAPP_API_BASE = 'https://api.whatsapp.com/send/'

const pushWhatsAppEvent = (
  action: WhatsAppClickEvent['whatsapp_action'],
  url: string,
  serviceName?: string
): void => {
  const location = window.location.pathname + window.location.hash

  const eventData: WhatsAppClickEvent = {
    event: 'whatsapp_click',
    whatsapp_action: action,
    whatsapp_location: location,
    whatsapp_url: url,
  }

  if (serviceName) {
    eventData.whatsapp_service = serviceName
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(eventData as unknown as Record<string, unknown>)
}

/**
 * Opens WhatsApp with a pre-filled message using the official API format
 * @param customMessage - Optional custom message to override the default
 */
export const openWhatsApp = (customMessage?: string): void => {
  const defaultMessage = 'Olá! Vim do site e quero orçamento para '
  const message = customMessage || defaultMessage
  const encodedMessage = encodeURIComponent(message)
  const url = `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`

  pushWhatsAppEvent('custom', url)
  trackLeadEvent()
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Opens WhatsApp for a specific service with dynamic message
 */
export const openWhatsAppForService = (serviceName: string): void => {
  const message = `Olá! Vim do site e quero orçamento para ${serviceName}`
  const encodedMessage = encodeURIComponent(message)
  const url = `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`

  pushWhatsAppEvent('service', url, serviceName)
  trackLeadEvent()
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Opens WhatsApp for scheduling a visit
 */
export const openWhatsAppForVisit = (): void => {
  const message = 'Olá! Vim do site e gostaria de agendar uma visita à loja'
  const encodedMessage = encodeURIComponent(message)
  const url = `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`

  pushWhatsAppEvent('visit', url)
  trackLeadEvent()
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Opens WhatsApp for general quote from hero section
 */
export const openWhatsAppForQuote = (): void => {
  const message = 'Olá! Vim do site e quero solicitar um orçamento grátis'
  const encodedMessage = encodeURIComponent(message)
  const url = `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`

  pushWhatsAppEvent('quote', url)
  trackLeadEvent()
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Opens WhatsApp with custom message
 */
export const openWhatsAppWithMessage = (message: string): void => {
  const encodedMessage = encodeURIComponent(message)
  const url = `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`

  pushWhatsAppEvent('custom', url)
  trackLeadEvent()
  window.open(url, '_blank', 'noopener,noreferrer')
}

// URL generators (return URLs without opening)
export const getWhatsAppQuoteUrl = (): string => {
  const message = 'Olá! Vim do site e quero solicitar um orçamento grátis'
  const encodedMessage = encodeURIComponent(message)
  return `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`
}

export const getWhatsAppServiceUrl = (serviceName: string): string => {
  const message = `Olá! Vim do site e quero orçamento para ${serviceName}`
  const encodedMessage = encodeURIComponent(message)
  return `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`
}

export const getWhatsAppVisitUrl = (): string => {
  const message = 'Olá! Vim do site e gostaria de agendar uma visita à loja'
  const encodedMessage = encodeURIComponent(message)
  return `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`
}

// Tracking-only functions (no window.open)
export const trackWhatsAppQuote = (): void => {
  const url = getWhatsAppQuoteUrl()
  pushWhatsAppEvent('quote', url)
  trackLeadEvent()
}

export const trackWhatsAppService = (serviceName: string): void => {
  const url = getWhatsAppServiceUrl(serviceName)
  pushWhatsAppEvent('service', url, serviceName)
  trackLeadEvent()
}

export const trackWhatsAppVisit = (): void => {
  const url = getWhatsAppVisitUrl()
  pushWhatsAppEvent('visit', url)
  trackLeadEvent()
}

// Legacy exports for backward compatibility
export const getServiceWhatsAppMessage = (serviceName: string): string => {
  return `Olá! Vim do site e quero orçamento para ${serviceName}`
}

export const getQuoteMessage = (): string => {
  return 'Olá! Vim do site e quero solicitar um orçamento grátis'
}

export const getDeviceQuoteMessage = (device: string, issue: string): string => {
  return `Olá! Vim do site. Meu ${device} está com problema: ${issue}. Gostaria de um orçamento`
}
