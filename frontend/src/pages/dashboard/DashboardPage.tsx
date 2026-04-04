import { useEffect, useState } from 'react'
import { fetchDashboardBalanceSummary } from '../../features/dashboard/api/dashboardApi'
import { DashboardAccountList } from '../../features/dashboard/components/DashboardAccountList'
import { DashboardGoalBucketList } from '../../features/dashboard/components/DashboardGoalBucketList'
import type { DashboardBalanceSummary } from '../../features/dashboard/types/dashboard'

const emptySummary: DashboardBalanceSummary = {
  accounts: [],
  goalBuckets: [],
  totals: {
    accountCurrentBalance: '0',
    goalBucketCurrentBalance: '0',
    unallocatedBalance: '0',
  },
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardBalanceSummary>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    void loadSummary()
  }, [])

  async function loadSummary() {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await fetchDashboardBalanceSummary()
      setSummary(data)
    } catch {
      setErrorMessage(
        'ダッシュボードの取得に失敗しました。バックエンドの状態を確認してください。',
      )
    } finally {
      setLoading(false)
    }
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
    </main>
  )
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}
