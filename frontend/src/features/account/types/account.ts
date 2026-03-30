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
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  OTHER: 'Other',
}
