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
    return <p className="status">Loading...</p>
  }

  if (goalBuckets.length === 0) {
    return (
      <p className="status">
        No goal buckets yet. Create the first `m_goal_bucket` entry from the form.
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
                {goalBucket.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <span className="type-chip">Account #{goalBucket.accountId}</span>
            </div>
            <h3>{goalBucket.bucketName}</h3>
            <p>{account ? `${account.bankName} / ${account.accountName}` : 'Unknown account'}</p>
            <time dateTime={goalBucket.createdAt}>
              Created at {new Date(goalBucket.createdAt).toLocaleString('ja-JP')}
            </time>
          </article>
        )
      })}
    </div>
  )
}
