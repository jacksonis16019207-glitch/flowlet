import type { DashboardMonthlyCashflow } from '../types/dashboard'

type DashboardMonthlyCashflowListProps = {
  cashflow: DashboardMonthlyCashflow
}

export function DashboardMonthlyCashflowList({
  cashflow,
}: DashboardMonthlyCashflowListProps) {
  return (
    <div className="dashboard-cashflow-list">
      <article className="account-card dashboard-cashflow-card">
        <div className="account-card-header">
          <span className="type-chip">{formatMonth(cashflow.targetMonth)}</span>
          <span className={`badge ${Number(cashflow.net) >= 0 ? 'active' : 'inactive'}`}>
            差額 {formatMoney(cashflow.net)}
          </span>
        </div>
        <p className="account-meta-note">
          {formatDate(cashflow.periodStartDate)} から {formatDate(cashflow.periodEndDate)}
        </p>
        <dl className="balance-pairs">
          <div>
            <dt>収入</dt>
            <dd>{formatMoney(cashflow.income)}</dd>
          </div>
          <div>
            <dt>支出</dt>
            <dd>{formatMoney(cashflow.expense)}</dd>
          </div>
        </dl>
      </article>
    </div>
  )
}

function formatMonth(value: string) {
  const [year, month] = value.split('-')
  return `${year}年${Number(month)}月`
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}
