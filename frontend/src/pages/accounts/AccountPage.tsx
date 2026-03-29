import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createAccount, fetchAccounts } from '../../features/account/api/accountApi'
import { AccountForm } from '../../features/account/components/AccountForm'
import { AccountList } from '../../features/account/components/AccountList'
import type { Account, CreateAccountInput } from '../../features/account/types/account'

const initialForm: CreateAccountInput = {
  bankName: '',
  accountName: '',
  accountType: 'CHECKING',
  active: true,
}

export function AccountPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<CreateAccountInput>(initialForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
        '口座マスタの取得に失敗しました。backend が起動しているか確認してください。',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const createdAccount = await createAccount(form)
      setAccounts((currentAccounts) => [createdAccount, ...currentAccounts])
      setForm(initialForm)
    } catch {
      setErrorMessage(
        '口座マスタの登録に失敗しました。入力内容と backend の状態を確認してください。',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / master account</p>
        <h1>口座マスタを登録する</h1>
        <p className="lead">
          `m_account` を起点に、口座マスタの一覧表示と登録の最小縦切りを完成させます。
          次の段階で目的別口座や残高配分へ広げます。
        </p>
        <div className="hero-stats">
          <article>
            <span>登録済み口座</span>
            <strong>{accounts.length}</strong>
          </article>
          <article>
            <span>有効口座</span>
            <strong>{accounts.filter((account) => account.active).length}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">new account</p>
            <h2>口座マスタを追加</h2>
          </div>
          <AccountForm
            value={form}
            submitting={submitting}
            onChange={setForm}
            onSubmit={handleSubmit}
          />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">account list</p>
            <h2>登録済み口座マスタ</h2>
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
