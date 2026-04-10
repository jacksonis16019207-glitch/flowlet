import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  updateAccount,
} from '../../features/account/api/accountApi'
import { AccountForm } from '../../features/account/components/AccountForm'
import type {
  Account,
  CreateAccountInput,
  PaymentDateAdjustmentRule,
} from '../../features/account/types/account'
import {
  createGoalBucket,
  deleteGoalBucket,
  fetchGoalBuckets,
  updateGoalBucket,
} from '../../features/goalBucket/api/goalBucketApi'
import { GoalBucketForm } from '../../features/goalBucket/components/GoalBucketForm'
import type { CreateGoalBucketInput, GoalBucket } from '../../features/goalBucket/types/goalBucket'
import { fetchTransactions } from '../../features/transaction/api/transactionApi'
import type { Transaction } from '../../features/transaction/types/transaction'
import { FormModal } from '../../shared/components/FormModal'
import { ApiRequestError } from '../../shared/lib/api/client'

const initialAccountForm: CreateAccountInput = {
  providerName: '',
  accountName: '',
  accountCategory: 'BANK',
  balanceSide: 'ASSET',
  initialBalance: '0',
  active: true,
  displayOrder: 10,
  creditCardProfile: null,
}

const initialGoalBucketForm: CreateGoalBucketInput = {
  accountId: 0,
  bucketName: '',
  active: true,
}

type AccountFormField = keyof CreateAccountInput
type GoalBucketFormField = keyof CreateGoalBucketInput
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
type SortOption = 'DISPLAY_ORDER' | 'NAME' | 'BALANCE_DESC'
type AccountListView = 'ALL' | 'BANK' | 'CREDIT_CARD'
type DetailSelection =
  | { type: 'account'; accountId: number }
  | { type: 'goalBucket'; goalBucketId: number }
  | { type: 'creditCard'; accountId: number }

type CreditCardBillingSummary = {
  closingDayLabel: string
  paymentDayLabel: string
  nextPaymentDate: string
  followingPaymentDate: string
  nextPaymentAmount: string
  followingPaymentAmount: string
}

