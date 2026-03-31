export type AccountCategory =
  | 'BANK'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'EWALLET'
  | 'OTHER'

export type BalanceSide = 'ASSET' | 'LIABILITY'

export type PaymentDateAdjustmentRule =
  | 'NONE'
  | 'NEXT_BUSINESS_DAY'
  | 'PREVIOUS_BUSINESS_DAY'

export type CreditCardProfile = {
  paymentAccountId: number
  closingDay: number
  paymentDay: number
  paymentDateAdjustmentRule: PaymentDateAdjustmentRule
  createdAt?: string
  updatedAt?: string
}

export type Account = {
  accountId: number
  providerName: string
  accountName: string
  accountCategory: AccountCategory
  balanceSide: BalanceSide
  active: boolean
  displayOrder: number
  currentBalance: string
  unallocatedBalance: string
  creditCardProfile: CreditCardProfile | null
  createdAt: string
  updatedAt: string
}

export type CreateAccountInput = {
  providerName: string
  accountName: string
  accountCategory: AccountCategory
  balanceSide: BalanceSide
  active: boolean
  displayOrder: number
  creditCardProfile: CreditCardProfile | null
}

export const accountCategoryLabels: Record<AccountCategory, string> = {
  BANK: '銀行口座',
  CREDIT_CARD: 'クレジットカード',
  CASH: '現金',
  EWALLET: '電子マネー',
  OTHER: 'その他',
}

export const balanceSideLabels: Record<BalanceSide, string> = {
  ASSET: '資産',
  LIABILITY: '負債',
}

export const paymentDateAdjustmentRuleLabels: Record<
  PaymentDateAdjustmentRule,
  string
> = {
  NONE: '補正なし',
  NEXT_BUSINESS_DAY: '翌営業日',
  PREVIOUS_BUSINESS_DAY: '前営業日',
}
