import { useState } from 'react'
import { CashflowAnalysisPage } from './pages/analysis/CashflowAnalysisPage'
import { AccountPage } from './pages/accounts/AccountPage'
import { CategoryPage } from './pages/categories/CategoryPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { GoalBucketPage } from './pages/goalBuckets/GoalBucketPage'
import { AppSettingPage } from './pages/settings/AppSettingPage'
import { TransactionPage } from './pages/transactions/TransactionPage'
import './App.css'

type PageKey =
  | 'dashboard'
  | 'analysis'
  | 'accounts'
  | 'goalBuckets'
  | 'categories'
  | 'transactions'
  | 'settings'

const pages: {
  key: PageKey
  label: string
  shortLabel: string
  description: string
}[] = [
  {
    key: 'dashboard',
    label: 'ダッシュボード',
    shortLabel: '残高と収支',
    description: '残高と今月の基準期間収支をまとめて確認するページです。',
  },
  {
    key: 'analysis',
    label: '収支分析',
    shortLabel: 'カテゴリ分析',
    description: '対象月ごとの1か月収支とカテゴリ別内訳を確認するページです。',
  },
  {
    key: 'accounts',
    label: '口座',
    shortLabel: '口座管理',
    description: '資産口座やカード口座を登録・編集するページです。',
  },
  {
    key: 'goalBuckets',
    label: '目的別口座',
    shortLabel: 'GoalBucket',
    description: '目的別に分けた残高を管理するページです。',
  },
  {
    key: 'categories',
    label: 'カテゴリ',
    shortLabel: '分類管理',
    description: '収支カテゴリとサブカテゴリを管理するページです。',
  },
  {
    key: 'transactions',
    label: '取引',
    shortLabel: '入出金',
    description: '通常取引、振替、配分を登録するページです。',
  },
  {
    key: 'settings',
    label: '設定',
    shortLabel: 'グローバル',
    description: '表示期間の開始日と土日祝補正ルールを設定するページです。',
  },
]

function App() {
  const isDevelopment = import.meta.env.DEV
  const [page, setPage] = useState<PageKey>('dashboard')
  const currentPage = pages.find((candidate) => candidate.key === page) ?? pages[0]

  return (
    <>
      {isDevelopment ? (
        <div className="environment-banner" role="status" aria-live="polite">
          DEVELOPMENT
        </div>
      ) : null}
      <header className="app-nav-shell">
        <div className="app-nav-header">
          <div>
            <p className="app-nav-kicker">flowlet workspace</p>
            <h1>{currentPage.label}</h1>
          </div>
          <p className="app-nav-description">{currentPage.description}</p>
        </div>
        <nav className="top-nav" aria-label="Main navigation">
          {pages.map((navigationPage) => (
            <button
              key={navigationPage.key}
              type="button"
              className={page === navigationPage.key ? 'active' : ''}
              aria-current={page === navigationPage.key ? 'page' : undefined}
              onClick={() => setPage(navigationPage.key)}
            >
              <span>{navigationPage.label}</span>
              <small>{navigationPage.shortLabel}</small>
            </button>
          ))}
        </nav>
      </header>
      {page === 'dashboard' ? <DashboardPage /> : null}
      {page === 'analysis' ? <CashflowAnalysisPage /> : null}
      {page === 'accounts' ? <AccountPage /> : null}
      {page === 'goalBuckets' ? <GoalBucketPage /> : null}
      {page === 'categories' ? <CategoryPage /> : null}
      {page === 'transactions' ? <TransactionPage /> : null}
      {page === 'settings' ? <AppSettingPage /> : null}
    </>
  )
}

export default App
