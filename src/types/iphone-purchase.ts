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

export interface IPhoneTradeIn {
  modelId: string
  otherModel: string
  capacity: string
  color: string
  battery: string
  batteryUnknown: boolean
  screen: string
  back: string
  sides: string
  repairs: string
  repairParts: string[]
  repairOther: string
  faults: string[]
  faultOther: string
  liquid: string
  activation: string
  notes: string
}

export interface IPhonePurchaseDraft {
  version: 1
  selection: IPhoneSelection
  preferredColorIds: string[]
  payment: string
  paymentDetail: string
  timing: string
  tradeChoice: '' | 'no' | 'yes'
  trade: IPhoneTradeIn
}

export type IPhoneScreen = 'product' | 'payment' | 'timing' | 'trade' | 'device' | 'condition' | 'history' | 'review'
