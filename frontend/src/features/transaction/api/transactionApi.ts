import { requestJson } from '../../../shared/lib/api/client'
import type {
  CreateGoalBucketAllocationsInput,
  CreateTransactionInput,
  CreateTransferInput,
  DeleteGoalBucketAllocationResponse,
  DeleteTransactionResponse,
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

export function updateTransaction(
  transactionId: number,
  input: CreateTransactionInput,
): Promise<Transaction> {
  return requestJson<Transaction>(`/api/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteTransaction(
  transactionId: number,
): Promise<DeleteTransactionResponse> {
  return requestJson<DeleteTransactionResponse>(`/api/transactions/${transactionId}`, {
    method: 'DELETE',
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

export function updateTransfer(
  transferGroupId: string,
  input: CreateTransferInput,
): Promise<TransferResponse> {
  return requestJson<TransferResponse>(`/api/transfers/${transferGroupId}`, {
    method: 'PUT',
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

export function updateGoalBucketAllocation(
  allocationId: number,
  input: CreateGoalBucketAllocationsInput,
): Promise<GoalBucketAllocation> {
  return requestJson<GoalBucketAllocation>(
    `/api/goal-bucket-allocations/${allocationId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export function deleteGoalBucketAllocation(
  allocationId: number,
): Promise<DeleteGoalBucketAllocationResponse> {
  return requestJson<DeleteGoalBucketAllocationResponse>(
    `/api/goal-bucket-allocations/${allocationId}`,
    {
      method: 'DELETE',
    },
  )
}
