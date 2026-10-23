export interface IPhoneContactPopupConfig {
  formId: string
  integrationVerified: boolean
}

// Keep disabled until the published form AND its Google Sheets destination have
// been tested with an accepted submission. Never put an account token here.
export const IPHONE_CONTACT_POPUP: IPhoneContactPopupConfig = {
  formId: '4a4Yab',
  integrationVerified: true,
}
