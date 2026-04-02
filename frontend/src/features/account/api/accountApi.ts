import { requestJson } from '../../../shared/lib/api/client'
import type { Account, CreateAccountInput } from '../types/account'

type FetchAccountsParams = {
  activeOnly?: boolean
  accountCategory?: string
}

export type DeleteAccountResponse = {
  accountId: number
  action: 'DEACTIVATED' | 'DELETED'
  active: boolean
}

export function fetchAccounts(params?: FetchAccountsParams): Promise<Account[]> {
  const searchParams = new URLSearchParams()

  if (params?.activeOnly) {
    searchParams.set('activeOnly', 'true')
  }

  if (params?.accountCategory) {
    searchParams.set('accountCategory', params.accountCategory)
  }

  const query = searchParams.toString()
  return requestJson<Account[]>(`/api/accounts${query ? `?${query}` : ''}`)
}

export function createAccount(input: CreateAccountInput): Promise<Account> {
  return requestJson<Account>('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateAccount(
  accountId: number,
  input: CreateAccountInput,
): Promise<Account> {
  return requestJson<Account>(`/api/accounts/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteAccount(accountId: number): Promise<DeleteAccountResponse> {
  return requestJson<DeleteAccountResponse>(`/api/accounts/${accountId}`, {
    method: 'DELETE',
  })
}
