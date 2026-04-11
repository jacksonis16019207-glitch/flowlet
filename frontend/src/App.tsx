import { useEffect, useState } from 'react'
import { AccountPage } from './pages/accounts/AccountPage'
import { CategoryPage } from './pages/categories/CategoryPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { AppSettingPage } from './pages/settings/AppSettingPage'
import { TransactionPage } from './pages/transactions/TransactionPage'
import './App.css'

type PageKey = 'dashboard' | 'ledger' | 'accounts' | 'settings'
type SettingsSectionKey = 'general' | 'categories'

type NavigationPage = {
  key: PageKey
  label: string
  shortLabel: string
  description: string
}

type SettingsSection = {
  key: SettingsSectionKey
  label: string
  description: string
}

const pages: NavigationPage[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Overview',
    description: '現在残高と選択月の収支をまとめて確認します。',
  },
  {
    key: 'ledger',
    label: 'Ledger',
    shortLabel: 'Record',
    description: '取引、振替、配分をまとめて記録して見直します。',
  },
  {
    key: 'accounts',
    label: 'Accounts',
    shortLabel: 'Money Map',
    description: '銀行口座、クレジットカード、目的別口座を管理します。',
  },
  {
    key: 'settings',
    label: 'Settings',
    shortLabel: 'Rules',
    description: '集計ルールとカテゴリマスタを管理します。',
  },
]

const settingsSections: SettingsSection[] = [
  {
    key: 'general',
    label: 'General',
    description: '月初日と営業日調整ルールを設定します。',
  },
  {
    key: 'categories',
    label: 'Categories',
    description: '収入、支出、振替に使うカテゴリとサブカテゴリを管理します。',
  },
]

function App() {
  const isDevelopment = import.meta.env.DEV
  const [page, setPage] = useState<PageKey>('dashboard')
  const [settingsSection, setSettingsSection] =
    useState<SettingsSectionKey>('general')

  const currentPage = pages.find((candidate) => candidate.key === page) ?? pages[0]
  const currentSettingsSection =
    settingsSections.find((section) => section.key === settingsSection) ??
    settingsSections[0]

  useEffect(() => {
    const title =
      page === 'settings'
        ? `${currentSettingsSection.label} | ${currentPage.label} | flowlet`
        : `${currentPage.label} | flowlet`

    document.title = title
  }, [currentPage.label, currentSettingsSection.label, page])

  function handlePageChange(nextPage: PageKey) {
    setPage(nextPage)

    if (nextPage !== 'settings') {
      setSettingsSection('general')
    }
  }

  return (
    <>
      {isDevelopment ? (
        <div className="environment-banner" role="status" aria-live="polite">
          DEVELOPMENT
        </div>
      ) : null}
      <div className="app-layout-shell">
        <aside className="app-sidebar">
          <div className="app-sidebar-brand">
            <p className="app-sidebar-kicker">flowlet workspace</p>
            <h1>flowlet</h1>
            <p className="app-sidebar-copy">
              お金の流れを把握、記録、整理するためのワークスペースです。
            </p>
          </div>

          <nav className="app-side-nav" aria-label="Main navigation">
            {pages.map((navigationPage) => (
              <button
                key={navigationPage.key}
                type="button"
                className={page === navigationPage.key ? 'active' : ''}
                aria-current={page === navigationPage.key ? 'page' : undefined}
                onClick={() => handlePageChange(navigationPage.key)}
              >
                <span>{navigationPage.label}</span>
                <small>{navigationPage.shortLabel}</small>
              </button>
            ))}
          </nav>
        </aside>

        <div className="app-main-shell">
          <header className="app-page-header">
            <div>
              <p className="app-page-kicker">workspace view</p>
              <h2>{currentPage.label}</h2>
            </div>
            <p className="app-page-description">
              {page === 'settings'
                ? currentSettingsSection.description
                : currentPage.description}
            </p>
          </header>

          {page === 'settings' ? (
            <div className="app-subnav-shell" role="tablist" aria-label="Settings sections">
              {settingsSections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  className={settingsSection === section.key ? 'active' : ''}
                  aria-selected={settingsSection === section.key}
                  onClick={() => setSettingsSection(section.key)}
                >
                  <span>{section.label}</span>
                  <small>{section.description}</small>
                </button>
              ))}
            </div>
          ) : null}

          <main className="app-page-content">
            {page === 'dashboard' ? <DashboardPage /> : null}
            {page === 'ledger' ? <TransactionPage /> : null}
            {page === 'accounts' ? <AccountPage /> : null}
            {page === 'settings' && settingsSection === 'general' ? (
              <AppSettingPage />
            ) : null}
            {page === 'settings' && settingsSection === 'categories' ? (
              <CategoryPage />
            ) : null}
          </main>
        </div>
      </div>

      <nav className="app-bottom-nav" aria-label="Mobile navigation">
        {pages.map((navigationPage) => (
          <button
            key={navigationPage.key}
            type="button"
            className={page === navigationPage.key ? 'active' : ''}
            aria-current={page === navigationPage.key ? 'page' : undefined}
            onClick={() => handlePageChange(navigationPage.key)}
          >
            <span>{navigationPage.label}</span>
            <small>{navigationPage.shortLabel}</small>
          </button>
        ))}
      </nav>
    </>
  )
}

export default App
