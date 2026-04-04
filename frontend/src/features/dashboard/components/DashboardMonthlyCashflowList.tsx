import type { DashboardMonthlyCashflow } from '../types/dashboard'

type DashboardMonthlyCashflowListProps = {
  cashflow: DashboardMonthlyCashflow
}

export function DashboardMonthlyCashflowList({
  cashflow,
}: DashboardMonthlyCashflowListProps) {
  if (cashflow.months.length === 0) {
    return <p className="status">表示できる月次収支データがまだありません。</p>
  }

  return (
    <div className="dashboard-cashflow-list">
      {cashflow.months.map((month) => (
        <article key={month.month} className="account-card dashboard-cashflow-card">
          <div className="account-card-header">
            <span className="type-chip">{formatMonth(month.month)}</span>
            <span className={`badge ${Number(month.net) >= 0 ? 'active' : 'inactive'}`}>
              差額 {formatMoney(month.net)}
            </span>
          </div>
          <dl className="balance-pairs">
            <div>
              <dt>収入</dt>
              <dd>{formatMoney(month.income)}</dd>
            </div>
            <div>
              <dt>支出</dt>
              <dd>{formatMoney(month.expense)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
}

function formatMonth(value: string) {
  const [year, month] = value.split('-')
  return `${year}年${Number(month)}月`
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}
