import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  updateAccount,
} from '../../features/account/api/accountApi'
import { AccountForm } from '../../features/account/components/AccountForm'
import { AccountList } from '../../features/account/components/AccountList'
import type {
  Account,
  CreateAccountInput,
  PaymentDateAdjustmentRule,
} from '../../features/account/types/account'
import { FormModal } from '../../shared/components/FormModal'
import { ApiRequestError } from '../../shared/lib/api/client'

const initialForm: CreateAccountInput = {
  providerName: '',
  accountName: '',
  accountCategory: 'BANK',
  balanceSide: 'ASSET',
  initialBalance: '0',
  active: true,
  displayOrder: 10,
  creditCardProfile: null,
}

type AccountFormField = keyof CreateAccountInput
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
type SortOption = 'DISPLAY_ORDER' | 'NAME' | 'BALANCE_DESC'

export function AccountPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<CreateAccountInput>(initialForm)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sortOption, setSortOption] = useState<SortOption>('DISPLAY_ORDER')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AccountFormField, string>>
  >({})
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    void loadAccounts()
  }, [])

  const filteredAccounts = accounts
    .filter((account) => matchesKeyword(account, keyword))
    .filter((account) => matchesStatus(account, statusFilter))
    .sort((left, right) => compareAccounts(left, right, sortOption))

  const operationalAccounts = filteredAccounts.filter(
    (account) => account.accountCategory !== 'CREDIT_CARD',
  )
  const creditCardAccounts = filteredAccounts.filter(
    (account) => account.accountCategory === 'CREDIT_CARD',
  )
  const selectedAccount =
    accounts.find((account) => account.accountId === selectedAccountId) ?? null
  const activeCount = accounts.filter((account) => account.active).length
  const operationalCount = accounts.filter(
    (account) => account.accountCategory !== 'CREDIT_CARD',
  ).length
  const creditCardCount = accounts.filter(
    (account) => account.accountCategory === 'CREDIT_CARD',
  ).length

  useEffect(() => {
    setSelectedAccountId((current) => {
      if (filteredAccounts.length === 0) {
        return null
      }

      if (
        current != null &&
        filteredAccounts.some((account) => account.accountId === current)
      ) {
        return current
      }

      return filteredAccounts[0].accountId
    })
  }, [filteredAccounts])

  async function loadAccounts() {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await fetchAccounts()
      setAccounts(data)
      setSelectedAccountId((current) => {
        if (data.length === 0) {
          return null
        }

        if (current != null && data.some((account) => account.accountId === current)) {
          return current
        }

        return data[0].accountId
      })
    } catch {
      setErrorMessage(
        '口座の取得に失敗しました。バックエンドの状態を確認してください。',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitErrorMessage('')
    setFieldErrors({})

    try {
      if (editingAccountId == null) {
        await createAccount(form)
      } else {
        await updateAccount(editingAccountId, form)
      }

      await loadAccounts()
      closeModal()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'VALIDATION_ERROR') {
          setSubmitErrorMessage(error.message)
          setFieldErrors(
            error.fieldErrors.reduce<Partial<Record<AccountFormField, string>>>(
              (accumulator, fieldError) => {
                if (isAccountFormField(fieldError.field)) {
                  accumulator[fieldError.field] = fieldError.message
                }

                return accumulator
              },
              {},
            ),
          )
          setModalOpen(true)
          return
        }

        setSubmitErrorMessage(error.message)
        setModalOpen(true)
        return
      }

      setSubmitErrorMessage(
        '口座の保存に失敗しました。入力内容とバックエンドの状態を確認してください。',
      )
      setModalOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenCreateModal() {
    setEditingAccountId(null)
    setForm(initialForm)
    setSubmitErrorMessage('')
    setFieldErrors({})
    setModalOpen(true)
  }

  function handleEdit(account: Account) {
    setEditingAccountId(account.accountId)
    setSubmitErrorMessage('')
    setFieldErrors({})
    setForm({
      providerName: account.providerName,
      accountName: account.accountName,
      accountCategory: account.accountCategory,
      balanceSide: account.balanceSide,
      initialBalance: account.initialBalance,
      active: account.active,
      displayOrder: account.displayOrder,
      creditCardProfile: account.creditCardProfile
        ? {
            paymentAccountId: account.creditCardProfile.paymentAccountId,
            closingDay: account.creditCardProfile.closingDay,
            paymentDay: account.creditCardProfile.paymentDay,
            paymentDateAdjustmentRule:
              account.creditCardProfile.paymentDateAdjustmentRule,
          }
        : null,
    })
    setModalOpen(true)
  }

  async function handleDelete(account: Account) {
    const confirmed = window.confirm(
      `「${account.accountName}」を削除しますか。通常は元に戻せません。`,
    )

    if (!confirmed) {
      return
    }

    setDeletingAccountId(account.accountId)
    setErrorMessage('')

    try {
      await deleteAccount(account.accountId)
      await loadAccounts()

      if (editingAccountId === account.accountId) {
        closeModal()
      }
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('口座の削除に失敗しました。')
      }
    } finally {
      setDeletingAccountId(null)
    }
  }

  function closeModal() {
    setEditingAccountId(null)
    setForm(initialForm)
    setSubmitErrorMessage('')
    setFieldErrors({})
    setModalOpen(false)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / accounts</p>
        <h1>口座一覧を毎日確認しやすくする</h1>
        <p className="lead">
          銀行口座とクレジットカードを分けて並べ、残高確認と次回支払い確認を一覧の時点で済ませやすくしています。
        </p>
        <div className="hero-stats account-hero-stats">
          <article>
            <span>稼働中口座</span>
            <strong>{activeCount}</strong>
            <small>日常的に確認する対象を先に把握できます。</small>
          </article>
          <article>
            <span>預金・現金など</span>
            <strong>{operationalCount}</strong>
            <small>残高と未配分を一覧で比較できます。</small>
          </article>
          <article>
            <span>クレジットカード</span>
            <strong>{creditCardCount}</strong>
            <small>請求額と引き落とし先をまとめて確認できます。</small>
          </article>
        </div>
      </section>

      <section className="content-grid management-focus-grid">
        <section className="panel management-focus-panel">
          <div className="panel-heading">
            <p className="eyebrow">Today Focus</p>
            <h2>一覧で押さえるポイント</h2>
          </div>
          <div className="dashboard-focus-list">
            <article className="dashboard-focus-item">
              <span>一覧表示件数</span>
              <strong>{filteredAccounts.length}</strong>
              <p>検索、状態フィルター、並び替えで今日見る口座だけに絞れます。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>選択中</span>
              <strong>{selectedAccount?.accountName ?? '未選択'}</strong>
              <p>一覧から詳細を見ると、確認対象をそのまま下の詳細カードに固定できます。</p>
            </article>
          </div>
        </section>
      </section>

      <section className="content-grid account-overview-grid">
        <section className="panel account-detail-panel">
          <div className="panel-heading">
            <p className="eyebrow">Selected Account</p>
            <h2>選択中の口座詳細</h2>
            <p className="lead dashboard-section-lead">
              P1-2 で関連情報を追加しやすいように、一覧から選んだ口座の基本情報を先に固定表示します。
            </p>
          </div>

          {selectedAccount == null ? (
            <p className="status">表示できる口座がまだありません。</p>
          ) : (
            <article className="account-detail-card">
              <div className="account-card-header">
                <span className={`badge ${selectedAccount.active ? 'active' : 'inactive'}`}>
                  {selectedAccount.active ? '有効' : '停止'}
                </span>
                <span className="type-chip">
                  {selectedAccount.accountCategory === 'CREDIT_CARD'
                    ? 'クレジットカード'
                    : '預金・現金など'}
                </span>
              </div>
              <h3>
                {selectedAccount.accountCategory === 'CREDIT_CARD'
                  ? selectedAccount.accountName
                  : `${selectedAccount.providerName} / ${selectedAccount.accountName}`}
              </h3>
              <p className="account-detail-provider">{selectedAccount.providerName}</p>
              <dl className="balance-pairs">
                {selectedAccount.accountCategory === 'CREDIT_CARD' ? (
                  <>
                    <div>
                      <dt>請求額</dt>
                      <dd>{formatMoney(selectedAccount.currentBalance, true)}</dd>
                    </div>
                    <div>
                      <dt>次の支払日</dt>
                      <dd>{formatNextPaymentDate(selectedAccount)}</dd>
                    </div>
                    <div>
                      <dt>引き落とし口座</dt>
                      <dd>
                        {formatPaymentAccountName(
                          accounts,
                          selectedAccount.creditCardProfile?.paymentAccountId,
                        )}
                      </dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt>現在残高</dt>
                      <dd>{formatMoney(selectedAccount.currentBalance)}</dd>
                    </div>
                    <div>
                      <dt>未配分</dt>
                      <dd>{formatMoney(selectedAccount.unallocatedBalance)}</dd>
                    </div>
                    <div>
                      <dt>初期残高</dt>
                      <dd>{formatMoney(selectedAccount.initialBalance)}</dd>
                    </div>
                  </>
                )}
              </dl>
              <div className="category-actions">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => handleEdit(selectedAccount)}
                >
                  この口座を編集
                </button>
              </div>
            </article>
          )}
        </section>

        <section className="panel account-list-panel">
          <div className="panel-heading">
            <p className="eyebrow">口座一覧</p>
            <h2>登録済み口座</h2>
            <p className="lead dashboard-section-lead">
              一覧を口座区分ごとに分け、探したい条件で絞り込みながら詳細確認へつなげます。
            </p>
          </div>
          <div className="button-row account-filter-row">
            <label className="filter-field">
              <span>検索</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="銀行名、口座名、カード名で検索"
              />
            </label>
            <label className="filter-field">
              <span>状態</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="ALL">すべて</option>
                <option value="ACTIVE">有効のみ</option>
                <option value="INACTIVE">停止のみ</option>
              </select>
            </label>
            <label className="filter-field">
              <span>並び替え</span>
              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
              >
                <option value="DISPLAY_ORDER">表示順</option>
                <option value="NAME">名称</option>
                <option value="BALANCE_DESC">残高が大きい順</option>
              </select>
            </label>
            <button type="button" onClick={handleOpenCreateModal}>
              新規口座を追加
            </button>
          </div>

          {errorMessage ? <p className="status error">{errorMessage}</p> : null}
          {loading ? <p className="status">読み込み中...</p> : null}

          {!loading && !errorMessage ? (
            <div className="account-section-stack">
              <AccountList
                title="預金・現金など"
                description="銀行口座、現金、電子マネーなどをまとめて確認します。"
                variant="operational"
                accounts={operationalAccounts}
                allAccounts={accounts}
                emptyMessage="条件に合う預金・現金系の口座はありません。"
                deletingAccountId={deletingAccountId}
                selectedAccountId={selectedAccountId}
                onSelectDetail={(account) => setSelectedAccountId(account.accountId)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <AccountList
                title="クレジットカード"
                description="請求額、次回支払日、引き落とし口座を先に見られるようにしています。"
                variant="creditCard"
                accounts={creditCardAccounts}
                allAccounts={accounts}
                emptyMessage="条件に合うクレジットカードはありません。"
                deletingAccountId={deletingAccountId}
                selectedAccountId={selectedAccountId}
                onSelectDetail={(account) => setSelectedAccountId(account.accountId)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ) : null}
        </section>
      </section>

      <FormModal
        open={modalOpen}
        title={editingAccountId == null ? '口座を追加' : '口座を編集'}
        description={
          editingAccountId == null
            ? '口座属性を入力して保存します。'
            : '既存口座の内容を更新します。'
        }
        onClose={closeModal}
      >
        <AccountForm
          accounts={accounts}
          value={form}
          submitting={submitting}
          submitErrorMessage={submitErrorMessage}
          fieldErrors={fieldErrors}
          onChange={setForm}
          onSubmit={handleSubmit}
        />
      </FormModal>
    </main>
  )
}

