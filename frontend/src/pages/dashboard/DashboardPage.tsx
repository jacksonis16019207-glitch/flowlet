import { useEffect, useMemo, useState } from 'react'
import {
  fetchDashboardBalanceSummary,
  fetchDashboardCategoryCashflow,
  fetchDashboardMonthlyCashflow,
} from '../../features/dashboard/api/dashboardApi'
import { DashboardCategoryCashflowList } from '../../features/dashboard/components/DashboardCategoryCashflowList'
import type {
  DashboardBalanceSummary,
  DashboardCategoryCashflow,
  DashboardMonthlyCashflow,
} from '../../features/dashboard/types/dashboard'
import { fetchTransactions } from '../../features/transaction/api/transactionApi'
import type { Transaction, TransactionType } from '../../features/transaction/types/transaction'

const emptySummary: DashboardBalanceSummary = {
  accounts: [],
  goalBuckets: [],
  totals: {
    accountCurrentBalance: '0',
    goalBucketCurrentBalance: '0',
    unallocatedBalance: '0',
  },
}

const emptyCashflow: DashboardMonthlyCashflow = {
  targetMonth: '',
  periodStartDate: '',
  periodEndDate: '',
  income: '0',
  expense: '0',
  net: '0',
}

const emptyCategoryCashflow: DashboardCategoryCashflow = {
  targetMonth: '',
  periodStartDate: '',
  periodEndDate: '',
  incomeCategories: [],
  expenseCategories: [],
  totals: {
    income: '0',
    expense: '0',
  },
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardBalanceSummary>(emptySummary)
  const [cashflow, setCashflow] = useState<DashboardMonthlyCashflow>(emptyCashflow)
  const [categoryCashflow, setCategoryCashflow] =
    useState<DashboardCategoryCashflow>(emptyCategoryCashflow)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [displayMonth, setDisplayMonth] = useState(getCurrentMonthLabel())
  const [loading, setLoading] = useState(true)
  const [monthlyLoading, setMonthlyLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [cashflowErrorMessage, setCashflowErrorMessage] = useState('')
  const [categoryCashflowErrorMessage, setCategoryCashflowErrorMessage] = useState('')
  const [transactionErrorMessage, setTransactionErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    void Promise.allSettled([fetchDashboardBalanceSummary(), fetchTransactions()]).then(
      ([summaryResult, transactionsResult]) => {
        if (!active) {
          return
        }

        if (summaryResult.status === 'fulfilled') {
          setSummary(summaryResult.value)
        } else {
          setErrorMessage('ダッシュボードの初期表示に必要な残高情報を取得できませんでした。')
        }

        if (transactionsResult.status === 'fulfilled') {
          setTransactions(transactionsResult.value)
        } else {
          setTransactionErrorMessage('最近の動きを取得できませんでした。')
        }

        setLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setMonthlyLoading(true)
    setCashflowErrorMessage('')
    setCategoryCashflowErrorMessage('')

    void Promise.allSettled([
      fetchDashboardMonthlyCashflow(displayMonth),
      fetchDashboardCategoryCashflow(displayMonth),
    ]).then(([cashflowResult, categoryCashflowResult]) => {
      if (!active) {
        return
      }

      if (cashflowResult.status === 'fulfilled') {
        setCashflow(cashflowResult.value)
      } else {
        setCashflow(emptyCashflow)
        setCashflowErrorMessage('選択月の月次収支を取得できませんでした。')
      }

      if (categoryCashflowResult.status === 'fulfilled') {
        setCategoryCashflow(categoryCashflowResult.value)
      } else {
        setCategoryCashflow(emptyCategoryCashflow)
        setCategoryCashflowErrorMessage('選択月のカテゴリ別収支を取得できませんでした。')
      }

      setMonthlyLoading(false)
    })

    return () => {
      active = false
    }
  }, [displayMonth])

  const monthlyNet = Number(cashflow.net)
  const topIncomeCategory = categoryCashflow.incomeCategories[0] ?? null
  const topExpenseCategory = categoryCashflow.expenseCategories[0] ?? null
  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => {
          if (!cashflow.periodStartDate || !cashflow.periodEndDate) {
            return false
          }

          return (
            transaction.transactionDate >= cashflow.periodStartDate &&
            transaction.transactionDate <= cashflow.periodEndDate
          )
        })
        .sort(compareTransactions),
    [cashflow.periodEndDate, cashflow.periodStartDate, transactions],
  )
  const recentTransactions = filteredTransactions.slice(0, 5)

  return (
    <main className="app-shell">
      <section className="hero-panel dashboard-hero-panel">
        <div className="dashboard-hero-header">
          <div>
            <p className="eyebrow">flowlet / dashboard</p>
            <h1>現在残高と選択月の収支をひと目で把握する</h1>
            <p className="lead">
              現在の総残高と、選択した月の収入、支出、収支をまとめて確認します。
            </p>
          </div>
          <div className="dashboard-month-switcher">
            <p className="dashboard-month-label">Target Month</p>
            <div className="dashboard-month-switcher-row">
              <button
                type="button"
                className="action-button"
                onClick={() => setDisplayMonth(shiftMonthLabel(displayMonth, -1))}
              >
                前月
              </button>
              <strong>{formatMonthLabel(displayMonth)}</strong>
              <button
                type="button"
                className="action-button"
                onClick={() => setDisplayMonth(shiftMonthLabel(displayMonth, 1))}
              >
                翌月
              </button>
            </div>
            <p className="dashboard-month-range">
              {cashflow.periodStartDate && cashflow.periodEndDate
                ? `${formatDateLabel(cashflow.periodStartDate)} から ${formatDateLabel(cashflow.periodEndDate)}`
                : '集計期間を読み込み中です。'}
            </p>
          </div>
        </div>

        <div className="hero-stats dashboard-summary-stats">
          <article>
            <span>現在残高</span>
            <strong>{formatMoney(summary.totals.accountCurrentBalance)}</strong>
            <small>銀行口座とクレジットカードを合算した現在値です。</small>
          </article>
          <article>
            <span>{formatMonthLabel(displayMonth)} の収入</span>
            <strong>{formatMoney(cashflow.income)}</strong>
            <small>選択月の集計期間で計上された収入です。</small>
          </article>
          <article>
            <span>{formatMonthLabel(displayMonth)} の支出</span>
            <strong>{formatMoney(cashflow.expense)}</strong>
            <small>選択月の集計期間で計上された支出です。</small>
          </article>
          <article>
            <span>{formatMonthLabel(displayMonth)} の収支</span>
            <strong>{formatMoney(cashflow.net)}</strong>
            <small>{monthlyNet >= 0 ? '黒字で推移しています。' : '赤字のため支出確認が必要です。'}</small>
          </article>
        </div>
      </section>

      {errorMessage ? (
        <section className="content-grid dashboard-grid">
          <section className="panel">
            <p className="status error">{errorMessage}</p>
          </section>
        </section>
      ) : null}

      <section className="content-grid dashboard-grid dashboard-focus-grid">
        <section className="panel dashboard-focus-panel">
          <div className="panel-heading">
            <p className="eyebrow">Monthly Focus</p>
            <h2>{formatMonthLabel(displayMonth)} の注目ポイント</h2>
            <p className="lead dashboard-section-lead">
              まず見るべき指標だけを抜き出して並べています。
            </p>
          </div>
          <div className="dashboard-focus-list">
            <article className="dashboard-focus-item">
              <span>収支ステータス</span>
              <strong>{monthlyNet >= 0 ? '黒字' : '赤字'}</strong>
              <p>{formatMoney(cashflow.net)} の着地です。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>主要収入カテゴリ</span>
              <strong>{topIncomeCategory?.categoryName ?? 'データなし'}</strong>
              <p>
                {topIncomeCategory == null
                  ? '選択月に収入カテゴリの計上がありません。'
                  : `${formatMoney(topIncomeCategory.amount)} を計上しています。`}
              </p>
            </article>
            <article className="dashboard-focus-item">
              <span>主要支出カテゴリ</span>
              <strong>{topExpenseCategory?.categoryName ?? 'データなし'}</strong>
              <p>
                {topExpenseCategory == null
                  ? '選択月に支出カテゴリの計上がありません。'
                  : `${formatMoney(topExpenseCategory.amount)} を計上しています。`}
              </p>
            </article>
          </div>
        </section>
      </section>

      <section className="content-grid dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Income Categories</p>
            <h2>主要収入カテゴリ</h2>
            <p className="lead dashboard-section-lead">
              選択月で金額の大きい収入カテゴリを確認します。
            </p>
          </div>
          {categoryCashflowErrorMessage ? (
            <p className="status error">{categoryCashflowErrorMessage}</p>
          ) : monthlyLoading ? (
            <p className="status">選択月の収入カテゴリを読み込み中です...</p>
          ) : (
            <DashboardCategoryCashflowList
              title="収入カテゴリ"
              categories={categoryCashflow.incomeCategories.slice(0, 5)}
              emptyMessage="選択月に収入カテゴリの計上はありません。"
              tone="income"
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Expense Categories</p>
            <h2>主要支出カテゴリ</h2>
            <p className="lead dashboard-section-lead">
              選択月で金額の大きい支出カテゴリを確認します。
            </p>
          </div>
          {categoryCashflowErrorMessage ? (
            <p className="status error">{categoryCashflowErrorMessage}</p>
          ) : monthlyLoading ? (
            <p className="status">選択月の支出カテゴリを読み込み中です...</p>
          ) : (
            <DashboardCategoryCashflowList
              title="支出カテゴリ"
              categories={categoryCashflow.expenseCategories.slice(0, 5)}
              emptyMessage="選択月に支出カテゴリの計上はありません。"
              tone="expense"
            />
          )}
        </section>
      </section>

      <section className="content-grid">
        <section className="panel dashboard-panel-full">
          <div className="panel-heading">
            <p className="eyebrow">Recent Activity</p>
            <h2>最近の動き</h2>
            <p className="lead dashboard-section-lead">
              選択月に記録された直近の取引を並べています。
            </p>
          </div>
          {transactionErrorMessage ? (
            <p className="status error">{transactionErrorMessage}</p>
          ) : loading || monthlyLoading ? (
            <p className="status">最近の動きを読み込み中です...</p>
          ) : recentTransactions.length === 0 ? (
            <p className="status">選択月に表示できる取引はありません。</p>
          ) : (
            <div className="dashboard-activity-list">
              {recentTransactions.map((transaction) => (
                <article key={transaction.transactionId} className="dashboard-activity-card">
                  <div className="dashboard-activity-main">
                    <div>
                      <p className="dashboard-activity-type">
                        {formatTransactionType(transaction.transactionType)}
                      </p>
                      <h3>{transaction.description}</h3>
                      <p className="dashboard-activity-meta">
                        {formatDateLabel(transaction.transactionDate)}
                        {transaction.accountName ? ` / ${transaction.accountName}` : ''}
                        {transaction.categoryName ? ` / ${transaction.categoryName}` : ''}
                      </p>
                    </div>
                    <strong
                      className={
                        isPositiveTransaction(transaction.transactionType)
                          ? 'dashboard-activity-money is-positive'
                          : 'dashboard-activity-money is-negative'
                      }
                    >
                      {formatSignedMoney(transaction)}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          )}
          {cashflowErrorMessage ? (
            <p className="status error dashboard-inline-status">{cashflowErrorMessage}</p>
          ) : null}
        </section>
      </section>
    </main>
  )
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

function formatMonthLabel(monthLabel: string) {
  const [year, month] = monthLabel.split('-').map(Number)
  return `${year}年${month}月`
}

function compareTransactions(left: Transaction, right: Transaction) {
  if (left.transactionDate !== right.transactionDate) {
    return right.transactionDate.localeCompare(left.transactionDate)
  }

  return right.transactionId - left.transactionId
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function isPositiveTransaction(transactionType: TransactionType) {
  return transactionType === 'INCOME' || transactionType === 'TRANSFER_IN'
}

function formatSignedMoney(transaction: Transaction) {
  return `${isPositiveTransaction(transaction.transactionType) ? '+' : '-'}${formatMoney(
    transaction.amount,
  )}`
}

function formatTransactionType(transactionType: TransactionType) {
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
