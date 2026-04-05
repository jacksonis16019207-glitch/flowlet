import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchAccounts } from '../../features/account/api/accountApi'
import type { Account } from '../../features/account/types/account'
import {
  createGoalBucket,
  deleteGoalBucket,
  fetchGoalBuckets,
  updateGoalBucket,
} from '../../features/goalBucket/api/goalBucketApi'
import { GoalBucketForm } from '../../features/goalBucket/components/GoalBucketForm'
import { GoalBucketList } from '../../features/goalBucket/components/GoalBucketList'
import type {
  CreateGoalBucketInput,
  GoalBucket,
} from '../../features/goalBucket/types/goalBucket'
import {
  fetchGoalBucketAllocations,
  fetchTransactions,
} from '../../features/transaction/api/transactionApi'
import type {
  GoalBucketAllocation,
  Transaction,
} from '../../features/transaction/types/transaction'
import { FormModal } from '../../shared/components/FormModal'
import { ApiRequestError } from '../../shared/lib/api/client'

const emptyForm: CreateGoalBucketInput = {
  accountId: 0,
  bucketName: '',
  active: true,
}

type GoalBucketFormField = keyof CreateGoalBucketInput

export function GoalBucketPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goalBuckets, setGoalBuckets] = useState<GoalBucket[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allocations, setAllocations] = useState<GoalBucketAllocation[]>([])
  const [form, setForm] = useState<CreateGoalBucketInput>(emptyForm)
  const [editingGoalBucketId, setEditingGoalBucketId] = useState<number | null>(
    null,
  )
  const [deletingGoalBucketId, setDeletingGoalBucketId] = useState<number | null>(
    null,
  )
  const [selectedGoalBucketId, setSelectedGoalBucketId] = useState<number | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<GoalBucketFormField, string>>
  >({})
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    void loadPageData()
  }, [])

  useEffect(() => {
    setSelectedGoalBucketId((current) => {
      if (goalBuckets.length === 0) {
        return null
      }

      if (
        current != null &&
        goalBuckets.some((goalBucket) => goalBucket.goalBucketId === current)
      ) {
        return current
      }

      return goalBuckets[0].goalBucketId
    })
  }, [goalBuckets])

  const linkedAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        goalBuckets.some((goalBucket) => goalBucket.accountId === account.accountId),
      ),
    [accounts, goalBuckets],
  )
  const activeGoalBucketCount = goalBuckets.filter((goalBucket) => goalBucket.active).length
  const selectedGoalBucket =
    goalBuckets.find((goalBucket) => goalBucket.goalBucketId === selectedGoalBucketId) ??
    null
  const selectedAccount =
    selectedGoalBucket == null
      ? null
      : accounts.find((account) => account.accountId === selectedGoalBucket.accountId) ??
        null
  const selectedTransactions =
    selectedGoalBucket == null
      ? []
      : transactions
          .filter(
            (transaction) => transaction.goalBucketId === selectedGoalBucket.goalBucketId,
          )
          .sort(compareTransactions)
  const selectedAllocations =
    selectedGoalBucket == null
      ? []
      : allocations
          .filter(
            (allocation) =>
              allocation.fromGoalBucketId === selectedGoalBucket.goalBucketId ||
              allocation.toGoalBucketId === selectedGoalBucket.goalBucketId,
          )
          .sort(compareAllocations)

  async function loadPageData() {
    setLoading(true)
    setErrorMessage('')

    try {
      const [accountData, goalBucketData, transactionData] = await Promise.all([
        fetchAccounts(),
        fetchGoalBuckets(),
        fetchTransactions(),
      ])
      const accountIds = goalBucketData.map((goalBucket) => goalBucket.accountId)
      const uniqueAccountIds = Array.from(new Set(accountIds))
      const allocationGroups = await Promise.all(
        uniqueAccountIds.map((accountId) => fetchGoalBucketAllocations(accountId)),
      )

      setAccounts(accountData)
      setGoalBuckets(goalBucketData)
      setTransactions(transactionData)
      setAllocations(allocationGroups.flat())
      setForm((current) => ({
        accountId: current.accountId || accountData[0]?.accountId || 0,
        bucketName: current.bucketName,
        active: current.active,
      }))
    } catch {
      setErrorMessage(
        '目的別口座の取得に失敗しました。バックエンドの状態を確認してください。',
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
      if (editingGoalBucketId == null) {
        await createGoalBucket(form)
      } else {
        await updateGoalBucket(editingGoalBucketId, form)
      }

      await loadPageData()
      closeModal()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'VALIDATION_ERROR') {
          setSubmitErrorMessage(error.message)
          setFieldErrors(
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
          setModalOpen(true)
          return
        }

        setSubmitErrorMessage(error.message)
        setModalOpen(true)
        return
      }

      setSubmitErrorMessage('目的別口座の保存に失敗しました。')
      setModalOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenCreateModal() {
    setEditingGoalBucketId(null)
    setForm({
      accountId: accounts[0]?.accountId ?? 0,
      bucketName: '',
      active: true,
    })
    setSubmitErrorMessage('')
    setFieldErrors({})
    setModalOpen(true)
  }

  function handleEdit(goalBucket: GoalBucket) {
    setEditingGoalBucketId(goalBucket.goalBucketId)
    setSelectedGoalBucketId(goalBucket.goalBucketId)
    setSubmitErrorMessage('')
    setFieldErrors({})
    setForm({
      accountId: goalBucket.accountId,
      bucketName: goalBucket.bucketName,
      active: goalBucket.active,
    })
    setModalOpen(true)
  }

  async function handleDelete(goalBucket: GoalBucket) {
    const confirmed = window.confirm(
      `「${goalBucket.bucketName}」を削除しますか。通常は元に戻せません。`,
    )

    if (!confirmed) {
      return
    }

    setDeletingGoalBucketId(goalBucket.goalBucketId)
    setErrorMessage('')

    try {
      await deleteGoalBucket(goalBucket.goalBucketId)
      await loadPageData()

      if (editingGoalBucketId === goalBucket.goalBucketId) {
        closeModal()
      }
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

  function closeModal() {
    setEditingGoalBucketId(null)
    setForm({
      accountId: accounts[0]?.accountId ?? 0,
      bucketName: '',
      active: true,
    })
    setSubmitErrorMessage('')
    setFieldErrors({})
    setModalOpen(false)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / goal buckets</p>
        <h1>目的別口座を一覧と詳細で整理する</h1>
        <p className="lead">
          銀行口座ごとのまとまりを一覧で確認し、詳細では関連取引と配分履歴まで追えるようにしています。
        </p>
        <div className="hero-stats account-hero-stats">
          <article>
            <span>目的別口座</span>
            <strong>{goalBuckets.length}</strong>
            <small>残高と親口座を一覧で把握できます。</small>
          </article>
          <article>
            <span>紐づく銀行口座</span>
            <strong>{linkedAccounts.length}</strong>
            <small>目的別口座を持つ実口座の数です。</small>
          </article>
          <article>
            <span>有効 / 停止</span>
            <strong>
              {activeGoalBucketCount} / {goalBuckets.length - activeGoalBucketCount}
            </strong>
            <small>運用中と停止中を同じ画面で見分けられます。</small>
          </article>
        </div>
      </section>

      <section className="content-grid management-focus-grid">
        <section className="panel management-focus-panel">
          <div className="panel-heading">
            <p className="eyebrow">Today Focus</p>
            <h2>目的別口座で先に見るポイント</h2>
          </div>
          <div className="dashboard-focus-list">
            <article className="dashboard-focus-item">
              <span>選択中の口座</span>
              <strong>{selectedGoalBucket?.bucketName ?? '未選択'}</strong>
              <p>詳細カードで関連取引と配分履歴を追えます。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>関連取引</span>
              <strong>{selectedTransactions.length}</strong>
              <p>GoalBucket が付いた最近の取引件数です。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>配分履歴</span>
              <strong>{selectedAllocations.length}</strong>
              <p>未配分との出入りや GoalBucket 間の移動を確認できます。</p>
            </article>
          </div>
        </section>
      </section>

      <section className="content-grid account-overview-grid">
        <section className="panel account-detail-panel">
          <div className="panel-heading">
            <p className="eyebrow">Selected Goal Bucket</p>
            <h2>選択中の目的別口座詳細</h2>
            <p className="lead dashboard-section-lead">
              紐づく銀行口座、関連取引、配分履歴を同じ場所で見て、配分操作の判断をしやすくしています。
            </p>
          </div>

          {selectedGoalBucket == null ? (
            <p className="status">表示できる目的別口座がまだありません。</p>
          ) : (
            <article className="account-detail-card">
              <div className="account-card-header">
                <span
                  className={`badge ${selectedGoalBucket.active ? 'active' : 'inactive'}`}
                >
                  {selectedGoalBucket.active ? '有効' : '停止'}
                </span>
                <span className="type-chip">
                  {selectedAccount == null
                    ? `口座ID #${selectedGoalBucket.accountId}`
                    : `${selectedAccount.providerName} / ${selectedAccount.accountName}`}
                </span>
              </div>
              <h3>{selectedGoalBucket.bucketName}</h3>
              <p className="account-detail-provider">
                紐づく銀行口座: {formatAccountName(selectedAccount, selectedGoalBucket.accountId)}
              </p>
              <dl className="balance-pairs">
                <div>
                  <dt>現在残高</dt>
                  <dd>{formatMoney(selectedGoalBucket.currentBalance)}</dd>
                </div>
                <div>
                  <dt>親口座の未配分</dt>
                  <dd>
                    {selectedAccount == null
                      ? '不明'
                      : formatMoney(selectedAccount.unallocatedBalance)}
                  </dd>
                </div>
                <div>
                  <dt>親口座の残高</dt>
                  <dd>
                    {selectedAccount == null
                      ? '不明'
                      : formatMoney(selectedAccount.currentBalance)}
                  </dd>
                </div>
              </dl>
              <div className="category-actions">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => handleEdit(selectedGoalBucket)}
                >
                  この目的別口座を編集
                </button>
              </div>

              <section className="account-detail-section">
                <div className="section-heading">
                  <div>
                    <h3>紐づく銀行口座</h3>
                    <p className="section-description">
                      どの実口座の資金を見ているかと、その口座に残る未配分を確認できます。
                    </p>
                  </div>
                </div>
                {selectedAccount == null ? (
                  <p className="status">
                    紐づく銀行口座の情報を取得できませんでした。
                  </p>
                ) : (
                  <div className="detail-list">
                    <article className="detail-list-item">
                      <div>
                        <h4>{`${selectedAccount.providerName} / ${selectedAccount.accountName}`}</h4>
                        <p>口座残高と未配分を同じカードで確認できます。</p>
                      </div>
                      <dl className="detail-inline-stats">
                        <div>
                          <dt>口座残高</dt>
                          <dd>{formatMoney(selectedAccount.currentBalance)}</dd>
                        </div>
                        <div>
                          <dt>未配分</dt>
                          <dd>{formatMoney(selectedAccount.unallocatedBalance)}</dd>
                        </div>
                      </dl>
                    </article>
                  </div>
                )}
              </section>

              <section className="account-detail-section">
                <div className="section-heading">
                  <div>
                    <h3>関連取引</h3>
                    <p className="section-description">
                      GoalBucket に紐づいた収入・支出・振替だけを抽出して表示します。
                    </p>
                  </div>
                </div>
                <GoalBucketTransactionList transactions={selectedTransactions} />
              </section>

              <section className="account-detail-section">
                <div className="section-heading">
                  <div>
                    <h3>配分履歴</h3>
                    <p className="section-description">
                      未配分との出入りと GoalBucket 間の移動を、同じ詳細カードで追えるようにしています。
                    </p>
                  </div>
                </div>
                <GoalBucketAllocationList
                  allocations={selectedAllocations}
                  selectedGoalBucket={selectedGoalBucket}
                />
                <p className="account-meta-note">
                  配分操作そのものは明細入力と同じ文脈で判断しやすいよう、詳細で履歴を確認してから取引・配分画面へ移る前提で整理しています。
                </p>
              </section>
            </article>
          )}
        </section>

        <section className="panel account-list-panel">
          <div className="panel-heading">
            <p className="eyebrow">Goal Bucket List</p>
            <h2>銀行口座ごとの目的別口座一覧</h2>
            <p className="lead dashboard-section-lead">
              一覧では `口座名 / 残高 / 紐づく銀行口座` を揃え、銀行口座単位のまとまりで見られるようにしています。
            </p>
          </div>
          <div className="button-row">
            <button type="button" onClick={handleOpenCreateModal}>
              新規目的別口座を追加
            </button>
          </div>
          <GoalBucketList
            goalBuckets={goalBuckets}
            accounts={accounts}
            loading={loading}
            errorMessage={errorMessage}
            deletingGoalBucketId={deletingGoalBucketId}
            selectedGoalBucketId={selectedGoalBucketId}
            onSelectDetail={(goalBucket) => setSelectedGoalBucketId(goalBucket.goalBucketId)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      </section>

      <FormModal
        open={modalOpen}
        title={editingGoalBucketId == null ? '目的別口座を追加' : '目的別口座を編集'}
        description={
          editingGoalBucketId == null
            ? '紐づく銀行口座と口座名を設定して登録します。'
            : '既存の目的別口座の設定を更新します。'
        }
        onClose={closeModal}
      >
        <GoalBucketForm
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

function GoalBucketTransactionList({
  transactions,
}: {
  transactions: Transaction[]
}) {
  if (transactions.length === 0) {
    return <p className="status">この目的別口座に紐づく取引はまだありません。</p>
  }

  return (
    <div className="detail-list">
      {transactions.slice(0, 5).map((transaction) => (
        <article key={transaction.transactionId} className="detail-list-item">
          <div>
            <h4>{transaction.description}</h4>
            <p>
              {transaction.categoryName ?? 'カテゴリ未設定'}
              {transaction.subcategoryName ? ` / ${transaction.subcategoryName}` : ''}
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

function GoalBucketAllocationList({
  allocations,
  selectedGoalBucket,
}: {
  allocations: GoalBucketAllocation[]
  selectedGoalBucket: GoalBucket
}) {
  if (allocations.length === 0) {
    return <p className="status">この目的別口座に関係する配分履歴はまだありません。</p>
  }

  return (
    <div className="detail-list">
      {allocations.slice(0, 5).map((allocation) => (
        <article key={allocation.allocationId} className="detail-list-item">
          <div>
            <h4>{describeAllocationDirection(allocation, selectedGoalBucket.goalBucketId)}</h4>
            <p>{allocation.description}</p>
          </div>
          <dl className="detail-inline-stats">
            <div>
              <dt>配分日</dt>
              <dd>{formatDateLabel(allocation.allocationDate)}</dd>
            </div>
            <div>
              <dt>金額</dt>
              <dd>{formatMoney(allocation.amount)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
}

function describeAllocationDirection(
  allocation: GoalBucketAllocation,
  selectedGoalBucketId: number,
) {
  if (
    allocation.toGoalBucketId === selectedGoalBucketId &&
    allocation.fromGoalBucketId == null
  ) {
    return '未配分から入金'
  }

  if (
    allocation.fromGoalBucketId === selectedGoalBucketId &&
    allocation.toGoalBucketId == null
  ) {
    return '未配分へ戻し'
  }

  if (allocation.toGoalBucketId === selectedGoalBucketId) {
    return `他の GoalBucket から移動: ${allocation.fromGoalBucketName ?? '名称不明'}`
  }

  return `他の GoalBucket へ移動: ${allocation.toGoalBucketName ?? '名称不明'}`
}

function compareTransactions(left: Transaction, right: Transaction) {
  if (left.transactionDate !== right.transactionDate) {
    return right.transactionDate.localeCompare(left.transactionDate)
  }

  return right.transactionId - left.transactionId
}

function compareAllocations(left: GoalBucketAllocation, right: GoalBucketAllocation) {
  if (left.allocationDate !== right.allocationDate) {
    return right.allocationDate.localeCompare(left.allocationDate)
  }

  return right.allocationId - left.allocationId
}

function formatAccountName(account: Account | null, fallbackAccountId: number) {
  if (account == null) {
    return `口座ID #${fallbackAccountId}`
  }

  return `${account.providerName} / ${account.accountName}`
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatMoneyByTransactionType(transaction: Transaction) {
  const sign =
    transaction.transactionType === 'INCOME' ||
    transaction.transactionType === 'TRANSFER_IN'
      ? '+'
      : '-'

  return `${sign}${formatMoney(transaction.amount, true)}`
}

function formatMoney(value: string | number, absolute = false) {
  const numericValue = Number(value)

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(absolute ? Math.abs(numericValue) : numericValue)
}

function isGoalBucketFormField(value: string): value is GoalBucketFormField {
  return value === 'accountId' || value === 'bucketName' || value === 'active'
}
