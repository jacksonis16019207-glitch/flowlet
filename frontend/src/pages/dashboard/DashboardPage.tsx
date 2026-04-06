import { useEffect, useState } from 'react'
import {
  fetchDashboardBalanceSummary,
  fetchDashboardCategoryCashflow,
  fetchDashboardMonthlyCashflow,
} from '../../features/dashboard/api/dashboardApi'
import { DashboardAccountList } from '../../features/dashboard/components/DashboardAccountList'
import { DashboardCategoryCashflowList } from '../../features/dashboard/components/DashboardCategoryCashflowList'
import { DashboardGoalBucketList } from '../../features/dashboard/components/DashboardGoalBucketList'
import { DashboardMonthlyCashflowList } from '../../features/dashboard/components/DashboardMonthlyCashflowList'
import type {
  DashboardBalanceSummary,
  DashboardCategoryCashflow,
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
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [cashflowErrorMessage, setCashflowErrorMessage] = useState('')
  const [categoryCashflowErrorMessage, setCategoryCashflowErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    void Promise.allSettled([
      fetchDashboardBalanceSummary(),
      fetchDashboardMonthlyCashflow(),
      fetchDashboardCategoryCashflow(),
    ]).then(([summaryResult, cashflowResult, categoryCashflowResult]) => {
      if (!active) {
        return
      }

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value)
      } else {
        setErrorMessage(
          'ダッシュボードの取得に失敗しました。バックエンド API の状態を確認してください。',
        )
      }

      if (cashflowResult.status === 'fulfilled') {
        setCashflow(cashflowResult.value)
      } else {
        setCashflowErrorMessage(
          '月次収支の取得に失敗しました。バックエンド API の状態を確認してください。',
        )
      }

      if (categoryCashflowResult.status === 'fulfilled') {
        setCategoryCashflow(categoryCashflowResult.value)
      } else {
        setCategoryCashflowErrorMessage(
          'カテゴリ別収支の取得に失敗しました。バックエンド API の状態を確認してください。',
        )
      }

      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const accountCount = summary.accounts.length
  const goalBucketCount = summary.goalBuckets.length
  const monthlyNet = Number(cashflow.net)
  const creditCardDebt = summary.accounts
    .filter((account) => account.accountCategory === 'CREDIT_CARD')
    .reduce((total, account) => total + Math.abs(Number(account.currentBalance)), 0)

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / dashboard</p>
        <h1>全体の残高と今月の基準期間を一覧する</h1>
        <p className="lead">
          口座残高、GoalBucket 残高、そして現在の基準期間での収支をまとめて確認できます。
        </p>
        <div className="hero-stats dashboard-hero-stats">
          <article>
            <span>口座残高合計</span>
            <strong>{formatMoney(summary.totals.accountCurrentBalance)}</strong>
            <small>{accountCount} 件の口座を集計</small>
          </article>
          <article>
            <span>GoalBucket 残高合計</span>
            <strong>{formatMoney(summary.totals.goalBucketCurrentBalance)}</strong>
            <small>{goalBucketCount} 件の GoalBucket</small>
          </article>
          <article>
            <span>未配分残高</span>
            <strong>{formatMoney(summary.totals.unallocatedBalance)}</strong>
            <small>{monthlyNet >= 0 ? '今月は黒字傾向です' : '今月は赤字傾向です'}</small>
          </article>
          <article>
            <span>カード負債合計</span>
            <strong>{formatMoney(String(creditCardDebt))}</strong>
            <small>クレジットカード残高の合計です</small>
          </article>
        </div>
      </section>

      <section className="content-grid dashboard-grid dashboard-focus-grid">
        <section className="panel dashboard-focus-panel">
          <div className="panel-heading">
            <p className="eyebrow">Today Focus</p>
            <h2>今すぐ見たい数値</h2>
          </div>
          <div className="dashboard-focus-list">
            <article className="dashboard-focus-item">
              <span>未配分</span>
              <strong>{formatMoney(summary.totals.unallocatedBalance)}</strong>
              <p>まだ割り当てていない残高です。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>今月の差額</span>
              <strong>{formatMoney(cashflow.net)}</strong>
              <p>現在の基準期間に対する収支差額です。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>最大の支出カテゴリ</span>
              <strong>
                {categoryCashflow.expenseCategories[0]?.categoryName ?? 'まだありません'}
              </strong>
              <p>
                {categoryCashflow.expenseCategories[0] == null
                  ? '支出カテゴリ別集計はまだありません。'
                  : `${formatMoney(categoryCashflow.expenseCategories[0].amount)} です。`}
              </p>
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
              口座の残高と未配分残高を並べて、次に見直す口座を判断しやすくします。
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
            <h2>目的別口座の見え方</h2>
            <p className="lead dashboard-section-lead">
              GoalBucket ごとの残高を一覧で確認できます。
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
            <h2>今月の基準期間収支</h2>
            <p className="lead dashboard-section-lead">
              グローバル設定の開始日と土日祝補正ルールを使って、現在月の1か月期間を集計しています。
            </p>
          </div>
          <div className="hero-stats dashboard-hero-stats dashboard-sub-stats">
            <article>
              <span>収入合計</span>
              <strong>{formatMoney(cashflow.income)}</strong>
            </article>
            <article>
              <span>支出合計</span>
              <strong>{formatMoney(cashflow.expense)}</strong>
            </article>
            <article>
              <span>差額</span>
              <strong>{formatMoney(cashflow.net)}</strong>
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

      <section className="content-grid dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Income Categories</p>
            <h2>収入の内訳</h2>
            <p className="lead dashboard-section-lead">
              現在の基準期間で、収入カテゴリの上位を確認できます。
            </p>
          </div>
          {categoryCashflowErrorMessage ? (
            <p className="status error">{categoryCashflowErrorMessage}</p>
          ) : loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardCategoryCashflowList
              title="収入カテゴリ"
              categories={categoryCashflow.incomeCategories.slice(0, 4)}
              emptyMessage="対象期間に収入カテゴリの集計はありません。"
              tone="income"
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Expense Categories</p>
            <h2>支出の内訳</h2>
            <p className="lead dashboard-section-lead">
              現在の基準期間で、支出カテゴリの上位を確認できます。
            </p>
          </div>
          {categoryCashflowErrorMessage ? (
            <p className="status error">{categoryCashflowErrorMessage}</p>
          ) : loading ? (
            <p className="status">読み込み中...</p>
          ) : (
            <DashboardCategoryCashflowList
              title="支出カテゴリ"
              categories={categoryCashflow.expenseCategories.slice(0, 4)}
              emptyMessage="対象期間に支出カテゴリの集計はありません。"
              tone="expense"
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
