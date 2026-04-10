import type { FormEvent } from 'react'
import {
  accountCategoryLabels,
  balanceSideLabels,
  paymentDateAdjustmentRuleLabels,
  type Account,
  type AccountCategory,
  type CreateAccountInput,
} from '../types/account'

type AccountFormField = keyof CreateAccountInput

type AccountFormProps = {
  accounts: Account[]
  value: CreateAccountInput
  isEditing?: boolean
  submitting: boolean
  submitErrorMessage: string
  fieldErrors: Partial<Record<AccountFormField, string>>
  onChange: (nextValue: CreateAccountInput) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AccountForm({
  accounts,
  value,
  isEditing = false,
  submitting,
  submitErrorMessage,
  fieldErrors,
  onChange,
  onSubmit,
}: AccountFormProps) {
  const isCreditCard = value.accountCategory === 'CREDIT_CARD'
  const providerFieldLabel = isCreditCard ? 'カード会社名（発行会社）' : '金融機関名'
  const providerFieldPlaceholder = isCreditCard ? '三井住友カード' : '住信SBIネット銀行'
  const providerFieldHelpText = isCreditCard
    ? 'カード券面や利用明細に記載されている会社名を入力します。'
    : '銀行名やサービス名を入力します。'

  return (
    <form className="account-form" onSubmit={onSubmit}>
      {submitErrorMessage ? (
        <div className="status error" role="alert">
          {submitErrorMessage}
        </div>
      ) : null}

      <label>
        {providerFieldLabel}
        <input
          aria-invalid={fieldErrors.providerName ? 'true' : 'false'}
          value={value.providerName}
          onChange={(event) =>
            onChange({
              ...value,
              providerName: event.target.value,
            })
          }
          placeholder={providerFieldPlaceholder}
          maxLength={100}
          required
        />
        <small>{providerFieldHelpText}</small>
        {fieldErrors.providerName ? (
          <span className="field-error">{fieldErrors.providerName}</span>
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
          placeholder="メイン口座"
          maxLength={100}
          required
        />
        {fieldErrors.accountName ? (
          <span className="field-error">{fieldErrors.accountName}</span>
        ) : null}
      </label>

      <label>
        口座区分
        <select
          aria-invalid={fieldErrors.accountCategory ? 'true' : 'false'}
          value={value.accountCategory}
          onChange={(event) =>
            onChange({
              ...value,
              accountCategory: event.target.value as AccountCategory,
              creditCardProfile:
                event.target.value === 'CREDIT_CARD'
                  ? {
                      paymentAccountId: accounts[0]?.accountId ?? 0,
                      closingDay: 25,
                      paymentDay: 27,
                      paymentDateAdjustmentRule: 'NEXT_BUSINESS_DAY',
                    }
                  : null,
            })
          }
        >
          {Object.entries(accountCategoryLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {fieldErrors.accountCategory ? (
          <span className="field-error">{fieldErrors.accountCategory}</span>
        ) : null}
      </label>

      <label>
        残高区分
        <select
          aria-invalid={fieldErrors.balanceSide ? 'true' : 'false'}
          value={value.balanceSide}
          onChange={(event) =>
            onChange({
              ...value,
              balanceSide: event.target.value as CreateAccountInput['balanceSide'],
            })
          }
        >
          {Object.entries(balanceSideLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {fieldErrors.balanceSide ? (
          <span className="field-error">{fieldErrors.balanceSide}</span>
        ) : null}
      </label>

      <label>
        初期残高
        <input
          type="number"
          min="0"
          step="1"
          aria-invalid={fieldErrors.initialBalance ? 'true' : 'false'}
          value={value.initialBalance}
          onChange={(event) =>
            onChange({
              ...value,
              initialBalance: event.target.value,
            })
          }
        />
        {fieldErrors.initialBalance ? (
          <span className="field-error">{fieldErrors.initialBalance}</span>
        ) : null}
      </label>

      <label>
        表示順
        <input
          type="number"
          value={value.displayOrder}
          onChange={(event) =>
            onChange({
              ...value,
              displayOrder: Number(event.target.value),
            })
          }
        />
      </label>

      {isCreditCard && value.creditCardProfile ? (
        <div className="subform-grid">
          <label>
            引き落とし元口座
            <select
              value={value.creditCardProfile.paymentAccountId}
              onChange={(event) =>
                onChange({
                  ...value,
                  creditCardProfile: {
                    ...value.creditCardProfile!,
                    paymentAccountId: Number(event.target.value),
                  },
                })
              }
            >
              {accounts
                .filter((account) => account.accountCategory !== 'CREDIT_CARD')
                .map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.providerName} / {account.accountName}
                  </option>
                ))}
            </select>
          </label>

          <label>
            締め日
            <input
              type="number"
              min={1}
              max={31}
              value={value.creditCardProfile.closingDay}
              onChange={(event) =>
                onChange({
                  ...value,
                  creditCardProfile: {
                    ...value.creditCardProfile!,
                    closingDay: Number(event.target.value),
                  },
                })
              }
            />
          </label>

          <label>
            支払日
            <input
              type="number"
              min={1}
              max={31}
              value={value.creditCardProfile.paymentDay}
              onChange={(event) =>
                onChange({
                  ...value,
                  creditCardProfile: {
                    ...value.creditCardProfile!,
                    paymentDay: Number(event.target.value),
                  },
                })
              }
            />
          </label>

          <label>
            支払日補正
            <select
              value={value.creditCardProfile.paymentDateAdjustmentRule}
              onChange={(event) =>
                onChange({
                  ...value,
                  creditCardProfile: {
                    ...value.creditCardProfile!,
                    paymentDateAdjustmentRule:
                      event.target.value as NonNullable<
                        CreateAccountInput['creditCardProfile']
                      >['paymentDateAdjustmentRule'],
                  },
                })
              }
            >
              {Object.entries(paymentDateAdjustmentRuleLabels).map(
                ([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      ) : null}

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
        {submitting ? '保存中...' : isEditing ? '口座を更新' : '口座を登録'}
      </button>
    </form>
  )
}
