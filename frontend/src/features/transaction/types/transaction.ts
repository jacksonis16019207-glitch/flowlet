import type { CategoryType } from '../../category/types/category'

export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'

export type CashflowTreatment = 'AUTO' | 'IGNORE' | 'INCOME' | 'EXPENSE'

export type Transaction = {
  transactionId: number
  accountId: number
  accountName: string | null
  goalBucketId: number | null
  goalBucketName: string | null
  categoryId: number
  categoryName: string | null
  subcategoryId: number | null
  subcategoryName: string | null
  transactionType: TransactionType
  cashflowTreatment: CashflowTreatment
  transactionDate: string
  amount: string
  description: string
  note: string | null
  transferGroupId: string | null
  createdAt: string
  updatedAt: string
}

export type GoalBucketAllocation = {
  allocationId: number
  accountId: number
  fromGoalBucketId: number | null
  fromGoalBucketName: string | null
  toGoalBucketId: number | null
  toGoalBucketName: string | null
  allocationDate: string
  amount: string
  description: string
  note: string | null
  linkedTransferGroupId: string | null
  createdAt: string
  updatedAt: string
}

export type CreateTransactionInput = {
  accountId: number
  goalBucketId: number | null
  categoryId: number
  subcategoryId: number | null
  transactionType: Extract<TransactionType, 'INCOME' | 'EXPENSE'>
  cashflowTreatment: CashflowTreatment
  transactionDate: string
  amount: string
  description: string
  note: string
}

export type CreateTransferInput = {
  fromAccountId: number
  toAccountId: number
  fromGoalBucketId: number | null
  categoryId: number
  subcategoryId: number | null
  transactionDate: string
  outgoingCashflowTreatment: CashflowTreatment
  incomingCashflowTreatment: CashflowTreatment
  amount: string
  description: string
  note: string
}

export type AllocationDraft = {
  toGoalBucketId: number
  value: string
}

export type CreateGoalBucketAllocationsInput = {
  accountId: number
  fromGoalBucketId: number | null
  allocationDate: string
  description: string
  note: string
  linkedTransferGroupId?: string
  allocations: {
    toGoalBucketId: number
    amount: string
  }[]
}

export type TransferResponse = {
  transferGroupId: string
  transactionDate: string
  amount: string
  outgoingTransaction: Transaction
  incomingTransaction: Transaction
}

export type DeleteTransactionResponse = {
  transactionId: number
  action: 'DELETED' | 'DELETED_TRANSFER_GROUP'
  transferGroupId: string | null
  deletedTransactionIds: number[]
  deletedAllocationIds: number[]
}

export type DeleteGoalBucketAllocationResponse = {
  allocationId: number
  action: 'DELETED'
}

export const transactionTypeCategoryMap: Record<
  CreateTransactionInput['transactionType'] | 'TRANSFER',
  CategoryType
> = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER: 'TRANSFER',
}
