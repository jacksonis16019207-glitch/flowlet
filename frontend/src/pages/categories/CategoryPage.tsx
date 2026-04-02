import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  fetchCategories,
  fetchSubcategories,
  updateCategory,
  updateSubcategory,
} from '../../features/category/api/categoryApi'
import {
  categoryTypeLabels,
  type Category,
  type CategoryType,
  type CategoryUpsertInput,
  type DeleteCategoryResult,
  type DeleteSubcategoryResult,
  type Subcategory,
  type SubcategoryUpsertInput,
} from '../../features/category/types/category'
import { ApiRequestError } from '../../shared/lib/api/client'

const emptyCategoryForm: CategoryUpsertInput = {
  categoryName: '',
  categoryType: 'EXPENSE',
  displayOrder: 10,
  active: true,
}

const emptySubcategoryForm = (categoryId: number): SubcategoryUpsertInput => ({
  categoryId,
  subcategoryName: '',
  displayOrder: 10,
  active: true,
})

const categoryTypeOrder: CategoryType[] = ['INCOME', 'EXPENSE', 'TRANSFER']

export function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [createCategoryForm, setCreateCategoryForm] =
    useState<CategoryUpsertInput>(emptyCategoryForm)
  const [createSubcategoryForms, setCreateSubcategoryForms] = useState<
    Record<number, SubcategoryUpsertInput>
  >({})
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryForm, setEditingCategoryForm] =
    useState<CategoryUpsertInput>(emptyCategoryForm)
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<number | null>(
    null,
  )
  const [editingSubcategoryForm, setEditingSubcategoryForm] =
    useState<SubcategoryUpsertInput>(emptySubcategoryForm(0))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    setLoading(true)
    setErrorMessage('')

    try {
      const [categoryData, subcategoryData] = await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
      ])

      setCategories(categoryData)
      setSubcategories(subcategoryData)
      setCreateSubcategoryForms((current) => {
        const next = { ...current }

        for (const category of categoryData) {
          if (!next[category.categoryId]) {
            next[category.categoryId] = emptySubcategoryForm(category.categoryId)
          }
        }

        return next
      })
    } catch {
      setErrorMessage(
        'カテゴリ管理画面の取得に失敗しました。バックエンドの状態を確認してください。',
      )
    } finally {
      setLoading(false)
    }
  }

  const groupedCategories = useMemo(
    () =>
      categoryTypeOrder.map((categoryType) => ({
        categoryType,
        label: categoryTypeLabels[categoryType],
        items: categories.filter((category) => category.categoryType === categoryType),
      })),
    [categories],
  )

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    resetMessages()

    try {
      await createCategory(createCategoryForm)
      setCreateCategoryForm(emptyCategoryForm)
      setInfoMessage('カテゴリを登録しました。')
      await loadPageData()
    } catch (error) {
      handleApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateCategory(
    event: FormEvent<HTMLFormElement>,
    categoryId: number,
  ) {
    event.preventDefault()
    setSubmitting(true)
    resetMessages()

    try {
      await updateCategory(categoryId, editingCategoryForm)
      setEditingCategoryId(null)
      setInfoMessage('カテゴリを更新しました。')
      await loadPageData()
    } catch (error) {
      handleApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCategory(categoryId: number) {
    if (
      !window.confirm(
        'カテゴリを削除します。参照中の場合は停止状態に切り替わります。',
      )
    ) {
      return
    }

    setSubmitting(true)
    resetMessages()

    try {
      const result = await deleteCategory(categoryId)
      setInfoMessage(categoryDeleteMessage(result))
      await loadPageData()
    } catch (error) {
      handleApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateSubcategory(
    event: FormEvent<HTMLFormElement>,
    categoryId: number,
  ) {
    event.preventDefault()
    setSubmitting(true)
    resetMessages()

    try {
      await createSubcategory(createSubcategoryForms[categoryId])
      setCreateSubcategoryForms((current) => ({
        ...current,
        [categoryId]: emptySubcategoryForm(categoryId),
      }))
      setInfoMessage('サブカテゴリを登録しました。')
      await loadPageData()
    } catch (error) {
      handleApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateSubcategory(
    event: FormEvent<HTMLFormElement>,
    subcategoryId: number,
  ) {
    event.preventDefault()
    setSubmitting(true)
    resetMessages()

    try {
      await updateSubcategory(subcategoryId, editingSubcategoryForm)
      setEditingSubcategoryId(null)
      setInfoMessage('サブカテゴリを更新しました。')
      await loadPageData()
    } catch (error) {
      handleApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteSubcategory(subcategoryId: number) {
    if (
      !window.confirm(
        'サブカテゴリを削除します。参照中の場合は停止状態に切り替わります。',
      )
    ) {
      return
    }

    setSubmitting(true)
    resetMessages()

    try {
      const result = await deleteSubcategory(subcategoryId)
      setInfoMessage(subcategoryDeleteMessage(result))
      await loadPageData()
    } catch (error) {
      handleApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  function beginCategoryEdit(category: Category) {
    setEditingCategoryId(category.categoryId)
    setEditingCategoryForm({
      categoryName: category.categoryName,
      categoryType: category.categoryType,
      displayOrder: category.displayOrder,
      active: category.active,
    })
    resetMessages()
  }

  function beginSubcategoryEdit(subcategory: Subcategory) {
    setEditingSubcategoryId(subcategory.subcategoryId)
    setEditingSubcategoryForm({
      categoryId: subcategory.categoryId,
      subcategoryName: subcategory.subcategoryName,
      displayOrder: subcategory.displayOrder,
      active: subcategory.active,
    })
    resetMessages()
  }

  function updateCreateSubcategoryForm(
    categoryId: number,
    updater: (current: SubcategoryUpsertInput) => SubcategoryUpsertInput,
  ) {
    setCreateSubcategoryForms((current) => ({
      ...current,
      [categoryId]: updater(current[categoryId] ?? emptySubcategoryForm(categoryId)),
    }))
  }

  function resetMessages() {
    setSubmitErrorMessage('')
    setInfoMessage('')
    setFieldErrors({})
  }

  function handleApiError(error: unknown) {
    if (error instanceof ApiRequestError) {
      setSubmitErrorMessage(error.message)
      setFieldErrors(
        error.fieldErrors.reduce<Record<string, string>>((accumulator, fieldError) => {
          accumulator[fieldError.field] = fieldError.message
          return accumulator
        }, {}),
      )
      return
    }

    setSubmitErrorMessage(
      'カテゴリ操作に失敗しました。入力内容とバックエンドの状態を確認してください。',
    )
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / カテゴリ管理</p>
        <h1>カテゴリとサブカテゴリを管理する</h1>
        <p className="lead">
          取引で使うカテゴリ体系をここで自由に調整します。参照中の項目を削除した場合は、
          履歴を壊さないため停止状態へ切り替えます。
        </p>
        <div className="hero-stats">
          <article>
            <span>カテゴリ数</span>
            <strong>{categories.length}</strong>
          </article>
          <article>
            <span>サブカテゴリ数</span>
            <strong>{subcategories.length}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">新規カテゴリ</p>
            <h2>カテゴリを追加</h2>
          </div>

          {infoMessage ? <div className="status">{infoMessage}</div> : null}
          {submitErrorMessage ? (
            <div className="status error" role="alert">
              {submitErrorMessage}
            </div>
          ) : null}

          <form className="account-form" onSubmit={handleCreateCategory}>
            <label>
              カテゴリ名
              <input
                aria-invalid={fieldErrors.categoryName ? 'true' : 'false'}
                value={createCategoryForm.categoryName}
                onChange={(event) =>
                  setCreateCategoryForm({
                    ...createCategoryForm,
                    categoryName: event.target.value,
                  })
                }
                maxLength={100}
                required
              />
              {fieldErrors.categoryName ? (
                <span className="field-error">{fieldErrors.categoryName}</span>
              ) : null}
            </label>

            <label>
              カテゴリ種別
              <select
                aria-invalid={fieldErrors.categoryType ? 'true' : 'false'}
                value={createCategoryForm.categoryType}
                onChange={(event) =>
                  setCreateCategoryForm({
                    ...createCategoryForm,
                    categoryType: event.target.value as CategoryType,
                  })
                }
              >
                {categoryTypeOrder.map((categoryType) => (
                  <option key={categoryType} value={categoryType}>
                    {categoryTypeLabels[categoryType]}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryType ? (
                <span className="field-error">{fieldErrors.categoryType}</span>
              ) : null}
            </label>

            <label>
              表示順
              <input
                type="number"
                value={createCategoryForm.displayOrder}
                onChange={(event) =>
                  setCreateCategoryForm({
                    ...createCategoryForm,
                    displayOrder: Number(event.target.value),
                  })
                }
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={createCategoryForm.active}
                onChange={(event) =>
                  setCreateCategoryForm({
                    ...createCategoryForm,
                    active: event.target.checked,
                  })
                }
              />
              利用中として登録
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? '保存中...' : 'カテゴリを登録'}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">カテゴリ一覧</p>
            <h2>カテゴリ体系を編集</h2>
          </div>

          {loading ? <div className="status">カテゴリを読み込み中です...</div> : null}
          {!loading && errorMessage ? (
            <div className="status error">{errorMessage}</div>
          ) : null}

          {!loading && !errorMessage ? (
            <div className="category-management">
              {groupedCategories.map((group) => (
                <section key={group.categoryType} className="category-type-group">
                  <div className="section-heading">
                    <h3>{group.label}</h3>
                    <span>{group.items.length}件</span>
                  </div>

                  <div className="category-stack">
                    {group.items.length === 0 ? (
                      <div className="status">まだ登録されていません。</div>
                    ) : null}

                    {group.items.map((category) => (
                      <CategoryCard
                        key={category.categoryId}
                        category={category}
                        categories={categories}
                        subcategories={subcategories.filter(
                          (subcategory) => subcategory.categoryId === category.categoryId,
                        )}
                        createSubcategoryForm={
                          createSubcategoryForms[category.categoryId] ??
                          emptySubcategoryForm(category.categoryId)
                        }
                        editingCategoryId={editingCategoryId}
                        editingCategoryForm={editingCategoryForm}
                        editingSubcategoryId={editingSubcategoryId}
                        editingSubcategoryForm={editingSubcategoryForm}
                        submitting={submitting}
                        onBeginCategoryEdit={beginCategoryEdit}
                        onDeleteCategory={handleDeleteCategory}
                        onCategoryFormChange={setEditingCategoryForm}
                        onCancelCategoryEdit={() => setEditingCategoryId(null)}
                        onUpdateCategory={handleUpdateCategory}
                        onBeginSubcategoryEdit={beginSubcategoryEdit}
                        onDeleteSubcategory={handleDeleteSubcategory}
                        onSubcategoryFormChange={setEditingSubcategoryForm}
                        onCancelSubcategoryEdit={() => setEditingSubcategoryId(null)}
                        onUpdateSubcategory={handleUpdateSubcategory}
                        onCreateSubcategoryFormChange={updateCreateSubcategoryForm}
                        onCreateSubcategory={handleCreateSubcategory}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}

type CategoryCardProps = {
  category: Category
  categories: Category[]
  subcategories: Subcategory[]
  createSubcategoryForm: SubcategoryUpsertInput
  editingCategoryId: number | null
  editingCategoryForm: CategoryUpsertInput
  editingSubcategoryId: number | null
  editingSubcategoryForm: SubcategoryUpsertInput
  submitting: boolean
  onBeginCategoryEdit: (category: Category) => void
  onDeleteCategory: (categoryId: number) => void
  onCategoryFormChange: (value: CategoryUpsertInput) => void
  onCancelCategoryEdit: () => void
  onUpdateCategory: (
    event: FormEvent<HTMLFormElement>,
    categoryId: number,
  ) => Promise<void>
  onBeginSubcategoryEdit: (subcategory: Subcategory) => void
  onDeleteSubcategory: (subcategoryId: number) => void
  onSubcategoryFormChange: (value: SubcategoryUpsertInput) => void
  onCancelSubcategoryEdit: () => void
  onUpdateSubcategory: (
    event: FormEvent<HTMLFormElement>,
    subcategoryId: number,
  ) => Promise<void>
  onCreateSubcategoryFormChange: (
    categoryId: number,
    updater: (current: SubcategoryUpsertInput) => SubcategoryUpsertInput,
  ) => void
  onCreateSubcategory: (
    event: FormEvent<HTMLFormElement>,
    categoryId: number,
  ) => Promise<void>
}

function CategoryCard({
  category,
  categories,
  subcategories,
  createSubcategoryForm,
  editingCategoryId,
  editingCategoryForm,
  editingSubcategoryId,
  editingSubcategoryForm,
  submitting,
  onBeginCategoryEdit,
  onDeleteCategory,
  onCategoryFormChange,
  onCancelCategoryEdit,
  onUpdateCategory,
  onBeginSubcategoryEdit,
  onDeleteSubcategory,
  onSubcategoryFormChange,
  onCancelSubcategoryEdit,
  onUpdateSubcategory,
  onCreateSubcategoryFormChange,
  onCreateSubcategory,
}: CategoryCardProps) {
  return (
    <article className="account-card">
      <div className="account-card-header">
        <div>
          <h3>{category.categoryName}</h3>
          <p>
            表示順 {category.displayOrder} / 種別 {categoryTypeLabels[category.categoryType]}
          </p>
        </div>
        <div className="category-actions">
          <span className={`badge ${category.active ? 'active' : 'inactive'}`}>
            {category.active ? '利用中' : '停止中'}
          </span>
          <button type="button" className="action-button" onClick={() => onBeginCategoryEdit(category)}>
            編集
          </button>
          <button
            type="button"
            className="action-button danger"
            onClick={() => void onDeleteCategory(category.categoryId)}
          >
            削除
          </button>
        </div>
      </div>

      {editingCategoryId === category.categoryId ? (
        <form
          className="account-form nested-form"
          onSubmit={(event) => void onUpdateCategory(event, category.categoryId)}
        >
          <label>
            カテゴリ名
            <input
              value={editingCategoryForm.categoryName}
              onChange={(event) =>
                onCategoryFormChange({
                  ...editingCategoryForm,
                  categoryName: event.target.value,
                })
              }
              maxLength={100}
              required
            />
          </label>
          <div className="subform-grid">
            <label>
              種別
              <select
                value={editingCategoryForm.categoryType}
                onChange={(event) =>
                  onCategoryFormChange({
                    ...editingCategoryForm,
                    categoryType: event.target.value as CategoryType,
                  })
                }
              >
                {categoryTypeOrder.map((categoryType) => (
                  <option key={categoryType} value={categoryType}>
                    {categoryTypeLabels[categoryType]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              表示順
              <input
                type="number"
                value={editingCategoryForm.displayOrder}
                onChange={(event) =>
                  onCategoryFormChange({
                    ...editingCategoryForm,
                    displayOrder: Number(event.target.value),
                  })
                }
              />
            </label>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={editingCategoryForm.active}
              onChange={(event) =>
                onCategoryFormChange({
                  ...editingCategoryForm,
                  active: event.target.checked,
                })
              }
            />
            利用中
          </label>
          <div className="button-row">
            <button type="submit" disabled={submitting}>
              保存
            </button>
            <button type="button" className="secondary" onClick={onCancelCategoryEdit}>
              キャンセル
            </button>
          </div>
        </form>
      ) : null}

      <div className="nested-panel">
        <div className="section-heading">
          <h4>サブカテゴリ</h4>
          <span>{subcategories.length}件</span>
        </div>

        <div className="subcategory-list">
          {subcategories.length === 0 ? <div className="status">未登録です。</div> : null}

          {subcategories.map((subcategory) => (
            <div key={subcategory.subcategoryId} className="subcategory-item">
              <div>
                <strong>{subcategory.subcategoryName}</strong>
                <p>表示順 {subcategory.displayOrder}</p>
              </div>
              <div className="category-actions">
                <span className={`badge ${subcategory.active ? 'active' : 'inactive'}`}>
                  {subcategory.active ? '利用中' : '停止中'}
                </span>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => onBeginSubcategoryEdit(subcategory)}
                >
                  編集
                </button>
                <button
                  type="button"
                  className="action-button danger"
                  onClick={() => void onDeleteSubcategory(subcategory.subcategoryId)}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingSubcategoryId !== null &&
        subcategories.some((subcategory) => subcategory.subcategoryId === editingSubcategoryId) ? (
          <form
            className="account-form nested-form"
            onSubmit={(event) => void onUpdateSubcategory(event, editingSubcategoryId)}
          >
            <label>
              サブカテゴリ名
              <input
                value={editingSubcategoryForm.subcategoryName}
                onChange={(event) =>
                  onSubcategoryFormChange({
                    ...editingSubcategoryForm,
                    subcategoryName: event.target.value,
                  })
                }
                maxLength={100}
                required
              />
            </label>
            <div className="subform-grid">
              <label>
                親カテゴリ
                <select
                  value={editingSubcategoryForm.categoryId}
                  onChange={(event) =>
                    onSubcategoryFormChange({
                      ...editingSubcategoryForm,
                      categoryId: Number(event.target.value),
                    })
                  }
                >
                  {categories.map((option) => (
                    <option key={option.categoryId} value={option.categoryId}>
                      {categoryTypeLabels[option.categoryType]} / {option.categoryName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                表示順
                <input
                  type="number"
                  value={editingSubcategoryForm.displayOrder}
                  onChange={(event) =>
                    onSubcategoryFormChange({
                      ...editingSubcategoryForm,
                      displayOrder: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={editingSubcategoryForm.active}
                onChange={(event) =>
                  onSubcategoryFormChange({
                    ...editingSubcategoryForm,
                    active: event.target.checked,
                  })
                }
              />
              利用中
            </label>
            <div className="button-row">
              <button type="submit" disabled={submitting}>
                保存
              </button>
              <button
                type="button"
                className="secondary"
                onClick={onCancelSubcategoryEdit}
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : null}

        <form
          className="account-form nested-form"
          onSubmit={(event) => void onCreateSubcategory(event, category.categoryId)}
        >
          <p className="eyebrow">新規サブカテゴリ</p>
          <label>
            サブカテゴリ名
            <input
              value={createSubcategoryForm.subcategoryName}
              onChange={(event) =>
                onCreateSubcategoryFormChange(category.categoryId, (current) => ({
                  ...current,
                  subcategoryName: event.target.value,
                }))
              }
              maxLength={100}
              required
            />
          </label>
          <div className="subform-grid">
            <label>
              表示順
              <input
                type="number"
                value={createSubcategoryForm.displayOrder}
                onChange={(event) =>
                  onCreateSubcategoryFormChange(category.categoryId, (current) => ({
                    ...current,
                    displayOrder: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={createSubcategoryForm.active}
                onChange={(event) =>
                  onCreateSubcategoryFormChange(category.categoryId, (current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
              />
              利用中
            </label>
          </div>
          <button type="submit" disabled={submitting}>
            サブカテゴリを追加
          </button>
        </form>
      </div>
    </article>
  )
}

function categoryDeleteMessage(result: DeleteCategoryResult): string {
  return result.action === 'DELETED'
    ? 'カテゴリを削除しました。'
    : 'カテゴリは取引で利用中のため停止状態に切り替えました。'
}

function subcategoryDeleteMessage(result: DeleteSubcategoryResult): string {
  return result.action === 'DELETED'
    ? 'サブカテゴリを削除しました。'
    : 'サブカテゴリは取引で利用中のため停止状態に切り替えました。'
}
