import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createGoalBucket,
  deleteGoalBucket,
  fetchGoalBuckets,
  updateGoalBucket,
} from '../../features/goalBucket/api/goalBucketApi'
import { GoalBucketForm } from '../../features/goalBucket/components/GoalBucketForm'
import { GoalBucketList } from '../../features/goalBucket/components/GoalBucketList'
import type {
  CreateGoalBucketInput,
  GoalBucket,
} from '../../features/goalBucket/types/goalBucket'
import { fetchAccounts } from '../../features/account/api/accountApi'
import type { Account } from '../../features/account/types/account'
import { FormModal } from '../../shared/components/FormModal'
import { ApiRequestError } from '../../shared/lib/api/client'

const emptyForm: CreateGoalBucketInput = {
  accountId: 0,
  bucketName: '',
  active: true,
}

type GoalBucketFormField = keyof CreateGoalBucketInput

export function GoalBucketPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goalBuckets, setGoalBuckets] = useState<GoalBucket[]>([])
  const [form, setForm] = useState<CreateGoalBucketInput>(emptyForm)
  const [editingGoalBucketId, setEditingGoalBucketId] = useState<number | null>(
    null,
  )
  const [deletingGoalBucketId, setDeletingGoalBucketId] = useState<number | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<GoalBucketFormField, string>>
  >({})
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    setLoading(true)
    setErrorMessage('')

    try {
      const [accountData, goalBucketData] = await Promise.all([
        fetchAccounts(),
        fetchGoalBuckets(),
      ])

      setAccounts(accountData)
      setGoalBuckets(goalBucketData)
      setForm((current) => ({
        accountId: current.accountId || accountData[0]?.accountId || 0,
        bucketName: current.bucketName,
        active: current.active,
      }))
    } catch {
      setErrorMessage(
        '目的別口座の取得に失敗しました。バックエンドの状態を確認してください。',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitErrorMessage('')
    setFieldErrors({})

    try {
      if (editingGoalBucketId == null) {
        await createGoalBucket(form)
      } else {
        await updateGoalBucket(editingGoalBucketId, form)
      }

      await loadPageData()
      closeModal()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'VALIDATION_ERROR') {
          setSubmitErrorMessage(error.message)
          setFieldErrors(
            error.fieldErrors.reduce<
              Partial<Record<GoalBucketFormField, string>>
            >((accumulator, fieldError) => {
              if (isGoalBucketFormField(fieldError.field)) {
                accumulator[fieldError.field] = fieldError.message
              }

              return accumulator
            }, {}),
          )
          setModalOpen(true)
          return
        }

        setSubmitErrorMessage(error.message)
        setModalOpen(true)
        return
      }

      setSubmitErrorMessage('目的別口座の保存に失敗しました。')
      setModalOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenCreateModal() {
    setEditingGoalBucketId(null)
    setForm({
      accountId: accounts[0]?.accountId ?? 0,
      bucketName: '',
      active: true,
    })
    setSubmitErrorMessage('')
    setFieldErrors({})
    setModalOpen(true)
  }

  function handleEdit(goalBucket: GoalBucket) {
    setEditingGoalBucketId(goalBucket.goalBucketId)
    setSubmitErrorMessage('')
    setFieldErrors({})
    setForm({
      accountId: goalBucket.accountId,
      bucketName: goalBucket.bucketName,
      active: goalBucket.active,
    })
    setModalOpen(true)
  }

  async function handleDelete(goalBucket: GoalBucket) {
    const confirmed = window.confirm(
      `「${goalBucket.bucketName}」を削除しますか。通常は元に戻せません。`,
    )

    if (!confirmed) {
      return
    }

    setDeletingGoalBucketId(goalBucket.goalBucketId)
    setErrorMessage('')

    try {
      await deleteGoalBucket(goalBucket.goalBucketId)
      await loadPageData()

      if (editingGoalBucketId === goalBucket.goalBucketId) {
        closeModal()
      }
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('目的別口座の削除に失敗しました。')
      }
    } finally {
      setDeletingGoalBucketId(null)
    }
  }

  function closeModal() {
    setEditingGoalBucketId(null)
    setForm({
      accountId: accounts[0]?.accountId ?? 0,
      bucketName: '',
      active: true,
    })
    setSubmitErrorMessage('')
    setFieldErrors({})
    setModalOpen(false)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / goal buckets</p>
        <h1>目的別口座を整理して管理する</h1>
        <p className="lead">
          一覧で残高のまとまりを確認しながら、必要なときだけ登録フォームを開ける構成にしています。
        </p>
        <div className="hero-stats">
          <article>
            <span>目的別口座数</span>
            <strong>{goalBuckets.length}</strong>
          </article>
          <article>
            <span>紐づく口座数</span>
            <strong>{accounts.length}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid management-focus-grid">
        <section className="panel management-focus-panel">
          <div className="panel-heading">
            <p className="eyebrow">Today Focus</p>
            <h2>まず見るポイント</h2>
          </div>
          <div className="dashboard-focus-list">
            <article className="dashboard-focus-item">
              <span>目的別口座数</span>
              <strong>{goalBuckets.length}</strong>
              <p>管理対象のまとまり数を先に把握できます。</p>
            </article>
            <article className="dashboard-focus-item">
              <span>入力状態</span>
              <strong>{modalOpen ? '入力中' : '待機中'}</strong>
              <p>
                {modalOpen
                  ? 'フォームを開いて入力または編集を進めています。'
                  : '一覧を見ながら次の操作を選べます。'}
              </p>
            </article>
          </div>
        </section>
      </section>

      <section className="content-grid">
        <section className="panel account-list-panel">
          <div className="panel-heading">
            <p className="eyebrow">目的別口座一覧</p>
            <h2>登録済み目的別口座</h2>
            <p className="lead dashboard-section-lead">
              一覧で対象を見つけて、必要なものだけ編集する流れを想定しています。
            </p>
          </div>
          <div className="button-row">
            <button type="button" onClick={handleOpenCreateModal}>
              新規目的別口座を追加
            </button>
          </div>
          <GoalBucketList
            goalBuckets={goalBuckets}
            accounts={accounts}
            loading={loading}
            errorMessage={errorMessage}
            deletingGoalBucketId={deletingGoalBucketId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      </section>

      <FormModal
        open={modalOpen}
        title={editingGoalBucketId == null ? '目的別口座を追加' : '目的別口座を編集'}
        description={
          editingGoalBucketId == null
            ? '紐づけ先の口座と名称を入力して保存します。'
            : '既存の目的別口座の内容を更新します。'
        }
        onClose={closeModal}
      >
        <GoalBucketForm
          accounts={accounts}
          value={form}
          submitting={submitting}
          submitErrorMessage={submitErrorMessage}
          fieldErrors={fieldErrors}
          onChange={setForm}
          onSubmit={handleSubmit}
        />
      </FormModal>
    </main>
  )
}

function isGoalBucketFormField(value: string): value is GoalBucketFormField {
  return value === 'accountId' || value === 'bucketName' || value === 'active'
}
