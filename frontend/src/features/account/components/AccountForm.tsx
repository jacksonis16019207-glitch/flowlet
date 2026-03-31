import type { FormEvent } from 'react'
import {
  accountTypeLabels,
  type AccountType,
  type CreateAccountInput,
} from '../types/account'

type AccountFormField = keyof CreateAccountInput

type AccountFormProps = {
  value: CreateAccountInput
  submitting: boolean
  submitErrorMessage: string
  fieldErrors: Partial<Record<AccountFormField, string>>
  onChange: (nextValue: CreateAccountInput) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AccountForm({
  value,
  submitting,
  submitErrorMessage,
  fieldErrors,
  onChange,
  onSubmit,
}: AccountFormProps) {
  return (
    <form className="account-form" onSubmit={onSubmit}>
      {submitErrorMessage ? (
        <div className="status error" role="alert">
          {submitErrorMessage}
        </div>
      ) : null}

      <label>
        銀行名
        <input
          aria-invalid={fieldErrors.bankName ? 'true' : 'false'}
          value={value.bankName}
          onChange={(event) =>
            onChange({
              ...value,
              bankName: event.target.value,
            })
          }
          placeholder="三菱UFJ銀行"
          maxLength={100}
          required
        />
        {fieldErrors.bankName ? (
          <span className="field-error">{fieldErrors.bankName}</span>
        ) : null}
      </label>

      <label>
        口座名
        <input
          aria-invalid={fieldErrors.accountName ? 'true' : 'false'}
          value={value.accountName}
          onChange={(event) =>
            onChange({
              ...value,
              accountName: event.target.value,
            })
          }
          placeholder="生活口座"
          maxLength={100}
          required
        />
        {fieldErrors.accountName ? (
          <span className="field-error">{fieldErrors.accountName}</span>
        ) : null}
      </label>

      <label>
        口座種別
        <select
          aria-invalid={fieldErrors.accountType ? 'true' : 'false'}
          value={value.accountType}
          onChange={(event) =>
            onChange({
              ...value,
              accountType: event.target.value as AccountType,
            })
          }
        >
          <option value="CHECKING">{accountTypeLabels.CHECKING}</option>
          <option value="SAVINGS">{accountTypeLabels.SAVINGS}</option>
          <option value="OTHER">{accountTypeLabels.OTHER}</option>
        </select>
        {fieldErrors.accountType ? (
          <span className="field-error">{fieldErrors.accountType}</span>
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
        利用中の口座として登録
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? '登録中...' : '口座を登録'}
      </button>
    </form>
  )
}
