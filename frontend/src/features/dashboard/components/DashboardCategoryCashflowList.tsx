import type { DashboardCategoryCashflowCategory } from '../types/dashboard'

type DashboardCategoryCashflowListProps = {
  title: string
  categories: DashboardCategoryCashflowCategory[]
  emptyMessage: string
  tone: 'income' | 'expense'
}

export function DashboardCategoryCashflowList({
  title,
  categories,
  emptyMessage,
  tone,
}: DashboardCategoryCashflowListProps) {
  const totalAmount = categories.reduce(
    (sum, category) => sum + Math.abs(Number(category.amount)),
    0,
  )
  const maxAmount = Math.max(
    ...categories.map((category) => Math.abs(Number(category.amount))),
    1,
  )

  return (
    <section className="dashboard-category-group">
      <div className="section-heading">
        <h3>{title}</h3>
        <span>{categories.length} 件</span>
      </div>
      {categories.length === 0 ? (
        <p className="status">{emptyMessage}</p>
      ) : (
        <div className="dashboard-category-list">
          {categories.map((category) => (
            <article key={category.categoryId} className={`dashboard-category-card ${tone}`}>
              <div className="dashboard-category-main">
                <div className="dashboard-category-top">
                  <div>
                    <strong>{category.categoryName}</strong>
                    <p>{tone === 'income' ? '収入側の寄与' : '支出側の寄与'}</p>
                  </div>
                  <span>{formatMoney(category.amount)}</span>
                </div>
                <div className="dashboard-category-bar-track">
                  <div
                    className={`dashboard-category-bar-fill ${tone}`}
                    style={{
                      width: `${(Math.abs(Number(category.amount)) / maxAmount) * 100}%`,
                    }}
                  />
                </div>
                <p className="dashboard-category-ratio">
                  構成比 {formatPercent(totalAmount === 0 ? 0 : Number(category.amount) / totalAmount)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
}
