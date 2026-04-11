import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { fetchAccounts } from '../../features/account/api/accountApi'
import { fetchAppSetting } from '../../features/appSetting/api/appSettingApi'
import type { AppSetting } from '../../features/appSetting/types/appSetting'
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
import { FormModal } from '../../shared/components/FormModal'
import { ApiRequestError } from '../../shared/lib/api/client'
import { resolveContainingMonth, resolveMonthlyPeriod } from '../../shared/lib/monthlyPeriod'
import {
  createGoalBucketAllocations,
  createTransaction,
  createTransfer,
  deleteGoalBucketAllocation,
  deleteTransaction,
  fetchGoalBucketAllocations,
  fetchTransactions,
  updateGoalBucketAllocation,
  updateTransfer,
  updateTransaction,
} from '../../features/transaction/api/transactionApi'
import type {
  CashflowTreatment,
  CreateGoalBucketAllocationsInput,
  CreateTransactionInput,
  CreateTransferInput,
  GoalBucketAllocation,
  Transaction,
  TransactionType,
} from '../../features/transaction/types/transaction'
import { Button } from '../../shared/components/ui/button'
import { Input } from '../../shared/components/ui/input'
import { Select } from '../../shared/components/ui/select'
import { Textarea } from '../../shared/components/ui/textarea'

type TransactionTab = 'transaction' | 'transfer' | 'allocation'
type AllocationMode = 'amount' | 'ratio'
type QuickCreateContext = 'transaction' | 'transfer'
type TransactionFilterType = 'ALL' | TransactionType
type TransactionEntryMode = 'single' | 'batch'

const today = new Date().toISOString().slice(0, 10)
const defaultAppSetting: AppSetting = {
  monthStartDay: 1,
  monthStartAdjustmentRule: 'NONE',
  updatedAt: '',
}

const initialTransactionForm: CreateTransactionInput = {
  accountId: 0,
  goalBucketId: null,
  categoryId: 0,
  subcategoryId: null,
  transactionType: 'EXPENSE',
  cashflowTreatment: 'AUTO',
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
  outgoingCashflowTreatment: 'AUTO',
  incomingCashflowTreatment: 'AUTO',
  amount: '',
  description: '',
  note: '',
}

const cashflowTreatmentOptions: { value: CashflowTreatment; label: string }[] = [
  { value: 'AUTO', label: '自動' },
  { value: 'IGNORE', label: '収支に含めない' },
  { value: 'INCOME', label: '収入として扱う' },
  { value: 'EXPENSE', label: '支出として扱う' },
]

type AllocationDraft = { toGoalBucketId: number; value: string }
type BatchTransactionDraft = {
  id: number
  amount: string
  description: string
  note: string
}

function createBatchTransactionDraft(
  overrides: Partial<BatchTransactionDraft> = {},
): BatchTransactionDraft {
  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    amount: '',
    description: '',
    note: '',
    ...overrides,
  }
}

const transactionTabMeta: {
  key: TransactionTab
  label: string
  description: string
}[] = [
  { key: 'transaction', label: '通常取引', description: '収入と支出を登録します。' },
  {
    key: 'transfer',
    label: '振替',
    description: '口座間の移動と必要な配分をまとめて登録します。',
  },
  {
    key: 'allocation',
    label: '配分',
    description: '口座内の未配分残高を GoalBucket へ振り分けます。',
  },
]

const transactionFilterOptions: { value: TransactionFilterType; label: string }[] = [
  { value: 'ALL', label: 'すべて' },
  { value: 'INCOME', label: '収入' },
  { value: 'EXPENSE', label: '支出' },
  { value: 'TRANSFER_OUT', label: '振替出金' },
  { value: 'TRANSFER_IN', label: '振替入金' },
]

type TransactionPageProps = {
  initialDisplayMonth?: string
}

