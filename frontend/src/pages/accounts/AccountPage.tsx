import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  updateAccount,
} from '../../features/account/api/accountApi'
import { fetchGoalBuckets } from '../../features/goalBucket/api/goalBucketApi'
import type { GoalBucket } from '../../features/goalBucket/types/goalBucket'
import { AccountForm } from '../../features/account/components/AccountForm'
import { AccountList } from '../../features/account/components/AccountList'
import { fetchTransactions } from '../../features/transaction/api/transactionApi'
import type { Transaction } from '../../features/transaction/types/transaction'
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
type AccountListView = 'ALL' | 'OPERATIONAL' | 'CREDIT_CARD'
type CreditCardBillingSummary = {
  closingDayLabel: string
  paymentDayLabel: string
  nextClosingDate: string
  nextPaymentDate: string
  followingPaymentDate: string
  nextPaymentAmount: string
  followingPaymentAmount: string
}

export function AccountPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goalBuckets, setGoalBuckets] = useState<GoalBucket[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
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
  const [accountListView, setAccountListView] = useState<AccountListView>('ALL')
  const [mobileDetailVisible, setMobileDetailVisible] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AccountFormField, string>>
  >({})
  const [modalOpen, setModalOpen] = useState(false)
  const hasActiveFilters =
    keyword.trim().length > 0 ||
    statusFilter !== 'ALL' ||
    sortOption !== 'DISPLAY_ORDER'

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
  const visibleActiveCount = filteredAccounts.filter((account) => account.active).length
  const visibleInactiveCount = filteredAccounts.length - visibleActiveCount
  const selectedListCount =
    accountListView === 'OPERATIONAL'
      ? operationalAccounts.length
      : accountListView === 'CREDIT_CARD'
        ? creditCardAccounts.length
        : filteredAccounts.length
  const selectedGoalBuckets =
    selectedAccount == null || selectedAccount.accountCategory === 'CREDIT_CARD'
      ? []
      : goalBuckets
          .filter((goalBucket) => goalBucket.accountId === selectedAccount.accountId)
          .sort(
            (left, right) =>
              Number(right.currentBalance) - Number(left.currentBalance) ||
              left.bucketName.localeCompare(right.bucketName, 'ja'),
          )
  const selectedTransactions =
    selectedAccount == null
      ? []
      : transactions
          .filter((transaction) => transaction.accountId === selectedAccount.accountId)
          .sort(compareTransactions)
  const selectedLinkedCreditCards =
    selectedAccount == null || selectedAccount.accountCategory === 'CREDIT_CARD'
      ? []
      : accounts
          .filter(
            (account) =>
              account.accountCategory === 'CREDIT_CARD' &&
              account.creditCardProfile?.paymentAccountId === selectedAccount.accountId,
          )
          .sort((left, right) => left.displayOrder - right.displayOrder)
  const selectedBillingSummary =
    selectedAccount?.accountCategory === 'CREDIT_CARD'
      ? buildCreditCardBillingSummary(selectedAccount, transactions)
      : null

  useEffect(() => {
    setSelectedAccountId((current) => {
      if (filteredAccounts.length === 0) {
        setMobileDetailVisible(false)
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
      const [accountData, goalBucketData, transactionData] = await Promise.all([
        fetchAccounts(),
        fetchGoalBuckets(),
        fetchTransactions(),
      ])
      setAccounts(accountData)
      setGoalBuckets(goalBucketData)
      setTransactions(transactionData)
      setSelectedAccountId((current) => {
        if (accountData.length === 0) {
          return null
        }

        if (
          current != null &&
          accountData.some((account) => account.accountId === current)
        ) {
          return current
        }

        return accountData[0].accountId
      })
    } catch {
      setErrorMessage(
        '口座詳細に必要なデータの取得に失敗しました。バックエンドの状態を確認してください。',
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

  function resetFilters() {
    setKeyword('')
    setStatusFilter('ALL')
    setSortOption('DISPLAY_ORDER')
  }

  function handleSelectAccount(account: Account) {
    setSelectedAccountId(account.accountId)

    if (!window.matchMedia('(max-width: 960px)').matches) {
      return
    }

    setMobileDetailVisible(true)
    window.requestAnimationFrame(() => {
      document
        .getElementById('selected-account-detail')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function scrollToSelectedAccountDetail() {
    document
      .getElementById('selected-account-detail')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleReturnToAccountList() {
    setMobileDetailVisible(false)

    window.requestAnimationFrame(() => {
      document
        .getElementById('account-list-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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
              <span>表示内訳</span>
              <strong>
                {operationalAccounts.length} / {creditCardAccounts.length}
              </strong>
              <p>左から順に、預金・現金系口座数とクレジットカード数です。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>状態内訳</span>
              <strong>
                {visibleActiveCount} / {visibleInactiveCount}
              </strong>
              <p>左から順に、有効口座数と停止口座数です。</p>
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
        <section
          id="selected-account-detail"
          className={`panel account-detail-panel ${mobileDetailVisible ? 'mobile-detail-visible' : 'mobile-detail-hidden'}`}
        >
          <div className="panel-heading">
            <p className="eyebrow">Selected Account</p>
            <h2>選択中の口座詳細</h2>
            <p className="lead dashboard-section-lead">
              一覧から選んだ口座に対して、関連する目的別口座、引き落とし情報、最近の取引をまとめて確認できます。
            </p>
          </div>

          <div className="mobile-detail-toolbar">
            <button
              type="button"
              className="secondary"
              onClick={handleReturnToAccountList}
            >
              一覧に戻る
            </button>
            <p>同じページのまま一覧位置へ戻せます。</p>
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
                  className="action-button mobile-back-button"
                  onClick={handleReturnToAccountList}
                >
                  一覧に戻る
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => handleEdit(selectedAccount)}
                >
                  この口座を編集
                </button>
              </div>

              {selectedAccount.accountCategory === 'CREDIT_CARD' &&
              selectedBillingSummary != null ? (
                <>
                  <section className="account-detail-section">
                    <div className="section-heading">
                      <div>
                        <h3>支払サイクル</h3>
                        <p className="section-description">
                          締め日と支払日を基準に、次回以降の予定を確認できます。
                        </p>
                      </div>
                    </div>
                    <dl className="balance-pairs compact">
                      <div>
                        <dt>締め日</dt>
                        <dd>{selectedBillingSummary.closingDayLabel}</dd>
                      </div>
                      <div>
                        <dt>支払日</dt>
                        <dd>{selectedBillingSummary.paymentDayLabel}</dd>
                      </div>
                      <div>
                        <dt>次の締め日</dt>
                        <dd>{selectedBillingSummary.nextClosingDate}</dd>
                      </div>
                      <div>
                        <dt>次の支払日</dt>
                        <dd>{selectedBillingSummary.nextPaymentDate}</dd>
                      </div>
                      <div>
                        <dt>次々回支払日</dt>
                        <dd>{selectedBillingSummary.followingPaymentDate}</dd>
                      </div>
                      <div>
                        <dt>次回支払額</dt>
                        <dd>{selectedBillingSummary.nextPaymentAmount}</dd>
                      </div>
                      <div>
                        <dt>次々回支払額</dt>
                        <dd>{selectedBillingSummary.followingPaymentAmount}</dd>
                      </div>
                    </dl>
                    <p className="account-meta-note">
                      支払額は登録済みのカード利用履歴から見た見込みです。振替による返済額は含めていません。
                    </p>
                  </section>
                  <section className="account-detail-section">
                    <div className="section-heading">
                      <div>
                        <h3>関連取引</h3>
                        <p className="section-description">
                          直近のカード利用を時系列で確認できます。
                        </p>
                      </div>
                    </div>
                    <TransactionSummaryList transactions={selectedTransactions} />
                  </section>
                </>
              ) : null}

              {selectedAccount.accountCategory !== 'CREDIT_CARD' ? (
                <>
                  <section className="account-detail-section">
                    <div className="section-heading">
                      <div>
                        <h3>紐づく目的別口座</h3>
                        <p className="section-description">
                          この口座配下で管理している残高のまとまりです。
                        </p>
                      </div>
                    </div>
                    {selectedGoalBuckets.length === 0 ? (
                      <p className="status">紐づく目的別口座はまだありません。</p>
                    ) : (
                      <div className="detail-chip-list">
                        {selectedGoalBuckets.map((goalBucket) => (
                          <article key={goalBucket.goalBucketId} className="detail-chip-card">
                            <strong>{goalBucket.bucketName}</strong>
                            <span>{formatMoney(goalBucket.currentBalance)}</span>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="account-detail-section">
                    <div className="section-heading">
                      <div>
                        <h3>引き落とし対象カード</h3>
                        <p className="section-description">
                          この口座から支払う設定のクレジットカードと、次回引き落とし予定を確認できます。
                        </p>
                      </div>
                    </div>
                    {selectedLinkedCreditCards.length === 0 ? (
                      <p className="status">この口座を引き落とし元にしているカードはありません。</p>
                    ) : (
                      <div className="detail-list">
                        {selectedLinkedCreditCards.map((creditCard) => (
                          <article key={creditCard.accountId} className="detail-list-item">
                            <div>
                              <h4>{creditCard.accountName}</h4>
                              <p>{creditCard.providerName}</p>
                            </div>
                            <dl className="detail-inline-stats">
                              <div>
                                <dt>次回支払日</dt>
                                <dd>{formatNextPaymentDate(creditCard)}</dd>
                              </div>
                              <div>
                                <dt>次回引き落とし見込み</dt>
                                <dd>{formatMoney(creditCard.currentBalance, true)}</dd>
                              </div>
                            </dl>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="account-detail-section">
                    <div className="section-heading">
                      <div>
                        <h3>関連取引</h3>
                        <p className="section-description">
                          最近の入出金や振替を確認できます。
                        </p>
                      </div>
                    </div>
                    <TransactionSummaryList transactions={selectedTransactions} />
                  </section>
                </>
              ) : null}
            </article>
          )}
        </section>

        <section
          id="account-list-panel"
          className={`panel account-list-panel ${mobileDetailVisible ? 'mobile-list-hidden' : 'mobile-list-visible'}`}
        >
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
            {hasActiveFilters ? (
              <button type="button" className="secondary" onClick={resetFilters}>
                条件をクリア
              </button>
            ) : null}
          </div>

          <div className="account-filter-summary" aria-live="polite">
            <span>表示中 {filteredAccounts.length} 件</span>
            <span>有効 {visibleActiveCount} 件</span>
            <span>停止 {visibleInactiveCount} 件</span>
            <span>預金・現金など {operationalAccounts.length} 件</span>
            <span>クレジットカード {creditCardAccounts.length} 件</span>
          </div>

          <div
            className="inline-tabs account-list-tabs"
            role="tablist"
            aria-label="口座一覧の表示切り替え"
          >
            <button
              type="button"
              className={accountListView === 'ALL' ? 'active' : ''}
              onClick={() => setAccountListView('ALL')}
            >
              すべて
              <span>{filteredAccounts.length}</span>
            </button>
            <button
              type="button"
              className={accountListView === 'OPERATIONAL' ? 'active' : ''}
              onClick={() => setAccountListView('OPERATIONAL')}
            >
              銀行口座
              <span>{operationalAccounts.length}</span>
            </button>
            <button
              type="button"
              className={accountListView === 'CREDIT_CARD' ? 'active' : ''}
              onClick={() => setAccountListView('CREDIT_CARD')}
            >
              クレジットカード
              <span>{creditCardAccounts.length}</span>
            </button>
          </div>

          {selectedAccount != null ? (
            <div className="selected-account-jump">
              <p>
                選択中: <strong>{selectedAccount.accountName}</strong>
              </p>
              <button
                type="button"
                className="secondary"
                onClick={scrollToSelectedAccountDetail}
              >
                詳細へ移動
              </button>
            </div>
          ) : null}

          {errorMessage ? <p className="status error">{errorMessage}</p> : null}
          {loading ? <p className="status">読み込み中...</p> : null}

          {!loading && !errorMessage ? (
            <div className="account-section-stack">
              <div className="account-section-summary">
                <p>現在の表示: {selectedListCount} 件</p>
                <p>
                  一覧から口座を選ぶと、固定表示している詳細カードの内容が切り替わります。
                </p>
              </div>
              <AccountList
                title="預金・現金など"
                description="銀行口座、現金、電子マネーなどをまとめて確認します。"
                variant="operational"
                accounts={
                  accountListView === 'CREDIT_CARD' ? [] : operationalAccounts
                }
                allAccounts={accounts}
                emptyMessage="条件に合う預金・現金系の口座はありません。"
                deletingAccountId={deletingAccountId}
                selectedAccountId={selectedAccountId}
                onSelectDetail={handleSelectAccount}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <AccountList
                title="クレジットカード"
                description="請求額、次回支払日、引き落とし口座を先に見られるようにしています。"
                variant="creditCard"
                accounts={
                  accountListView === 'OPERATIONAL' ? [] : creditCardAccounts
                }
                allAccounts={accounts}
                emptyMessage="条件に合うクレジットカードはありません。"
                deletingAccountId={deletingAccountId}
                selectedAccountId={selectedAccountId}
                onSelectDetail={handleSelectAccount}
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
          isEditing={editingAccountId != null}
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

  return buildKeywordText(account)
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

function buildKeywordText(account: Account) {
  return [
    account.providerName,
    account.accountName,
    account.accountCategory === 'CREDIT_CARD' ? 'クレジットカード' : '預金 現金 電子マネー',
    account.creditCardProfile?.paymentAccountId != null
      ? `payment-account-${account.creditCardProfile.paymentAccountId}`
      : '',
  ]
    .join(' ')
    .trim()
}

function TransactionSummaryList({
  transactions,
}: {
  transactions: Transaction[]
}) {
  if (transactions.length === 0) {
    return <p className="status">紐づく取引はまだありません。</p>
  }

  return (
    <div className="detail-list">
      {transactions.slice(0, 5).map((transaction) => (
        <article key={transaction.transactionId} className="detail-list-item">
          <div>
            <h4>{transaction.description}</h4>
            <p>
              {transaction.categoryName}
              {transaction.subcategoryName ? ` / ${transaction.subcategoryName}` : ''}
              {transaction.goalBucketName ? ` / ${transaction.goalBucketName}` : ''}
            </p>
          </div>
          <dl className="detail-inline-stats">
            <div>
              <dt>取引日</dt>
              <dd>{formatDateLabel(transaction.transactionDate)}</dd>
            </div>
            <div>
              <dt>金額</dt>
              <dd>{formatMoneyByTransactionType(transaction)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
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
    paymentDayLabel: `${account.creditCardProfile.paymentDay}日 / ${describeAdjustmentRule(account.creditCardProfile.paymentDateAdjustmentRule)}`,
    nextClosingDate: formatDateLabel(nextClosingDate),
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

function getPaymentDateForMonthOffset(
  paymentDay: number,
  adjustmentRule: PaymentDateAdjustmentRule,
  monthOffset: number,
) {
  const today = new Date()
  const candidate = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    clampToMonthEnd(
      today.getFullYear(),
      today.getMonth() + monthOffset,
      paymentDay,
    ),
  )

  return adjustBusinessDate(candidate, adjustmentRule)
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

function formatMoneyByTransactionType(transaction: Transaction) {
  const sign =
    transaction.transactionType === 'INCOME' || transaction.transactionType === 'TRANSFER_IN'
      ? '+'
      : '-'

  return `${sign}${formatMoney(transaction.amount, true)}`
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

function compareTransactions(left: Transaction, right: Transaction) {
  if (left.transactionDate !== right.transactionDate) {
    return right.transactionDate.localeCompare(left.transactionDate)
  }

  return right.transactionId - left.transactionId
}

function formatMoney(value: string | number, absolute = false) {
  const numericValue = Number(value)

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(absolute ? Math.abs(numericValue) : numericValue)
}

function describeAdjustmentRule(rule: PaymentDateAdjustmentRule) {
  if (rule === 'NEXT_BUSINESS_DAY') {
    return '翌営業日補正'
  }

  if (rule === 'PREVIOUS_BUSINESS_DAY') {
    return '前営業日補正'
  }

  return '補正なし'
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
