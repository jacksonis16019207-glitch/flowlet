import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  updateAccount,
} from '../../features/account/api/accountApi'
import { AccountForm } from '../../features/account/components/AccountForm'
import { AccountList } from '../../features/account/components/AccountList'
import type { Account, CreateAccountInput } from '../../features/account/types/account'
import { FormModal } from '../../shared/components/FormModal'
import { ApiRequestError } from '../../shared/lib/api/client'

const initialForm: CreateAccountInput = {
  providerName: '',
  accountName: '',
  accountCategory: 'BANK',
  balanceSide: 'ASSET',
  initialBalance: '0',
  active: true,
  displayOrder: 10,
  creditCardProfile: null,
}

type AccountFormField = keyof CreateAccountInput

export function AccountPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<CreateAccountInput>(initialForm)
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AccountFormField, string>>
  >({})
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    void loadAccounts()
  }, [])

  async function loadAccounts() {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await fetchAccounts()
      setAccounts(data)
    } catch {
      setErrorMessage(
        '口座の取得に失敗しました。バックエンドの状態を確認してください。',
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
      if (editingAccountId == null) {
        await createAccount(form)
      } else {
        await updateAccount(editingAccountId, form)
      }

      await loadAccounts()
      closeModal()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'VALIDATION_ERROR') {
          setSubmitErrorMessage(error.message)
          setFieldErrors(
            error.fieldErrors.reduce<Partial<Record<AccountFormField, string>>>(
              (accumulator, fieldError) => {
                if (isAccountFormField(fieldError.field)) {
                  accumulator[fieldError.field] = fieldError.message
                }

                return accumulator
              },
              {},
            ),
          )
          setModalOpen(true)
          return
        }

        setSubmitErrorMessage(error.message)
        setModalOpen(true)
        return
      }

      setSubmitErrorMessage(
        '口座の保存に失敗しました。入力内容とバックエンドの状態を確認してください。',
      )
      setModalOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenCreateModal() {
    setEditingAccountId(null)
    setForm(initialForm)
    setSubmitErrorMessage('')
    setFieldErrors({})
    setModalOpen(true)
  }

  function handleEdit(account: Account) {
    setEditingAccountId(account.accountId)
    setSubmitErrorMessage('')
    setFieldErrors({})
    setForm({
      providerName: account.providerName,
      accountName: account.accountName,
      accountCategory: account.accountCategory,
      balanceSide: account.balanceSide,
      initialBalance: account.initialBalance,
      active: account.active,
      displayOrder: account.displayOrder,
      creditCardProfile: account.creditCardProfile
        ? {
            paymentAccountId: account.creditCardProfile.paymentAccountId,
            closingDay: account.creditCardProfile.closingDay,
            paymentDay: account.creditCardProfile.paymentDay,
            paymentDateAdjustmentRule:
              account.creditCardProfile.paymentDateAdjustmentRule,
          }
        : null,
    })
    setModalOpen(true)
  }

  async function handleDelete(account: Account) {
    const confirmed = window.confirm(
      `「${account.accountName}」を削除しますか。通常は元に戻せません。`,
    )

    if (!confirmed) {
      return
    }

    setDeletingAccountId(account.accountId)
    setErrorMessage('')

    try {
      await deleteAccount(account.accountId)
      await loadAccounts()

      if (editingAccountId === account.accountId) {
        closeModal()
      }
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('口座の削除に失敗しました。')
      }
    } finally {
      setDeletingAccountId(null)
    }
  }

  function closeModal() {
    setEditingAccountId(null)
    setForm(initialForm)
    setSubmitErrorMessage('')
    setFieldErrors({})
    setModalOpen(false)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / accounts</p>
        <h1>口座を整理して管理する</h1>
        <p className="lead">
          一覧で全体を確認しながら、必要なときだけ登録フォームを開ける構成にしています。
        </p>
        <div className="hero-stats">
          <article>
            <span>口座数</span>
            <strong>{accounts.length}</strong>
          </article>
          <article>
            <span>稼働中口座</span>
            <strong>{accounts.filter((account) => account.active).length}</strong>
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
              <span>稼働中口座</span>
              <strong>{accounts.filter((account) => account.active).length}</strong>
              <p>日常運用で使う口座数を先に把握できます。</p>
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
            <p className="eyebrow">口座一覧</p>
            <h2>登録済み口座</h2>
            <p className="lead dashboard-section-lead">
              一覧で対象を見つけて、必要な口座だけ編集する流れを想定しています。
            </p>
          </div>
          <div className="button-row">
            <button type="button" onClick={handleOpenCreateModal}>
              新規口座を追加
            </button>
          </div>
          <AccountList
            accounts={accounts}
            loading={loading}
            errorMessage={errorMessage}
            deletingAccountId={deletingAccountId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      </section>

      <FormModal
        open={modalOpen}
        title={editingAccountId == null ? '口座を追加' : '口座を編集'}
        description={
          editingAccountId == null
            ? '口座属性を入力して保存します。'
            : '既存口座の内容を更新します。'
        }
        onClose={closeModal}
      >
        <AccountForm
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

function isAccountFormField(value: string): value is AccountFormField {
  return (
    value === 'providerName' ||
    value === 'accountName' ||
    value === 'accountCategory' ||
    value === 'balanceSide' ||
    value === 'initialBalance' ||
    value === 'active' ||
    value === 'displayOrder' ||
    value === 'creditCardProfile'
  )
}
