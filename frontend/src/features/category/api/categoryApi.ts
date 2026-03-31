import { requestJson } from '../../../shared/lib/api/client'
import type { Category, CategoryType, Subcategory } from '../types/category'

export function fetchCategories(categoryType?: CategoryType): Promise<Category[]> {
  const searchParams = new URLSearchParams()

  if (categoryType) {
    searchParams.set('categoryType', categoryType)
  }

  const query = searchParams.toString()
  return requestJson<Category[]>(`/api/categories${query ? `?${query}` : ''}`)
}

export function fetchSubcategories(categoryId?: number): Promise<Subcategory[]> {
  const searchParams = new URLSearchParams()

  if (categoryId) {
    searchParams.set('categoryId', String(categoryId))
  }

  const query = searchParams.toString()
  return requestJson<Subcategory[]>(`/api/subcategories${query ? `?${query}` : ''}`)
}
