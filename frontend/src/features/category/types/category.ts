export type CategoryType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export const categoryTypeLabels: Record<CategoryType, string> = {
  INCOME: '収入',
  EXPENSE: '支出',
  TRANSFER: '振替',
}

export type Category = {
  categoryId: number
  categoryName: string
  categoryType: CategoryType
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CategoryUpsertInput = {
  categoryName: string
  categoryType: CategoryType
  displayOrder: number
  active: boolean
}

export type Subcategory = {
  subcategoryId: number
  categoryId: number
  subcategoryName: string
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type SubcategoryUpsertInput = {
  categoryId: number
  subcategoryName: string
  displayOrder: number
  active: boolean
}

export type DeleteCategoryResult = {
  categoryId: number
  action: 'DELETED' | 'DEACTIVATED'
  active: boolean
}

export type DeleteSubcategoryResult = {
  subcategoryId: number
  action: 'DELETED' | 'DEACTIVATED'
  active: boolean
}
