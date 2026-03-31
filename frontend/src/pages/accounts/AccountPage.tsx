import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createAccount, fetchAccounts } from '../../features/account/api/accountApi'
import { AccountForm } from '../../features/account/components/AccountForm'
import { AccountList } from '../../features/account/components/AccountList'
import type { Account, CreateAccountInput } from '../../features/account/types/account'
import { ApiRequestError } from '../../shared/lib/api/client'

const initialForm: CreateAccountInput = {
  providerName: '',
  accountName: '',
  accountCategory: 'BANK',
  balanceSide: 'ASSET',
  active: true,
  displayOrder: 10,
  creditCardProfile: null,
}

type AccountFormField = keyof CreateAccountInput

export function AccountPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<CreateAccountInput>(initialForm)
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
      setErrorMessage('口座の取得に失敗しました。バックエンドの状態を確認してください。')
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
      await createAccount(form)
      await loadAccounts()
      setForm(initialForm)
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

      setSubmitErrorMessage('口座の登録に失敗しました。入力内容とバックエンドの状態を確認してください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / 口座マスタ</p>
        <h1>口座を登録して管理する</h1>
        <p className="lead">
          取引残高、未配分残高、クレジットカード詳細まで含めて 1 画面で管理します。
        </p>
        <div className="hero-stats">
          <article>
            <span>口座数</span>
            <strong>{accounts.length}</strong>
          </article>
          <article>
            <span>利用中の口座</span>
            <strong>{accounts.filter((account) => account.active).length}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">新規口座</p>
            <h2>口座を登録</h2>
          </div>
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
    value === 'active' ||
    value === 'displayOrder' ||
    value === 'creditCardProfile'
  )
}
