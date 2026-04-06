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
  targetMonth: string,
): Promise<DashboardMonthlyCashflow> {
  const searchParams = new URLSearchParams({ targetMonth })

  return requestJson<DashboardMonthlyCashflow>(
    `/api/dashboard/monthly-cashflow?${searchParams.toString()}`,
  )
}

export function fetchDashboardCategoryCashflow(
  targetMonth: string,
): Promise<DashboardCategoryCashflow> {
  const searchParams = new URLSearchParams({ targetMonth })

  return requestJson<DashboardCategoryCashflow>(
    `/api/dashboard/category-cashflow?${searchParams.toString()}`,
  )
}
