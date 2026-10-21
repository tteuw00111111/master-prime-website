export interface IPhoneVariant {
  id: string
  model: string
  modelId: string
  capacity: number
  condition: 'sealed' | 'used'
  colorId: string
  color: string
  cashCents: number
  installmentCents: number
  availability: 'consult' | 'unavailable'
}

export interface IPhoneSelection {
  modelId: string
  capacity: number
  condition: IPhoneVariant['condition']
  colorId: string
}

/** Journey v2 retains only choices collected by the three-step form. */
export interface IPhonePurchaseDraft {
  version: 2
  selection: IPhoneSelection
  preferredColorIds: string[]
  payment: string
  paymentDetail: string
}

export type IPhoneScreen = 'product' | 'payment' | 'review'
