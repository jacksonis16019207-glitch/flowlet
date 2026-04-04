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
        '月次収支の取得に失敗しました。API の状態を確認してください。',
      )
    }

    setLoading(false)
  }

  const accountCount = summary.accounts.length
  const goalBucketCount = summary.goalBuckets.length
  const monthlyNet = Number(cashflow.totals.net)

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / dashboard</p>
        <h1>残高と収支をすぐ見返せる状態に整える</h1>
        <p className="lead">
          口座残高、目的別残高、直近の月次収支をひとまとまりで確認して、
          今日見るべき数字にすぐ辿り着けるようにしています。
        </p>
        <div className="hero-stats dashboard-hero-stats">
          <article>
            <span>口座残高合計</span>
            <strong>{formatMoney(summary.totals.accountCurrentBalance)}</strong>
            <small>{accountCount} 件の口座を集計</small>
          </article>
          <article>
            <span>目的別残高合計</span>
            <strong>{formatMoney(summary.totals.goalBucketCurrentBalance)}</strong>
            <small>{goalBucketCount} 件の GoalBucket</small>
          </article>
          <article>
            <span>未配分残高</span>
            <strong>{formatMoney(summary.totals.unallocatedBalance)}</strong>
            <small>{monthlyNet >= 0 ? '直近収支は黒字です' : '直近収支は赤字です'}</small>
          </article>
        </div>
      </section>

      <section className="content-grid dashboard-grid dashboard-focus-grid">
        <section className="panel dashboard-focus-panel">
          <div className="panel-heading">
            <p className="eyebrow">Today Focus</p>
            <h2>まず見るポイント</h2>
          </div>
          <div className="dashboard-focus-list">
            <article className="dashboard-focus-item">
              <span>配分待ち</span>
              <strong>{formatMoney(summary.totals.unallocatedBalance)}</strong>
              <p>まだ行き先が決まっていない残高です。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>直近 4 か月収支</span>
              <strong>{formatMoney(cashflow.totals.net)}</strong>
              <p>黒字か赤字かを最短で把握できます。</p>
            </article>
          </div>
        </section>
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
            <h2>口座ごとの現在残高</h2>
            <p className="lead dashboard-section-lead">
              口座種別と未配分残高を並べて、次に動かすべき口座を判断しやすくします。
            </p>
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
            <h2>目的別残高の見え方</h2>
            <p className="lead dashboard-section-lead">
              使い道ごとの残高を、どの口座に紐づいているかと一緒に確認できます。
            </p>
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
              収入と支出の差分を月ごとに見て、資金の流れを荒く把握できるようにしています。
            </p>
          </div>
          <div className="hero-stats dashboard-hero-stats dashboard-sub-stats">
            <article>
              <span>収入合計</span>
              <strong>{formatMoney(cashflow.totals.income)}</strong>
            </article>
            <article>
              <span>支出合計</span>
              <strong>{formatMoney(cashflow.totals.expense)}</strong>
            </article>
            <article>
              <span>収支差額</span>
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
