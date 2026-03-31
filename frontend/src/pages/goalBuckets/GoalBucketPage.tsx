import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createGoalBucket,
  fetchGoalBuckets,
} from '../../features/goalBucket/api/goalBucketApi'
import { GoalBucketForm } from '../../features/goalBucket/components/GoalBucketForm'
import { GoalBucketList } from '../../features/goalBucket/components/GoalBucketList'
import type {
  CreateGoalBucketInput,
  GoalBucket,
} from '../../features/goalBucket/types/goalBucket'
import { fetchAccounts } from '../../features/account/api/accountApi'
import type { Account } from '../../features/account/types/account'
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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<GoalBucketFormField, string>>
  >({})

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
      setForm({
        accountId: accountData[0]?.accountId ?? 0,
        bucketName: '',
        active: true,
      })
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
      const createdGoalBucket = await createGoalBucket(form)
      setGoalBuckets((currentGoalBuckets) => [
        createdGoalBucket,
        ...currentGoalBuckets,
      ])
      setForm((currentForm) => ({
        accountId: currentForm.accountId,
        bucketName: '',
        active: true,
      }))
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
          return
        }

        setSubmitErrorMessage(error.message)
        return
      }

      setSubmitErrorMessage(
        '目的別口座の登録に失敗しました。入力内容とバックエンドの状態を確認してください。',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / 目的別口座</p>
        <h1>目的別口座を登録して管理する</h1>
        <p className="lead">
          目的別口座を親口座にひも付けて登録し、用途ごとの管理を 1 画面で見えるようにします。
        </p>
        <div className="hero-stats">
          <article>
            <span>目的別口座数</span>
            <strong>{goalBuckets.length}</strong>
          </article>
          <article>
            <span>選択可能な親口座</span>
            <strong>{accounts.length}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">新規目的別口座</p>
            <h2>目的別口座を登録</h2>
          </div>
          <GoalBucketForm
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
            <p className="eyebrow">目的別口座一覧</p>
            <h2>登録済み目的別口座</h2>
          </div>
          <GoalBucketList
            goalBuckets={goalBuckets}
            accounts={accounts}
            loading={loading}
            errorMessage={errorMessage}
          />
        </section>
      </section>
    </main>
  )
}

function isGoalBucketFormField(value: string): value is GoalBucketFormField {
  return value === 'accountId' || value === 'bucketName' || value === 'active'
}
