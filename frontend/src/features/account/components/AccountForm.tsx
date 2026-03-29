import type { FormEvent } from 'react'
import {
  accountTypeLabels,
  type AccountType,
  type CreateAccountInput,
} from '../types/account'

type AccountFormProps = {
  value: CreateAccountInput
  submitting: boolean
  onChange: (nextValue: CreateAccountInput) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AccountForm({
  value,
  submitting,
  onChange,
  onSubmit,
}: AccountFormProps) {
  return (
    <form className="account-form" onSubmit={onSubmit}>
      <label>
        銀行名
        <input
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
      </label>

      <label>
        口座名
        <input
          value={value.accountName}
          onChange={(event) =>
            onChange({
              ...value,
              accountName: event.target.value,
            })
          }
          placeholder="メイン口座"
          maxLength={100}
          required
        />
      </label>

      <label>
        口座種別
        <select
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
        利用中の口座として登録する
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? '登録中...' : '口座マスタを登録'}
      </button>
    </form>
  )
}
