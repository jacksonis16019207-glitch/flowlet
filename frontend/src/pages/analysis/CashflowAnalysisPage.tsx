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
  fromMonth: '',
  toMonth: '',
  months: [],
  totals: {
    income: '0',
    expense: '0',
    net: '0',
  },
}

const emptyCategoryCashflow: DashboardCategoryCashflow = {
  fromMonth: '',
  toMonth: '',
  incomeCategories: [],
  expenseCategories: [],
  totals: {
    income: '0',
    expense: '0',
  },
}

export function CashflowAnalysisPage() {
  const defaultRange = getDefaultMonthRange()
  const [fromMonth, setFromMonth] = useState(defaultRange.fromMonth)
  const [toMonth, setToMonth] = useState(defaultRange.toMonth)
  const [appliedRange, setAppliedRange] = useState(defaultRange)
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
      fetchDashboardMonthlyCashflow(appliedRange.fromMonth, appliedRange.toMonth),
      fetchDashboardCategoryCashflow(appliedRange.fromMonth, appliedRange.toMonth),
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
          '収支分析データの取得に失敗しました。バックエンドの状態を確認してください。',
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
  }, [appliedRange])

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / analysis</p>
        <h1>収支の偏りと推移をまとめて確認する</h1>
        <p className="lead">
          月次の増減とカテゴリ別の偏りを同じ画面に並べて、どこで増えたか、
          どこで使ったかを短時間で把握できるようにしています。
        </p>
        <form
          className="analysis-filter-row"
          onSubmit={(event) => {
            event.preventDefault()
            setAppliedRange({ fromMonth, toMonth })
          }}
        >
          <label>
            開始月
            <input
              type="month"
              value={fromMonth}
              onChange={(event) => setFromMonth(event.target.value)}
            />
          </label>
          <label>
            終了月
            <input
              type="month"
              value={toMonth}
              onChange={(event) => setToMonth(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="submit">分析を更新</button>
          </div>
        </form>
        <div className="hero-stats dashboard-hero-stats">
          <article>
            <span>収入合計</span>
            <strong>{formatMoney(cashflow.totals.income)}</strong>
            <small>{cashflow.fromMonth || appliedRange.fromMonth} から集計</small>
          </article>
          <article>
            <span>支出合計</span>
            <strong>{formatMoney(cashflow.totals.expense)}</strong>
            <small>{cashflow.toMonth || appliedRange.toMonth} まで集計</small>
          </article>
          <article>
            <span>差額</span>
            <strong>{formatMoney(cashflow.totals.net)}</strong>
            <small>カテゴリ別内訳も同期間で集計</small>
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
            <h2>月次推移</h2>
            <p className="lead dashboard-section-lead">
              月ごとの収入、支出、差額を並べて、波の大きい月を見つけやすくします。
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
            <h2>収入カテゴリ内訳</h2>
          </div>
          {loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardCategoryCashflowList
              title="収入カテゴリ"
              categories={categoryCashflow.incomeCategories}
              emptyMessage="表示できる収入カテゴリはまだありません。"
              tone="income"
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Expense Categories</p>
            <h2>支出カテゴリ内訳</h2>
          </div>
          {loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardCategoryCashflowList
              title="支出カテゴリ"
              categories={categoryCashflow.expenseCategories}
              emptyMessage="表示できる支出カテゴリはまだありません。"
              tone="expense"
            />
          )}
        </section>
      </section>
    </main>
  )
}

function getDefaultMonthRange() {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1)

  return {
    fromMonth: formatYearMonth(start),
    toMonth: formatYearMonth(end),
  }
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
