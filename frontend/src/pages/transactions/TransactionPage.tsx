import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { fetchAccounts } from '../../features/account/api/accountApi'
import type { Account } from '../../features/account/types/account'
import {
  createCategory,
  createSubcategory,
  fetchCategories,
  fetchSubcategories,
} from '../../features/category/api/categoryApi'
import {
  categoryTypeLabels,
  type Category,
  type CategoryType,
  type CategoryUpsertInput,
  type Subcategory,
  type SubcategoryUpsertInput,
} from '../../features/category/types/category'
import { fetchGoalBuckets } from '../../features/goalBucket/api/goalBucketApi'
import type { GoalBucket } from '../../features/goalBucket/types/goalBucket'
import { ApiRequestError } from '../../shared/lib/api/client'
import {
  createGoalBucketAllocations,
  createTransaction,
  createTransfer,
  fetchGoalBucketAllocations,
  fetchTransactions,
} from '../../features/transaction/api/transactionApi'
import type {
  AllocationDraft,
  CreateGoalBucketAllocationsInput,
  CreateTransactionInput,
  CreateTransferInput,
  GoalBucketAllocation,
  Transaction,
} from '../../features/transaction/types/transaction'

type TransactionTab = 'transaction' | 'transfer' | 'allocation'
type AllocationMode = 'amount' | 'ratio'
type QuickCreateContext = 'transaction' | 'transfer'

const today = new Date().toISOString().slice(0, 10)

const initialTransactionForm: CreateTransactionInput = {
  accountId: 0,
  goalBucketId: null,
  categoryId: 0,
  subcategoryId: null,
  transactionType: 'EXPENSE',
  transactionDate: today,
  amount: '',
  description: '',
  note: '',
}

const initialTransferForm: CreateTransferInput = {
  fromAccountId: 0,
  toAccountId: 0,
  fromGoalBucketId: null,
  categoryId: 0,
  subcategoryId: null,
  transactionDate: today,
  amount: '',
  description: '',
  note: '',
}

const initialQuickCategoryForm: CategoryUpsertInput = {
  categoryName: '',
  categoryType: 'EXPENSE',
  displayOrder: 10,
  active: true,
}

const initialQuickSubcategoryForm: SubcategoryUpsertInput = {
  categoryId: 0,
  subcategoryName: '',
  displayOrder: 10,
  active: true,
}

