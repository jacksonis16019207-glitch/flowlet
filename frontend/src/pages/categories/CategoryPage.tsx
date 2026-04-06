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
import { FormModal } from '../../shared/components/FormModal'
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

const categoryTypeDescriptions: Record<CategoryType, string> = {
  INCOME: '入金系の分類をまとめて管理します。',
  EXPENSE: '日々の支出入力で使う分類を整えます。',
  TRANSFER: '口座移動や内部振替の分類を管理します。',
}

type CategoryModalMode = 'create' | 'edit' | null
type CategorySortOrder = 'displayOrder' | 'name'

export function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [activeCategoryType, setActiveCategoryType] = useState<CategoryType>('EXPENSE')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState<CategorySortOrder>('displayOrder')
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
  const [categoryModalMode, setCategoryModalMode] =
    useState<CategoryModalMode>(null)

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
        items: categories
          .filter((category) => category.categoryType === categoryType)
          .filter((category) => {
            const keyword = searchKeyword.trim().toLowerCase()
            if (!keyword) {
              return true
            }

            const relatedSubcategories = subcategories.filter(
              (subcategory) => subcategory.categoryId === category.categoryId,
            )
            const targets = [
              category.categoryName,
              ...relatedSubcategories.map((subcategory) => subcategory.subcategoryName),
            ]

            return targets.some((target) => target.toLowerCase().includes(keyword))
          })
          .sort((left, right) => {
            if (sortOrder === 'name') {
              return left.categoryName.localeCompare(right.categoryName, 'ja')
            }

            if (left.displayOrder !== right.displayOrder) {
              return left.displayOrder - right.displayOrder
            }

            return left.categoryName.localeCompare(right.categoryName, 'ja')
          }),
      })),
    [categories, searchKeyword, sortOrder, subcategories],
  )
  const activeGroup =
    groupedCategories.find((group) => group.categoryType === activeCategoryType) ??
    groupedCategories[0]

  const categoryFormValue =
    categoryModalMode === 'edit' ? editingCategoryForm : createCategoryForm

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    resetMessages()

    try {
      await createCategory(createCategoryForm)
      setCreateCategoryForm(emptyCategoryForm)
      setCategoryModalMode(null)
      setInfoMessage('カテゴリを追加しました。')
      await loadPageData()
    } catch (error) {
      handleApiError(error)
      setCategoryModalMode('create')
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
      setCategoryModalMode(null)
      setInfoMessage('カテゴリを更新しました。')
      await loadPageData()
    } catch (error) {
      handleApiError(error)
      setCategoryModalMode('edit')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCategory(categoryId: number) {
    if (!window.confirm('カテゴリを削除しますか。通常は元に戻せません。')) {
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
      setInfoMessage('サブカテゴリを追加しました。')
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
    if (!window.confirm('サブカテゴリを削除しますか。通常は元に戻せません。')) {
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

  function openCreateCategoryModal() {
    setEditingCategoryId(null)
    setCreateCategoryForm(emptyCategoryForm)
    resetMessages()
    setCategoryModalMode('create')
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
    setCategoryModalMode('edit')
  }

  function closeCategoryModal() {
    setEditingCategoryId(null)
    setCreateCategoryForm(emptyCategoryForm)
    setEditingCategoryForm(emptyCategoryForm)
    resetMessages()
    setCategoryModalMode(null)
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
        <p className="eyebrow">flowlet / categories</p>
        <h1>カテゴリとサブカテゴリを整理する</h1>
        <p className="lead">
          カテゴリ本体はモーダルで追加・編集し、サブカテゴリは一覧の文脈を保ったまま調整できるようにしています。
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
          <article>
            <span>表示中</span>
            <strong>{categoryTypeLabels[activeCategoryType]}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel account-list-panel">
          <div className="panel-heading">
            <p className="eyebrow">カテゴリ一覧</p>
            <h2>登録済みカテゴリ</h2>
          </div>

          {infoMessage ? <div className="status">{infoMessage}</div> : null}
          {submitErrorMessage && categoryModalMode == null ? (
            <div className="status error" role="alert">
              {submitErrorMessage}
            </div>
          ) : null}

          <div className="button-row">
            <button type="button" onClick={openCreateCategoryModal}>
              新規カテゴリを追加
            </button>
          </div>

          <div className="category-toolbar">
            <div className="category-type-tabs" role="tablist" aria-label="カテゴリ種別">
              {categoryTypeOrder.map((categoryType) => (
                <button
                  key={categoryType}
                  type="button"
                  role="tab"
                  className={activeCategoryType === categoryType ? 'active' : ''}
                  aria-selected={activeCategoryType === categoryType}
                  onClick={() => setActiveCategoryType(categoryType)}
                >
                  {categoryTypeLabels[categoryType]}
                </button>
              ))}
            </div>
            <div className="category-filter-row">
              <label>
                キーワード検索
                <input
                  type="search"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="カテゴリ名・サブカテゴリ名で絞り込む"
                />
              </label>
              <label>
                並び順
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as CategorySortOrder)
                  }
                >
                  <option value="displayOrder">表示順</option>
                  <option value="name">名前順</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? <div className="status">カテゴリを読み込み中です...</div> : null}
          {!loading && errorMessage ? (
            <div className="status error">{errorMessage}</div>
          ) : null}

          {!loading && !errorMessage ? (
            <div className="category-management">
              <section key={activeGroup.categoryType} className="category-type-group">
                <div className="section-heading">
                  <div>
                    <h3>{activeGroup.label}</h3>
                    <p className="section-description">
                      {categoryTypeDescriptions[activeGroup.categoryType]}
                    </p>
                  </div>
                  <span>{activeGroup.items.length}件</span>
                </div>

                <div className="category-stack">
                  {activeGroup.items.length === 0 ? (
                    <div className="status">
                      {searchKeyword
                        ? '条件に一致するカテゴリはありません。'
                        : 'まだ登録されていません。'}
                    </div>
                  ) : null}

                  {activeGroup.items.map((category) => (
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
                      editingSubcategoryId={editingSubcategoryId}
                      editingSubcategoryForm={editingSubcategoryForm}
                      submitting={submitting}
                      onBeginCategoryEdit={beginCategoryEdit}
                      onDeleteCategory={handleDeleteCategory}
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
            </div>
          ) : null}
        </section>
      </section>

      <FormModal
        open={categoryModalMode != null}
        title={categoryModalMode === 'edit' ? 'カテゴリを編集' : 'カテゴリを追加'}
        description={
          categoryModalMode === 'edit'
            ? 'カテゴリ本体の名称や種別を更新します。'
            : '新しいカテゴリを追加します。'
        }
        onClose={closeCategoryModal}
      >
        {submitErrorMessage ? (
          <div className="status error" role="alert">
            {submitErrorMessage}
          </div>
        ) : null}

        <form
          className="account-form"
          onSubmit={(event) =>
            categoryModalMode === 'edit'
              ? void handleUpdateCategory(event, editingCategoryId ?? 0)
              : void handleCreateCategory(event)
          }
        >
          <label>
            カテゴリ名
            <input
              aria-invalid={fieldErrors.categoryName ? 'true' : 'false'}
              value={categoryFormValue.categoryName}
              onChange={(event) => {
                const nextValue = {
                  ...categoryFormValue,
                  categoryName: event.target.value,
                }
                if (categoryModalMode === 'edit') {
                  setEditingCategoryForm(nextValue)
                } else {
                  setCreateCategoryForm(nextValue)
                }
              }}
              maxLength={100}
              required
            />
            {fieldErrors.categoryName ? (
              <span className="field-error">{fieldErrors.categoryName}</span>
            ) : null}
          </label>

          <label>
            種別
            <select
              aria-invalid={fieldErrors.categoryType ? 'true' : 'false'}
              value={categoryFormValue.categoryType}
              onChange={(event) => {
                const nextValue = {
                  ...categoryFormValue,
                  categoryType: event.target.value as CategoryType,
                }
                if (categoryModalMode === 'edit') {
                  setEditingCategoryForm(nextValue)
                } else {
                  setCreateCategoryForm(nextValue)
                }
              }}
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
              value={categoryFormValue.displayOrder}
              onChange={(event) => {
                const nextValue = {
                  ...categoryFormValue,
                  displayOrder: Number(event.target.value),
                }
                if (categoryModalMode === 'edit') {
                  setEditingCategoryForm(nextValue)
                } else {
                  setCreateCategoryForm(nextValue)
                }
              }}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={categoryFormValue.active}
              onChange={(event) => {
                const nextValue = {
                  ...categoryFormValue,
                  active: event.target.checked,
                }
                if (categoryModalMode === 'edit') {
                  setEditingCategoryForm(nextValue)
                } else {
                  setCreateCategoryForm(nextValue)
                }
              }}
            />
            有効なカテゴリとして登録
          </label>

          <div className="button-row modal-action-row">
            <button type="submit" disabled={submitting}>
              {submitting
                ? '保存中...'
                : categoryModalMode === 'edit'
                  ? 'カテゴリを更新'
                  : 'カテゴリを追加'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={closeCategoryModal}
            >
              キャンセル
            </button>
          </div>
        </form>
      </FormModal>
    </main>
  )
}

type CategoryCardProps = {
  category: Category
  categories: Category[]
  subcategories: Subcategory[]
  createSubcategoryForm: SubcategoryUpsertInput
  editingSubcategoryId: number | null
  editingSubcategoryForm: SubcategoryUpsertInput
  submitting: boolean
  onBeginCategoryEdit: (category: Category) => void
  onDeleteCategory: (categoryId: number) => void
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
  editingSubcategoryId,
  editingSubcategoryForm,
  submitting,
  onBeginCategoryEdit,
  onDeleteCategory,
  onBeginSubcategoryEdit,
  onDeleteSubcategory,
  onSubcategoryFormChange,
  onCancelSubcategoryEdit,
  onUpdateSubcategory,
  onCreateSubcategoryFormChange,
  onCreateSubcategory,
}: CategoryCardProps) {
  const sortedSubcategories = [...subcategories].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder
    }

    return left.subcategoryName.localeCompare(right.subcategoryName, 'ja')
  })

  return (
    <article className="account-card">
      <div className="account-card-header">
        <div>
          <h3>{category.categoryName}</h3>
          <p>
            表示順 {category.displayOrder} / 種別{' '}
            {categoryTypeLabels[category.categoryType]}
          </p>
        </div>
        <div className="category-actions">
          <span className={`badge ${category.active ? 'active' : 'inactive'}`}>
            {category.active ? '有効' : '停止'}
          </span>
          <button
            type="button"
            className="action-button"
            onClick={() => onBeginCategoryEdit(category)}
          >
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

      <div className="nested-panel">
        <div className="section-heading">
          <h4>サブカテゴリ</h4>
          <span>{subcategories.length}件</span>
        </div>

        <div className="subcategory-list">
          {sortedSubcategories.length === 0 ? (
            <div className="status">まだ登録されていません。</div>
          ) : null}

          {sortedSubcategories.map((subcategory) => (
            <div key={subcategory.subcategoryId} className="subcategory-item">
              <div>
                <strong>{subcategory.subcategoryName}</strong>
                <p>表示順 {subcategory.displayOrder}</p>
              </div>
              <div className="category-actions">
                <span
                  className={`badge ${subcategory.active ? 'active' : 'inactive'}`}
                >
                  {subcategory.active ? '有効' : '停止'}
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
        sortedSubcategories.some(
          (subcategory) => subcategory.subcategoryId === editingSubcategoryId,
        ) ? (
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
                      {categoryTypeLabels[option.categoryType]} /{' '}
                      {option.categoryName}
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
              有効
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
              有効
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
    : 'カテゴリは参照中のため、停止状態に切り替えました。'
}

function subcategoryDeleteMessage(result: DeleteSubcategoryResult): string {
  return result.action === 'DELETED'
    ? 'サブカテゴリを削除しました。'
    : 'サブカテゴリは参照中のため、停止状態に切り替えました。'
}
