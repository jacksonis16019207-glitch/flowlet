import type { PaymentDateAdjustmentRule } from '../../account/types/account'

export type AppSetting = {
  monthStartDay: number
  monthStartAdjustmentRule: PaymentDateAdjustmentRule
  updatedAt: string
}

export type UpdateAppSettingInput = {
  monthStartDay: number
  monthStartAdjustmentRule: PaymentDateAdjustmentRule
}