export function TransactionPage() {
  const [activeTab, setActiveTab] = useState<TransactionTab>('transaction')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goalBuckets, setGoalBuckets] = useState<GoalBucket[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allocations, setAllocations] = useState<GoalBucketAllocation[]>([])
  const [transactionForm, setTransactionForm] = useState(initialTransactionForm)
  const [transferForm, setTransferForm] = useState(initialTransferForm)
  const [allocationAccountId, setAllocationAccountId] = useState(0)
  const [allocationFromGoalBucketId, setAllocationFromGoalBucketId] = useState<
    number | null
  >(null)
  const [allocationDate, setAllocationDate] = useState(today)
  const [allocationDescription, setAllocationDescription] = useState('口座内配分')
  const [allocationNote, setAllocationNote] = useState('')
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('amount')
  const [allocationBaseAmount, setAllocationBaseAmount] = useState('')
  const [allocationDrafts, setAllocationDrafts] = useState<AllocationDraft[]>([])
  const [transferAllocationMode, setTransferAllocationMode] =
    useState<AllocationMode>('amount')
  const [transferAllocationDrafts, setTransferAllocationDrafts] = useState<
    AllocationDraft[]
  >([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [quickCategoryForm, setQuickCategoryForm] = useState(initialQuickCategoryForm)
  const [quickSubcategoryForm, setQuickSubcategoryForm] = useState(initialQuickSubcategoryForm)
  const [quickCategoryErrorMessage, setQuickCategoryErrorMessage] = useState('')
  const [quickSubcategoryErrorMessage, setQuickSubcategoryErrorMessage] = useState('')
  const [quickSubmitting, setQuickSubmitting] = useState(false)

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    setLoading(true)
    setErrorMessage('')

    try {
      const [
        accountData,
        goalBucketData,
        categoryData,
        subcategoryData,
        transactionData,
        allocationData,
      ] = await Promise.all([
        fetchAccounts(),
        fetchGoalBuckets(),
        fetchCategories(undefined, true),
        fetchSubcategories(undefined, true),
        fetchTransactions(),
        fetchGoalBucketAllocations(),
      ])

      setAccounts(accountData)
      setGoalBuckets(goalBucketData)
      setCategories(categoryData)
      setSubcategories(subcategoryData)
      setTransactions(transactionData)
      setAllocations(allocationData)

      const defaultAccountId = accountData[0]?.accountId ?? 0
      const expenseCategory =
        categoryData.find((category) => category.categoryType === 'EXPENSE')
          ?.categoryId ?? 0
      const transferCategory =
        categoryData.find((category) => category.categoryType === 'TRANSFER')
          ?.categoryId ?? 0

      setTransactionForm((current) => ({
        ...current,
        accountId: current.accountId || defaultAccountId,
        categoryId: current.categoryId || expenseCategory,
      }))
      setTransferForm((current) => ({
        ...current,
        fromAccountId: current.fromAccountId || defaultAccountId,
        toAccountId: current.toAccountId || accountData[1]?.accountId || defaultAccountId,
        categoryId: current.categoryId || transferCategory,
      }))
      setAllocationAccountId((current) => current || defaultAccountId)
      setAllocationDrafts((current) =>
        current.length > 0
          ? current
          : goalBucketData
              .filter((goalBucket) => goalBucket.accountId === defaultAccountId)
              .slice(0, 1)
              .map((goalBucket) => ({ toGoalBucketId: goalBucket.goalBucketId, value: '' })),
      )
      setTransferAllocationDrafts((current) =>
        current.length > 0
          ? current
          : goalBucketData
              .filter(
                (goalBucket) =>
                  goalBucket.accountId ===
                  (accountData[1]?.accountId || defaultAccountId),
              )
              .slice(0, 1)
              .map((goalBucket) => ({ toGoalBucketId: goalBucket.goalBucketId, value: '' })),
      )
    } catch {
      setErrorMessage('取引画面の取得に失敗しました。バックエンドの状態を確認してください。')
    } finally {
      setLoading(false)
    }
  }

  const transactionCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.categoryType ===
          (transactionForm.transactionType === 'INCOME' ? 'INCOME' : 'EXPENSE'),
      ),
    [categories, transactionForm.transactionType],
  )

  const transactionSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.categoryId === transactionForm.categoryId,
      ),
    [subcategories, transactionForm.categoryId],
  )

  const transferCategories = useMemo(
    () => categories.filter((category) => category.categoryType === 'TRANSFER'),
    [categories],
  )

  const transferSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) => subcategory.categoryId === transferForm.categoryId,
      ),
    [subcategories, transferForm.categoryId],
  )

  const accountGoalBuckets = useMemo(
    () =>
      goalBuckets.filter((goalBucket) => goalBucket.accountId === allocationAccountId),
    [goalBuckets, allocationAccountId],
  )

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await createTransaction(transactionForm)
      await loadPageData()
      setTransactionForm((current) => ({
        ...current,
        amount: '',
        description: '',
        note: '',
        goalBucketId: null,
        subcategoryId: null,
      }))
    } catch {
      setErrorMessage('通常取引の登録に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const transfer = await createTransfer(transferForm)
      const payload = buildAllocationPayload(
        transferForm.toAccountId,
        null,
        transferForm.transactionDate,
        transferForm.description,
        transferForm.note,
        transferAllocationMode,
        transferAllocationDrafts,
        transferForm.amount,
        transfer.transferGroupId,
      )

      if (payload) {
        await createGoalBucketAllocations(payload)
      }

      await loadPageData()
      setTransferForm((current) => ({
        ...current,
        amount: '',
        description: '',
        note: '',
        fromGoalBucketId: null,
        subcategoryId: null,
      }))
      setTransferAllocationDrafts([])
    } catch {
      setErrorMessage('振替・振込の登録に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAllocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = buildAllocationPayload(
      allocationAccountId,
      allocationFromGoalBucketId,
      allocationDate,
      allocationDescription,
      allocationNote,
      allocationMode,
      allocationDrafts,
      allocationBaseAmount,
    )

    if (!payload) {
      setErrorMessage('配分先と金額を入力してください。')
      return
    }

    setSubmitting(true)
    try {
      await createGoalBucketAllocations(payload)
      await loadPageData()
      setAllocationDrafts([])
      setAllocationBaseAmount('')
      setAllocationNote('')
    } catch {
      setErrorMessage('配分の登録に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleQuickCreateCategory(context: QuickCreateContext) {
    setQuickSubmitting(true)
    setQuickCategoryErrorMessage('')

    try {
      const createdCategory = await createCategory(quickCategoryForm)
      await loadPageData()

      if (context === 'transaction') {
        setTransactionForm((current) => ({
          ...current,
          categoryId: createdCategory.categoryId,
          subcategoryId: null,
        }))
      } else {
        setTransferForm((current) => ({
          ...current,
          categoryId: createdCategory.categoryId,
          subcategoryId: null,
        }))
      }

      setQuickSubcategoryForm((current) => ({
        ...current,
        categoryId: createdCategory.categoryId,
      }))
      setQuickCategoryForm((current) => ({
        ...current,
        categoryName: '',
      }))
    } catch (error) {
      setQuickCategoryErrorMessage(resolveQuickCreateErrorMessage(error))
    } finally {
      setQuickSubmitting(false)
    }
  }

  async function handleQuickCreateSubcategory(context: QuickCreateContext) {
    setQuickSubmitting(true)
    setQuickSubcategoryErrorMessage('')

    try {
      const createdSubcategory = await createSubcategory(quickSubcategoryForm)
      await loadPageData()

      if (context === 'transaction') {
        setTransactionForm((current) => ({
          ...current,
          categoryId: createdSubcategory.categoryId,
          subcategoryId: createdSubcategory.subcategoryId,
        }))
      } else {
        setTransferForm((current) => ({
          ...current,
          categoryId: createdSubcategory.categoryId,
          subcategoryId: createdSubcategory.subcategoryId,
        }))
      }

      setQuickSubcategoryForm((current) => ({
        ...current,
        subcategoryName: '',
      }))
    } catch (error) {
      setQuickSubcategoryErrorMessage(resolveQuickCreateErrorMessage(error))
    } finally {
      setQuickSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / 取引</p>
        <h1>通常取引、振替、配分をまとめて記録する</h1>
        <p className="lead">
          残高確認、口座間振替、GoalBucket への配分を同じ画面で進められます。
        </p>
        <div className="hero-stats account-summary-grid">
          {accounts.map((account) => (
            <article key={account.accountId}>
              <span>
                {account.providerName} / {account.accountName}
              </span>
              <strong>{formatMoney(account.currentBalance)}</strong>
              <small>未配分 {formatMoney(account.unallocatedBalance)}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel transaction-panel">
        <div className="inline-tabs">
          <button
            type="button"
            className={activeTab === 'transaction' ? 'active' : ''}
            onClick={() => setActiveTab('transaction')}
          >
            通常取引
          </button>
          <button
            type="button"
            className={activeTab === 'transfer' ? 'active' : ''}
            onClick={() => setActiveTab('transfer')}
          >
            振替・振込
          </button>
          <button
            type="button"
            className={activeTab === 'allocation' ? 'active' : ''}
            onClick={() => setActiveTab('allocation')}
          >
            配分
          </button>
        </div>

        {errorMessage ? <p className="status error">{errorMessage}</p> : null}
        {loading ? <p className="status">読み込み中...</p> : null}

        {activeTab === 'transaction' ? (
          <form className="account-form" onSubmit={handleTransactionSubmit}>
            {renderCommonTransactionFields(
              transactionForm,
              setTransactionForm,
              accounts,
              transactionCategories,
              transactionSubcategories,
              goalBuckets.filter(
                (goalBucket) => goalBucket.accountId === transactionForm.accountId,
              ),
              {
                context: 'transaction',
                quickCategoryForm,
                quickSubcategoryForm,
                quickCategoryErrorMessage,
                quickSubcategoryErrorMessage,
                quickSubmitting,
                onQuickCategoryFormChange: setQuickCategoryForm,
                onQuickSubcategoryFormChange: setQuickSubcategoryForm,
                onQuickCreateCategory: handleQuickCreateCategory,
                onQuickCreateSubcategory: handleQuickCreateSubcategory,
              },
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? '登録中...' : '通常取引を登録'}
            </button>
          </form>
        ) : null}

        {activeTab === 'transfer' ? (
          <form className="account-form" onSubmit={handleTransferSubmit}>
            <label>
              振替元口座
              <select
                value={transferForm.fromAccountId}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    fromAccountId: Number(event.target.value),
                    fromGoalBucketId: null,
                  }))
                }
              >
                {accounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.providerName} / {account.accountName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              振替先口座
              <select
                value={transferForm.toAccountId}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    toAccountId: Number(event.target.value),
                  }))
                }
              >
                {accounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.providerName} / {account.accountName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              振替元 GoalBucket
              <select
                value={transferForm.fromGoalBucketId ?? ''}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    fromGoalBucketId: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              >
                <option value="">未配分から</option>
                {goalBuckets
                  .filter(
                    (goalBucket) =>
                      goalBucket.accountId === transferForm.fromAccountId,
                  )
                  .map((goalBucket) => (
                    <option
                      key={goalBucket.goalBucketId}
                      value={goalBucket.goalBucketId}
                    >
                      {goalBucket.bucketName}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              カテゴリ
              <select
                value={transferForm.categoryId}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    categoryId: Number(event.target.value),
                    subcategoryId: null,
                  }))
                }
              >
                {transferCategories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </label>
            <QuickCategoryCreator
              context="transfer"
              categoryOptions={transferCategories}
              quickCategoryForm={quickCategoryForm}
              quickSubcategoryForm={quickSubcategoryForm}
              quickCategoryErrorMessage={quickCategoryErrorMessage}
              quickSubcategoryErrorMessage={quickSubcategoryErrorMessage}
              quickSubmitting={quickSubmitting}
              onQuickCategoryFormChange={setQuickCategoryForm}
              onQuickSubcategoryFormChange={setQuickSubcategoryForm}
              onQuickCreateCategory={handleQuickCreateCategory}
              onQuickCreateSubcategory={handleQuickCreateSubcategory}
            />
            <label>
              サブカテゴリ
              <select
                value={transferForm.subcategoryId ?? ''}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    subcategoryId: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
              >
                <option value="">なし</option>
                {transferSubcategories.map((subcategory) => (
                  <option
                    key={subcategory.subcategoryId}
                    value={subcategory.subcategoryId}
                  >
                    {subcategory.subcategoryName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              振替日
              <input
                type="date"
                value={transferForm.transactionDate}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    transactionDate: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              金額
              <input
                value={transferForm.amount}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="50000"
              />
            </label>
            <label>
              説明
              <input
                value={transferForm.description}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="旅行用口座へ振替"
              />
            </label>
            <label>
              メモ
              <textarea
                value={transferForm.note}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
              />
            </label>

            <AllocationEditor
              title="振替後に同時配分"
              mode={transferAllocationMode}
              onModeChange={setTransferAllocationMode}
              baseAmount={transferForm.amount}
              onBaseAmountChange={() => undefined}
              drafts={transferAllocationDrafts}
              onDraftsChange={setTransferAllocationDrafts}
              goalBuckets={goalBuckets.filter(
                (goalBucket) => goalBucket.accountId === transferForm.toAccountId,
              )}
            />

            <button type="submit" disabled={submitting}>
              {submitting ? '登録中...' : '振替・振込を登録'}
            </button>
          </form>
        ) : null}

        {activeTab === 'allocation' ? (
          <form className="account-form" onSubmit={handleAllocationSubmit}>
            <label>
              対象口座
              <select
                value={allocationAccountId}
                onChange={(event) => {
                  setAllocationAccountId(Number(event.target.value))
                  setAllocationFromGoalBucketId(null)
                }}
              >
                {accounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.providerName} / {account.accountName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              配分元
              <select
                value={allocationFromGoalBucketId ?? ''}
                onChange={(event) =>
                  setAllocationFromGoalBucketId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
              >
                <option value="">未配分から</option>
                {accountGoalBuckets.map((goalBucket) => (
                  <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>
                    {goalBucket.bucketName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              配分日
              <input
                type="date"
                value={allocationDate}
                onChange={(event) => setAllocationDate(event.target.value)}
              />
            </label>
            <label>
              説明
              <input
                value={allocationDescription}
                onChange={(event) => setAllocationDescription(event.target.value)}
              />
            </label>
            <label>
              メモ
              <textarea
                value={allocationNote}
                onChange={(event) => setAllocationNote(event.target.value)}
              />
            </label>

            <AllocationEditor
              title="配分先"
              mode={allocationMode}
              onModeChange={setAllocationMode}
              baseAmount={allocationBaseAmount}
              onBaseAmountChange={setAllocationBaseAmount}
              drafts={allocationDrafts}
              onDraftsChange={setAllocationDrafts}
              goalBuckets={accountGoalBuckets}
            />

            <button type="submit" disabled={submitting}>
              {submitting ? '登録中...' : '配分を登録'}
            </button>
          </form>
        ) : null}
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">取引一覧</p>
            <h2>登録済み明細</h2>
          </div>
          <div className="account-list">
            {transactions.map((transaction) => (
              <article key={transaction.transactionId} className="account-card">
                <div className="account-card-header">
                  <span className="type-chip">{transaction.transactionType}</span>
                  <span className="badge active">
                    {formatMoney(transaction.amount)}
                  </span>
                </div>
                <h3>{transaction.description}</h3>
                <p>
                  {transaction.accountName} / {transaction.categoryName}
                  {transaction.subcategoryName ? ` / ${transaction.subcategoryName}` : ''}
                </p>
                <p>
                  {transaction.goalBucketName
                    ? `GoalBucket: ${transaction.goalBucketName}`
                    : '未配分'}
                </p>
                <time dateTime={transaction.transactionDate}>
                  取引日 {transaction.transactionDate}
                </time>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">配分履歴</p>
            <h2>GoalBucket 配分</h2>
          </div>
          <div className="account-list">
            {allocations.map((allocation) => (
              <article key={allocation.allocationId} className="account-card">
                <div className="account-card-header">
                  <span className="type-chip">{formatMoney(allocation.amount)}</span>
                  <span className="badge active">{allocation.allocationDate}</span>
                </div>
                <h3>{allocation.description}</h3>
                <p>
                  {allocation.fromGoalBucketName ?? '未配分'} →{' '}
                  {allocation.toGoalBucketName ?? '未配分'}
                </p>
                {allocation.linkedTransferGroupId ? (
                  <p>振替連携 {allocation.linkedTransferGroupId}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

type AllocationEditorProps = {
  title: string
  mode: AllocationMode
  onModeChange: (mode: AllocationMode) => void
  baseAmount: string
  onBaseAmountChange: (value: string) => void
  drafts: AllocationDraft[]
  onDraftsChange: (drafts: AllocationDraft[]) => void
  goalBuckets: GoalBucket[]
}

function AllocationEditor({
  title,
  mode,
  onModeChange,
  baseAmount,
  onBaseAmountChange,
  drafts,
  onDraftsChange,
  goalBuckets,
}: AllocationEditorProps) {
  return (
    <div className="allocation-editor">
      <div className="panel-heading">
        <p className="eyebrow">{title}</p>
        <h2>複数配分</h2>
      </div>
      <div className="inline-tabs">
        <button
          type="button"
          className={mode === 'amount' ? 'active' : ''}
          onClick={() => onModeChange('amount')}
        >
          金額指定
        </button>
        <button
          type="button"
          className={mode === 'ratio' ? 'active' : ''}
          onClick={() => onModeChange('ratio')}
        >
          割合指定
        </button>
      </div>
      {mode === 'ratio' ? (
        <label>
          配分元金額
          <input
            value={baseAmount}
            onChange={(event) => onBaseAmountChange(event.target.value)}
            placeholder="50000"
          />
        </label>
      ) : null}
      <div className="subform-grid">
        {drafts.map((draft, index) => (
          <div key={`${draft.toGoalBucketId}-${index}`} className="allocation-row">
            <select
              value={draft.toGoalBucketId}
              onChange={(event) =>
                onDraftsChange(
                  drafts.map((current, currentIndex) =>
                    currentIndex === index
                      ? {
                          ...current,
                          toGoalBucketId: Number(event.target.value),
                        }
                      : current,
                  ),
                )
              }
            >
              {goalBuckets.map((goalBucket) => (
                <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>
                  {goalBucket.bucketName}
                </option>
              ))}
            </select>
            <input
              value={draft.value}
              onChange={(event) =>
                onDraftsChange(
                  drafts.map((current, currentIndex) =>
                    currentIndex === index
                      ? {
                          ...current,
                          value: event.target.value,
                        }
                      : current,
                  ),
                )
              }
              placeholder={mode === 'amount' ? '30000' : '60'}
            />
            <button
              type="button"
              onClick={() =>
                onDraftsChange(
                  drafts.filter((_, currentIndex) => currentIndex !== index),
                )
              }
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onDraftsChange([
            ...drafts,
            {
              toGoalBucketId: goalBuckets[0]?.goalBucketId ?? 0,
              value: '',
            },
          ])
        }
      >
        配分先を追加
      </button>
    </div>
  )
}

function renderCommonTransactionFields(
  form: CreateTransactionInput,
  setForm: Dispatch<SetStateAction<CreateTransactionInput>>,
  accounts: Account[],
  categories: Category[],
  subcategories: Subcategory[],
  goalBuckets: GoalBucket[],
  quickCreateProps: QuickCreateSharedProps,
) {
  return (
    <>
      <label>
        口座
        <select
          value={form.accountId}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              accountId: Number(event.target.value),
              goalBucketId: null,
            }))
          }
        >
          {accounts.map((account) => (
            <option key={account.accountId} value={account.accountId}>
              {account.providerName} / {account.accountName}
            </option>
          ))}
        </select>
      </label>
      <label>
        取引種別
        <select
          value={form.transactionType}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              transactionType: event.target.value as CreateTransactionInput['transactionType'],
              categoryId: 0,
              subcategoryId: null,
            }))
          }
        >
          <option value="EXPENSE">支出</option>
          <option value="INCOME">収入</option>
        </select>
      </label>
      <label>
        GoalBucket
        <select
          value={form.goalBucketId ?? ''}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              goalBucketId: event.target.value ? Number(event.target.value) : null,
            }))
          }
        >
          <option value="">未配分</option>
          {goalBuckets.map((goalBucket) => (
            <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>
              {goalBucket.bucketName}
            </option>
          ))}
        </select>
      </label>
      <label>
        カテゴリ
        <select
          value={form.categoryId}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              categoryId: Number(event.target.value),
              subcategoryId: null,
            }))
          }
        >
          {categories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
      </label>
      <QuickCategoryCreator
        {...quickCreateProps}
        categoryOptions={categories}
      />
      <label>
        サブカテゴリ
        <select
          value={form.subcategoryId ?? ''}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              subcategoryId: event.target.value ? Number(event.target.value) : null,
            }))
          }
        >
          <option value="">なし</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.subcategoryId} value={subcategory.subcategoryId}>
              {subcategory.subcategoryName}
            </option>
          ))}
        </select>
      </label>
      <label>
        取引日
        <input
          type="date"
          value={form.transactionDate}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              transactionDate: event.target.value,
            }))
          }
        />
      </label>
      <label>
        金額
        <input
          value={form.amount}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              amount: event.target.value,
            }))
          }
          placeholder="2800"
        />
      </label>
      <label>
        説明
        <input
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="ホテル朝食"
        />
      </label>
      <label>
        メモ
        <textarea
          value={form.note}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              note: event.target.value,
            }))
          }
        />
      </label>
    </>
  )
}

