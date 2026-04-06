import { useState } from 'react'
import { CashflowAnalysisPage } from './pages/analysis/CashflowAnalysisPage'
import { AccountPage } from './pages/accounts/AccountPage'
import { CategoryPage } from './pages/categories/CategoryPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { GoalBucketPage } from './pages/goalBuckets/GoalBucketPage'
import { TransactionPage } from './pages/transactions/TransactionPage'
import './App.css'

type PageKey =
  | 'dashboard'
  | 'analysis'
  | 'accounts'
  | 'goalBuckets'
  | 'categories'
  | 'transactions'

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
    description: '現在の残高と直近の収支を最初に確認するページです。',
  },
  {
    key: 'analysis',
    label: '収支分析',
    shortLabel: '内訳',
    description: '月次推移とカテゴリ別内訳をまとめて確認するページです。',
  },
  {
    key: 'accounts',
    label: '口座',
    shortLabel: '管理',
    description: '資産口座や支払い元口座を整理して管理します。',
  },
  {
    key: 'goalBuckets',
    label: '目的別口座',
    shortLabel: '配分',
    description: '使い道ごとの残高を分けて確認しやすくします。',
  },
  {
    key: 'categories',
    label: 'カテゴリ',
    shortLabel: '分類',
    description: '取引入力で使う分類をまとめて整備します。',
  },
  {
    key: 'transactions',
    label: '取引',
    shortLabel: '記録',
    description: '通常取引、振替、配分をまとめて登録します。',
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
    </>
  )
}

export default App
