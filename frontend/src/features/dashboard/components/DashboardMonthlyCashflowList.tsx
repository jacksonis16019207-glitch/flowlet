import type { DashboardMonthlyCashflow } from '../types/dashboard'

type DashboardMonthlyCashflowListProps = {
  cashflow: DashboardMonthlyCashflow
}

export function DashboardMonthlyCashflowList({
  cashflow,
}: DashboardMonthlyCashflowListProps) {
  const incomeAmount = Math.max(Number(cashflow.income), 0)
  const expenseAmount = Math.max(Number(cashflow.expense), 0)
  const maxAmount = Math.max(incomeAmount, expenseAmount, 1)
  const incomeRatio = (incomeAmount / maxAmount) * 100
  const expenseRatio = (expenseAmount / maxAmount) * 100

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
        <div className="dashboard-mini-chart" aria-label="収入と支出の比較グラフ">
          <div className="dashboard-mini-chart-row">
            <div className="dashboard-mini-chart-label">
              <span>収入</span>
              <strong>{formatMoney(cashflow.income)}</strong>
            </div>
            <div className="dashboard-mini-chart-track">
              <div
                className="dashboard-mini-chart-fill income"
                style={{ width: `${incomeRatio}%` }}
              />
            </div>
          </div>
          <div className="dashboard-mini-chart-row">
            <div className="dashboard-mini-chart-label">
              <span>支出</span>
              <strong>{formatMoney(cashflow.expense)}</strong>
            </div>
            <div className="dashboard-mini-chart-track">
              <div
                className="dashboard-mini-chart-fill expense"
                style={{ width: `${expenseRatio}%` }}
              />
            </div>
          </div>
        </div>
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
