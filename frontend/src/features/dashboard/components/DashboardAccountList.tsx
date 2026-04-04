import {
  accountCategoryLabels,
  balanceSideLabels,
} from '../../account/types/account'
import type { DashboardAccountBalanceSummary } from '../types/dashboard'

type DashboardAccountListProps = {
  accounts: DashboardAccountBalanceSummary[]
}

export function DashboardAccountList({
  accounts,
}: DashboardAccountListProps) {
  if (accounts.length === 0) {
    return <p className="status">表示できる口座がまだありません。</p>
  }

  return (
    <div className="account-list dashboard-card-list">
      {accounts.map((account) => (
        <article key={account.accountId} className="account-card dashboard-card">
          <div className="account-card-header">
            <span className="type-chip">
              {accountCategoryLabels[account.accountCategory]}
            </span>
            <span className="badge active">
              {balanceSideLabels[account.balanceSide]}
            </span>
          </div>
          <h3>{account.accountName}</h3>
          <p>{account.providerName}</p>
          <dl className="balance-pairs">
            <div>
              <dt>現在残高</dt>
              <dd>{formatMoney(account.currentBalance)}</dd>
            </div>
            <div>
              <dt>未配分残高</dt>
              <dd>{formatMoney(account.unallocatedBalance)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}
