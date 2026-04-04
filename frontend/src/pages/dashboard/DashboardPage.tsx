import { useEffect, useState } from 'react'
import {
  fetchDashboardBalanceSummary,
  fetchDashboardMonthlyCashflow,
} from '../../features/dashboard/api/dashboardApi'
import { DashboardAccountList } from '../../features/dashboard/components/DashboardAccountList'
import { DashboardGoalBucketList } from '../../features/dashboard/components/DashboardGoalBucketList'
import { DashboardMonthlyCashflowList } from '../../features/dashboard/components/DashboardMonthlyCashflowList'
import type {
  DashboardBalanceSummary,
  DashboardMonthlyCashflow,
} from '../../features/dashboard/types/dashboard'

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
  fromMonth: '',
  toMonth: '',
  months: [],
  totals: {
    income: '0',
    expense: '0',
    net: '0',
  },
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardBalanceSummary>(emptySummary)
  const [cashflow, setCashflow] = useState<DashboardMonthlyCashflow>(emptyCashflow)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [cashflowErrorMessage, setCashflowErrorMessage] = useState('')

  useEffect(() => {
    void loadSummary()
  }, [])

  async function loadSummary() {
    setLoading(true)
    setErrorMessage('')
    setCashflowErrorMessage('')

    const { fromMonth, toMonth } = getDefaultMonthRange()
    const [summaryResult, cashflowResult] = await Promise.allSettled([
      fetchDashboardBalanceSummary(),
      fetchDashboardMonthlyCashflow(fromMonth, toMonth),
    ])

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value)
    } else {
      setErrorMessage(
        'ダッシュボードの取得に失敗しました。バックエンドの状態を確認してください。',
      )
    }

    if (cashflowResult.status === 'fulfilled') {
      setCashflow(cashflowResult.value)
    } else {
      setCashflowErrorMessage(
        '月次収支の取得に失敗しました。集計APIの状態を確認してください。',
      )
    }

    setLoading(false)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / dashboard</p>
        <h1>残高の全体像をすぐ確認する</h1>
        <p className="lead">
          実口座残高、GoalBucket 残高、未配分残高をひとまとめに見て、次の操作へ進みやすくします。
        </p>
        <div className="hero-stats dashboard-hero-stats">
          <article>
            <span>実口座残高合計</span>
            <strong>{formatMoney(summary.totals.accountCurrentBalance)}</strong>
          </article>
          <article>
            <span>GoalBucket 残高合計</span>
            <strong>{formatMoney(summary.totals.goalBucketCurrentBalance)}</strong>
          </article>
          <article>
            <span>未配分残高合計</span>
            <strong>{formatMoney(summary.totals.unallocatedBalance)}</strong>
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

      <section className="content-grid dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">口座サマリ</p>
            <h2>実口座の現在状態</h2>
          </div>
          {loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardAccountList accounts={summary.accounts} />
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">GoalBucket サマリ</p>
            <h2>目的別口座の配分状況</h2>
          </div>
          {loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardGoalBucketList
              goalBuckets={summary.goalBuckets}
              accounts={summary.accounts}
            />
          )}
        </section>
      </section>

      <section className="content-grid">
        <section className="panel dashboard-panel-full">
          <div className="panel-heading">
            <p className="eyebrow">Monthly Cashflow</p>
            <h2>直近の月次収支</h2>
            <p className="lead dashboard-section-lead">
              振替と配分を除いた収入、支出、差額を月単位で確認します。
            </p>
          </div>
          <div className="hero-stats dashboard-hero-stats dashboard-sub-stats">
            <article>
              <span>期間収入合計</span>
              <strong>{formatMoney(cashflow.totals.income)}</strong>
            </article>
            <article>
              <span>期間支出合計</span>
              <strong>{formatMoney(cashflow.totals.expense)}</strong>
            </article>
            <article>
              <span>期間差額</span>
              <strong>{formatMoney(cashflow.totals.net)}</strong>
            </article>
          </div>
          {cashflowErrorMessage ? (
            <p className="status error">{cashflowErrorMessage}</p>
          ) : loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardMonthlyCashflowList cashflow={cashflow} />
          )}
        </section>
      </section>
    </main>
  )
}

function getDefaultMonthRange() {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - 3, 1)

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
