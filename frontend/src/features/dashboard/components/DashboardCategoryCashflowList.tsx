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
            <article
              key={category.categoryId}
              className={`dashboard-category-card ${tone}`}
            >
              <div>
                <strong>{category.categoryName}</strong>
                <p>{tone === 'income' ? '収入側の寄与' : '支出側の寄与'}</p>
              </div>
              <span>{formatMoney(category.amount)}</span>
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
