export type AccountType = 'CHECKING' | 'SAVINGS' | 'OTHER'

export type Account = {
  accountId: number
  bankName: string
  accountName: string
  accountType: AccountType
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateAccountInput = {
  bankName: string
  accountName: string
  accountType: AccountType
  active: boolean
}

export const accountTypeLabels: Record<AccountType, string> = {
  CHECKING: '普通預金',
  SAVINGS: '貯蓄預金',
  OTHER: 'その他',
}