function matchesKeyword(account: Account, keyword: string) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase()

  if (normalizedKeyword.length === 0) {
    return true
  }

  return `${account.providerName} ${account.accountName}`
    .toLocaleLowerCase()
    .includes(normalizedKeyword)
}

function matchesStatus(account: Account, statusFilter: StatusFilter) {
  if (statusFilter === 'ACTIVE') {
    return account.active
  }

  if (statusFilter === 'INACTIVE') {
    return !account.active
  }

  return true
}

function compareAccounts(
  left: Account,
  right: Account,
  sortOption: SortOption,
) {
  if (sortOption === 'NAME') {
    return getSortLabel(left).localeCompare(getSortLabel(right), 'ja')
  }

  if (sortOption === 'BALANCE_DESC') {
    const balanceDifference =
      Math.abs(Number(right.currentBalance)) - Math.abs(Number(left.currentBalance))

    return balanceDifference !== 0
      ? balanceDifference
      : left.displayOrder - right.displayOrder
  }

  return (
    left.displayOrder - right.displayOrder ||
    getSortLabel(left).localeCompare(getSortLabel(right), 'ja')
  )
}

function getSortLabel(account: Account) {
  return `${account.providerName} ${account.accountName}`
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

function isAccountFormField(value: string): value is AccountFormField {
  return (
    value === 'providerName' ||
    value === 'accountName' ||
    value === 'accountCategory' ||
    value === 'balanceSide' ||
    value === 'initialBalance' ||
    value === 'active' ||
    value === 'displayOrder' ||
    value === 'creditCardProfile'
  )
}
