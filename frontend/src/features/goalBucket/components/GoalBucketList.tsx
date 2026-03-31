import type { Account } from '../../account/types/account'
import type { GoalBucket } from '../types/goalBucket'

type GoalBucketListProps = {
  goalBuckets: GoalBucket[]
  accounts: Account[]
  loading: boolean
  errorMessage: string
}

export function GoalBucketList({
  goalBuckets,
  accounts,
  loading,
  errorMessage,
}: GoalBucketListProps) {
  if (errorMessage) {
    return <p className="status error">{errorMessage}</p>
  }

  if (loading) {
    return <p className="status">読み込み中...</p>
  }

  if (goalBuckets.length === 0) {
    return (
      <p className="status">
        目的別口座はまだありません。フォームから最初の `m_goal_bucket` を登録してください。
      </p>
    )
  }

  return (
    <div className="account-list">
      {goalBuckets.map((goalBucket) => {
        const account = accounts.find(
          (candidate) => candidate.accountId === goalBucket.accountId,
        )

        return (
          <article key={goalBucket.goalBucketId} className="account-card">
            <div className="account-card-header">
              <span
                className={`badge ${goalBucket.active ? 'active' : 'inactive'}`}
              >
                {goalBucket.active ? '利用中' : '停止中'}
              </span>
              <span className="type-chip">口座ID #{goalBucket.accountId}</span>
            </div>
            <h3>{goalBucket.bucketName}</h3>
            <p>
              {account
                ? `${account.providerName} / ${account.accountName}`
                : '親口座不明'}
            </p>
            <p>残高 {formatMoney(goalBucket.currentBalance)}</p>
            <time dateTime={goalBucket.createdAt}>
              登録日時 {new Date(goalBucket.createdAt).toLocaleString('ja-JP')}
            </time>
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
