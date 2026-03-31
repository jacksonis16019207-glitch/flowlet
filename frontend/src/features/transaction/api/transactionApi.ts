import { requestJson } from '../../../shared/lib/api/client'
import type {
  CreateGoalBucketAllocationsInput,
  CreateTransactionInput,
  CreateTransferInput,
  GoalBucketAllocation,
  Transaction,
  TransferResponse,
} from '../types/transaction'

export function fetchTransactions(): Promise<Transaction[]> {
  return requestJson<Transaction[]>('/api/transactions')
}

export function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  return requestJson<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function createTransfer(
  input: CreateTransferInput,
): Promise<TransferResponse> {
  return requestJson<TransferResponse>('/api/transfers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchGoalBucketAllocations(
  accountId?: number,
): Promise<GoalBucketAllocation[]> {
  const query = accountId ? `?accountId=${accountId}` : ''
  return requestJson<GoalBucketAllocation[]>(
    `/api/goal-bucket-allocations${query}`,
  )
}

export function createGoalBucketAllocations(
  input: CreateGoalBucketAllocationsInput,
): Promise<unknown> {
  return requestJson('/api/goal-bucket-allocations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
