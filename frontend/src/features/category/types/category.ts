export type CategoryType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export type Category = {
  categoryId: number
  categoryName: string
  categoryType: CategoryType
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
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
