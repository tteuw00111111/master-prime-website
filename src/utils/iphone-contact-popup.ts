import type { IPhoneContactPopupConfig } from '@/data/iphone-contact-popup'

export const IPHONE_POPUP_VISIBLE_MS = 7000

export function getIPhoneContactEmbedUrl(config: IPhoneContactPopupConfig): string | null {
  if (config.integrationVerified !== true || !/^[a-zA-Z0-9]{6,32}$/.test(config.formId)) return null
  // Deliberately do not read location, attribution, draft or submitted fields.
  return `https://tally.so/embed/${config.formId}?origin=site_iphone_popup`
}
