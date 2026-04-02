import { requestJson } from '../../../shared/lib/api/client'
import type {
  Category,
  CategoryType,
  CategoryUpsertInput,
  DeleteCategoryResult,
  DeleteSubcategoryResult,
  Subcategory,
  SubcategoryUpsertInput,
} from '../types/category'

export function fetchCategories(
  categoryType?: CategoryType,
  activeOnly?: boolean,
): Promise<Category[]> {
  const searchParams = new URLSearchParams()

  if (categoryType) {
    searchParams.set('categoryType', categoryType)
  }

  if (activeOnly !== undefined) {
    searchParams.set('activeOnly', String(activeOnly))
  }

  const query = searchParams.toString()
  return requestJson<Category[]>(`/api/categories${query ? `?${query}` : ''}`)
}

export function fetchSubcategories(
  categoryId?: number,
  activeOnly?: boolean,
): Promise<Subcategory[]> {
  const searchParams = new URLSearchParams()

  if (categoryId) {
    searchParams.set('categoryId', String(categoryId))
  }

  if (activeOnly !== undefined) {
    searchParams.set('activeOnly', String(activeOnly))
  }

  const query = searchParams.toString()
  return requestJson<Subcategory[]>(`/api/subcategories${query ? `?${query}` : ''}`)
}

export function createCategory(input: CategoryUpsertInput): Promise<Category> {
  return requestJson<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCategory(
  categoryId: number,
  input: CategoryUpsertInput,
): Promise<Category> {
  return requestJson<Category>(`/api/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCategory(categoryId: number): Promise<DeleteCategoryResult> {
  return requestJson<DeleteCategoryResult>(`/api/categories/${categoryId}`, {
    method: 'DELETE',
  })
}

export function createSubcategory(
  input: SubcategoryUpsertInput,
): Promise<Subcategory> {
  return requestJson<Subcategory>('/api/subcategories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateSubcategory(
  subcategoryId: number,
  input: SubcategoryUpsertInput,
): Promise<Subcategory> {
  return requestJson<Subcategory>(`/api/subcategories/${subcategoryId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteSubcategory(
  subcategoryId: number,
): Promise<DeleteSubcategoryResult> {
  return requestJson<DeleteSubcategoryResult>(`/api/subcategories/${subcategoryId}`, {
    method: 'DELETE',
  })
}
