import { IPHONE_PURCHASE_PATH, IPHONE_VARIANTS } from '@/data/iphone-purchase'
import type { IPhoneVariant } from '@/types/iphone-purchase'
import { cleanIPhoneAttribution } from './iphone-purchase-tracking'

export const isIPhoneQuoteEntry = (search: string) => {
  const params = new URLSearchParams(search)
  return params.has('model') || params.get('view') === 'quote'
}

// URL navigation only: fbclid never joins the custom event payload or storage.
// Keep this click-ID rule identical to the pre-Pixel sanitizer in index.html.
export const getIPhoneNavigationAttribution = (search: string) => {
  const incoming = new URLSearchParams(search)
  const safe = new URLSearchParams(cleanIPhoneAttribution(incoming))
  const fbclid = incoming.get('fbclid')
  if (fbclid && /^[A-Za-z0-9_-]+$/.test(fbclid)) safe.set('fbclid', fbclid)
  return safe
}

export const getIPhoneCatalogLink = (variant: IPhoneVariant, search = '') => `${IPHONE_PURCHASE_PATH}?${new URLSearchParams({ model: variant.modelId, capacity: String(variant.capacity), condition: variant.condition, ...Object.fromEntries(getIPhoneNavigationAttribution(search)) })}`

export const getIPhoneCatalogHomeLink = (search: string) => {
  const query = getIPhoneNavigationAttribution(search).toString()
  return `${IPHONE_PURCHASE_PATH}${query ? `?${query}` : ''}`
}

// Unavailable variants never contribute a starting price or a selectable option.
export const getIPhoneCatalogGroups = (catalog: readonly IPhoneVariant[] = IPHONE_VARIANTS) =>
  [...new Set(catalog.map(variant => `${variant.modelId}:${variant.condition}`))].flatMap(key => {
    const variants = catalog.filter(variant => `${variant.modelId}:${variant.condition}` === key && variant.availability !== 'unavailable')
    return variants.length ? [{ ...variants[0], variants, cheapest: variants.reduce((min, variant) => variant.cashCents < min.cashCents ? variant : min) }] : []
  })
