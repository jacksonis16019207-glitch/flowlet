import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createAccount, fetchAccounts } from '../../features/account/api/accountApi'
import { AccountForm } from '../../features/account/components/AccountForm'
import { AccountList } from '../../features/account/components/AccountList'
import type { Account, CreateAccountInput } from '../../features/account/types/account'
import { ApiRequestError } from '../../shared/lib/api/client'

const initialForm: CreateAccountInput = {
  bankName: '',
  accountName: '',
  accountType: 'CHECKING',
  active: true,
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
      setErrorMessage('Failed to load accounts. Check backend status and try again.')
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
      const createdAccount = await createAccount(form)
      setAccounts((currentAccounts) => [createdAccount, ...currentAccounts])
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

      setSubmitErrorMessage('Failed to create account. Check your input and backend status.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / master account</p>
        <h1>Create and manage accounts</h1>
        <p className="lead">
          Manage the `m_account` master with a single screen for listing and registration.
          This view is wired to structured backend errors so field validation and business
          errors are shown separately.
        </p>
        <div className="hero-stats">
          <article>
            <span>Total accounts</span>
            <strong>{accounts.length}</strong>
          </article>
          <article>
            <span>Active accounts</span>
            <strong>{accounts.filter((account) => account.active).length}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">new account</p>
            <h2>New account</h2>
          </div>
          <AccountForm
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
            <p className="eyebrow">account list</p>
            <h2>Saved accounts</h2>
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
    value === 'bankName' ||
    value === 'accountName' ||
    value === 'accountType' ||
    value === 'active'
  )
}
