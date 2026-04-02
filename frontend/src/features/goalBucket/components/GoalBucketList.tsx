import type { Account } from '../../account/types/account'
import type { GoalBucket } from '../types/goalBucket'

type GoalBucketListProps = {
  goalBuckets: GoalBucket[]
  accounts: Account[]
  loading: boolean
  errorMessage: string
  deletingGoalBucketId?: number | null
  onEdit?: (goalBucket: GoalBucket) => void
  onDelete?: (goalBucket: GoalBucket) => void
}

export function GoalBucketList({
  goalBuckets,
  accounts,
  loading,
  errorMessage,
  deletingGoalBucketId,
  onEdit,
  onDelete,
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
                {goalBucket.active ? '有効' : '停止'}
              </span>
              <span className="type-chip">口座ID #{goalBucket.accountId}</span>
            </div>
            <h3>{goalBucket.bucketName}</h3>
            <p>
              {account
                ? `${account.providerName} / ${account.accountName}`
                : '親口座なし'}
            </p>
            <p>残高 {formatMoney(goalBucket.currentBalance)}</p>
            <div className="category-actions">
              <button
                type="button"
                className="action-button"
                onClick={() => onEdit?.(goalBucket)}
              >
                編集
              </button>
              <button
                type="button"
                className="action-button danger"
                disabled={deletingGoalBucketId === goalBucket.goalBucketId}
                onClick={() => onDelete?.(goalBucket)}
              >
                {deletingGoalBucketId === goalBucket.goalBucketId
                  ? '削除中...'
                  : '削除'}
              </button>
            </div>
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
