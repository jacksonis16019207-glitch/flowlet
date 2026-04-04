import { requestJson } from '../../../shared/lib/api/client'
import type { DashboardBalanceSummary } from '../types/dashboard'

export function fetchDashboardBalanceSummary(): Promise<DashboardBalanceSummary> {
  return requestJson<DashboardBalanceSummary>('/api/dashboard/balance-summary')
}