export function TransactionPage({ initialDisplayMonth }: TransactionPageProps) {
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }
    return window.innerWidth <= 960
  })
  const [activeTab, setActiveTab] = useState<TransactionTab>('transaction')
  const [transactionEntryMode, setTransactionEntryMode] =
    useState<TransactionEntryMode>('single')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [appSetting, setAppSetting] = useState<AppSetting>(defaultAppSetting)
  const [goalBuckets, setGoalBuckets] = useState<GoalBucket[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allocations, setAllocations] = useState<GoalBucketAllocation[]>([])
  const [transactionForm, setTransactionForm] = useState(initialTransactionForm)
  const [batchTransactionDrafts, setBatchTransactionDrafts] = useState<
    BatchTransactionDraft[]
  >([createBatchTransactionDraft()])
  const [transferForm, setTransferForm] = useState(initialTransferForm)
  const [allocationAccountId, setAllocationAccountId] = useState(0)
  const [allocationFromGoalBucketId, setAllocationFromGoalBucketId] = useState<number | null>(null)
  const [allocationDate, setAllocationDate] = useState(today)
  const [allocationDescription, setAllocationDescription] = useState('口座内配分')
  const [allocationNote, setAllocationNote] = useState('')
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('amount')
  const [allocationBaseAmount, setAllocationBaseAmount] = useState('')
  const [allocationDrafts, setAllocationDrafts] = useState<AllocationDraft[]>([])
  const [transferAllocationMode, setTransferAllocationMode] = useState<AllocationMode>('amount')
  const [transferAllocationDrafts, setTransferAllocationDrafts] = useState<AllocationDraft[]>([])
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null)
  const [editingTransferGroupId, setEditingTransferGroupId] = useState<string | null>(null)
  const [editingAllocationId, setEditingAllocationId] = useState<number | null>(null)
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)
  const [selectedAllocationId, setSelectedAllocationId] = useState<number | null>(null)
  const [entryModalOpen, setEntryModalOpen] = useState(false)
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false)
  const [allocationDetailOpen, setAllocationDetailOpen] = useState(false)
  const [displayMonth, setDisplayMonth] = useState(initialDisplayMonth ?? today.slice(0, 7))
  const [transactionFilterType, setTransactionFilterType] = useState<TransactionFilterType>('ALL')
  const [transactionFilterAccountId, setTransactionFilterAccountId] = useState<number>(0)
  const [transactionFilterCategoryId, setTransactionFilterCategoryId] = useState<number>(0)
  const [transactionFilterGoalBucketId, setTransactionFilterGoalBucketId] = useState<number>(0)
  const [transactionFilterKeyword, setTransactionFilterKeyword] = useState('')
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
  const [lastSubmittedTransactionForm, setLastSubmittedTransactionForm] =
    useState<CreateTransactionInput | null>(null)

  useEffect(() => {
    void loadPageData()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 960px)')
    const updateLayout = () => setIsMobileLayout(mediaQuery.matches)

    updateLayout()
    mediaQuery.addEventListener('change', updateLayout)

    return () => {
      mediaQuery.removeEventListener('change', updateLayout)
    }
  }, [])

  useEffect(() => {
    if (!initialDisplayMonth) {
      return
    }

    setDisplayMonth(initialDisplayMonth)
  }, [initialDisplayMonth])

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
  const displayPeriod = useMemo(
    () => resolveMonthlyPeriod(appSetting, displayMonth),
    [appSetting, displayMonth],
  )
  const currentTabMeta =
    transactionTabMeta.find((tab) => tab.key === activeTab) ?? transactionTabMeta[0]
  const entryModalTitle =
    editingTransactionId != null
      ? '取引を編集'
      : editingAllocationId != null
        ? '配分を編集'
        : editingTransferGroupId != null
          ? '振替を編集'
          : currentTabMeta.label
  const sortedTransactions = useMemo(
    () => [...transactions].sort(compareTransactions),
    [transactions],
  )
  const filteredTransactions = useMemo(
    () =>
      sortedTransactions.filter((transaction) => {
        if (
          transaction.transactionDate < displayPeriod.periodStartDate ||
          transaction.transactionDate > displayPeriod.periodEndDate
        ) {
          return false
        }

        if (
          transactionFilterType !== 'ALL' &&
          transaction.transactionType !== transactionFilterType
        ) {
          return false
        }

        if (
          transactionFilterAccountId !== 0 &&
          transaction.accountId !== transactionFilterAccountId
        ) {
          return false
        }

        if (
          transactionFilterCategoryId !== 0 &&
          transaction.categoryId !== transactionFilterCategoryId
        ) {
          return false
        }

        if (
          transactionFilterGoalBucketId !== 0 &&
          transaction.goalBucketId !== transactionFilterGoalBucketId
        ) {
          return false
        }

        const keyword = transactionFilterKeyword.trim().toLowerCase()
        if (!keyword) {
          return true
        }

        const searchTargets = [
          transaction.description,
          transaction.note ?? '',
          transaction.accountName ?? '',
          transaction.categoryName ?? '',
          transaction.subcategoryName ?? '',
          transaction.goalBucketName ?? '',
        ]

        return searchTargets.some((target) => target.toLowerCase().includes(keyword))
      }),
    [
      sortedTransactions,
      displayPeriod.periodEndDate,
      displayPeriod.periodStartDate,
      transactionFilterType,
      transactionFilterAccountId,
      transactionFilterCategoryId,
      transactionFilterGoalBucketId,
      transactionFilterKeyword,
    ],
  )
  const filteredLedgerTransactions = useMemo(() => {
    if (activeTab === 'allocation') {
      return []
    }

    if (activeTab === 'transaction') {
      return filteredTransactions
    }

    return filteredTransactions.filter((transaction) => {
      const isTransfer =
        transaction.transactionType === 'TRANSFER_IN' ||
        transaction.transactionType === 'TRANSFER_OUT' ||
        Boolean(transaction.transferGroupId)

      return isTransfer
    })
  }, [activeTab, filteredTransactions])
  const filteredAllocations = useMemo(
    () =>
      [...allocations]
        .filter((allocation) => {
          if (
            allocation.allocationDate < displayPeriod.periodStartDate ||
            allocation.allocationDate > displayPeriod.periodEndDate
          ) {
            return false
          }

          if (
            transactionFilterAccountId !== 0 &&
            allocation.accountId !== transactionFilterAccountId
          ) {
            return false
          }

          if (transactionFilterGoalBucketId !== 0) {
            const matchedGoalBucket =
              allocation.fromGoalBucketId === transactionFilterGoalBucketId ||
              allocation.toGoalBucketId === transactionFilterGoalBucketId

            if (!matchedGoalBucket) {
              return false
            }
          }

          const keyword = transactionFilterKeyword.trim().toLowerCase()
          if (!keyword) {
            return true
          }

          const searchTargets = [
            allocation.description,
            allocation.note ?? '',
            allocation.fromGoalBucketName ?? '',
            allocation.toGoalBucketName ?? '',
          ]

          return searchTargets.some((target) => target.toLowerCase().includes(keyword))
        })
        .sort(compareAllocations),
    [
      allocations,
      displayPeriod.periodEndDate,
      displayPeriod.periodStartDate,
      transactionFilterAccountId,
      transactionFilterGoalBucketId,
      transactionFilterKeyword,
    ],
  )
  const selectedTransaction =
    filteredLedgerTransactions.find(
      (transaction) => transaction.transactionId === selectedTransactionId,
    ) ?? filteredLedgerTransactions[0] ?? null
  const selectedAllocation =
    filteredAllocations.find((allocation) => allocation.allocationId === selectedAllocationId) ??
    filteredAllocations[0] ??
    null

  useEffect(() => {
    if (filteredLedgerTransactions.length === 0) {
      if (selectedTransactionId != null) {
        setSelectedTransactionId(null)
      }
      return
    }

    const matched = filteredLedgerTransactions.some(
      (transaction) => transaction.transactionId === selectedTransactionId,
    )
    if (!matched) {
      setSelectedTransactionId(filteredLedgerTransactions[0].transactionId)
    }
  }, [filteredLedgerTransactions, selectedTransactionId])

  useEffect(() => {
    if (filteredAllocations.length === 0) {
      if (selectedAllocationId != null) {
        setSelectedAllocationId(null)
      }
      return
    }

    const matched = filteredAllocations.some(
      (allocation) => allocation.allocationId === selectedAllocationId,
    )
    if (!matched) {
      setSelectedAllocationId(filteredAllocations[0].allocationId)
    }
  }, [filteredAllocations, selectedAllocationId])

  async function loadPageData() {
    setLoading(true)
    setErrorMessage('')
    try {
      const [
        appSettingData,
        accountData,
        goalBucketData,
        categoryData,
        subcategoryData,
        transactionData,
        allocationData,
      ] = await Promise.all([
        fetchAppSetting(),
        fetchAccounts(),
        fetchGoalBuckets(),
        fetchCategories(undefined, true),
        fetchSubcategories(undefined, true),
        fetchTransactions(),
        fetchGoalBucketAllocations(),
      ])
      setAppSetting(appSettingData)
      setAccounts(accountData)
      setGoalBuckets(goalBucketData)
      setCategories(categoryData)
      setSubcategories(subcategoryData)
      setTransactions(transactionData)
      setAllocations(allocationData)
      setDisplayMonth(initialDisplayMonth ?? resolveContainingMonth(appSettingData, new Date()))

      const defaultAccountId = accountData[0]?.accountId ?? 0
      const expenseCategoryId =
        categoryData.find((category) => category.categoryType === 'EXPENSE')
          ?.categoryId ?? 0
      const transferCategoryId =
        categoryData.find((category) => category.categoryType === 'TRANSFER')
          ?.categoryId ?? 0
      setTransactionForm((current) => ({
        ...current,
        accountId: current.accountId || defaultAccountId,
        categoryId: current.categoryId || expenseCategoryId,
      }))
      setTransferForm((current) => ({
        ...current,
        fromAccountId: current.fromAccountId || defaultAccountId,
        toAccountId:
          current.toAccountId || accountData[1]?.accountId || defaultAccountId,
        categoryId: current.categoryId || transferCategoryId,
      }))
      setAllocationAccountId((current) => current || defaultAccountId)
      setAllocationDrafts((current) =>
        current.length > 0
          ? current
          : goalBucketData
              .filter((goalBucket) => goalBucket.accountId === defaultAccountId)
              .slice(0, 1)
              .map((goalBucket) => ({
                toGoalBucketId: goalBucket.goalBucketId,
                value: '',
              })),
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
              .map((goalBucket) => ({
                toGoalBucketId: goalBucket.goalBucketId,
                value: '',
              })),
      )
    } catch {
      setErrorMessage('取引画面の読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  function resetTransactionForm() {
    setEditingTransactionId(null)
    setTransactionForm((current) => ({
      ...current,
      goalBucketId: null,
      subcategoryId: null,
      amount: '',
      description: '',
      note: '',
    }))
  }

  function resetTransferForm() {
    setEditingTransferGroupId(null)
    setTransferAllocationMode('amount')
    setTransferForm((current) => ({
      ...current,
      fromGoalBucketId: null,
      subcategoryId: null,
      outgoingCashflowTreatment: 'AUTO',
      incomingCashflowTreatment: 'AUTO',
      amount: '',
      description: '',
      note: '',
    }))
    setTransferAllocationDrafts([])
  }

  function resetBatchTransactionDrafts() {
    setBatchTransactionDrafts([createBatchTransactionDraft()])
  }

  function resetAllocationForm() {
    setEditingAllocationId(null)
    setAllocationFromGoalBucketId(null)
    setAllocationDate(today)
    setAllocationDescription('口座内配分')
    setAllocationNote('')
    setAllocationMode('amount')
    setAllocationBaseAmount('')
    setAllocationDrafts(
      accountGoalBuckets.slice(0, 1).map((goalBucket) => ({
        toGoalBucketId: goalBucket.goalBucketId,
        value: '',
      })),
    )
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (transactionEntryMode === 'batch' && editingTransactionId == null) {
      const validDrafts = batchTransactionDrafts.filter(
        (draft) => draft.amount.trim() && draft.description.trim(),
      )
      if (validDrafts.length === 0) {
        setErrorMessage('一括登録する明細を1件以上入力してください。')
        return
      }

      setSubmitting(true)
      setErrorMessage('')
      try {
        let savedTransaction: Transaction | null = null
        for (const draft of validDrafts) {
          savedTransaction = await createTransaction({
            ...transactionForm,
            amount: draft.amount,
            description: draft.description,
            note: draft.note,
          })
        }
        setLastSubmittedTransactionForm({
          ...transactionForm,
          amount: validDrafts[validDrafts.length - 1].amount,
          description: validDrafts[validDrafts.length - 1].description,
          note: validDrafts[validDrafts.length - 1].note,
        })
        await loadPageData()
        if (savedTransaction) {
          setSelectedTransactionId(savedTransaction.transactionId)
        }
        setEntryModalOpen(false)
        resetBatchTransactionDrafts()
        resetTransactionForm()
      } catch (error) {
        setErrorMessage(
          resolveApiErrorMessage(error, '通常取引の一括登録に失敗しました。'),
        )
      } finally {
        setSubmitting(false)
      }
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    try {
      const savedTransaction =
        editingTransactionId == null
          ? await createTransaction(transactionForm)
          : await updateTransaction(editingTransactionId, transactionForm)
      setLastSubmittedTransactionForm({ ...transactionForm })
      await loadPageData()
      setSelectedTransactionId(savedTransaction.transactionId)
      setEntryModalOpen(false)
      resetTransactionForm()
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, '通常取引の保存に失敗しました。'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    try {
      const transfer =
        editingTransferGroupId == null
          ? await createTransfer(transferForm)
          : await updateTransfer(editingTransferGroupId, transferForm)
      await syncTransferAllocations(transfer.transferGroupId)
      await loadPageData()
      setSelectedTransactionId(transfer.outgoingTransaction.transactionId)
      setEntryModalOpen(false)
      resetTransferForm()
    } catch (error) {
      setErrorMessage(resolveApiErrorMessage(error, '振替の保存に失敗しました。'))
    } finally {
      setSubmitting(false)
    }
  }

  async function syncTransferAllocations(transferGroupId: string) {
    const payload = buildAllocationPayload(
      transferForm.toAccountId,
      null,
      transferForm.transactionDate,
      transferForm.description,
      transferForm.note,
      transferAllocationMode,
      transferAllocationDrafts,
      transferForm.amount,
      transferGroupId,
    )
    const nextAllocations = payload?.allocations ?? []
    const existingLinkedAllocations = allocations.filter(
      (allocation) => allocation.linkedTransferGroupId === transferGroupId,
    )
    const existingByGoalBucketId = new Map(
      existingLinkedAllocations
        .filter(
          (allocation): allocation is GoalBucketAllocation & { toGoalBucketId: number } =>
            allocation.toGoalBucketId != null,
        )
        .map((allocation) => [allocation.toGoalBucketId, allocation]),
    )
    const nextByGoalBucketId = new Map(
      nextAllocations.map((allocation) => [allocation.toGoalBucketId, allocation]),
    )

    for (const allocation of existingLinkedAllocations) {
      if (
        allocation.toGoalBucketId == null ||
        !nextByGoalBucketId.has(allocation.toGoalBucketId)
      ) {
        await deleteGoalBucketAllocation(allocation.allocationId)
      }
    }

    for (const nextAllocation of nextAllocations) {
      const existingAllocation = existingByGoalBucketId.get(nextAllocation.toGoalBucketId)
      const allocationPayload = {
        accountId: transferForm.toAccountId,
        fromGoalBucketId: null,
        allocationDate: transferForm.transactionDate,
        description: transferForm.description,
        note: transferForm.note,
        linkedTransferGroupId: transferGroupId,
        allocations: [nextAllocation],
      }
      if (existingAllocation) {
        await updateGoalBucketAllocation(existingAllocation.allocationId, allocationPayload)
      } else {
        await createGoalBucketAllocations(allocationPayload)
      }
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
      setEntryModalOpen(false)
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
      setQuickCategoryForm((current) => ({ ...current, categoryName: '' }))
    } catch (error) {
      setQuickCategoryErrorMessage(
        resolveApiErrorMessage(error, 'カテゴリの作成に失敗しました。'),
      )
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
      setQuickSubcategoryErrorMessage(
        resolveApiErrorMessage(error, 'サブカテゴリの作成に失敗しました。'),
      )
    } finally {
      setQuickSubmitting(false)
    }
  }

  function handleEditTransaction(transaction: Transaction) {
    if (transaction.transferGroupId) {
      const transferGroupId = transaction.transferGroupId
      const outgoingTransaction = transactions.find(
        (item) =>
          item.transferGroupId === transferGroupId &&
          item.transactionType === 'TRANSFER_OUT',
      )
      const incomingTransaction = transactions.find(
        (item) =>
          item.transferGroupId === transferGroupId &&
          item.transactionType === 'TRANSFER_IN',
      )
      if (!outgoingTransaction || !incomingTransaction) {
        setErrorMessage('振替データの読み込みに失敗しました。一覧を再読み込みしてください。')
        return
      }

      setErrorMessage('')
      setSelectedTransactionId(transaction.transactionId)
      setTransactionDetailOpen(false)
      setActiveTab('transfer')
      setTransactionEntryMode('single')
      setEditingTransactionId(null)
      setEditingTransferGroupId(transferGroupId)
      setTransferAllocationMode('amount')
      setTransferForm({
        fromAccountId: outgoingTransaction.accountId,
        toAccountId: incomingTransaction.accountId,
        fromGoalBucketId: outgoingTransaction.goalBucketId,
        categoryId: outgoingTransaction.categoryId,
        subcategoryId: outgoingTransaction.subcategoryId,
        transactionDate: outgoingTransaction.transactionDate,
        outgoingCashflowTreatment: outgoingTransaction.cashflowTreatment,
        incomingCashflowTreatment: incomingTransaction.cashflowTreatment,
        amount: outgoingTransaction.amount,
        description: outgoingTransaction.description,
        note: outgoingTransaction.note ?? '',
      })
      setTransferAllocationDrafts(
        allocations
          .filter((allocation) => allocation.linkedTransferGroupId === transferGroupId)
          .filter(
            (allocation): allocation is GoalBucketAllocation & { toGoalBucketId: number } =>
              allocation.toGoalBucketId != null,
          )
          .map((allocation) => ({
            toGoalBucketId: allocation.toGoalBucketId,
            value: allocation.amount,
          })),
      )
      setEntryModalOpen(true)
      return
    }
    if (transaction.transferGroupId) {
      setErrorMessage(
        '振替で登録された取引は個別編集できません。削除して再登録してください。',
      )
      return
    }
    setEditingTransferGroupId(null)
    setSelectedTransactionId(transaction.transactionId)
    setTransactionDetailOpen(false)
    setActiveTab('transaction')
    setTransactionEntryMode('single')
    setEditingTransactionId(transaction.transactionId)
    setEntryModalOpen(true)
    setTransactionForm({
      accountId: transaction.accountId,
      goalBucketId: transaction.goalBucketId,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
      transactionType: transaction.transactionType as CreateTransactionInput['transactionType'],
      cashflowTreatment: transaction.cashflowTreatment,
      transactionDate: transaction.transactionDate,
      amount: transaction.amount,
      description: transaction.description,
      note: transaction.note ?? '',
    })
  }

  function handleCopyTransaction(transaction: Transaction) {
    if (
      transaction.transactionType !== 'INCOME' &&
      transaction.transactionType !== 'EXPENSE'
    ) {
      setErrorMessage('振替明細は通常取引としてコピーできません。')
      return
    }

    setErrorMessage('')
    setSelectedTransactionId(transaction.transactionId)
    setTransactionDetailOpen(false)
    setActiveTab('transaction')
    setTransactionEntryMode('single')
    setEditingTransactionId(null)
    setEntryModalOpen(true)
    setTransactionForm({
      accountId: transaction.accountId,
      goalBucketId: transaction.goalBucketId,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
      transactionType: transaction.transactionType,
      cashflowTreatment: transaction.cashflowTreatment,
      transactionDate: transaction.transactionDate,
      amount: transaction.amount,
      description: transaction.description,
      note: transaction.note ?? '',
    })
  }

  function handleReuseLastTransactionInput() {
    if (!lastSubmittedTransactionForm) {
      return
    }

    setErrorMessage('')
    setActiveTab('transaction')
    setTransactionEntryMode('single')
    setEditingTransactionId(null)
    setEditingTransferGroupId(null)
    setEntryModalOpen(true)
    setTransactionForm({ ...lastSubmittedTransactionForm })
  }

  function resetTransactionFilters() {
    setTransactionFilterType('ALL')
    setTransactionFilterAccountId(0)
    setTransactionFilterCategoryId(0)
    setTransactionFilterGoalBucketId(0)
    setTransactionFilterKeyword('')
  }

  async function handleDeleteTransaction(transaction: Transaction) {
    const confirmed = window.confirm(
      transaction.transferGroupId
        ? `「${transaction.description}」を削除します。振替グループと関連配分も削除されます。`
        : `「${transaction.description}」を削除します。`,
    )
    if (!confirmed) {
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
    setAllocationDetailOpen(false)
    setEditingTransferGroupId(null)
    setEditingAllocationId(allocation.allocationId)
    setSelectedAllocationId(allocation.allocationId)
    setAllocationAccountId(allocation.accountId)
    setAllocationFromGoalBucketId(allocation.fromGoalBucketId)
    setAllocationDate(allocation.allocationDate)
    setAllocationDescription(allocation.description)
    setAllocationNote(allocation.note ?? '')
    setAllocationMode('amount')
    setAllocationBaseAmount('')
    setAllocationDrafts([
      {
        toGoalBucketId: allocation.toGoalBucketId ?? 0,
        value: allocation.amount,
      },
    ])
    setEntryModalOpen(true)
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

  const hasTransactionFilters =
    transactionFilterType !== 'ALL' ||
    transactionFilterAccountId !== 0 ||
    transactionFilterCategoryId !== 0 ||
    transactionFilterGoalBucketId !== 0 ||
    transactionFilterKeyword.trim() !== ''

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / 取引</p>
        <h1>登録と一覧確認を切り分けて管理する</h1>
        <p className="lead">
          左で入力、中央で一覧、右で詳細を確認できるようにして、日々の更新導線を整理しました。
        </p>
      </section>

      <section className="panel transaction-action-panel">
        <div className="panel-heading">
          <h2>取引アクション</h2>
          <button type="button" onClick={() => setEntryModalOpen(true)}>
            新規登録
          </button>
        </div>
        <p className="section-description">
          通常取引、振替、配分はモーダルで登録できます。
        </p>
      </section>

      <FormModal
        open={entryModalOpen}
        title={entryModalTitle}
        description={currentTabMeta.description}
        eyebrow="Transaction Entry"
        panelClassName="modal-panel-xwide"
        onClose={() => setEntryModalOpen(false)}
      >
      <section className="panel transaction-panel">
        <div className="inline-tabs transaction-tabs">
          {transactionTabMeta.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="transaction-active-summary">
          <p className="eyebrow">Current Flow</p>
          <h2>{currentTabMeta.label}</h2>
          <p>{currentTabMeta.description}</p>
        </div>
        {errorMessage ? <p className="status error">{errorMessage}</p> : null}
        {loading ? <p className="status">読み込み中...</p> : null}

        {activeTab === 'transaction' ? (
          <form className="account-form transaction-form-grid transaction-form-upgraded" onSubmit={handleTransactionSubmit}>
            <div className="section-heading">
              <h3>{editingTransactionId == null ? '通常取引を登録' : '通常取引を編集'}</h3>
              {editingTransactionId != null ? (
                <button type="button" className="action-button" onClick={resetTransactionForm}>
                  新規入力に戻す
                </button>
              ) : null}
            </div>
            <div className="transaction-form-toolbar">
              <div className="inline-tabs transaction-entry-tabs">
                <button
                  type="button"
                  className={transactionEntryMode === 'single' ? 'active' : ''}
                  onClick={() => setTransactionEntryMode('single')}
                >
                  単件入力
                </button>
                <button
                  type="button"
                  className={transactionEntryMode === 'batch' ? 'active' : ''}
                  disabled={editingTransactionId != null}
                  onClick={() => setTransactionEntryMode('batch')}
                >
                  一括入力
                </button>
              </div>
              <div className="transaction-form-actions">
                <button
                  type="button"
                  className="action-button"
                  disabled={!lastSubmittedTransactionForm}
                  onClick={handleReuseLastTransactionInput}
                >
                  前回入力を戻す
                </button>
                {transactionEntryMode === 'batch' ? (
                  <p className="status">共通項目を固定して明細だけ続けて登録できます。</p>
                ) : (
                  <p className="status">明細を1件ずつ登録しつつ、前回入力をすぐ再利用できます。</p>
                )}
              </div>
            </div>
            <CommonTransactionFields
              form={transactionForm}
              setForm={setTransactionForm}
              accounts={accounts}
              categories={transactionCategories}
              subcategories={transactionSubcategories}
              goalBuckets={goalBuckets.filter(
                (goalBucket) => goalBucket.accountId === transactionForm.accountId,
              )}
              showDetailFields={
                !(transactionEntryMode === 'batch' && editingTransactionId == null)
              }
            />
            {transactionEntryMode === 'batch' && editingTransactionId == null ? (
              <BatchTransactionEditor
                drafts={batchTransactionDrafts}
                setDrafts={setBatchTransactionDrafts}
              />
            ) : null}
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
            <Button type="submit" className="transaction-submit-button" disabled={submitting}>
              {submitting
                ? '保存中...'
                : editingTransactionId == null
                  ? '通常取引を登録'
                  : '通常取引を更新'}
            </Button>
          </form>
        ) : null}

        {activeTab === 'transfer' ? (
          <form
            className="account-form transaction-form-grid transaction-form-upgraded"
            onSubmit={handleTransferSubmit}
          >
            <div className="section-heading">
              <h3>振替を登録</h3>
            </div>
            <label className="transaction-field">
              振替元口座
              <Select
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
              </Select>
            </label>
            <label className="transaction-field">
              振替先口座
              <Select
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
              </Select>
            </label>
            <label className="transaction-field">
              振替元 GoalBucket
              <Select
                value={transferForm.fromGoalBucketId ?? ''}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    fromGoalBucketId: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              >
                <option value="">未配分から</option>
                {goalBuckets
                  .filter((goalBucket) => goalBucket.accountId === transferForm.fromAccountId)
                  .map((goalBucket) => (
                    <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>
                      {goalBucket.bucketName}
                    </option>
                  ))}
              </Select>
            </label>
            <label className="transaction-field">
              カテゴリ
              <Select
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
              </Select>
            </label>
            <label className="transaction-field">
              サブカテゴリ
              <Select
                value={transferForm.subcategoryId ?? ''}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    subcategoryId: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              >
                <option value="">なし</option>
                {transferSubcategories.map((subcategory) => (
                  <option key={subcategory.subcategoryId} value={subcategory.subcategoryId}>
                    {subcategory.subcategoryName}
                  </option>
                ))}
              </Select>
            </label>
            <label className="transaction-field">
              振替元の収支集計
              <Select
                value={transferForm.outgoingCashflowTreatment}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    outgoingCashflowTreatment: event.target.value as CashflowTreatment,
                  }))
                }
              >
                {cashflowTreatmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="transaction-field">
              振替先の収支集計
              <Select
                value={transferForm.incomingCashflowTreatment}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    incomingCashflowTreatment: event.target.value as CashflowTreatment,
                  }))
                }
              >
                {cashflowTreatmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
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
            <label className="transaction-field">
              振替日
              <Input
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
            <label className="transaction-field">
              金額
              <Input
                value={transferForm.amount}
                onChange={(event) =>
                  setTransferForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="50000"
              />
            </label>
            <label className="transaction-field">
              説明
              <Input
                value={transferForm.description}
                onChange={(event) =>
                  setTransferForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="例: 生活費口座へ振替"
              />
            </label>
            <label className="transaction-field transaction-field-wide">
              メモ
              <Textarea
                value={transferForm.note}
                onChange={(event) =>
                  setTransferForm((current) => ({ ...current, note: event.target.value }))
                }
              />
            </label>
            <AllocationFields
              mode={transferAllocationMode}
              setMode={setTransferAllocationMode}
              baseAmount={transferForm.amount}
              setBaseAmount={() => undefined}
              drafts={transferAllocationDrafts}
              setDrafts={setTransferAllocationDrafts}
              goalBuckets={goalBuckets.filter(
                (goalBucket) => goalBucket.accountId === transferForm.toAccountId,
              )}
            />
            <Button type="submit" className="transaction-submit-button" disabled={submitting}>
              {submitting ? '保存中...' : '振替を登録'}
            </Button>
          </form>
        ) : null}

        {activeTab === 'allocation' ? (
          <form
            className="account-form transaction-form-grid transaction-form-upgraded"
            onSubmit={handleAllocationSubmit}
          >
            <div className="section-heading">
              <h3>{editingAllocationId == null ? '配分を登録' : '配分を編集'}</h3>
              {editingAllocationId != null ? (
                <button type="button" className="action-button" onClick={resetAllocationForm}>
                  新規入力に戻す
                </button>
              ) : null}
            </div>
            <label className="transaction-field transaction-field-wide">
              対象口座
              <Select
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
              </Select>
            </label>
            <label className="transaction-field">
              配分元
              <Select
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
              </Select>
            </label>
            <label className="transaction-field">
              配分日
              <Input
                type="date"
                value={allocationDate}
                onChange={(event) => setAllocationDate(event.target.value)}
              />
            </label>
            <label className="transaction-field">
              説明
              <Input
                value={allocationDescription}
                onChange={(event) => setAllocationDescription(event.target.value)}
              />
            </label>
            <label className="transaction-field transaction-field-wide">
              メモ
              <Textarea
                value={allocationNote}
                onChange={(event) => setAllocationNote(event.target.value)}
              />
            </label>
            <AllocationFields
              mode={allocationMode}
              setMode={setAllocationMode}
              baseAmount={allocationBaseAmount}
              setBaseAmount={setAllocationBaseAmount}
              drafts={allocationDrafts}
              setDrafts={setAllocationDrafts}
              goalBuckets={accountGoalBuckets}
            />
            <Button type="submit" className="transaction-submit-button" disabled={submitting}>
              {submitting
                ? '保存中...'
                : editingAllocationId == null
                  ? '配分を登録'
                  : '配分を更新'}
            </Button>
          </form>
        ) : null}
      </section>
      </FormModal>

      {activeTab === 'allocation' ? null : (
      <section className="content-grid transaction-workbench-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>取引一覧</h2>
            <span>{filteredTransactions.length} 件</span>
          </div>
          <div className="transaction-month-switcher">
            <button
              type="button"
              className="action-button"
              onClick={() => setDisplayMonth(shiftMonthLabel(displayMonth, -1))}
            >
              {'<'}
            </button>
            <strong>{formatMonthLabel(displayMonth)}</strong>
            <button
              type="button"
              className="action-button"
              onClick={() => setDisplayMonth(shiftMonthLabel(displayMonth, 1))}
            >
              {'>'}
            </button>
          </div>
          <p className="section-description transaction-period-label">
            {formatPeriodLabel(displayPeriod.periodStartDate, displayPeriod.periodEndDate)}
          </p>
          <div className="transaction-filter-grid">
            <label>
              種別
              <select
                value={transactionFilterType}
                onChange={(event) =>
                  setTransactionFilterType(event.target.value as TransactionFilterType)
                }
              >
                {transactionFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              口座
              <select
                value={transactionFilterAccountId}
                onChange={(event) =>
                  setTransactionFilterAccountId(Number(event.target.value))
                }
              >
                <option value={0}>すべての口座</option>
                {accounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.providerName} / {account.accountName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select
                value={transactionFilterCategoryId}
                onChange={(event) =>
                  setTransactionFilterCategoryId(Number(event.target.value))
                }
              >
                <option value={0}>All categories</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Goal Bucket
              <select
                value={transactionFilterGoalBucketId}
                onChange={(event) =>
                  setTransactionFilterGoalBucketId(Number(event.target.value))
                }
              >
                <option value={0}>All goal buckets</option>
                {goalBuckets.map((goalBucket) => (
                  <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>
                    {goalBucket.bucketName}
                  </option>
                ))}
              </select>
            </label>
            <label className="transaction-filter-keyword">
              キーワード
              <input
                value={transactionFilterKeyword}
                onChange={(event) => setTransactionFilterKeyword(event.target.value)}
                placeholder="説明・メモ・カテゴリで検索"
              />
            </label>
          </div>
          <div className="account-filter-summary" aria-live="polite">
            <span>表示中 {filteredTransactions.length} 件</span>
            {transactionFilterType !== 'ALL' ? (
              <span>
                種別:{' '}
                {
                  transactionFilterOptions.find((option) => option.value === transactionFilterType)
                    ?.label
                }
              </span>
            ) : null}
            {transactionFilterAccountId !== 0 ? (
              <span>
                口座:{' '}
                {accounts.find((account) => account.accountId === transactionFilterAccountId)
                  ?.accountName ?? '未選択'}
              </span>
            ) : null}
            {transactionFilterCategoryId !== 0 ? (
              <span>
                Category:{' '}
                {categories.find((category) => category.categoryId === transactionFilterCategoryId)
                  ?.categoryName ?? 'Not selected'}
              </span>
            ) : null}
            {transactionFilterGoalBucketId !== 0 ? (
              <span>
                Goal Bucket:{' '}
                {goalBuckets.find(
                  (goalBucket) => goalBucket.goalBucketId === transactionFilterGoalBucketId,
                )?.bucketName ?? 'Not selected'}
              </span>
            ) : null}
            {transactionFilterKeyword.trim() !== '' ? (
              <span>キーワード: {transactionFilterKeyword.trim()}</span>
            ) : null}
            {hasTransactionFilters ? (
              <button
                type="button"
                className="action-button transaction-filter-reset"
                onClick={resetTransactionFilters}
              >
                条件をクリア
              </button>
            ) : null}
            {isMobileLayout && selectedTransaction ? (
              <button
                type="button"
                className="action-button secondary"
                onClick={() => setTransactionDetailOpen(true)}
              >
                詳細を開く
              </button>
            ) : null}
          </div>
          <div className="transaction-table-shell">
            {filteredLedgerTransactions.length === 0 ? (
              <p className="status">条件に一致する取引はありません。</p>
            ) : (
              <div className="transaction-table-scroll">
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th scope="col">区分</th>
                      <th scope="col">日付</th>
                      <th scope="col">金額</th>
                      <th scope="col">口座</th>
                      <th scope="col">カテゴリ</th>
                      <th scope="col">サブカテゴリ</th>
                      <th scope="col">内容</th>
                      <th scope="col">メモ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedgerTransactions.map((transaction) => {
                      const selected =
                        transaction.transactionId === selectedTransaction?.transactionId
                      const isNonCashflow = transaction.cashflowTreatment === 'IGNORE'

                      return (
                        <tr
                          key={transaction.transactionId}
                          className={`${selected ? 'selected' : ''} ${
                            isNonCashflow ? 'is-non-cashflow' : ''
                          }`.trim()}
                          onClick={() => setSelectedTransactionId(transaction.transactionId)}
                        >
                          <td data-label="区分">
                            <span className="type-chip">
                              {formatTransactionTypeLabel(transaction.transactionType)}
                            </span>
                          </td>
                          <td data-label="日付">
                            <time dateTime={transaction.transactionDate}>
                              {formatDateLabel(transaction.transactionDate)}
                            </time>
                          </td>
                          <td
                            data-label="金額"
                            className={`transaction-money-cell ${
                              transaction.transactionType === 'INCOME' ||
                              transaction.transactionType === 'TRANSFER_IN'
                                ? 'is-positive'
                                : 'is-negative'
                            }`}
                          >
                            {formatSignedMoney(transaction)}
                          </td>
                          <td data-label="口座">
                            {transaction.accountName ?? '未設定'}
                          </td>
                          <td data-label="カテゴリ">{transaction.categoryName ?? '未設定'}</td>
                          <td data-label="サブカテゴリ">
                            {transaction.subcategoryName ?? '-'}
                          </td>
                          <td data-label="内容" className="transaction-description-cell">
                            {transaction.description}
                          </td>
                          <td data-label="メモ" className="transaction-note-cell">
                            {transaction.note?.trim() || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="panel transaction-detail-panel">
          <div className="panel-heading">
            <h2>取引詳細</h2>
          </div>
          {selectedTransaction ? (
            <div className="transaction-detail-stack">
              <div className="transaction-detail-hero">
                <p className="eyebrow">Selected Transaction</p>
                <h3>{selectedTransaction.description}</h3>
                <p>{formatSignedMoney(selectedTransaction)}</p>
              </div>
              <dl className="detail-list">
                <div className="detail-list-item">
                  <dt>取引種別</dt>
                  <dd>{formatTransactionTypeLabel(selectedTransaction.transactionType)}</dd>
                </div>
                <div className="detail-list-item">
                  <dt>口座</dt>
                  <dd>{selectedTransaction.accountName ?? '未設定'}</dd>
                </div>
                <div className="detail-list-item">
                  <dt>GoalBucket</dt>
                  <dd>{selectedTransaction.goalBucketName ?? '未配分'}</dd>
                </div>
                <div className="detail-list-item">
                  <dt>カテゴリ</dt>
                  <dd>
                    {selectedTransaction.categoryName ?? '未設定'}
                    {selectedTransaction.subcategoryName
                      ? ` / ${selectedTransaction.subcategoryName}`
                      : ''}
                  </dd>
                </div>
                <div className="detail-list-item">
                  <dt>取引日</dt>
                  <dd>{formatDateLabel(selectedTransaction.transactionDate)}</dd>
                </div>
                <div className="detail-list-item">
                  <dt>メモ</dt>
                  <dd>{selectedTransaction.note?.trim() || 'なし'}</dd>
                </div>
                <div className="detail-list-item">
                  <dt>作成日時</dt>
                  <dd>{formatDateTimeLabel(selectedTransaction.createdAt)}</dd>
                </div>
                <div className="detail-list-item">
                  <dt>更新日時</dt>
                  <dd>{formatDateTimeLabel(selectedTransaction.updatedAt)}</dd>
                </div>
                {selectedTransaction.transferGroupId ? (
                  <div className="detail-list-item">
                    <dt>振替グループ</dt>
                    <dd>{selectedTransaction.transferGroupId}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="category-actions">
                <button
                  type="button"
                  className="action-button"
                  disabled={Boolean(selectedTransaction.transferGroupId)}
                  onClick={() => handleCopyTransaction(selectedTransaction)}
                >
                  コピーして新規作成
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => handleEditTransaction(selectedTransaction)}
                >
                  編集
                </button>
                <button
                  type="button"
                  className="action-button danger"
                  disabled={deletingTransactionId === selectedTransaction.transactionId}
                  onClick={() => void handleDeleteTransaction(selectedTransaction)}
                >
                  {deletingTransactionId === selectedTransaction.transactionId
                    ? '削除中...'
                    : '削除'}
                </button>
              </div>
              {selectedTransaction.transferGroupId ? (
                <p className="status">
                  振替で登録された明細は一覧から確認できますが、編集はできません。
                </p>
              ) : null}
            </div>
          ) : (
            <p className="status">一覧から取引を選択すると詳細を表示します。</p>
          )}
        </section>
      </section>
      )}

      {activeTab !== 'allocation' ? null : (
      <section className="content-grid transaction-workbench-grid transaction-allocation-grid">
      <section className="panel transaction-allocation-panel">
        <div className="panel-heading">
          <h2>直近の配分</h2>
          <span>{filteredAllocations.length} 件</span>
        </div>
        <div className="account-list">
          {filteredAllocations.length === 0 ? (
            <p className="status">配分はまだありません。</p>
          ) : (
            filteredAllocations.map((allocation) => (
              <article
                key={allocation.allocationId}
                className={`account-card${
                  selectedAllocation?.allocationId === allocation.allocationId ? ' selected' : ''
                }`}
              >
                <div className="account-card-header">
                  <span className="type-chip">{formatMoney(allocation.amount)}</span>
                  <span className="badge active">
                    {formatDateLabel(allocation.allocationDate)}
                  </span>
                </div>
                <h3>{allocation.description}</h3>
                <p>
                  {allocation.fromGoalBucketName ?? '未配分'} →{' '}
                  {allocation.toGoalBucketName ?? '未配分'}
                </p>
                {allocation.linkedTransferGroupId ? (
                  <p>振替連携 {allocation.linkedTransferGroupId}</p>
                ) : null}
                <div className="category-actions">
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => {
                      setSelectedAllocationId(allocation.allocationId)
                      if (isMobileLayout) {
                        setAllocationDetailOpen(true)
                      }
                    }}
                  >
                    詳細
                  </button>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => handleEditAllocation(allocation)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="action-button danger"
                    disabled={deletingAllocationId === allocation.allocationId}
                    onClick={() => void handleDeleteAllocation(allocation)}
                  >
                    {deletingAllocationId === allocation.allocationId
                      ? '削除中...'
                      : '削除'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      <section className="panel transaction-detail-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Allocation detail</p>
            <h2>Allocation summary</h2>
          </div>
        </div>
        {selectedAllocation ? (
          <div className="transaction-detail-stack">
            <div className="transaction-detail-hero">
              <p className="eyebrow">Allocation summary</p>
              <h3>{selectedAllocation.description || 'No description'}</h3>
              <p>{formatMoney(selectedAllocation.amount)}</p>
            </div>
            <dl className="detail-list">
              <div className="detail-list-item">
                <dt>Allocation date</dt>
                <dd>{formatDateLabel(selectedAllocation.allocationDate)}</dd>
              </div>
              <div className="detail-list-item">
                <dt>From GoalBucket</dt>
                <dd>{selectedAllocation.fromGoalBucketName ?? 'Unassigned'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>To GoalBucket</dt>
                <dd>{selectedAllocation.toGoalBucketName ?? 'Unassigned'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>Note</dt>
                <dd>{selectedAllocation.note?.trim() || 'None'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>Created at</dt>
                <dd>{formatDateTimeLabel(selectedAllocation.createdAt)}</dd>
              </div>
              <div className="detail-list-item">
                <dt>Updated at</dt>
                <dd>{formatDateTimeLabel(selectedAllocation.updatedAt)}</dd>
              </div>
              {selectedAllocation.linkedTransferGroupId ? (
                <div className="detail-list-item">
                  <dt>Linked transfer group</dt>
                  <dd>{selectedAllocation.linkedTransferGroupId}</dd>
                </div>
              ) : null}
            </dl>
            <div className="category-actions">
              <button
                type="button"
                className="action-button"
                onClick={() => handleEditAllocation(selectedAllocation)}
              >
                編集
              </button>
              <button
                type="button"
                className="action-button danger"
                disabled={deletingAllocationId === selectedAllocation.allocationId}
                onClick={() => void handleDeleteAllocation(selectedAllocation)}
              >
                {deletingAllocationId === selectedAllocation.allocationId
                  ? '削除中...'
                  : '削除'}
              </button>
            </div>
          </div>
        ) : (
          <p className="status">配分を選択すると詳細を表示します。</p>
        )}
      </section>
      </section>
      )}

      <FormModal
        open={isMobileLayout && transactionDetailOpen && selectedTransaction != null}
        title={selectedTransaction?.description ?? '取引詳細'}
        description="取引日、金額、口座、カテゴリ、GoalBucket、更新情報を確認できます。"
        eyebrow="取引詳細"
        panelClassName="modal-panel-wide"
        onClose={() => setTransactionDetailOpen(false)}
      >
        {selectedTransaction == null ? null : (
          <div className="transaction-detail-stack">
            <div className="transaction-detail-hero">
              <p className="eyebrow">取引サマリー</p>
              <h3>{selectedTransaction.description || '説明なし'}</h3>
              <p>{formatSignedMoney(selectedTransaction)}</p>
            </div>
            <dl className="detail-list">
              <div className="detail-list-item">
                <dt>取引種別</dt>
                <dd>{formatTransactionTypeLabel(selectedTransaction.transactionType)}</dd>
              </div>
              <div className="detail-list-item">
                <dt>口座</dt>
                <dd>{selectedTransaction.accountName ?? '未設定'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>GoalBucket</dt>
                <dd>{selectedTransaction.goalBucketName ?? '未設定'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>カテゴリ</dt>
                <dd>
                  {selectedTransaction.categoryName ?? '未設定'}
                  {selectedTransaction.subcategoryName
                    ? ` / ${selectedTransaction.subcategoryName}`
                    : ''}
                </dd>
              </div>
              <div className="detail-list-item">
                <dt>取引日</dt>
                <dd>{formatDateLabel(selectedTransaction.transactionDate)}</dd>
              </div>
              <div className="detail-list-item">
                <dt>メモ</dt>
                <dd>{selectedTransaction.note?.trim() || 'なし'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>作成日時</dt>
                <dd>{formatDateTimeLabel(selectedTransaction.createdAt)}</dd>
              </div>
              <div className="detail-list-item">
                <dt>更新日時</dt>
                <dd>{formatDateTimeLabel(selectedTransaction.updatedAt)}</dd>
              </div>
              {selectedTransaction.transferGroupId ? (
                <div className="detail-list-item">
                  <dt>振替グループ</dt>
                  <dd>{selectedTransaction.transferGroupId}</dd>
                </div>
              ) : null}
            </dl>
            <div className="category-actions">
              <button
                type="button"
                className="action-button"
                disabled={Boolean(selectedTransaction.transferGroupId)}
                onClick={() => handleCopyTransaction(selectedTransaction)}
              >
                コピーして新規作成
              </button>
              <button
                type="button"
                className="action-button"
                onClick={() => handleEditTransaction(selectedTransaction)}
              >
                編集
              </button>
              <button
                type="button"
                className="action-button danger"
                disabled={deletingTransactionId === selectedTransaction.transactionId}
                onClick={() => void handleDeleteTransaction(selectedTransaction)}
              >
                {deletingTransactionId === selectedTransaction.transactionId
                  ? '削除中...'
                  : '削除'}
              </button>
            </div>
          </div>
        )}
      </FormModal>

      <FormModal
        open={isMobileLayout && allocationDetailOpen && selectedAllocation != null}
        title={selectedAllocation?.description ?? '配分詳細'}
        description="配分日、配分元、配分先、関連する振替情報、更新情報を確認できます。"
        eyebrow="配分詳細"
        panelClassName="modal-panel-wide"
        onClose={() => setAllocationDetailOpen(false)}
      >
        {selectedAllocation == null ? null : (
          <div className="transaction-detail-stack">
            <div className="transaction-detail-hero">
              <p className="eyebrow">配分サマリー</p>
              <h3>{selectedAllocation.description || '説明なし'}</h3>
              <p>{formatMoney(selectedAllocation.amount)}</p>
            </div>
            <dl className="detail-list">
              <div className="detail-list-item">
                <dt>配分日</dt>
                <dd>{formatDateLabel(selectedAllocation.allocationDate)}</dd>
              </div>
              <div className="detail-list-item">
                <dt>配分元</dt>
                <dd>{selectedAllocation.fromGoalBucketName ?? '未配分'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>配分先</dt>
                <dd>{selectedAllocation.toGoalBucketName ?? '未配分'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>メモ</dt>
                <dd>{selectedAllocation.note?.trim() || 'なし'}</dd>
              </div>
              <div className="detail-list-item">
                <dt>作成日時</dt>
                <dd>{formatDateTimeLabel(selectedAllocation.createdAt)}</dd>
              </div>
              <div className="detail-list-item">
                <dt>更新日時</dt>
                <dd>{formatDateTimeLabel(selectedAllocation.updatedAt)}</dd>
              </div>
              {selectedAllocation.linkedTransferGroupId ? (
                <div className="detail-list-item">
                  <dt>関連する振替グループ</dt>
                  <dd>{selectedAllocation.linkedTransferGroupId}</dd>
                </div>
              ) : null}
            </dl>
            <div className="category-actions">
              <button
                type="button"
                className="action-button"
                onClick={() => handleEditAllocation(selectedAllocation)}
              >
                編集
              </button>
              <button
                type="button"
                className="action-button danger"
                disabled={deletingAllocationId === selectedAllocation.allocationId}
                onClick={() => void handleDeleteAllocation(selectedAllocation)}
              >
                {deletingAllocationId === selectedAllocation.allocationId
                  ? '削除中...'
                  : '削除'}
              </button>
            </div>
          </div>
        )}
      </FormModal>
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
  showDetailFields?: boolean
}

function CommonTransactionFields({
  form,
  setForm,
  accounts,
  categories,
  subcategories,
  goalBuckets,
  showDetailFields = true,
}: CommonTransactionFieldsProps) {
  return (
    <>
      <label className="transaction-field transaction-field-wide">
        <span className="transaction-field-label">Account</span>
        <Select
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
        </Select>
        <small className="transaction-field-help">
          Select the account for this entry.
        </small>
      </label>
      <label className="transaction-field">
        <span className="transaction-field-label">Type</span>
        <Select
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
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </Select>
      </label>
      <label className="transaction-field">
        <span className="transaction-field-label">GoalBucket</span>
        <Select
          value={form.goalBucketId ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              goalBucketId: event.target.value ? Number(event.target.value) : null,
            }))
          }
        >
          <option value="">None</option>
          {goalBuckets.map((goalBucket) => (
            <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>
              {goalBucket.bucketName}
            </option>
          ))}
        </Select>
      </label>
      <label className="transaction-field">
        <span className="transaction-field-label">Cashflow</span>
        <Select
          value={form.cashflowTreatment}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              cashflowTreatment: event.target.value as CashflowTreatment,
            }))
          }
        >
          {cashflowTreatmentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="transaction-field">
        <span className="transaction-field-label">Category</span>
        <Select
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
        </Select>
      </label>
      <label className="transaction-field">
        <span className="transaction-field-label">Subcategory</span>
        <Select
          value={form.subcategoryId ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              subcategoryId: event.target.value ? Number(event.target.value) : null,
            }))
          }
        >
          <option value="">None</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.subcategoryId} value={subcategory.subcategoryId}>
              {subcategory.subcategoryName}
            </option>
          ))}
        </Select>
      </label>
      <label className="transaction-field">
        <span className="transaction-field-label">Date</span>
        <Input
          type="date"
          value={form.transactionDate}
          onChange={(event) =>
            setForm((current) => ({ ...current, transactionDate: event.target.value }))
          }
        />
      </label>
      <label className="transaction-field">
        <span className="transaction-field-label">Amount</span>
        <Input
          value={form.amount}
          onChange={(event) =>
            setForm((current) => ({ ...current, amount: event.target.value }))
          }
          placeholder="2800"
        />
      </label>
      <label className="transaction-field transaction-field-wide">
        <span className="transaction-field-label">Description</span>
        <Input
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Example: Hotel breakfast"
        />
      </label>
      <label className="transaction-field transaction-field-wide">
        <span className="transaction-field-label">Note</span>
        <Textarea
          value={form.note}
          onChange={(event) =>
            setForm((current) => ({ ...current, note: event.target.value }))
          }
        />
      </label>
      {!showDetailFields ? (
        <p className="status">Amount, description, and note are shared in batch mode.</p>
      ) : null}
    </>
  )
}

type BatchTransactionEditorProps = {
  drafts: BatchTransactionDraft[]
  setDrafts: Dispatch<SetStateAction<BatchTransactionDraft[]>>
}

function BatchTransactionEditor({
  drafts,
  setDrafts,
}: BatchTransactionEditorProps) {
  return (
    <div className="batch-transaction-editor">
      <div className="section-heading">
        <h3>一括登録する明細</h3>
        <button
          type="button"
          className="action-button"
          onClick={() =>
            setDrafts((current) => [...current, createBatchTransactionDraft()])
          }
        >
          明細を追加
        </button>
      </div>
      <div className="batch-transaction-list">
        {drafts.map((draft, index) => (
          <div key={draft.id} className="batch-transaction-row">
            <div className="batch-transaction-row-header">
              <strong>明細 {index + 1}</strong>
              <button
                type="button"
                className="action-button danger"
                disabled={drafts.length === 1}
                onClick={() =>
                  setDrafts((current) =>
                    current.length === 1
                      ? current
                      : current.filter((item) => item.id !== draft.id),
                  )
                }
              >
                削除
              </button>
            </div>
            <label>
              金額
              <input
                value={draft.amount}
                onChange={(event) =>
                  setDrafts((current) =>
                    current.map((item) =>
                      item.id === draft.id
                        ? { ...item, amount: event.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="2800"
              />
            </label>
            <label>
              説明
              <input
                value={draft.description}
                onChange={(event) =>
                  setDrafts((current) =>
                    current.map((item) =>
                      item.id === draft.id
                        ? { ...item, description: event.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="例: コンビニ"
              />
            </label>
            <label>
              メモ
              <textarea
                value={draft.note}
                onChange={(event) =>
                  setDrafts((current) =>
                    current.map((item) =>
                      item.id === draft.id
                        ? { ...item, note: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </label>
          </div>
        ))}
      </div>
    </div>
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
  const {
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
  } = props

  return (
    <div className="quick-create-panel quick-create-panel-upgraded">
      <p className="eyebrow">候補になければその場で追加</p>
      <div className="quick-create-grid">
        <label className="transaction-field">
          <span className="transaction-field-label">新規カテゴリ</span>
          <Input
            value={quickCategoryForm.categoryName}
            onChange={(event) =>
              onQuickCategoryFormChange((current) => ({
                ...current,
                categoryName: event.target.value,
              }))
            }
            maxLength={100}
          />
        </label>
        <label className="transaction-field">
          <span className="transaction-field-label">種別</span>
          <Select
            value={quickCategoryForm.categoryType}
            onChange={(event) =>
              onQuickCategoryFormChange((current) => ({
                ...current,
                categoryType: event.target.value as CategoryType,
              }))
            }
          >
            <option value="EXPENSE">支出</option>
            <option value="INCOME">収入</option>
            <option value="TRANSFER">振替</option>
          </Select>
        </label>
        <Button
          type="button"
          className="quick-create-button"
          disabled={quickSubmitting || !quickCategoryForm.categoryName.trim()}
          onClick={() => void onQuickCreateCategory(context)}
        >
          作成
        </Button>
      </div>
      {quickCategoryErrorMessage ? <p className="field-error">{quickCategoryErrorMessage}</p> : null}
      <div className="quick-create-grid">
        <label className="transaction-field">
          <span className="transaction-field-label">新規サブカテゴリ</span>
          <Input
            value={quickSubcategoryForm.subcategoryName}
            onChange={(event) =>
              onQuickSubcategoryFormChange((current) => ({
                ...current,
                subcategoryName: event.target.value,
              }))
            }
            maxLength={100}
          />
        </label>
        <label className="transaction-field">
          <span className="transaction-field-label">親カテゴリ</span>
          <Select
            value={quickSubcategoryForm.categoryId}
            onChange={(event) =>
              onQuickSubcategoryFormChange((current) => ({
                ...current,
                categoryId: Number(event.target.value),
              }))
            }
          >
            <option value={0}>選択してください</option>
            {categoryOptions.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.categoryName}
              </option>
            ))}
          </Select>
        </label>
        <Button
          type="button"
          className="quick-create-button"
          disabled={quickSubmitting || !quickSubcategoryForm.subcategoryName.trim() || !quickSubcategoryForm.categoryId}
          onClick={() => void onQuickCreateSubcategory(context)}
        >
          作成
        </Button>
      </div>
      {quickSubcategoryErrorMessage ? (
        <p className="field-error">{quickSubcategoryErrorMessage}</p>
      ) : null}
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

function AllocationFields({
  mode,
  setMode,
  baseAmount,
  setBaseAmount,
  drafts,
  setDrafts,
  goalBuckets,
}: AllocationFieldsProps) {
  return (
    <div className="allocation-editor">
      <div className="inline-tabs allocation-mode-tabs">
        <button
          type="button"
          className={mode === 'amount' ? 'active' : ''}
          onClick={() => setMode('amount')}
        >
          金額指定
        </button>
        <button
          type="button"
          className={mode === 'ratio' ? 'active' : ''}
          onClick={() => setMode('ratio')}
        >
          比率指定
        </button>
      </div>
      {mode === 'ratio' ? (
        <label className="transaction-field transaction-field-wide">
          配分元の基準額
          <Input
            value={baseAmount}
            onChange={(event) => setBaseAmount(event.target.value)}
            placeholder="50000"
          />
        </label>
      ) : null}
      <div className="subform-grid">
        {drafts.map((draft, index) => (
          <div key={`${draft.toGoalBucketId}-${index}`} className="allocation-row">
            <Select
              value={draft.toGoalBucketId}
              onChange={(event) =>
                setDrafts((current) =>
                  current.map((item, currentIndex) =>
                    currentIndex === index
                      ? { ...item, toGoalBucketId: Number(event.target.value) }
                      : item,
                  ),
                )
              }
            >
              <option value={0}>配分先を選択</option>
              {goalBuckets.map((goalBucket) => (
                <option key={goalBucket.goalBucketId} value={goalBucket.goalBucketId}>
                  {goalBucket.bucketName}
                </option>
              ))}
            </Select>
            <Input
              value={draft.value}
              onChange={(event) =>
                setDrafts((current) =>
                  current.map((item, currentIndex) =>
                    currentIndex === index
                      ? { ...item, value: event.target.value }
                      : item,
                  ),
                )
              }
              placeholder={mode === 'amount' ? '30000' : '60'}
            />
            <Button
              type="button"
              variant="danger"
              onClick={() =>
                setDrafts((current) =>
                  current.filter((_, currentIndex) => currentIndex !== index),
                )
              }
            >
              削除
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        className="allocation-add-button"
        onClick={() =>
          setDrafts((current) => [
            ...current,
            { toGoalBucketId: goalBuckets[0]?.goalBucketId ?? 0, value: '' },
          ])
        }
      >
        配分先を追加
      </Button>
    </div>
  )
}

function shiftMonthLabel(monthLabel: string, diff: number) {
  const [year, month] = monthLabel.split('-').map(Number)
  const date = new Date(year, month - 1 + diff, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthLabel: string) {
  const [year, month] = monthLabel.split('-').map(Number)
  return `${year}年${month}月`
}

function formatPeriodLabel(startDate: string, endDate: string) {
  return `${formatDateLabel(startDate)} から ${formatDateLabel(endDate)}`
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

function resolveApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return error.message
  }
  return fallback
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

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatSignedMoney(transaction: Transaction) {
  const sign =
    transaction.transactionType === 'INCOME' ||
    transaction.transactionType === 'TRANSFER_IN'
      ? '+'
      : '-'
  return `${sign}${formatMoney(transaction.amount)}`
}

function formatTransactionTypeLabel(transactionType: TransactionType) {
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

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
