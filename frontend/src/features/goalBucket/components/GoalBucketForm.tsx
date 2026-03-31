import type { FormEvent } from 'react'
import type { Account } from '../../account/types/account'
import type { CreateGoalBucketInput } from '../types/goalBucket'

type GoalBucketFormField = keyof CreateGoalBucketInput

type GoalBucketFormProps = {
  accounts: Account[]
  value: CreateGoalBucketInput
  submitting: boolean
  submitErrorMessage: string
  fieldErrors: Partial<Record<GoalBucketFormField, string>>
  onChange: (nextValue: CreateGoalBucketInput) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function GoalBucketForm({
  accounts,
  value,
  submitting,
  submitErrorMessage,
  fieldErrors,
  onChange,
  onSubmit,
}: GoalBucketFormProps) {
  return (
    <form className="account-form" onSubmit={onSubmit}>
      {submitErrorMessage ? (
        <div className="status error" role="alert">
          {submitErrorMessage}
        </div>
      ) : null}

      <label>
        Parent account
        <select
          aria-invalid={fieldErrors.accountId ? 'true' : 'false'}
          value={value.accountId}
          onChange={(event) =>
            onChange({
              ...value,
              accountId: Number(event.target.value),
            })
          }
          disabled={accounts.length === 0}
        >
          {accounts.length === 0 ? (
            <option value={0}>Create an account first</option>
          ) : null}
          {accounts.map((account) => (
            <option key={account.accountId} value={account.accountId}>
              {account.bankName} / {account.accountName}
            </option>
          ))}
        </select>
        {fieldErrors.accountId ? (
          <span className="field-error">{fieldErrors.accountId}</span>
        ) : null}
      </label>

      <label>
        Goal bucket name
        <input
          aria-invalid={fieldErrors.bucketName ? 'true' : 'false'}
          value={value.bucketName}
          onChange={(event) =>
            onChange({
              ...value,
              bucketName: event.target.value,
            })
          }
          placeholder="Emergency fund"
          maxLength={100}
          required
        />
        {fieldErrors.bucketName ? (
          <span className="field-error">{fieldErrors.bucketName}</span>
        ) : null}
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={value.active}
          onChange={(event) =>
            onChange({
              ...value,
              active: event.target.checked,
            })
          }
        />
        Register as active goal bucket
      </label>

      <button type="submit" disabled={submitting || accounts.length === 0}>
        {submitting ? 'Saving...' : 'Create goal bucket'}
      </button>
    </form>
  )
}
