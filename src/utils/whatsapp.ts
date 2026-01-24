import { trackLeadEvent } from './metaTracking'

const WHATSAPP_PHONE = '5521967635340'
const WHATSAPP_API_BASE = 'https://api.whatsapp.com/send/'

/**
 * Opens WhatsApp with a pre-filled message using the official API format
 * @param customMessage - Optional custom message to override the default
 */
export const openWhatsApp = (customMessage?: string): void => {
  const defaultMessage = 'Olá! Vim do site e quero orçamento para '
  const message = customMessage || defaultMessage
  const encodedMessage = encodeURIComponent(message)
  const url = `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`

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

  trackLeadEvent()
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Opens WhatsApp with custom message
 */
export const openWhatsAppWithMessage = (message: string): void => {
  const encodedMessage = encodeURIComponent(message)
  const url = `${WHATSAPP_API_BASE}?phone=${WHATSAPP_PHONE}&text=${encodedMessage}&type=phone_number&app_absent=0`

  trackLeadEvent()
  window.open(url, '_blank', 'noopener,noreferrer')
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
