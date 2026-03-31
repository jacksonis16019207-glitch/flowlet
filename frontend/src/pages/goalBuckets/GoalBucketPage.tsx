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
        'Failed to load goal buckets. Check backend status and try again.',
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
        'Failed to create goal bucket. Check your input and backend status.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / goal bucket</p>
        <h1>Create and manage goal buckets</h1>
        <p className="lead">
          Link each goal bucket to a parent account and keep your purpose-based
          allocation visible from a single screen.
        </p>
        <div className="hero-stats">
          <article>
            <span>Total goal buckets</span>
            <strong>{goalBuckets.length}</strong>
          </article>
          <article>
            <span>Available parent accounts</span>
            <strong>{accounts.length}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">new goal bucket</p>
            <h2>New goal bucket</h2>
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
            <p className="eyebrow">goal bucket list</p>
            <h2>Saved goal buckets</h2>
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
