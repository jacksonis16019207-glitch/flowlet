import { accountTypeLabels, type Account } from '../types/account'

type AccountListProps = {
  accounts: Account[]
  loading: boolean
  errorMessage: string
}

export function AccountList({
  accounts,
  loading,
  errorMessage,
}: AccountListProps) {
  if (errorMessage) {
    return <p className="status error">{errorMessage}</p>
  }

  if (loading) {
    return <p className="status">読み込み中...</p>
  }

  if (accounts.length === 0) {
    return (
      <p className="status">
        まだ口座マスタがありません。まずは `m_account` に 1 件登録してください。
      </p>
    )
  }

  return (
    <div className="account-list">
      {accounts.map((account) => (
        <article key={account.accountId} className="account-card">
          <div className="account-card-header">
            <span className={`badge ${account.active ? 'active' : 'inactive'}`}>
              {account.active ? 'ACTIVE' : 'INACTIVE'}
            </span>
            <span className="type-chip">
              {accountTypeLabels[account.accountType]}
            </span>
          </div>
          <h3>{account.accountName}</h3>
          <p>{account.bankName}</p>
          <time dateTime={account.createdAt}>
            登録日時: {new Date(account.createdAt).toLocaleString('ja-JP')}
          </time>
        </article>
      ))}
    </div>
  )
}