export function AccountPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goalBuckets, setGoalBuckets] = useState<GoalBucket[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accountForm, setAccountForm] = useState<CreateAccountInput>(initialAccountForm)
  const [goalBucketForm, setGoalBucketForm] =
    useState<CreateGoalBucketInput>(initialGoalBucketForm)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const [editingGoalBucketId, setEditingGoalBucketId] = useState<number | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null)
  const [deletingGoalBucketId, setDeletingGoalBucketId] = useState<number | null>(null)
  const [detailSelection, setDetailSelection] = useState<DetailSelection | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingAccount, setSubmittingAccount] = useState(false)
  const [submittingGoalBucket, setSubmittingGoalBucket] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [accountSubmitErrorMessage, setAccountSubmitErrorMessage] = useState('')
  const [goalBucketSubmitErrorMessage, setGoalBucketSubmitErrorMessage] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sortOption, setSortOption] = useState<SortOption>('DISPLAY_ORDER')
  const [accountListView, setAccountListView] = useState<AccountListView>('ALL')
  const [accountFieldErrors, setAccountFieldErrors] = useState<
    Partial<Record<AccountFormField, string>>
  >({})
  const [goalBucketFieldErrors, setGoalBucketFieldErrors] = useState<
    Partial<Record<GoalBucketFormField, string>>
  >({})
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [goalBucketModalOpen, setGoalBucketModalOpen] = useState(false)
  const [bankMonth, setBankMonth] = useState(getCurrentMonthLabel())

  useEffect(() => {
    void loadAccounts()
  }, [])

  const filteredAccounts = useMemo(
    () =>
      accounts
        .filter((account) => matchesKeyword(account, keyword))
        .filter((account) => matchesStatus(account, statusFilter))
        .sort((left, right) => compareAccounts(left, right, sortOption)),
    [accounts, keyword, sortOption, statusFilter],
  )

  const bankAccounts = useMemo(
    () =>
      filteredAccounts.filter((account) => account.accountCategory !== 'CREDIT_CARD'),
    [filteredAccounts],
  )
  const creditCardAccounts = useMemo(
    () => filteredAccounts.filter((account) => account.accountCategory === 'CREDIT_CARD'),
    [filteredAccounts],
  )

  const bankAccountCount = accounts.filter(
    (account) => account.accountCategory !== 'CREDIT_CARD',
  ).length
  const creditCardCount = accounts.filter(
    (account) => account.accountCategory === 'CREDIT_CARD',
  ).length
  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.currentBalance),
    0,
  )

  const selectedAccount =
    detailSelection?.type === 'account'
      ? accounts.find((account) => account.accountId === detailSelection.accountId) ?? null
      : null
  const selectedGoalBucket =
    detailSelection?.type === 'goalBucket'
      ? goalBuckets.find((goalBucket) => goalBucket.goalBucketId === detailSelection.goalBucketId) ??
        null
      : null
  const selectedCreditCard =
    detailSelection?.type === 'creditCard'
      ? accounts.find((account) => account.accountId === detailSelection.accountId) ?? null
      : null

  useEffect(() => {
    setDetailSelection((current) => {
      if (current == null) {
        const firstAccount = filteredAccounts[0]
        return firstAccount == null ? null : resolveAccountSelection(firstAccount)
      }

      if (current.type === 'account' || current.type === 'creditCard') {
        const matched = accounts.find((account) => account.accountId === current.accountId)
        if (matched) {
          return matched.accountCategory === 'CREDIT_CARD'
            ? { type: 'creditCard', accountId: matched.accountId }
            : { type: 'account', accountId: matched.accountId }
        }
      }

      if (current.type === 'goalBucket') {
        const matched = goalBuckets.find(
          (goalBucket) => goalBucket.goalBucketId === current.goalBucketId,
        )
        if (matched) {
          return current
        }
      }

      const fallbackAccount = filteredAccounts[0]
      return fallbackAccount == null ? null : resolveAccountSelection(fallbackAccount)
    })
  }, [accounts, filteredAccounts, goalBuckets])

  const selectedBankGoalBuckets = useMemo(
    () =>
      selectedAccount == null
        ? []
        : goalBuckets
            .filter((goalBucket) => goalBucket.accountId === selectedAccount.accountId)
            .sort(compareGoalBuckets),
    [goalBuckets, selectedAccount],
  )
  const selectedLinkedCreditCards = useMemo(
    () =>
      selectedAccount == null
        ? []
        : accounts
            .filter(
              (account) =>
                account.accountCategory === 'CREDIT_CARD' &&
                account.creditCardProfile?.paymentAccountId === selectedAccount.accountId,
            )
            .sort(compareAccountsByDisplayOrder),
    [accounts, selectedAccount],
  )
  const selectedBankTransactions = useMemo(
    () =>
      selectedAccount == null
        ? []
        : transactions
            .filter((transaction) => transaction.accountId === selectedAccount.accountId)
            .sort(compareTransactions),
    [selectedAccount, transactions],
  )
  const selectedGoalBucketAccount =
    selectedGoalBucket == null
      ? null
      : accounts.find((account) => account.accountId === selectedGoalBucket.accountId) ?? null
  const selectedGoalBucketTransactions = useMemo(
    () =>
      selectedGoalBucket == null
        ? []
        : transactions
            .filter((transaction) => transaction.goalBucketId === selectedGoalBucket.goalBucketId)
            .sort(compareTransactions)
            .slice(0, 5),
    [selectedGoalBucket, transactions],
  )
  const selectedCreditCardTransactions = useMemo(
    () =>
      selectedCreditCard == null
        ? []
        : transactions
            .filter((transaction) => transaction.accountId === selectedCreditCard.accountId)
            .sort(compareTransactions)
            .slice(0, 5),
    [selectedCreditCard, transactions],
  )
  const selectedCreditCardPaymentAccount =
    selectedCreditCard == null
      ? null
      : accounts.find(
          (account) =>
            account.accountId === selectedCreditCard.creditCardProfile?.paymentAccountId,
        ) ?? null
  const selectedBillingSummary =
    selectedCreditCard == null
      ? null
      : buildCreditCardBillingSummary(selectedCreditCard, transactions)

  const selectedBankMonthlyTransactions = useMemo(() => {
    if (selectedAccount == null) {
      return []
    }

    const { periodStartDate, periodEndDate } = resolveMonthPeriod(bankMonth)
    return selectedBankTransactions.filter(
      (transaction) =>
        transaction.transactionDate >= periodStartDate &&
        transaction.transactionDate <= periodEndDate,
    )
  }, [bankMonth, selectedAccount, selectedBankTransactions])

  const selectedBankIncome = selectedBankMonthlyTransactions
    .filter((transaction) => transaction.transactionType === 'INCOME')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const selectedBankExpense = selectedBankMonthlyTransactions
    .filter(
      (transaction) =>
        transaction.transactionType === 'EXPENSE' ||
        transaction.transactionType === 'TRANSFER_OUT',
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const selectedBankNet = selectedBankIncome - selectedBankExpense

  async function loadAccounts() {
    setLoading(true)
    setErrorMessage('')

    try {
      const [accountData, goalBucketData, transactionData] = await Promise.all([
        fetchAccounts(),
        fetchGoalBuckets(),
        fetchTransactions(),
      ])

      setAccounts(accountData)
      setGoalBuckets(goalBucketData)
      setTransactions(transactionData)
    } catch {
      setErrorMessage('口座情報の読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingAccount(true)
    setAccountSubmitErrorMessage('')
    setAccountFieldErrors({})

    try {
      if (editingAccountId == null) {
        await createAccount(accountForm)
      } else {
        await updateAccount(editingAccountId, accountForm)
      }

      await loadAccounts()
      closeAccountModal()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'VALIDATION_ERROR') {
          setAccountSubmitErrorMessage(error.message)
          setAccountFieldErrors(
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
          return
        }

        setAccountSubmitErrorMessage(error.message)
        return
      }

      setAccountSubmitErrorMessage('口座の保存に失敗しました。')
    } finally {
      setSubmittingAccount(false)
    }
  }

  async function handleGoalBucketSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingGoalBucket(true)
    setGoalBucketSubmitErrorMessage('')
    setGoalBucketFieldErrors({})

    try {
      let savedGoalBucket: GoalBucket
      if (editingGoalBucketId == null) {
        savedGoalBucket = await createGoalBucket(goalBucketForm)
      } else {
        savedGoalBucket = await updateGoalBucket(editingGoalBucketId, goalBucketForm)
      }

      await loadAccounts()
      setDetailSelection({ type: 'goalBucket', goalBucketId: savedGoalBucket.goalBucketId })
      closeGoalBucketModal()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'VALIDATION_ERROR') {
          setGoalBucketSubmitErrorMessage(error.message)
          setGoalBucketFieldErrors(
            error.fieldErrors.reduce<Partial<Record<GoalBucketFormField, string>>>(
              (accumulator, fieldError) => {
                if (isGoalBucketFormField(fieldError.field)) {
                  accumulator[fieldError.field] = fieldError.message
                }

                return accumulator
              },
              {},
            ),
          )
          return
        }

        setGoalBucketSubmitErrorMessage(error.message)
        return
      }

      setGoalBucketSubmitErrorMessage('目的別口座の保存に失敗しました。')
    } finally {
      setSubmittingGoalBucket(false)
    }
  }

  function openCreateAccountModal() {
    setEditingAccountId(null)
    setAccountForm(initialAccountForm)
    setAccountSubmitErrorMessage('')
    setAccountFieldErrors({})
    setAccountModalOpen(true)
  }

  function openEditAccountModal(account: Account) {
    setEditingAccountId(account.accountId)
    setAccountForm({
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
    setAccountSubmitErrorMessage('')
    setAccountFieldErrors({})
    setAccountModalOpen(true)
  }

  function closeAccountModal() {
    setEditingAccountId(null)
    setAccountForm(initialAccountForm)
    setAccountSubmitErrorMessage('')
    setAccountFieldErrors({})
    setAccountModalOpen(false)
  }

  function openCreateGoalBucketModal(accountId?: number) {
    setEditingGoalBucketId(null)
    setGoalBucketForm({
      accountId: accountId ?? selectedAccount?.accountId ?? getPrimaryBankAccountId(accounts),
      bucketName: '',
      active: true,
    })
    setGoalBucketSubmitErrorMessage('')
    setGoalBucketFieldErrors({})
    setGoalBucketModalOpen(true)
  }

  function openEditGoalBucketModal(goalBucket: GoalBucket) {
    setEditingGoalBucketId(goalBucket.goalBucketId)
    setGoalBucketForm({
      accountId: goalBucket.accountId,
      bucketName: goalBucket.bucketName,
      active: goalBucket.active,
    })
    setGoalBucketSubmitErrorMessage('')
    setGoalBucketFieldErrors({})
    setGoalBucketModalOpen(true)
  }

  function closeGoalBucketModal() {
    setEditingGoalBucketId(null)
    setGoalBucketForm(initialGoalBucketForm)
    setGoalBucketSubmitErrorMessage('')
    setGoalBucketFieldErrors({})
    setGoalBucketModalOpen(false)
  }

  async function handleDeleteAccount(account: Account) {
    const confirmed = window.confirm(`${account.accountName} を削除しますか。`)
    if (!confirmed) {
      return
    }

    setDeletingAccountId(account.accountId)
    setErrorMessage('')

    try {
      await deleteAccount(account.accountId)
      await loadAccounts()
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

  async function handleDeleteGoalBucket(goalBucket: GoalBucket) {
    const confirmed = window.confirm(`${goalBucket.bucketName} を削除しますか。`)
    if (!confirmed) {
      return
    }

    setDeletingGoalBucketId(goalBucket.goalBucketId)
    setErrorMessage('')

    try {
      await deleteGoalBucket(goalBucket.goalBucketId)
      await loadAccounts()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('目的別口座の削除に失敗しました。')
      }
    } finally {
      setDeletingGoalBucketId(null)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / accounts</p>
        <h1>銀行口座とクレジットカードの関係を整理して確認する</h1>
        <p className="lead">
          銀行口座ごとの収支、目的別口座、紐づくクレジットカードを一つの流れで見られるようにします。
        </p>
        <div className="hero-stats account-hero-stats">
          <article>
            <span>銀行口座数</span>
            <strong>{bankAccountCount}</strong>
            <small>銀行、現金、電子マネーなどの資産口座を含みます。</small>
          </article>
          <article>
            <span>クレジットカード数</span>
            <strong>{creditCardCount}</strong>
            <small>支払口座と請求見込みを追うカード数です。</small>
          </article>
          <article>
            <span>総口座残高</span>
            <strong>{formatMoney(totalBalance)}</strong>
            <small>現在登録されている全口座の現在残高の合計です。</small>
          </article>
        </div>
      </section>

      <section className="content-grid account-overview-grid">
        <section className="panel account-list-panel" id="account-list-panel">
          <div className="panel-heading">
            <p className="eyebrow">Account Directory</p>
            <h2>一覧から詳細対象を切り替える</h2>
            <p className="lead dashboard-section-lead">
              銀行口座とクレジットカードを切り替えながら、詳細パネルの内容を切り替えます。
            </p>
          </div>

          <div className="button-row">
            <button type="button" onClick={openCreateAccountModal}>
              口座を追加
            </button>
          </div>

          <div className="account-filter-row account-page-filter-row">
            <label className="filter-field">
              <span>検索</span>
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </label>
            <label className="filter-field">
              <span>状態</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="ALL">すべて</option>
                <option value="ACTIVE">有効</option>
                <option value="INACTIVE">無効</option>
              </select>
            </label>
            <label className="filter-field">
              <span>表示対象</span>
              <select
                value={accountListView}
                onChange={(event) =>
                  setAccountListView(event.target.value as AccountListView)
                }
              >
                <option value="ALL">すべて</option>
                <option value="BANK">銀行口座</option>
                <option value="CREDIT_CARD">クレジットカード</option>
              </select>
            </label>
            <label className="filter-field">
              <span>並び順</span>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
              >
                <option value="DISPLAY_ORDER">表示順</option>
                <option value="NAME">名称</option>
                <option value="BALANCE_DESC">残高順</option>
              </select>
            </label>
          </div>

          {loading ? <p className="status">口座一覧を読み込み中です...</p> : null}
          {errorMessage ? <p className="status error">{errorMessage}</p> : null}

          {accountListView !== 'CREDIT_CARD' ? (
            <section className="account-section-stack">
              <div className="section-heading">
                <div>
                  <h3>銀行口座</h3>
                  <p className="section-description">
                    銀行口座を選ぶと、目的別口座と紐づくカードを同じ詳細パネルで見られます。
                  </p>
                </div>
                <span>{bankAccounts.length} 件</span>
              </div>
              {bankAccounts.length === 0 ? (
                <p className="status">表示できる銀行口座はありません。</p>
              ) : (
                <div className="account-list">
                  {bankAccounts.map((account) => (
                    <button
                      key={account.accountId}
                      type="button"
                      className={`account-card account-card-button ${
                        detailSelection?.type === 'account' &&
                        detailSelection.accountId === account.accountId
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() => setDetailSelection({ type: 'account', accountId: account.accountId })}
                    >
                      <div className="account-card-header">
                        <span className={`badge ${account.active ? 'active' : 'inactive'}`}>
                          {account.active ? '有効' : '無効'}
                        </span>
                        <span className="type-chip">{formatBankAccountLabel(account)}</span>
                      </div>
                      <h3>{`${account.providerName} / ${account.accountName}`}</h3>
                      <dl className="balance-pairs compact">
                        <div>
                          <dt>現在残高</dt>
                          <dd>{formatMoney(account.currentBalance)}</dd>
                        </div>
                        <div>
                          <dt>未配分残高</dt>
                          <dd>{formatMoney(account.unallocatedBalance)}</dd>
                        </div>
                      </dl>
                    </button>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {accountListView !== 'BANK' ? (
            <section className="account-section-stack">
              <div className="section-heading">
                <div>
                  <h3>クレジットカード</h3>
                  <p className="section-description">
                    カード利用残高と次回支払見込みをまとめて見られます。
                  </p>
                </div>
                <span>{creditCardAccounts.length} 件</span>
              </div>
              {creditCardAccounts.length === 0 ? (
                <p className="status">表示できるクレジットカードはありません。</p>
              ) : (
                <div className="account-list">
                  {creditCardAccounts.map((account) => (
                    <button
                      key={account.accountId}
                      type="button"
                      className={`account-card account-card-button ${
                        detailSelection?.type === 'creditCard' &&
                        detailSelection.accountId === account.accountId
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        setDetailSelection({ type: 'creditCard', accountId: account.accountId })
                      }
                    >
                      <div className="account-card-header">
                        <span className={`badge ${account.active ? 'active' : 'inactive'}`}>
                          {account.active ? '有効' : '無効'}
                        </span>
                        <span className="type-chip">クレジットカード</span>
                      </div>
                      <h3>{account.accountName}</h3>
                      <p>{account.providerName}</p>
                      <dl className="balance-pairs compact">
                        <div>
                          <dt>利用残高</dt>
                          <dd>{formatMoney(account.currentBalance, true)}</dd>
                        </div>
                        <div>
                          <dt>次回支払日</dt>
                          <dd>{formatNextPaymentDate(account)}</dd>
                        </div>
                      </dl>
                    </button>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </section>

        <section className="panel account-detail-panel">
          {selectedAccount ? (
            <BankAccountDetail
              account={selectedAccount}
              goalBuckets={selectedBankGoalBuckets}
              linkedCreditCards={selectedLinkedCreditCards}
              monthlyIncome={selectedBankIncome}
              monthlyExpense={selectedBankExpense}
              monthlyNet={selectedBankNet}
              bankMonth={bankMonth}
              recentTransactions={selectedBankTransactions.slice(0, 5)}
              onBankMonthChange={setBankMonth}
              onEditAccount={openEditAccountModal}
              onDeleteAccount={handleDeleteAccount}
              onOpenCreateGoalBucket={openCreateGoalBucketModal}
              onSelectGoalBucket={(goalBucket) =>
                setDetailSelection({ type: 'goalBucket', goalBucketId: goalBucket.goalBucketId })
              }
              onSelectCreditCard={(account) =>
                setDetailSelection({ type: 'creditCard', accountId: account.accountId })
              }
              deletingAccountId={deletingAccountId}
            />
          ) : null}

          {selectedGoalBucket ? (
            <GoalBucketDetail
              goalBucket={selectedGoalBucket}
              account={selectedGoalBucketAccount}
              recentTransactions={selectedGoalBucketTransactions}
              onBackToAccount={() =>
                selectedGoalBucketAccount &&
                setDetailSelection({
                  type: 'account',
                  accountId: selectedGoalBucketAccount.accountId,
                })
              }
              onEditGoalBucket={openEditGoalBucketModal}
              onDeleteGoalBucket={handleDeleteGoalBucket}
              deletingGoalBucketId={deletingGoalBucketId}
            />
          ) : null}

          {selectedCreditCard ? (
            <CreditCardDetail
              account={selectedCreditCard}
              paymentAccount={selectedCreditCardPaymentAccount}
              billingSummary={selectedBillingSummary}
              recentTransactions={selectedCreditCardTransactions}
              onBackToAccount={() =>
                selectedCreditCardPaymentAccount &&
                setDetailSelection({
                  type: 'account',
                  accountId: selectedCreditCardPaymentAccount.accountId,
                })
              }
              onEditAccount={openEditAccountModal}
              onDeleteAccount={handleDeleteAccount}
              deletingAccountId={deletingAccountId}
            />
          ) : null}

          {detailSelection == null ? (
            <p className="status">一覧から詳細を表示する対象を選んでください。</p>
          ) : null}
        </section>
      </section>

      <FormModal
        open={accountModalOpen}
        title={editingAccountId == null ? '口座を追加' : '口座を編集'}
        description={
          editingAccountId == null
            ? '銀行口座またはクレジットカードを登録します。'
            : '既存口座の設定を更新します。'
        }
        onClose={closeAccountModal}
      >
        <AccountForm
          accounts={accounts.filter((account) => account.accountCategory !== 'CREDIT_CARD')}
          value={accountForm}
          isEditing={editingAccountId != null}
          submitting={submittingAccount}
          submitErrorMessage={accountSubmitErrorMessage}
          fieldErrors={accountFieldErrors}
          onChange={setAccountForm}
          onSubmit={handleAccountSubmit}
        />
      </FormModal>

      <FormModal
        open={goalBucketModalOpen}
        title={editingGoalBucketId == null ? '目的別口座を追加' : '目的別口座を編集'}
        description={
          editingGoalBucketId == null
            ? '選択した銀行口座に目的別口座を追加します。'
            : '既存の目的別口座設定を更新します。'
        }
        onClose={closeGoalBucketModal}
      >
        <GoalBucketForm
          accounts={accounts.filter((account) => account.accountCategory !== 'CREDIT_CARD')}
          value={goalBucketForm}
          submitting={submittingGoalBucket}
          submitErrorMessage={goalBucketSubmitErrorMessage}
          fieldErrors={goalBucketFieldErrors}
          onChange={setGoalBucketForm}
          onSubmit={handleGoalBucketSubmit}
        />
      </FormModal>
    </main>
  )
}

function BankAccountDetail(props: {
  account: Account
  goalBuckets: GoalBucket[]
  linkedCreditCards: Account[]
  monthlyIncome: number
  monthlyExpense: number
  monthlyNet: number
  bankMonth: string
  recentTransactions: Transaction[]
  onBankMonthChange: (month: string) => void
  onEditAccount: (account: Account) => void
  onDeleteAccount: (account: Account) => void
  onOpenCreateGoalBucket: (accountId: number) => void
  onSelectGoalBucket: (goalBucket: GoalBucket) => void
  onSelectCreditCard: (account: Account) => void
  deletingAccountId: number | null
}) {
  const {
    account,
    goalBuckets,
    linkedCreditCards,
    monthlyIncome,
    monthlyExpense,
    monthlyNet,
    bankMonth,
    recentTransactions,
    onBankMonthChange,
    onDeleteAccount,
    onEditAccount,
    onOpenCreateGoalBucket,
    onSelectGoalBucket,
    onSelectCreditCard,
    deletingAccountId,
  } = props

  return (
    <article className="account-detail-card">
      <div className="account-card-header">
        <span className={`badge ${account.active ? 'active' : 'inactive'}`}>
          {account.active ? '有効' : '無効'}
        </span>
        <span className="type-chip">{formatBankAccountLabel(account)}</span>
      </div>
      <h3>{`${account.providerName} / ${account.accountName}`}</h3>
      <p className="account-detail-provider">銀行口座の概要、収支、紐づく情報をまとめて確認します。</p>
      <dl className="balance-pairs">
        <div>
          <dt>現在残高</dt>
          <dd>{formatMoney(account.currentBalance)}</dd>
        </div>
        <div>
          <dt>未配分残高</dt>
          <dd>{formatMoney(account.unallocatedBalance)}</dd>
        </div>
        <div>
          <dt>初期残高</dt>
          <dd>{formatMoney(account.initialBalance)}</dd>
        </div>
      </dl>
      <div className="category-actions">
        <button type="button" className="action-button" onClick={() => onEditAccount(account)}>
          口座を編集
        </button>
        <button
          type="button"
          className="action-button danger"
          disabled={deletingAccountId === account.accountId}
          onClick={() => onDeleteAccount(account)}
        >
          {deletingAccountId === account.accountId ? '削除中...' : '口座を削除'}
        </button>
      </div>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>口座ごとの月次収支</h3>
            <p className="section-description">選択月の収入、支出、収支を口座単位で確認します。</p>
          </div>
        </div>
        <div className="account-month-switcher">
          <button
            type="button"
            className="action-button"
            onClick={() => onBankMonthChange(shiftMonthLabel(bankMonth, -1))}
          >
            前月
          </button>
          <strong>{formatMonthLabel(bankMonth)}</strong>
          <button
            type="button"
            className="action-button"
            onClick={() => onBankMonthChange(shiftMonthLabel(bankMonth, 1))}
          >
            翌月
          </button>
        </div>
        <div className="detail-chip-list">
          <article className="detail-chip-card">
            <strong>収入</strong>
            <span>{formatMoney(monthlyIncome)}</span>
          </article>
          <article className="detail-chip-card">
            <strong>支出</strong>
            <span>{formatMoney(monthlyExpense)}</span>
          </article>
          <article className="detail-chip-card">
            <strong>収支</strong>
            <span>{formatMoney(monthlyNet)}</span>
          </article>
        </div>
      </section>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>目的別口座一覧</h3>
            <p className="section-description">この銀行口座に属する目的別口座を選ぶと、詳細へ移動します。</p>
          </div>
          <button
            type="button"
            className="action-button"
            onClick={() => onOpenCreateGoalBucket(account.accountId)}
          >
            目的別口座を追加
          </button>
        </div>
        {goalBuckets.length === 0 ? (
          <p className="status">この銀行口座に紐づく目的別口座はまだありません。</p>
        ) : (
          <div className="detail-list">
            {goalBuckets.map((goalBucket) => (
              <button
                key={goalBucket.goalBucketId}
                type="button"
                className="detail-list-item detail-list-button"
                onClick={() => onSelectGoalBucket(goalBucket)}
              >
                <div>
                  <h4>{goalBucket.bucketName}</h4>
                  <p>{goalBucket.active ? '有効' : '無効'}</p>
                </div>
                <dl className="detail-inline-stats">
                  <div>
                    <dt>現在残高</dt>
                    <dd>{formatMoney(goalBucket.currentBalance)}</dd>
                  </div>
                </dl>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>紐づくクレジットカード一覧</h3>
            <p className="section-description">支払口座として設定されているクレジットカードを選ぶと、カード詳細へ移動します。</p>
          </div>
        </div>
        {linkedCreditCards.length === 0 ? (
          <p className="status">この銀行口座に紐づくクレジットカードはありません。</p>
        ) : (
          <div className="detail-list">
            {linkedCreditCards.map((creditCard) => (
              <button
                key={creditCard.accountId}
                type="button"
                className="detail-list-item detail-list-button"
                onClick={() => onSelectCreditCard(creditCard)}
              >
                <div>
                  <h4>{creditCard.accountName}</h4>
                  <p>{creditCard.providerName}</p>
                </div>
                <dl className="detail-inline-stats">
                  <div>
                    <dt>利用残高</dt>
                    <dd>{formatMoney(creditCard.currentBalance, true)}</dd>
                  </div>
                  <div>
                    <dt>次回支払日</dt>
                    <dd>{formatNextPaymentDate(creditCard)}</dd>
                  </div>
                </dl>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>最近の取引</h3>
            <p className="section-description">この口座に紐づく直近の取引を 5 件まで表示します。</p>
          </div>
        </div>
        <TransactionSummaryList transactions={recentTransactions} />
      </section>
    </article>
  )
}

function GoalBucketDetail(props: {
  goalBucket: GoalBucket
  account: Account | null
  recentTransactions: Transaction[]
  onBackToAccount: () => void
  onEditGoalBucket: (goalBucket: GoalBucket) => void
  onDeleteGoalBucket: (goalBucket: GoalBucket) => void
  deletingGoalBucketId: number | null
}) {
  const {
    account,
    goalBucket,
    recentTransactions,
    onBackToAccount,
    onDeleteGoalBucket,
    onEditGoalBucket,
    deletingGoalBucketId,
  } = props

  return (
    <article className="account-detail-card">
      <div className="account-card-header">
        <span className={`badge ${goalBucket.active ? 'active' : 'inactive'}`}>
          {goalBucket.active ? '有効' : '無効'}
        </span>
        <span className="type-chip">Goal Bucket Detail</span>
      </div>
      <h3>{goalBucket.bucketName}</h3>
      <p className="account-detail-provider">親の銀行口座との関係と直近の動きを確認します。</p>
      <dl className="balance-pairs">
        <div>
          <dt>現在残高</dt>
          <dd>{formatMoney(goalBucket.currentBalance)}</dd>
        </div>
        <div>
          <dt>所属銀行口座</dt>
          <dd>{account ? `${account.providerName} / ${account.accountName}` : `口座ID #${goalBucket.accountId}`}</dd>
        </div>
        <div>
          <dt>状態</dt>
          <dd>{goalBucket.active ? '有効' : '無効'}</dd>
        </div>
      </dl>
      <div className="category-actions">
        <button type="button" className="action-button" onClick={onBackToAccount}>
          親の銀行口座へ戻る
        </button>
        <button
          type="button"
          className="action-button"
          onClick={() => onEditGoalBucket(goalBucket)}
        >
          目的別口座を編集
        </button>
        <button
          type="button"
          className="action-button danger"
          disabled={deletingGoalBucketId === goalBucket.goalBucketId}
          onClick={() => onDeleteGoalBucket(goalBucket)}
        >
          {deletingGoalBucketId === goalBucket.goalBucketId ? '削除中...' : '目的別口座を削除'}
        </button>
      </div>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>所属銀行口座</h3>
            <p className="section-description">この目的別口座が紐づく銀行口座に戻れます。</p>
          </div>
        </div>
        {account == null ? (
          <p className="status">親の銀行口座情報を取得できませんでした。</p>
        ) : (
          <button type="button" className="detail-list-item detail-list-button" onClick={onBackToAccount}>
            <div>
              <h4>{`${account.providerName} / ${account.accountName}`}</h4>
              <p>未配分残高 {formatMoney(account.unallocatedBalance)}</p>
            </div>
            <dl className="detail-inline-stats">
              <div>
                <dt>現在残高</dt>
                <dd>{formatMoney(account.currentBalance)}</dd>
              </div>
            </dl>
          </button>
        )}
      </section>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>最近の取引</h3>
            <p className="section-description">Goal Bucket に紐づく直近の取引を表示します。</p>
          </div>
        </div>
        <TransactionSummaryList transactions={recentTransactions} />
      </section>
    </article>
  )
}

function CreditCardDetail(props: {
  account: Account
  paymentAccount: Account | null
  billingSummary: CreditCardBillingSummary | null
  recentTransactions: Transaction[]
  onBackToAccount: () => void
  onEditAccount: (account: Account) => void
  onDeleteAccount: (account: Account) => void
  deletingAccountId: number | null
}) {
  const {
    account,
    paymentAccount,
    billingSummary,
    recentTransactions,
    onBackToAccount,
    onDeleteAccount,
    onEditAccount,
    deletingAccountId,
  } = props

  return (
    <article className="account-detail-card">
      <div className="account-card-header">
        <span className={`badge ${account.active ? 'active' : 'inactive'}`}>
          {account.active ? '有効' : '無効'}
        </span>
        <span className="type-chip">Credit Card Detail</span>
      </div>
      <h3>{account.accountName}</h3>
      <p className="account-detail-provider">{account.providerName}</p>
      <dl className="balance-pairs">
        <div>
          <dt>利用残高</dt>
          <dd>{formatMoney(account.currentBalance, true)}</dd>
        </div>
        <div>
          <dt>支払口座</dt>
          <dd>
            {paymentAccount
              ? `${paymentAccount.providerName} / ${paymentAccount.accountName}`
              : '未設定'}
          </dd>
        </div>
      </dl>
      <div className="category-actions">
        {paymentAccount ? (
          <button type="button" className="action-button" onClick={onBackToAccount}>
            支払口座へ移動
          </button>
        ) : null}
        <button type="button" className="action-button" onClick={() => onEditAccount(account)}>
          カードを編集
        </button>
        <button
          type="button"
          className="action-button danger"
          disabled={deletingAccountId === account.accountId}
          onClick={() => onDeleteAccount(account)}
        >
          {deletingAccountId === account.accountId ? '削除中...' : 'カードを削除'}
        </button>
      </div>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>支払見込み</h3>
            <p className="section-description">次回、次々回の支払日と支払額を確認します。</p>
          </div>
        </div>
        {billingSummary == null ? (
          <p className="status">支払見込みを計算できませんでした。</p>
        ) : (
          <div className="detail-chip-list">
            <article className="detail-chip-card">
              <strong>次回支払日</strong>
              <span>{billingSummary.nextPaymentDate}</span>
            </article>
            <article className="detail-chip-card">
              <strong>次回支払額</strong>
              <span>{billingSummary.nextPaymentAmount}</span>
            </article>
            <article className="detail-chip-card">
              <strong>次々回支払日</strong>
              <span>{billingSummary.followingPaymentDate}</span>
            </article>
            <article className="detail-chip-card">
              <strong>次々回支払額</strong>
              <span>{billingSummary.followingPaymentAmount}</span>
            </article>
          </div>
        )}
      </section>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>支払情報</h3>
            <p className="section-description">締め日と支払日ルールを確認します。</p>
          </div>
        </div>
        {billingSummary == null ? (
          <p className="status">支払情報を表示できません。</p>
        ) : (
          <div className="detail-chip-list">
            <article className="detail-chip-card">
              <strong>締め日</strong>
              <span>{billingSummary.closingDayLabel}</span>
            </article>
            <article className="detail-chip-card">
              <strong>支払日</strong>
              <span>{billingSummary.paymentDayLabel}</span>
            </article>
          </div>
        )}
      </section>

      <section className="account-detail-section">
        <div className="section-heading">
          <div>
            <h3>最近の利用明細</h3>
            <p className="section-description">カードに紐づく直近の利用を表示します。</p>
          </div>
        </div>
        <TransactionSummaryList transactions={recentTransactions} />
      </section>
    </article>
  )
}

function TransactionSummaryList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <p className="status">表示できる取引はありません。</p>
  }

  return (
    <div className="detail-list">
      {transactions.map((transaction) => (
        <article key={transaction.transactionId} className="detail-list-item">
          <div>
            <h4>{transaction.description}</h4>
            <p>
              {formatDateLabel(transaction.transactionDate)}
              {transaction.categoryName ? ` / ${transaction.categoryName}` : ''}
              {transaction.goalBucketName ? ` / ${transaction.goalBucketName}` : ''}
            </p>
          </div>
          <dl className="detail-inline-stats">
            <div>
              <dt>種別</dt>
              <dd>{formatTransactionType(transaction.transactionType)}</dd>
            </div>
            <div>
              <dt>金額</dt>
              <dd>{formatTransactionMoney(transaction)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
}

function matchesKeyword(account: Account, keyword: string) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase()
  if (normalizedKeyword.length === 0) {
    return true
  }

  return buildKeywordText(account).toLocaleLowerCase().includes(normalizedKeyword)
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

function compareAccounts(left: Account, right: Account, sortOption: SortOption) {
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

function compareAccountsByDisplayOrder(left: Account, right: Account) {
  return left.displayOrder - right.displayOrder
}

function compareGoalBuckets(left: GoalBucket, right: GoalBucket) {
  return (
    Number(right.currentBalance) - Number(left.currentBalance) ||
    left.bucketName.localeCompare(right.bucketName, 'ja')
  )
}

function compareTransactions(left: Transaction, right: Transaction) {
  if (left.transactionDate !== right.transactionDate) {
    return right.transactionDate.localeCompare(left.transactionDate)
  }

  return right.transactionId - left.transactionId
}

function getSortLabel(account: Account) {
  return `${account.providerName} ${account.accountName}`
}

function buildKeywordText(account: Account) {
  return [
    account.providerName,
    account.accountName,
    account.accountCategory === 'CREDIT_CARD' ? 'credit-card' : 'bank-account',
    account.creditCardProfile?.paymentAccountId != null
      ? `payment-account-${account.creditCardProfile.paymentAccountId}`
      : '',
  ]
    .join(' ')
    .trim()
}

function resolveAccountSelection(account: Account): DetailSelection {
  return account.accountCategory === 'CREDIT_CARD'
    ? { type: 'creditCard', accountId: account.accountId }
    : { type: 'account', accountId: account.accountId }
}

function getPrimaryBankAccountId(accounts: Account[]) {
  return accounts.find((account) => account.accountCategory !== 'CREDIT_CARD')?.accountId ?? 0
}

function getCurrentMonthLabel() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonthLabel(monthLabel: string, diff: number) {
  const [year, month] = monthLabel.split('-').map(Number)
  const date = new Date(year, month - 1 + diff, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function resolveMonthPeriod(monthLabel: string) {
  const [year, month] = monthLabel.split('-').map(Number)
  const periodStartDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0)
  const periodEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(endDate.getDate()).padStart(2, '0')}`

  return { periodStartDate, periodEndDate }
}

function formatMonthLabel(monthLabel: string) {
  const [year, month] = monthLabel.split('-').map(Number)
  return `${year}年${month}月`
}

function formatDateLabel(value: string | Date) {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatMoney(value: string | number, absolute = false) {
  const numericValue = Number(value)

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(absolute ? Math.abs(numericValue) : numericValue)
}

function formatTransactionType(transactionType: Transaction['transactionType']) {
  switch (transactionType) {
    case 'INCOME':
      return '収入'
    case 'EXPENSE':
      return '支出'
    case 'TRANSFER_OUT':
      return '振替出金'
    case 'TRANSFER_IN':
      return '振替入金'
    default:
      return transactionType
  }
}

function formatTransactionMoney(transaction: Transaction) {
  const sign =
    transaction.transactionType === 'INCOME' ||
    transaction.transactionType === 'TRANSFER_IN'
      ? '+'
      : '-'

  return `${sign}${formatMoney(transaction.amount, true)}`
}

function formatBankAccountLabel(account: Account) {
  switch (account.accountCategory) {
    case 'BANK':
      return '銀行口座'
    case 'CASH':
      return '現金'
    case 'EWALLET':
      return '電子マネー'
    default:
      return 'その他口座'
  }
}

function buildCreditCardBillingSummary(
  account: Account,
  transactions: Transaction[],
): CreditCardBillingSummary | null {
  if (account.creditCardProfile == null) {
    return null
  }

  const today = startOfDay(new Date())
  const previousClosingDate = getPreviousOccurrence(
    account.creditCardProfile.closingDay,
    today,
  )
  const priorClosingDate = getPreviousOccurrence(
    account.creditCardProfile.closingDay,
    addMonths(previousClosingDate, -1),
  )
  const nextClosingDate = getNextOccurrence(
    account.creditCardProfile.closingDay,
    today,
  )
  const nextPaymentDate = getNextPaymentDate(
    account.creditCardProfile.paymentDay,
    account.creditCardProfile.paymentDateAdjustmentRule,
  )
  const followingPaymentDate = getPaymentDateForMonthOffset(
    account.creditCardProfile.paymentDay,
    account.creditCardProfile.paymentDateAdjustmentRule,
    1,
  )
  const cardTransactions = transactions.filter(
    (transaction) => transaction.accountId === account.accountId,
  )

  return {
    closingDayLabel: `${account.creditCardProfile.closingDay}日`,
    paymentDayLabel: `${account.creditCardProfile.paymentDay}日 / ${describeAdjustmentRule(
      account.creditCardProfile.paymentDateAdjustmentRule,
    )}`,
    nextPaymentDate: formatDateLabel(nextPaymentDate),
    followingPaymentDate: formatDateLabel(followingPaymentDate),
    nextPaymentAmount: formatMoney(
      sumCreditCardCharges(cardTransactions, priorClosingDate, previousClosingDate),
      true,
    ),
    followingPaymentAmount: formatMoney(
      sumCreditCardCharges(cardTransactions, previousClosingDate, nextClosingDate),
      true,
    ),
  }
}

function sumCreditCardCharges(
  transactions: Transaction[],
  fromExclusive: Date,
  toInclusive: Date,
) {
  return transactions.reduce((total, transaction) => {
    const transactionDate = new Date(`${transaction.transactionDate}T00:00:00`)
    if (transactionDate <= fromExclusive || transactionDate > toInclusive) {
      return total
    }

    if (transaction.transactionType === 'EXPENSE') {
      return total + Number(transaction.amount)
    }

    if (transaction.transactionType === 'INCOME') {
      return total - Number(transaction.amount)
    }

    return total
  }, 0)
}

function formatNextPaymentDate(account: Account) {
  if (account.creditCardProfile == null) {
    return '未設定'
  }

  return formatDateLabel(
    getNextPaymentDate(
      account.creditCardProfile.paymentDay,
      account.creditCardProfile.paymentDateAdjustmentRule,
    ),
  )
}

function getPaymentDateForMonthOffset(
  paymentDay: number,
  adjustmentRule: PaymentDateAdjustmentRule,
  monthOffset: number,
) {
  const today = new Date()
  const candidate = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    clampToMonthEnd(today.getFullYear(), today.getMonth() + monthOffset, paymentDay),
  )

  return adjustBusinessDate(candidate, adjustmentRule)
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

function getPreviousOccurrence(day: number, referenceDate: Date) {
  const candidate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    clampToMonthEnd(referenceDate.getFullYear(), referenceDate.getMonth(), day),
  )

  if (candidate > startOfDay(referenceDate)) {
    candidate.setMonth(candidate.getMonth() - 1)
    candidate.setDate(
      clampToMonthEnd(candidate.getFullYear(), candidate.getMonth(), day),
    )
  }

  return candidate
}

function getNextOccurrence(day: number, referenceDate: Date) {
  const candidate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    clampToMonthEnd(referenceDate.getFullYear(), referenceDate.getMonth(), day),
  )

  if (candidate <= startOfDay(referenceDate)) {
    candidate.setMonth(candidate.getMonth() + 1)
    candidate.setDate(
      clampToMonthEnd(candidate.getFullYear(), candidate.getMonth(), day),
    )
  }

  return candidate
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, value.getDate())
}

function clampToMonthEnd(year: number, month: number, day: number) {
  return Math.min(day, new Date(year, month + 1, 0).getDate())
}

function adjustBusinessDate(date: Date, adjustmentRule: PaymentDateAdjustmentRule) {
  const adjusted = new Date(date)
  if (adjustmentRule === 'NONE') {
    return adjusted
  }

  while (adjusted.getDay() === 0 || adjusted.getDay() === 6) {
    adjusted.setDate(
      adjusted.getDate() + (adjustmentRule === 'NEXT_BUSINESS_DAY' ? 1 : -1),
    )
  }

  return adjusted
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function describeAdjustmentRule(rule: PaymentDateAdjustmentRule) {
  if (rule === 'NEXT_BUSINESS_DAY') {
    return '翌営業日'
  }

  if (rule === 'PREVIOUS_BUSINESS_DAY') {
    return '前営業日'
  }

  return '調整なし'
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

function isGoalBucketFormField(value: string): value is GoalBucketFormField {
  return value === 'accountId' || value === 'bucketName' || value === 'active'
}
