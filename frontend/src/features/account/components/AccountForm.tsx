import type { FormEvent, ReactNode } from 'react'
import { Landmark, CreditCard, WalletCards, CircleDollarSign } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
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
  const providerFieldLabel = isCreditCard ? 'カード会社' : '金融機関'
  const providerFieldPlaceholder = isCreditCard ? '例: 楽天カード' : '例: 住信SBIネット銀行'
  const providerFieldHelpText = isCreditCard
    ? '利用明細や支払い通知で識別しやすいカード会社名を入力します。'
    : '一覧と検索で見分けやすい金融機関名を入力します。'
  const paymentAccounts = accounts.filter((account) => account.accountCategory !== 'CREDIT_CARD')

  return (
    <form className="account-form account-form-upgraded" onSubmit={onSubmit}>
      {submitErrorMessage ? (
        <div className="status error" role="alert">
          {submitErrorMessage}
        </div>
      ) : null}

      <section className="account-form-surface">
        <div className="account-form-intro">
          <p className="account-form-kicker">
            {isEditing ? 'Account Update' : 'Account Setup'}
          </p>
          <h3>{isEditing ? '口座の設定を更新' : '新しい口座を登録'}</h3>
          <p>
            口座の種類と残高の見え方を先に定義しておくと、後続の取引入力とダッシュボードが崩れません。
          </p>
        </div>

        <div className="account-form-grid">
          <Field
            label={providerFieldLabel}
            helpText={providerFieldHelpText}
            error={fieldErrors.providerName}
            className="account-form-field-wide"
          >
            <Input
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
          </Field>

          <Field
            label="口座名"
            helpText="家計上の役割がわかる名前にすると、口座一覧とフィルタで迷いません。"
            error={fieldErrors.accountName}
            className="account-form-field-wide"
          >
            <Input
              aria-invalid={fieldErrors.accountName ? 'true' : 'false'}
              value={value.accountName}
              onChange={(event) =>
                onChange({
                  ...value,
                  accountName: event.target.value,
                })
              }
              placeholder="例: メイン口座"
              maxLength={100}
              required
            />
          </Field>

          <Field
            label="口座種別"
            helpText="現金・銀行・カードのどれとして扱うかを決めます。"
            error={fieldErrors.accountCategory}
          >
            <Select
              aria-invalid={fieldErrors.accountCategory ? 'true' : 'false'}
              value={value.accountCategory}
              onChange={(event) =>
                onChange({
                  ...value,
                  accountCategory: event.target.value as AccountCategory,
                  creditCardProfile:
                    event.target.value === 'CREDIT_CARD'
                      ? {
                          paymentAccountId: paymentAccounts[0]?.accountId ?? 0,
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
            </Select>
          </Field>

          <Field
            label="残高の向き"
            helpText="資産として増える口座か、負債として積み上がる口座かを指定します。"
            error={fieldErrors.balanceSide}
          >
            <Select
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
            </Select>
          </Field>

          <Field
            label="初期残高"
            helpText="登録時点の残高を円単位で入力します。"
            error={fieldErrors.initialBalance}
          >
            <Input
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
          </Field>

          <Field
            label="表示順"
            helpText="小さいほど一覧の上に表示されます。"
          >
            <Input
              type="number"
              value={value.displayOrder}
              onChange={(event) =>
                onChange({
                  ...value,
                  displayOrder: Number(event.target.value),
                })
              }
            />
          </Field>
        </div>

        <div className="account-form-preview-grid" aria-hidden="true">
          <PreviewCard
            icon={<Landmark size={18} />}
            label="口座分類"
            value={accountCategoryLabels[value.accountCategory]}
          />
          <PreviewCard
            icon={<CircleDollarSign size={18} />}
            label="残高の向き"
            value={balanceSideLabels[value.balanceSide]}
          />
          <PreviewCard
            icon={isCreditCard ? <CreditCard size={18} /> : <WalletCards size={18} />}
            label="開始残高"
            value={`${value.initialBalance || '0'} 円`}
          />
        </div>
      </section>

      {isCreditCard && value.creditCardProfile ? (
        <section className="account-form-surface account-form-credit-card">
          <div className="account-form-intro">
            <p className="account-form-kicker">Billing Rules</p>
            <h3>クレジットカードの締めと支払い</h3>
            <p>支払い口座と締め日を先に決めておくと、あとから利用履歴を整理しやすくなります。</p>
          </div>

          <div className="subform-grid account-form-grid">
            <Field
              label="支払い口座"
              helpText="カード利用額を引き落とす口座を選びます。"
            >
              <Select
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
                {paymentAccounts.map((account) => (
                  <option key={account.accountId} value={account.accountId}>
                    {account.providerName} / {account.accountName}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="締め日"
              helpText="毎月の利用集計を締める日です。"
            >
              <Input
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
            </Field>

            <Field
              label="支払日"
              helpText="引き落とし日を 1 から 31 の範囲で指定します。"
            >
              <Input
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
            </Field>

            <Field
              label="営業日補正"
              helpText="休日に重なった場合の繰り上げ・繰り下げルールです。"
            >
              <Select
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
                {Object.entries(paymentDateAdjustmentRuleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </section>
      ) : null}

      <label className="account-form-toggle">
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
        <span className="account-form-toggle-indicator" />
        <span className="account-form-toggle-copy">
          <strong>有効な口座として公開する</strong>
          <small>一覧と関連画面で選択できる状態にします。</small>
        </span>
      </label>

      <div className="account-form-actions">
        <Button type="submit" size="default" disabled={submitting}>
          {submitting ? '保存中...' : isEditing ? '口座設定を更新' : '口座を登録'}
        </Button>
      </div>
    </form>
  )
}

function Field(props: {
  label: string
  helpText?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  const { label, helpText, error, className, children } = props

  return (
    <label className={className ? `account-form-field ${className}` : 'account-form-field'}>
      <span className="account-form-label">{label}</span>
      {children}
      {helpText ? <small className="account-form-help">{helpText}</small> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

function PreviewCard(props: { icon: ReactNode; label: string; value: string }) {
  const { icon, label, value } = props

  return (
    <article className="account-form-preview-card">
      <span className="account-form-preview-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  )
}
