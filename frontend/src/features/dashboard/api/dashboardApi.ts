import { requestJson } from '../../../shared/lib/api/client'
import type {
  DashboardBalanceSummary,
  DashboardCategoryCashflow,
  DashboardMonthlyCashflow,
} from '../types/dashboard'

export function fetchDashboardBalanceSummary(): Promise<DashboardBalanceSummary> {
  return requestJson<DashboardBalanceSummary>('/api/dashboard/balance-summary')
}

export function fetchDashboardMonthlyCashflow(
  targetMonth?: string,
): Promise<DashboardMonthlyCashflow> {
  const searchParams = new URLSearchParams()
  if (targetMonth) {
    searchParams.set('targetMonth', targetMonth)
  }

  const path = searchParams.size
    ? `/api/dashboard/monthly-cashflow?${searchParams.toString()}`
    : '/api/dashboard/monthly-cashflow'

  return requestJson<DashboardMonthlyCashflow>(path)
}

export function fetchDashboardCategoryCashflow(
  targetMonth?: string,
): Promise<DashboardCategoryCashflow> {
  const searchParams = new URLSearchParams()
  if (targetMonth) {
    searchParams.set('targetMonth', targetMonth)
  }

  const path = searchParams.size
    ? `/api/dashboard/category-cashflow?${searchParams.toString()}`
    : '/api/dashboard/category-cashflow'

  return requestJson<DashboardCategoryCashflow>(path)
}
