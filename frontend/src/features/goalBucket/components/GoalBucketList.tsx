import type { Account } from '../../account/types/account'
import type { GoalBucket } from '../types/goalBucket'

type GoalBucketListProps = {
  goalBuckets: GoalBucket[]
  accounts: Account[]
  loading: boolean
  errorMessage: string
  deletingGoalBucketId?: number | null
  selectedGoalBucketId?: number | null
  onSelectDetail?: (goalBucket: GoalBucket) => void
  onEdit?: (goalBucket: GoalBucket) => void
  onDelete?: (goalBucket: GoalBucket) => void
}

type GoalBucketGroup = {
  groupKey: string
  title: string
  description: string
  goalBuckets: GoalBucket[]
}

export function GoalBucketList({
  goalBuckets,
  accounts,
  loading,
  errorMessage,
  deletingGoalBucketId,
  selectedGoalBucketId,
  onSelectDetail,
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

  const groups = buildGoalBucketGroups(goalBuckets, accounts)

  return (
    <div className="account-section-stack">
      {groups.map((group) => (
        <section key={group.groupKey} className="goal-bucket-group">
          <div className="goal-bucket-group-header">
            <div>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>
            <div className="goal-bucket-group-metrics">
              <span>{group.goalBuckets.length} 件</span>
              <span>
                合計 {formatMoney(sumBalance(group.goalBuckets.map((goalBucket) => goalBucket.currentBalance)))}
              </span>
            </div>
          </div>

          <div className="account-list">
            {group.goalBuckets.map((goalBucket) => {
              const account = accounts.find(
                (candidate) => candidate.accountId === goalBucket.accountId,
              )

              return (
                <article
                  key={goalBucket.goalBucketId}
                  className={`account-card ${
                    selectedGoalBucketId === goalBucket.goalBucketId ? 'selected' : ''
                  }`}
                >
                  <div className="account-card-header">
                    <span
                      className={`badge ${goalBucket.active ? 'active' : 'inactive'}`}
                    >
                      {goalBucket.active ? '有効' : '停止'}
                    </span>
                    <span className="type-chip">GoalBucket #{goalBucket.goalBucketId}</span>
                  </div>
                  <h3>{goalBucket.bucketName}</h3>
                  <p>{formatAccountName(account, goalBucket.accountId)}</p>
                  <p className="goal-bucket-linked-summary">
                    残高 {formatMoney(goalBucket.currentBalance)}
                  </p>
                  <div className="goal-bucket-action-row">
                    <button
                      type="button"
                      className="action-button"
                      onClick={() => onSelectDetail?.(goalBucket)}
                    >
                      {selectedGoalBucketId === goalBucket.goalBucketId
                        ? '詳細を表示中'
                        : '詳細を見る'}
                    </button>
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
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function buildGoalBucketGroups(
  goalBuckets: GoalBucket[],
  accounts: Account[],
): GoalBucketGroup[] {
  const accountGroups = accounts
    .map((account) => ({
      groupKey: `account-${account.accountId}`,
      title: `${account.providerName} / ${account.accountName}`,
      description: `口座残高 ${formatMoney(account.currentBalance)} / 未配分 ${formatMoney(account.unallocatedBalance)}`,
      goalBuckets: goalBuckets
        .filter((goalBucket) => goalBucket.accountId === account.accountId)
        .sort(compareGoalBuckets),
    }))
    .filter((group) => group.goalBuckets.length > 0)

  const linkedAccountIds = new Set(accounts.map((account) => account.accountId))
  const unlinkedGoalBuckets = goalBuckets
    .filter((goalBucket) => !linkedAccountIds.has(goalBucket.accountId))
    .sort(compareGoalBuckets)

  if (unlinkedGoalBuckets.length === 0) {
    return accountGroups
  }

  return [
    ...accountGroups,
    {
      groupKey: 'unlinked',
      title: '親口座不明',
      description: '紐づく銀行口座の情報が取得できなかった目的別口座です。',
      goalBuckets: unlinkedGoalBuckets,
    },
  ]
}

function compareGoalBuckets(left: GoalBucket, right: GoalBucket) {
  return (
    Number(right.currentBalance) - Number(left.currentBalance) ||
    left.bucketName.localeCompare(right.bucketName, 'ja')
  )
}

function formatAccountName(account: Account | undefined, fallbackAccountId: number) {
  if (account == null) {
    return `口座ID #${fallbackAccountId}`
  }

  return `${account.providerName} / ${account.accountName}`
}

function sumBalance(values: string[]) {
  return values.reduce((total, value) => total + Number(value), 0)
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}
