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
import type {
  Category,
  CategoryType,
  CategoryUpsertInput,
  Subcategory,
  SubcategoryUpsertInput,
} from '../../features/category/types/category'
import { fetchGoalBuckets } from '../../features/goalBucket/api/goalBucketApi'
import type { GoalBucket } from '../../features/goalBucket/types/goalBucket'
import { ApiRequestError } from '../../shared/lib/api/client'
import {
  createGoalBucketAllocations,
  createTransaction,
  createTransfer,
  deleteGoalBucketAllocation,
  deleteTransaction,
  fetchGoalBucketAllocations,
  fetchTransactions,
  updateGoalBucketAllocation,
  updateTransaction,
} from '../../features/transaction/api/transactionApi'
import type {
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

type AllocationDraft = { toGoalBucketId: number; value: string }

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
  const [allocationFromGoalBucketId, setAllocationFromGoalBucketId] = useState<number | null>(null)
  const [allocationDate, setAllocationDate] = useState(today)
  const [allocationDescription, setAllocationDescription] = useState('口座配分')
  const [allocationNote, setAllocationNote] = useState('')
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('amount')
  const [allocationBaseAmount, setAllocationBaseAmount] = useState('')
  const [allocationDrafts, setAllocationDrafts] = useState<AllocationDraft[]>([])
  const [transferAllocationMode, setTransferAllocationMode] = useState<AllocationMode>('amount')
  const [transferAllocationDrafts, setTransferAllocationDrafts] = useState<AllocationDraft[]>([])
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null)
  const [editingAllocationId, setEditingAllocationId] = useState<number | null>(null)
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null)
  const [deletingAllocationId, setDeletingAllocationId] = useState<number | null>(null)
  const [quickCategoryForm, setQuickCategoryForm] = useState<CategoryUpsertInput>({
    categoryName: '',
    categoryType: 'EXPENSE',
    displayOrder: 10,
    active: true,
  })
  const [quickSubcategoryForm, setQuickSubcategoryForm] = useState<SubcategoryUpsertInput>({
    categoryId: 0,
    subcategoryName: '',
    displayOrder: 10,
    active: true,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quickSubmitting, setQuickSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [quickCategoryErrorMessage, setQuickCategoryErrorMessage] = useState('')
  const [quickSubcategoryErrorMessage, setQuickSubcategoryErrorMessage] = useState('')

  useEffect(() => {
    void loadPageData()
  }, [])

  const transactionCategories = useMemo(
    () => categories.filter((category) => category.categoryType === (transactionForm.transactionType === 'INCOME' ? 'INCOME' : 'EXPENSE')),
    [categories, transactionForm.transactionType],
  )
  const transactionSubcategories = useMemo(
    () => subcategories.filter((subcategory) => subcategory.categoryId === transactionForm.categoryId),
    [subcategories, transactionForm.categoryId],
  )
  const transferCategories = useMemo(
    () => categories.filter((category) => category.categoryType === 'TRANSFER'),
    [categories],
  )
  const transferSubcategories = useMemo(
    () => subcategories.filter((subcategory) => subcategory.categoryId === transferForm.categoryId),
    [subcategories, transferForm.categoryId],
  )
  const accountGoalBuckets = useMemo(
    () => goalBuckets.filter((goalBucket) => goalBucket.accountId === allocationAccountId),
    [goalBuckets, allocationAccountId],
  )

  async function loadPageData() {
    setLoading(true)
    setErrorMessage('')
    try {
      const [accountData, goalBucketData, categoryData, subcategoryData, transactionData, allocationData] = await Promise.all([
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
      const expenseCategoryId = categoryData.find((category) => category.categoryType === 'EXPENSE')?.categoryId ?? 0
      const transferCategoryId = categoryData.find((category) => category.categoryType === 'TRANSFER')?.categoryId ?? 0
      setTransactionForm((current) => ({ ...current, accountId: current.accountId || defaultAccountId, categoryId: current.categoryId || expenseCategoryId }))
      setTransferForm((current) => ({ ...current, fromAccountId: current.fromAccountId || defaultAccountId, toAccountId: current.toAccountId || accountData[1]?.accountId || defaultAccountId, categoryId: current.categoryId || transferCategoryId }))
      setAllocationAccountId((current) => current || defaultAccountId)
      setAllocationDrafts((current) => current.length > 0 ? current : goalBucketData.filter((goalBucket) => goalBucket.accountId === defaultAccountId).slice(0, 1).map((goalBucket) => ({ toGoalBucketId: goalBucket.goalBucketId, value: '' })))
      setTransferAllocationDrafts((current) => current.length > 0 ? current : goalBucketData.filter((goalBucket) => goalBucket.accountId === (accountData[1]?.accountId || defaultAccountId)).slice(0, 1).map((goalBucket) => ({ toGoalBucketId: goalBucket.goalBucketId, value: '' })))
    } catch {
      setErrorMessage('取引画面の読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  function resetTransactionForm() {
    setEditingTransactionId(null)
    setTransactionForm((current) => ({ ...current, goalBucketId: null, subcategoryId: null, amount: '', description: '', note: '' }))
  }

  function resetAllocationForm() {
    setEditingAllocationId(null)
    setAllocationFromGoalBucketId(null)
    setAllocationDate(today)
    setAllocationDescription('口座配分')
    setAllocationNote('')
    setAllocationMode('amount')
    setAllocationBaseAmount('')
    setAllocationDrafts(accountGoalBuckets.slice(0, 1).map((goalBucket) => ({ toGoalBucketId: goalBucket.goalBucketId, value: '' })))
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      if (editingTransactionId == null) {
        await createTransaction(transactionForm)
      } else {
        await updateTransaction(editingTransactionId, transactionForm)
      }
      await loadPageData()
      resetTransactionForm()
    } catch (error) {
      setErrorMessage(resolveApiErrorMessage(error, '通常取引の保存に失敗しました。'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
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
      setTransferForm((current) => ({ ...current, amount: '', description: '', note: '', fromGoalBucketId: null, subcategoryId: null }))
      setTransferAllocationDrafts([])
    } catch (error) {
      setErrorMessage(resolveApiErrorMessage(error, '振替の保存に失敗しました。'))
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
    setErrorMessage('')
    try {
      if (editingAllocationId == null) {
        await createGoalBucketAllocations(payload)
      } else {
        await updateGoalBucketAllocation(editingAllocationId, payload)
      }
      await loadPageData()
      resetAllocationForm()
    } catch (error) {
      setErrorMessage(resolveApiErrorMessage(error, '配分の保存に失敗しました。'))
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
        setTransactionForm((current) => ({ ...current, categoryId: createdCategory.categoryId, subcategoryId: null }))
      } else {
        setTransferForm((current) => ({ ...current, categoryId: createdCategory.categoryId, subcategoryId: null }))
      }
      setQuickSubcategoryForm((current) => ({ ...current, categoryId: createdCategory.categoryId }))
      setQuickCategoryForm((current) => ({ ...current, categoryName: '' }))
    } catch (error) {
      setQuickCategoryErrorMessage(resolveApiErrorMessage(error, 'カテゴリの追加に失敗しました。'))
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
        setTransactionForm((current) => ({ ...current, categoryId: createdSubcategory.categoryId, subcategoryId: createdSubcategory.subcategoryId }))
      } else {
        setTransferForm((current) => ({ ...current, categoryId: createdSubcategory.categoryId, subcategoryId: createdSubcategory.subcategoryId }))
      }
      setQuickSubcategoryForm((current) => ({ ...current, subcategoryName: '' }))
    } catch (error) {
      setQuickSubcategoryErrorMessage(resolveApiErrorMessage(error, 'サブカテゴリの追加に失敗しました。'))
    } finally {
      setQuickSubmitting(false)
    }
  }

  function handleEditTransaction(transaction: Transaction) {
    if (transaction.transferGroupId) {
      setErrorMessage('振替で作成された取引は個別編集できません。削除は可能です。')
      return
    }
    setActiveTab('transaction')
    setEditingTransactionId(transaction.transactionId)
    setTransactionForm({
      accountId: transaction.accountId,
      goalBucketId: transaction.goalBucketId,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
      transactionType: transaction.transactionType as CreateTransactionInput['transactionType'],
      transactionDate: transaction.transactionDate,
      amount: transaction.amount,
      description: transaction.description,
      note: transaction.note ?? '',
    })
  }

  async function handleDeleteTransaction(transaction: Transaction) {
    if (!window.confirm(transaction.transferGroupId ? `「${transaction.description}」を削除します。振替グループと関連配分も削除されます。` : `「${transaction.description}」を削除します。`)) {
      return
    }
    setDeletingTransactionId(transaction.transactionId)
    try {
      await deleteTransaction(transaction.transactionId)
      await loadPageData()
      if (editingTransactionId === transaction.transactionId) {
        resetTransactionForm()
      }
    } catch (error) {
      setErrorMessage(resolveApiErrorMessage(error, '取引の削除に失敗しました。'))
    } finally {
      setDeletingTransactionId(null)
    }
  }

  function handleEditAllocation(allocation: GoalBucketAllocation) {
    setActiveTab('allocation')
    setEditingAllocationId(allocation.allocationId)
    setAllocationAccountId(allocation.accountId)
    setAllocationFromGoalBucketId(allocation.fromGoalBucketId)
    setAllocationDate(allocation.allocationDate)
    setAllocationDescription(allocation.description)
    setAllocationNote(allocation.note ?? '')
    setAllocationMode('amount')
    setAllocationBaseAmount('')
    setAllocationDrafts([{ toGoalBucketId: allocation.toGoalBucketId ?? 0, value: allocation.amount }])
  }

  async function handleDeleteAllocation(allocation: GoalBucketAllocation) {
    if (!window.confirm(`「${allocation.description}」を削除します。`)) {
      return
    }
    setDeletingAllocationId(allocation.allocationId)
    try {
      await deleteGoalBucketAllocation(allocation.allocationId)
      await loadPageData()
      if (editingAllocationId === allocation.allocationId) {
        resetAllocationForm()
      }
    } catch (error) {
      setErrorMessage(resolveApiErrorMessage(error, '配分の削除に失敗しました。'))
    } finally {
      setDeletingAllocationId(null)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / 取引</p>
        <h1>通常取引、振替、配分をまとめて管理する</h1>
        <p className="lead">登録だけでなく、一覧から編集と削除も行えます。</p>
      </section>

      <section className="panel transaction-panel">
        <div className="inline-tabs">
          <button type="button" className={activeTab === 'transaction' ? 'active' : ''} onClick={() => setActiveTab('transaction')}>通常取引</button>
          <button type="button" className={activeTab === 'transfer' ? 'active' : ''} onClick={() => setActiveTab('transfer')}>振替</button>
          <button type="button" className={activeTab === 'allocation' ? 'active' : ''} onClick={() => setActiveTab('allocation')}>配分</button>
        </div>
        {errorMessage ? <p className="status error">{errorMessage}</p> : null}
        {loading ? <p className="status">読み込み中...</p> : null}

        {activeTab === 'transaction' ? (
          <form className="account-form" onSubmit={handleTransactionSubmit}>
            <div className="section-heading"><h3>{editingTransactionId == null ? '通常取引を登録' : '通常取引を編集'}</h3>{editingTransactionId != null ? <button type="button" className="action-button" onClick={resetTransactionForm}>新規入力に戻す</button> : null}</div>
            <CommonTransactionFields
              form={transactionForm}
              setForm={setTransactionForm}
              accounts={accounts}
              categories={transactionCategories}
              subcategories={transactionSubcategories}
              goalBuckets={goalBuckets.filter((goalBucket) => goalBucket.accountId === transactionForm.accountId)}
            />
            <QuickCreatePanel
              context="transaction"
              categoryOptions={transactionCategories}
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
            <button type="submit" disabled={submitting}>{submitting ? '保存中...' : editingTransactionId == null ? '通常取引を登録' : '通常取引を更新'}</button>
          </form>
        ) : null}

        {activeTab === 'transfer' ? (
          <form className="account-form" onSubmit={handleTransferSubmit}>
            <label>振替元口座<select value={transferForm.fromAccountId} onChange={(event) => setTransferForm((current) => ({ ...current, fromAccountId: Number(event.target.value), fromGoalBucketId: null }))}>{accounts.map((account) => <option key={account.accountId} value={account.accountId}>{account.providerName} / {account.accountName}</option>)}</select></label>
            <label>振替先口座<select value={transferForm.toAccountId} onChange={(event) => setTransferForm((current) => ({ ...current, toAccountId: Number(event.target.value) }))}>{accounts.map((account) => <option key={account.accountId} value={account.accountId}>{account.providerName} / {account.accountName}</option>)}</select></label>
            <label>振替元GoalBucket<select value={transferForm.fromGoalBucketId ?? ''} onChange={(event) => setTransferForm((current) => ({ ...current, fromGoalBucketId: event.target.value ? Number(event.target.value) : null }))}><option value="">未配分から</option>{goalBuckets.filter((goalBucket) => goalBucket.accountId === transferForm.fromAccountId).map((goalBucket) => <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>{goalBucket.bucketName}</option>)}</select></label>
            <label>カテゴリ<select value={transferForm.categoryId} onChange={(event) => setTransferForm((current) => ({ ...current, categoryId: Number(event.target.value), subcategoryId: null }))}>{transferCategories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}</select></label>
            <label>サブカテゴリ<select value={transferForm.subcategoryId ?? ''} onChange={(event) => setTransferForm((current) => ({ ...current, subcategoryId: event.target.value ? Number(event.target.value) : null }))}><option value="">なし</option>{transferSubcategories.map((subcategory) => <option key={subcategory.subcategoryId} value={subcategory.subcategoryId}>{subcategory.subcategoryName}</option>)}</select></label>
            <QuickCreatePanel
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
            <label>振替日<input type="date" value={transferForm.transactionDate} onChange={(event) => setTransferForm((current) => ({ ...current, transactionDate: event.target.value }))} /></label>
            <label>金額<input value={transferForm.amount} onChange={(event) => setTransferForm((current) => ({ ...current, amount: event.target.value }))} placeholder="50000" /></label>
            <label>説明<input value={transferForm.description} onChange={(event) => setTransferForm((current) => ({ ...current, description: event.target.value }))} placeholder="例: 普通口座へ振替" /></label>
            <label>メモ<textarea value={transferForm.note} onChange={(event) => setTransferForm((current) => ({ ...current, note: event.target.value }))} /></label>
            <AllocationFields mode={transferAllocationMode} setMode={setTransferAllocationMode} baseAmount={transferForm.amount} setBaseAmount={() => undefined} drafts={transferAllocationDrafts} setDrafts={setTransferAllocationDrafts} goalBuckets={goalBuckets.filter((goalBucket) => goalBucket.accountId === transferForm.toAccountId)} />
            <button type="submit" disabled={submitting}>{submitting ? '保存中...' : '振替を登録'}</button>
          </form>
        ) : null}

        {activeTab === 'allocation' ? (
          <form className="account-form" onSubmit={handleAllocationSubmit}>
            <div className="section-heading"><h3>{editingAllocationId == null ? '配分を登録' : '配分を編集'}</h3>{editingAllocationId != null ? <button type="button" className="action-button" onClick={resetAllocationForm}>新規入力に戻す</button> : null}</div>
            <label>対象口座<select value={allocationAccountId} onChange={(event) => { setAllocationAccountId(Number(event.target.value)); setAllocationFromGoalBucketId(null) }}>{accounts.map((account) => <option key={account.accountId} value={account.accountId}>{account.providerName} / {account.accountName}</option>)}</select></label>
            <label>配分元<select value={allocationFromGoalBucketId ?? ''} onChange={(event) => setAllocationFromGoalBucketId(event.target.value ? Number(event.target.value) : null)}><option value="">未配分から</option>{accountGoalBuckets.map((goalBucket) => <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>{goalBucket.bucketName}</option>)}</select></label>
            <label>配分日<input type="date" value={allocationDate} onChange={(event) => setAllocationDate(event.target.value)} /></label>
            <label>説明<input value={allocationDescription} onChange={(event) => setAllocationDescription(event.target.value)} /></label>
            <label>メモ<textarea value={allocationNote} onChange={(event) => setAllocationNote(event.target.value)} /></label>
            <AllocationFields mode={allocationMode} setMode={setAllocationMode} baseAmount={allocationBaseAmount} setBaseAmount={setAllocationBaseAmount} drafts={allocationDrafts} setDrafts={setAllocationDrafts} goalBuckets={accountGoalBuckets} />
            <button type="submit" disabled={submitting}>{submitting ? '保存中...' : editingAllocationId == null ? '配分を登録' : '配分を更新'}</button>
          </form>
        ) : null}
      </section>

      <section className="content-grid">
        <section className="panel"><div className="panel-heading"><h2>取引一覧</h2></div><div className="account-list">{transactions.map((transaction) => <article key={transaction.transactionId} className="account-card"><div className="account-card-header"><span className="type-chip">{transaction.transactionType}</span><span className="badge active">{formatMoney(transaction.amount)}</span></div><h3>{transaction.description}</h3><p>{transaction.accountName} / {transaction.categoryName}{transaction.subcategoryName ? ` / ${transaction.subcategoryName}` : ''}</p><p>{transaction.goalBucketName ? `GoalBucket: ${transaction.goalBucketName}` : '未配分'}</p>{transaction.transferGroupId ? <p>振替グループ {transaction.transferGroupId}</p> : null}<div className="category-actions"><button type="button" className="action-button" disabled={Boolean(transaction.transferGroupId)} onClick={() => handleEditTransaction(transaction)}>編集</button><button type="button" className="action-button danger" disabled={deletingTransactionId === transaction.transactionId} onClick={() => void handleDeleteTransaction(transaction)}>{deletingTransactionId === transaction.transactionId ? '削除中...' : '削除'}</button></div><time dateTime={transaction.transactionDate}>取引日 {transaction.transactionDate}</time></article>)}</div></section>
        <section className="panel"><div className="panel-heading"><h2>配分履歴</h2></div><div className="account-list">{allocations.map((allocation) => <article key={allocation.allocationId} className="account-card"><div className="account-card-header"><span className="type-chip">{formatMoney(allocation.amount)}</span><span className="badge active">{allocation.allocationDate}</span></div><h3>{allocation.description}</h3><p>{allocation.fromGoalBucketName ?? '未配分'} → {allocation.toGoalBucketName ?? '未配分'}</p>{allocation.linkedTransferGroupId ? <p>振替連携 {allocation.linkedTransferGroupId}</p> : null}<div className="category-actions"><button type="button" className="action-button" onClick={() => handleEditAllocation(allocation)}>編集</button><button type="button" className="action-button danger" disabled={deletingAllocationId === allocation.allocationId} onClick={() => void handleDeleteAllocation(allocation)}>{deletingAllocationId === allocation.allocationId ? '削除中...' : '削除'}</button></div></article>)}</div></section>
      </section>
    </main>
  )
}

type CommonTransactionFieldsProps = {
  form: CreateTransactionInput
  setForm: Dispatch<SetStateAction<CreateTransactionInput>>
  accounts: Account[]
  categories: Category[]
  subcategories: Subcategory[]
  goalBuckets: GoalBucket[]
}

function CommonTransactionFields({ form, setForm, accounts, categories, subcategories, goalBuckets }: CommonTransactionFieldsProps) {
  return (
    <>
      <label>口座<select value={form.accountId} onChange={(event) => setForm((current) => ({ ...current, accountId: Number(event.target.value), goalBucketId: null }))}>{accounts.map((account) => <option key={account.accountId} value={account.accountId}>{account.providerName} / {account.accountName}</option>)}</select></label>
      <label>取引種別<select value={form.transactionType} onChange={(event) => setForm((current) => ({ ...current, transactionType: event.target.value as CreateTransactionInput['transactionType'], categoryId: 0, subcategoryId: null }))}><option value="EXPENSE">支出</option><option value="INCOME">収入</option></select></label>
      <label>GoalBucket<select value={form.goalBucketId ?? ''} onChange={(event) => setForm((current) => ({ ...current, goalBucketId: event.target.value ? Number(event.target.value) : null }))}><option value="">未配分</option>{goalBuckets.map((goalBucket) => <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>{goalBucket.bucketName}</option>)}</select></label>
      <label>カテゴリ<select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: Number(event.target.value), subcategoryId: null }))}>{categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}</select></label>
      <label>サブカテゴリ<select value={form.subcategoryId ?? ''} onChange={(event) => setForm((current) => ({ ...current, subcategoryId: event.target.value ? Number(event.target.value) : null }))}><option value="">なし</option>{subcategories.map((subcategory) => <option key={subcategory.subcategoryId} value={subcategory.subcategoryId}>{subcategory.subcategoryName}</option>)}</select></label>
      <label>取引日<input type="date" value={form.transactionDate} onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))} /></label>
      <label>金額<input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="2800" /></label>
      <label>説明<input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="例: ホテル朝食" /></label>
      <label>メモ<textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
    </>
  )
}