type QuickCategoryCreatorProps = {
  context: QuickCreateContext
  categoryOptions: Category[]
  quickCategoryForm: CategoryUpsertInput
  quickSubcategoryForm: SubcategoryUpsertInput
  quickCategoryErrorMessage: string
  quickSubcategoryErrorMessage: string
  quickSubmitting: boolean
  onQuickCategoryFormChange: Dispatch<SetStateAction<CategoryUpsertInput>>
  onQuickSubcategoryFormChange: Dispatch<SetStateAction<SubcategoryUpsertInput>>
  onQuickCreateCategory: (context: QuickCreateContext) => Promise<void>
  onQuickCreateSubcategory: (context: QuickCreateContext) => Promise<void>
}

type QuickCreateSharedProps = Omit<QuickCategoryCreatorProps, 'categoryOptions'>

function QuickCategoryCreator({
  context,
  categoryOptions,
  quickCategoryForm,
  quickSubcategoryForm,
  quickCategoryErrorMessage,
  quickSubcategoryErrorMessage,
  quickSubmitting,
  onQuickCategoryFormChange,
  onQuickSubcategoryFormChange,
  onQuickCreateCategory,
  onQuickCreateSubcategory,
}: QuickCategoryCreatorProps) {
  return (
    <div className="quick-create-panel">
      <p className="eyebrow">候補になければその場で追加</p>
      <div className="quick-create-grid">
        <label>
          新規カテゴリ名
          <input
            value={quickCategoryForm.categoryName}
            onChange={(event) =>
              onQuickCategoryFormChange((current) => ({
                ...current,
                categoryName: event.target.value,
              }))
            }
            placeholder="例: 日用品"
            maxLength={100}
          />
        </label>
        <label>
          種別
          <select
            value={quickCategoryForm.categoryType}
            onChange={(event) =>
              onQuickCategoryFormChange((current) => ({
                ...current,
                categoryType: event.target.value as CategoryType,
              }))
            }
          >
            {Object.entries(categoryTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={quickSubmitting || !quickCategoryForm.categoryName.trim()}
          onClick={() => void onQuickCreateCategory(context)}
        >
          カテゴリを追加
        </button>
      </div>
      {quickCategoryErrorMessage ? (
        <p className="field-error">{quickCategoryErrorMessage}</p>
      ) : null}

      <div className="quick-create-grid">
        <label>
          新規サブカテゴリ名
          <input
            value={quickSubcategoryForm.subcategoryName}
            onChange={(event) =>
              onQuickSubcategoryFormChange((current) => ({
                ...current,
                subcategoryName: event.target.value,
              }))
            }
            placeholder="例: ドラッグストア"
            maxLength={100}
          />
        </label>
        <label>
          親カテゴリ
          <select
            value={quickSubcategoryForm.categoryId}
            onChange={(event) =>
              onQuickSubcategoryFormChange((current) => ({
                ...current,
                categoryId: Number(event.target.value),
              }))
            }
          >
            <option value={0}>親カテゴリを選択</option>
            {categoryOptions.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.categoryName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={
            quickSubmitting ||
            !quickSubcategoryForm.subcategoryName.trim() ||
            !quickSubcategoryForm.categoryId
          }
          onClick={() => void onQuickCreateSubcategory(context)}
        >
          サブカテゴリを追加
        </button>
      </div>
      {quickSubcategoryErrorMessage ? (
        <p className="field-error">{quickSubcategoryErrorMessage}</p>
      ) : null}
    </div>
  )
}

function buildAllocationPayload(
  accountId: number,
  fromGoalBucketId: number | null,
  allocationDate: string,
  description: string,
  note: string,
  mode: AllocationMode,
  drafts: AllocationDraft[],
  baseAmount: string,
  linkedTransferGroupId?: string,
): CreateGoalBucketAllocationsInput | null {
  const allocations = drafts
    .filter((draft) => draft.toGoalBucketId && draft.value)
    .map((draft) => ({
      toGoalBucketId: draft.toGoalBucketId,
      amount:
        mode === 'amount'
          ? draft.value
          : ((Number(baseAmount) * Number(draft.value)) / 100).toFixed(2),
    }))
    .filter((allocation) => Number(allocation.amount) > 0)

  if (allocations.length === 0) {
    return null
  }

  return {
    accountId,
    fromGoalBucketId,
    allocationDate,
    description,
    note,
    linkedTransferGroupId,
    allocations,
  }
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function resolveQuickCreateErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error.message
  }

  return 'その場登録に失敗しました。入力内容とバックエンドの状態を確認してください。'
}
