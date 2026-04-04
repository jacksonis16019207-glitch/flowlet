import type { DashboardAccountBalanceSummary, DashboardGoalBucketBalanceSummary } from '../types/dashboard'

type DashboardGoalBucketListProps = {
  goalBuckets: DashboardGoalBucketBalanceSummary[]
  accounts: DashboardAccountBalanceSummary[]
}

export function DashboardGoalBucketList({
  goalBuckets,
  accounts,
}: DashboardGoalBucketListProps) {
  if (goalBuckets.length === 0) {
    return <p className="status">表示できる目的別口座がまだありません。</p>
  }

  return (
    <div className="account-list dashboard-card-list">
      {goalBuckets.map((goalBucket) => {
        const account = accounts.find(
          (currentAccount) => currentAccount.accountId === goalBucket.accountId,
        )

        return (
          <article
            key={goalBucket.goalBucketId}
            className="account-card dashboard-card"
          >
            <div className="account-card-header">
              <span className="type-chip">GoalBucket</span>
              <span className="badge active">
                {formatMoney(goalBucket.currentBalance)}
              </span>
            </div>
            <h3>{goalBucket.bucketName}</h3>
            <p>
              {account == null
                ? '親口座なし'
                : `${account.providerName} / ${account.accountName}`}
            </p>
          </article>
        )
      })}
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
