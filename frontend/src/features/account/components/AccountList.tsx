import {
  accountCategoryLabels,
  balanceSideLabels,
  type Account,
} from '../types/account'

type AccountListProps = {
  accounts: Account[]
  loading: boolean
  errorMessage: string
  deletingAccountId?: number | null
  onEdit?: (account: Account) => void
  onDelete?: (account: Account) => void
}

export function AccountList({
  accounts,
  loading,
  errorMessage,
  deletingAccountId,
  onEdit,
  onDelete,
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
        口座はまだありません。フォームから最初の `m_account` を登録してください。
      </p>
    )
  }

  return (
    <div className="account-list">
      {accounts.map((account) => (
        <article key={account.accountId} className="account-card">
          <div className="account-card-header">
            <span className={`badge ${account.active ? 'active' : 'inactive'}`}>
              {account.active ? '有効' : '停止'}
            </span>
            <span className="type-chip">
              {accountCategoryLabels[account.accountCategory]}
            </span>
          </div>
          <h3>{account.accountName}</h3>
          <p>{account.providerName}</p>
          <p>
            {balanceSideLabels[account.balanceSide]} / 表示順 {account.displayOrder}
          </p>
          <p>初期残高 {formatMoney(account.initialBalance)}</p>
          <p>
            残高 {formatMoney(account.currentBalance)} / 未配分{' '}
            {formatMoney(account.unallocatedBalance)}
          </p>
          {account.creditCardProfile ? (
            <p>
              支払口座ID #{account.creditCardProfile.paymentAccountId} / 締め日{' '}
              {account.creditCardProfile.closingDay} / 支払日{' '}
              {account.creditCardProfile.paymentDay}
            </p>
          ) : null}
          <div className="category-actions">
            <button
              type="button"
              className="action-button"
              onClick={() => onEdit?.(account)}
            >
              編集
            </button>
            <button
              type="button"
              className="action-button danger"
              disabled={deletingAccountId === account.accountId}
              onClick={() => onDelete?.(account)}
            >
              {deletingAccountId === account.accountId ? '削除中...' : '削除'}
            </button>
          </div>
          <time dateTime={account.createdAt}>
            登録日時 {new Date(account.createdAt).toLocaleString('ja-JP')}
          </time>
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
