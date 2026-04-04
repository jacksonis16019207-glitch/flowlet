import type { AccountCategory, BalanceSide } from '../../account/types/account'

export type DashboardAccountBalanceSummary = {
  accountId: number
  providerName: string
  accountName: string
  accountCategory: AccountCategory
  balanceSide: BalanceSide
  currentBalance: string
  unallocatedBalance: string
}

export type DashboardGoalBucketBalanceSummary = {
  goalBucketId: number
  accountId: number
  bucketName: string
  currentBalance: string
}

export type DashboardTotals = {
  accountCurrentBalance: string
  goalBucketCurrentBalance: string
  unallocatedBalance: string
}

export type DashboardBalanceSummary = {
  accounts: DashboardAccountBalanceSummary[]
  goalBuckets: DashboardGoalBucketBalanceSummary[]
  totals: DashboardTotals
}

export type DashboardMonthlyCashflowMonth = {
  month: string
  income: string
  expense: string
  net: string
}

export type DashboardMonthlyCashflowTotals = {
  income: string
  expense: string
  net: string
}

export type DashboardMonthlyCashflow = {
  fromMonth: string
  toMonth: string
  months: DashboardMonthlyCashflowMonth[]
  totals: DashboardMonthlyCashflowTotals
}
