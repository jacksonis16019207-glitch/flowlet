import { useState } from 'react'
import { AccountPage } from './pages/accounts/AccountPage'
import { CategoryPage } from './pages/categories/CategoryPage'
import { GoalBucketPage } from './pages/goalBuckets/GoalBucketPage'
import { TransactionPage } from './pages/transactions/TransactionPage'
import './App.css'

function App() {
  const isDevelopment = import.meta.env.DEV
  const [page, setPage] = useState<
    'accounts' | 'goalBuckets' | 'categories' | 'transactions'
  >('accounts')

  return (
    <>
      {isDevelopment ? (
        <div className="environment-banner" role="status" aria-live="polite">
          DEVELOPMENT
        </div>
      ) : null}
      <nav className="top-nav" aria-label="Main navigation">
        <button
          type="button"
          className={page === 'accounts' ? 'active' : ''}
          onClick={() => setPage('accounts')}
        >
          口座
        </button>
        <button
          type="button"
          className={page === 'goalBuckets' ? 'active' : ''}
          onClick={() => setPage('goalBuckets')}
        >
          目的別口座
        </button>
        <button
          type="button"
          className={page === 'categories' ? 'active' : ''}
          onClick={() => setPage('categories')}
        >
          カテゴリ
        </button>
        <button
          type="button"
          className={page === 'transactions' ? 'active' : ''}
          onClick={() => setPage('transactions')}
        >
          取引
        </button>
      </nav>
      {page === 'accounts' ? <AccountPage /> : null}
      {page === 'goalBuckets' ? <GoalBucketPage /> : null}
      {page === 'categories' ? <CategoryPage /> : null}
      {page === 'transactions' ? <TransactionPage /> : null}
    </>
  )
}

export default App