type QuickCreatePanelProps = {
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

function QuickCreatePanel(props: QuickCreatePanelProps) {
  const { context, categoryOptions, quickCategoryForm, quickSubcategoryForm, quickCategoryErrorMessage, quickSubcategoryErrorMessage, quickSubmitting, onQuickCategoryFormChange, onQuickSubcategoryFormChange, onQuickCreateCategory, onQuickCreateSubcategory } = props
  return (
    <div className="quick-create-panel">
      <p className="eyebrow">候補になければその場で追加</p>
      <div className="quick-create-grid">
        <label>新規カテゴリ<input value={quickCategoryForm.categoryName} onChange={(event) => onQuickCategoryFormChange((current) => ({ ...current, categoryName: event.target.value }))} maxLength={100} /></label>
        <label>種別<select value={quickCategoryForm.categoryType} onChange={(event) => onQuickCategoryFormChange((current) => ({ ...current, categoryType: event.target.value as CategoryType }))}><option value="EXPENSE">支出</option><option value="INCOME">収入</option><option value="TRANSFER">振替</option></select></label>
        <button type="button" disabled={quickSubmitting || !quickCategoryForm.categoryName.trim()} onClick={() => void onQuickCreateCategory(context)}>追加</button>
      </div>
      {quickCategoryErrorMessage ? <p className="field-error">{quickCategoryErrorMessage}</p> : null}
      <div className="quick-create-grid">
        <label>新規サブカテゴリ<input value={quickSubcategoryForm.subcategoryName} onChange={(event) => onQuickSubcategoryFormChange((current) => ({ ...current, subcategoryName: event.target.value }))} maxLength={100} /></label>
        <label>親カテゴリ<select value={quickSubcategoryForm.categoryId} onChange={(event) => onQuickSubcategoryFormChange((current) => ({ ...current, categoryId: Number(event.target.value) }))}><option value={0}>選択してください</option>{categoryOptions.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}</select></label>
        <button type="button" disabled={quickSubmitting || !quickSubcategoryForm.subcategoryName.trim() || !quickSubcategoryForm.categoryId} onClick={() => void onQuickCreateSubcategory(context)}>追加</button>
      </div>
      {quickSubcategoryErrorMessage ? <p className="field-error">{quickSubcategoryErrorMessage}</p> : null}
    </div>
  )
}

type AllocationFieldsProps = {
  mode: AllocationMode
  setMode: Dispatch<SetStateAction<AllocationMode>>
  baseAmount: string
  setBaseAmount: (value: string) => void
  drafts: AllocationDraft[]
  setDrafts: Dispatch<SetStateAction<AllocationDraft[]>>
  goalBuckets: GoalBucket[]
}

function AllocationFields({ mode, setMode, baseAmount, setBaseAmount, drafts, setDrafts, goalBuckets }: AllocationFieldsProps) {
  return (
    <div className="allocation-editor">
      <div className="inline-tabs"><button type="button" className={mode === 'amount' ? 'active' : ''} onClick={() => setMode('amount')}>金額指定</button><button type="button" className={mode === 'ratio' ? 'active' : ''} onClick={() => setMode('ratio')}>割合指定</button></div>
      {mode === 'ratio' ? <label>配分元の合計額<input value={baseAmount} onChange={(event) => setBaseAmount(event.target.value)} placeholder="50000" /></label> : null}
      <div className="subform-grid">{drafts.map((draft, index) => <div key={`${draft.toGoalBucketId}-${index}`} className="allocation-row"><select value={draft.toGoalBucketId} onChange={(event) => setDrafts((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, toGoalBucketId: Number(event.target.value) } : item))}>{goalBuckets.map((goalBucket) => <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>{goalBucket.bucketName}</option>)}</select><input value={draft.value} onChange={(event) => setDrafts((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, value: event.target.value } : item))} placeholder={mode === 'amount' ? '30000' : '60'} /><button type="button" onClick={() => setDrafts((current) => current.filter((_, currentIndex) => currentIndex !== index))}>削除</button></div>)}</div>
      <button type="button" onClick={() => setDrafts((current) => [...current, { toGoalBucketId: goalBuckets[0]?.goalBucketId ?? 0, value: '' }])}>配分先を追加</button>
    </div>
  )
}

function buildAllocationPayload(accountId: number, fromGoalBucketId: number | null, allocationDate: string, description: string, note: string, mode: AllocationMode, drafts: AllocationDraft[], baseAmount: string, linkedTransferGroupId?: string): CreateGoalBucketAllocationsInput | null {
  const allocations = drafts.filter((draft) => draft.toGoalBucketId && draft.value).map((draft) => ({ toGoalBucketId: draft.toGoalBucketId, amount: mode === 'amount' ? draft.value : ((Number(baseAmount) * Number(draft.value)) / 100).toFixed(2) })).filter((allocation) => Number(allocation.amount) > 0)
  if (allocations.length === 0) {
    return null
  }
  return { accountId, fromGoalBucketId, allocationDate, description, note, linkedTransferGroupId, allocations }
}

function resolveApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return error.message
  }
  return fallback
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(Number(value))
}
