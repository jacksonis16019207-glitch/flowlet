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

export type DashboardMonthlyCashflow = {
  targetMonth: string
  periodStartDate: string
  periodEndDate: string
  income: string
  expense: string
  net: string
}

export type DashboardCategoryCashflowCategory = {
  categoryId: number
  categoryName: string
  amount: string
}

export type DashboardCategoryCashflowTotals = {
  income: string
  expense: string
}

export type DashboardCategoryCashflow = {
  targetMonth: string
  periodStartDate: string
  periodEndDate: string
  incomeCategories: DashboardCategoryCashflowCategory[]
  expenseCategories: DashboardCategoryCashflowCategory[]
  totals: DashboardCategoryCashflowTotals
}
