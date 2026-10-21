import { IPHONE_PURCHASE_PATH, IPHONE_VARIANTS } from '@/data/iphone-purchase'
import type { IPhoneVariant } from '@/types/iphone-purchase'

export const isIPhoneQuoteEntry = (search: string) => {
  const params = new URLSearchParams(search)
  return params.has('model') || params.get('view') === 'quote'
}

export const getIPhoneCatalogLink = (variant: IPhoneVariant) => `${IPHONE_PURCHASE_PATH}?${new URLSearchParams({ model: variant.modelId, capacity: String(variant.capacity), condition: variant.condition })}`

// Unavailable variants never contribute a starting price or a selectable option.
export const getIPhoneCatalogGroups = (catalog: readonly IPhoneVariant[] = IPHONE_VARIANTS) =>
  [...new Set(catalog.map(variant => `${variant.modelId}:${variant.condition}`))].flatMap(key => {
    const variants = catalog.filter(variant => `${variant.modelId}:${variant.condition}` === key && variant.availability !== 'unavailable')
    return variants.length ? [{ ...variants[0], variants, cheapest: variants.reduce((min, variant) => variant.cashCents < min.cashCents ? variant : min) }] : []
  })
