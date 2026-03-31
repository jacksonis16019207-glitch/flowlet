import { requestJson } from '../../../shared/lib/api/client'
import type { Account, CreateAccountInput } from '../types/account'

type FetchAccountsParams = {
  activeOnly?: boolean
  accountCategory?: string
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
