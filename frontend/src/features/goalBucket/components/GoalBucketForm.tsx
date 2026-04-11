import type { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
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
        親口座
        <Select
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
            <option value={0}>先に口座を登録してください</option>
          ) : null}
          {accounts.map((account) => (
            <option key={account.accountId} value={account.accountId}>
              {account.providerName} / {account.accountName}
            </option>
          ))}
        </Select>
        {fieldErrors.accountId ? (
          <span className="field-error">{fieldErrors.accountId}</span>
        ) : null}
      </label>

      <label>
        目的別口座名
        <Input
          aria-invalid={fieldErrors.bucketName ? 'true' : 'false'}
          value={value.bucketName}
          onChange={(event) =>
            onChange({
              ...value,
              bucketName: event.target.value,
            })
          }
          placeholder="旅行費"
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
        有効な目的別口座として登録
      </label>

      <Button type="submit" disabled={submitting || accounts.length === 0}>
        {submitting ? '登録中...' : '目的別口座を登録'}
      </Button>
    </form>
  )
}
