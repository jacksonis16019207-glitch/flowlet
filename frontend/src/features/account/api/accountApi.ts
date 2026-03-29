import { requestJson } from '../../../shared/lib/api/client'
import type { Account, CreateAccountInput } from '../types/account'

export function fetchAccounts(): Promise<Account[]> {
  return requestJson<Account[]>('/api/accounts')
}

export function createAccount(input: CreateAccountInput): Promise<Account> {
  return requestJson<Account>('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
