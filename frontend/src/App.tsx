import { useState } from 'react'
import { AccountPage } from './pages/accounts/AccountPage'
import { GoalBucketPage } from './pages/goalBuckets/GoalBucketPage'
import './App.css'

function App() {
  const [page, setPage] = useState<'accounts' | 'goalBuckets'>('accounts')

  return (
    <>
      <nav className="top-nav" aria-label="Main navigation">
        <button
          type="button"
          className={page === 'accounts' ? 'active' : ''}
          onClick={() => setPage('accounts')}
        >
          Accounts
        </button>
        <button
          type="button"
          className={page === 'goalBuckets' ? 'active' : ''}
          onClick={() => setPage('goalBuckets')}
        >
          Goal Buckets
        </button>
      </nav>
      {page === 'accounts' ? <AccountPage /> : <GoalBucketPage />}
    </>
  )
}

export default App
