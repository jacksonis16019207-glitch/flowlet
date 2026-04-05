import {
  accountCategoryLabels,
  paymentDateAdjustmentRuleLabels,
  type Account,
  type PaymentDateAdjustmentRule,
} from '../types/account'

type AccountListVariant = 'operational' | 'creditCard'

type AccountListProps = {
  title: string
  description: string
  variant: AccountListVariant
  accounts: Account[]
  allAccounts: Account[]
  emptyMessage: string
  deletingAccountId?: number | null
  selectedAccountId?: number | null
  onSelectDetail?: (account: Account) => void
  onEdit?: (account: Account) => void
  onDelete?: (account: Account) => void
}

export function AccountList({
  title,
  description,
  variant,
  accounts,
  allAccounts,
  emptyMessage,
  deletingAccountId,
  selectedAccountId,
  onSelectDetail,
  onEdit,
  onDelete,
}: AccountListProps) {
  return (
    <section className="account-list-section">
      <div className="section-heading">
        <div>
          <h3>{title}</h3>
          <p className="section-description">{description}</p>
        </div>
        <span>{accounts.length} 件</span>
      </div>

      {accounts.length === 0 ? (
        <p className="status">{emptyMessage}</p>
      ) : (
        <div className="account-list">
          {accounts.map((account) => (
            <article
              key={account.accountId}
              className={`account-card ${selectedAccountId === account.accountId ? 'selected' : ''}`}
            >
              <div className="account-card-header">
                <span className={`badge ${account.active ? 'active' : 'inactive'}`}>
                  {account.active ? '有効' : '停止'}
                </span>
                <span className="type-chip">
                  {accountCategoryLabels[account.accountCategory]}
                </span>
              </div>

              {variant === 'creditCard' ? (
                <>
                  <h3>{account.accountName}</h3>
                  <p>{account.providerName}</p>
                  <dl className="balance-pairs compact">
                    <div>
                      <dt>請求額</dt>
                      <dd>{formatMoney(account.currentBalance, true)}</dd>
                    </div>
                    <div>
                      <dt>次の支払日</dt>
                      <dd>{formatNextPaymentDate(account)}</dd>
                    </div>
                    <div>
                      <dt>引き落とし口座</dt>
                      <dd>
                        {formatPaymentAccountName(
                          allAccounts,
                          account.creditCardProfile?.paymentAccountId,
                        )}
                      </dd>
                    </div>
                  </dl>
                  {account.creditCardProfile ? (
                    <p className="account-meta-note">
                      締め日 {account.creditCardProfile.closingDay} 日 / 補正{' '}
                      {
                        paymentDateAdjustmentRuleLabels[
                          account.creditCardProfile.paymentDateAdjustmentRule
                        ]
                      }
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <h3>{formatOperationalTitle(account)}</h3>
                  <p>{accountCategoryLabels[account.accountCategory]}</p>
                  <dl className="balance-pairs compact">
                    <div>
                      <dt>現在残高</dt>
                      <dd>{formatMoney(account.currentBalance)}</dd>
                    </div>
                    <div>
                      <dt>未配分</dt>
                      <dd>{formatMoney(account.unallocatedBalance)}</dd>
                    </div>
                    <div>
                      <dt>表示順</dt>
                      <dd>{account.displayOrder}</dd>
                    </div>
                  </dl>
                </>
              )}

              <div className="category-actions">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => onSelectDetail?.(account)}
                >
                  詳細を見る
                </button>
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
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function formatOperationalTitle(account: Account) {
  return `${account.providerName} / ${account.accountName}`
}

function formatPaymentAccountName(
  allAccounts: Account[],
  paymentAccountId?: number,
) {
  if (paymentAccountId == null) {
    return '未設定'
  }

  const paymentAccount = allAccounts.find(
    (account) => account.accountId === paymentAccountId,
  )

  return paymentAccount == null
    ? `口座ID #${paymentAccountId}`
    : `${paymentAccount.providerName} / ${paymentAccount.accountName}`
}

function formatNextPaymentDate(account: Account) {
  if (account.creditCardProfile == null) {
    return '未設定'
  }

  const nextPaymentDate = getNextPaymentDate(
    account.creditCardProfile.paymentDay,
    account.creditCardProfile.paymentDateAdjustmentRule,
  )

  return nextPaymentDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

function getNextPaymentDate(
  paymentDay: number,
  adjustmentRule: PaymentDateAdjustmentRule,
) {
  const today = new Date()
  const candidate = new Date(
    today.getFullYear(),
    today.getMonth(),
    clampToMonthEnd(today.getFullYear(), today.getMonth(), paymentDay),
  )

  if (candidate < startOfDay(today)) {
    candidate.setMonth(candidate.getMonth() + 1)
    candidate.setDate(
      clampToMonthEnd(candidate.getFullYear(), candidate.getMonth(), paymentDay),
    )
  }

  return adjustBusinessDate(candidate, adjustmentRule)
}

function clampToMonthEnd(year: number, month: number, day: number) {
  return Math.min(day, new Date(year, month + 1, 0).getDate())
}

function adjustBusinessDate(
  date: Date,
  adjustmentRule: PaymentDateAdjustmentRule,
) {
  const adjusted = new Date(date)

  if (adjustmentRule === 'NONE') {
    return adjusted
  }

  while (adjusted.getDay() === 0 || adjusted.getDay() === 6) {
    adjusted.setDate(
      adjusted.getDate() +
        (adjustmentRule === 'NEXT_BUSINESS_DAY' ? 1 : -1),
    )
  }

  return adjusted
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatMoney(value: string, absolute = false) {
  const numericValue = Number(value)

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(absolute ? Math.abs(numericValue) : numericValue)
}
