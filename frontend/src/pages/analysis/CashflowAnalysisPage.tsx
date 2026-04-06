import { useEffect, useState } from 'react'
import {
  fetchDashboardCategoryCashflow,
  fetchDashboardMonthlyCashflow,
} from '../../features/dashboard/api/dashboardApi'
import { DashboardCategoryCashflowList } from '../../features/dashboard/components/DashboardCategoryCashflowList'
import { DashboardMonthlyCashflowList } from '../../features/dashboard/components/DashboardMonthlyCashflowList'
import type {
  DashboardCategoryCashflow,
  DashboardMonthlyCashflow,
} from '../../features/dashboard/types/dashboard'

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

export function CashflowAnalysisPage() {
  const defaultTargetMonth = getCurrentYearMonth()
  const [targetMonth, setTargetMonth] = useState(defaultTargetMonth)
  const [appliedTargetMonth, setAppliedTargetMonth] = useState(defaultTargetMonth)
  const [cashflow, setCashflow] = useState<DashboardMonthlyCashflow>(emptyCashflow)
  const [categoryCashflow, setCategoryCashflow] =
    useState<DashboardCategoryCashflow>(emptyCategoryCashflow)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setErrorMessage('')

    void Promise.all([
      fetchDashboardMonthlyCashflow(appliedTargetMonth),
      fetchDashboardCategoryCashflow(appliedTargetMonth),
    ])
      .then(([cashflowResponse, categoryCashflowResponse]) => {
        if (!active) {
          return
        }

        setCashflow(cashflowResponse)
        setCategoryCashflow(categoryCashflowResponse)
      })
      .catch(() => {
        if (!active) {
          return
        }

        setErrorMessage(
          '収支分析データの取得に失敗しました。バックエンド API の状態を確認してください。',
        )
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [appliedTargetMonth])

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / analysis</p>
        <h1>1か月単位の収支を振り返る</h1>
        <p className="lead">
          対象月を選ぶと、グローバル設定した開始日と土日祝補正ルールに従って、
          その月の表示期間を1か月で集計します。
        </p>
        <form
          className="analysis-filter-row"
          onSubmit={(event) => {
            event.preventDefault()
            setAppliedTargetMonth(targetMonth)
          }}
        >
          <label>
            対象月
            <input
              type="month"
              value={targetMonth}
              onChange={(event) => setTargetMonth(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="submit">集計を更新</button>
          </div>
        </form>
        <div className="hero-stats dashboard-hero-stats">
          <article>
            <span>収入合計</span>
            <strong>{formatMoney(cashflow.income)}</strong>
            <small>{formatPeriod(cashflow.periodStartDate, cashflow.periodEndDate)}</small>
          </article>
          <article>
            <span>支出合計</span>
            <strong>{formatMoney(cashflow.expense)}</strong>
            <small>対象月 {cashflow.targetMonth || appliedTargetMonth}</small>
          </article>
          <article>
            <span>差額</span>
            <strong>{formatMoney(cashflow.net)}</strong>
            <small>カテゴリ別内訳も同じ期間で集計</small>
          </article>
        </div>
      </section>

      {errorMessage ? (
        <section className="content-grid dashboard-grid">
          <section className="panel dashboard-panel-full">
            <p className="status error">{errorMessage}</p>
          </section>
        </section>
      ) : null}

      <section className="content-grid dashboard-grid">
        <section className="panel dashboard-panel-full">
          <div className="panel-heading">
            <p className="eyebrow">Monthly Cashflow</p>
            <h2>対象期間の収支</h2>
            <p className="lead dashboard-section-lead">
              グローバル設定した月初基準に従って、対象月に対応する1か月期間の収支を表示します。
            </p>
          </div>
          {loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardMonthlyCashflowList cashflow={cashflow} />
          )}
        </section>
      </section>

      <section className="content-grid dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Income Categories</p>
            <h2>収入カテゴリ別内訳</h2>
          </div>
          {loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardCategoryCashflowList
              title="収入カテゴリ"
              categories={categoryCashflow.incomeCategories}
              emptyMessage="対象期間に収入カテゴリの集計はありません。"
              tone="income"
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Expense Categories</p>
            <h2>支出カテゴリ別内訳</h2>
          </div>
          {loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardCategoryCashflowList
              title="支出カテゴリ"
              categories={categoryCashflow.expenseCategories}
              emptyMessage="対象期間に支出カテゴリの集計はありません。"
              tone="expense"
            />
          )}
        </section>
      </section>
    </main>
  )
}

function getCurrentYearMonth() {
  return formatYearMonth(new Date())
}

function formatYearMonth(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatPeriod(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return '期間を計算中'
  }

  return `${startDate} から ${endDate}`
}
