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
      resetForm()
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
          return
        }

        setSubmitErrorMessage(error.message)
        return
      }

      setSubmitErrorMessage(
        '口座の保存に失敗しました。入力内容とバックエンドの状態を確認してください。',
      )
    } finally {
      setSubmitting(false)
    }
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
  }

  async function handleDelete(account: Account) {
    const confirmed = window.confirm(
      `「${account.accountName}」を削除します。参照中なら停止状態に切り替わります。`,
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
        resetForm()
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

  function resetForm() {
    setEditingAccountId(null)
    setForm(initialForm)
    setSubmitErrorMessage('')
    setFieldErrors({})
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / 口座マスタ</p>
        <h1>口座を登録して管理する</h1>
        <p className="lead">
          口座の追加に加えて、一覧から編集と削除も行えます。
        </p>
        <div className="hero-stats">
          <article>
            <span>口座数</span>
            <strong>{accounts.length}</strong>
          </article>
          <article>
            <span>有効な口座</span>
            <strong>{accounts.filter((account) => account.active).length}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">
              {editingAccountId == null ? '新規口座' : '口座編集'}
            </p>
            <h2>{editingAccountId == null ? '口座を登録' : '口座を編集'}</h2>
          </div>
          {editingAccountId != null ? (
            <div className="button-row">
              <button type="button" className="secondary" onClick={resetForm}>
                新規登録に戻す
              </button>
            </div>
          ) : null}
          <AccountForm
            accounts={accounts}
            value={form}
            submitting={submitting}
            submitErrorMessage={submitErrorMessage}
            fieldErrors={fieldErrors}
            onChange={setForm}
            onSubmit={handleSubmit}
          />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">口座一覧</p>
            <h2>登録済み口座</h2>
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
