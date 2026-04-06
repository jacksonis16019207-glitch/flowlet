import { useEffect, useState } from 'react'
import { fetchAppSetting, updateAppSetting } from '../../features/appSetting/api/appSettingApi'
import type { AppSetting } from '../../features/appSetting/types/appSetting'
import {
  paymentDateAdjustmentRuleLabels,
  type PaymentDateAdjustmentRule,
} from '../../features/account/types/account'
import { ApiRequestError } from '../../shared/lib/api/client'

const emptySetting: AppSetting = {
  monthStartDay: 1,
  monthStartAdjustmentRule: 'NONE',
  updatedAt: '',
}

const adjustmentRuleOptions: PaymentDateAdjustmentRule[] = [
  'NONE',
  'PREVIOUS_BUSINESS_DAY',
  'NEXT_BUSINESS_DAY',
]

export function AppSettingPage() {
  const [setting, setSetting] = useState<AppSetting>(emptySetting)
  const [monthStartDay, setMonthStartDay] = useState('1')
  const [monthStartAdjustmentRule, setMonthStartAdjustmentRule] =
    useState<PaymentDateAdjustmentRule>('NONE')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    void fetchAppSetting()
      .then((response) => {
        if (!active) {
          return
        }
        setSetting(response)
        setMonthStartDay(String(response.monthStartDay))
        setMonthStartAdjustmentRule(response.monthStartAdjustmentRule)
      })
      .catch(() => {
        if (!active) {
          return
        }
        setErrorMessage('設定の取得に失敗しました。')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / settings</p>
        <h1>表示期間の基準を設定する</h1>
        <p className="lead">
          月の開始日と、開始日が土日祝に重なったときの補正ルールをアプリ全体で管理します。
        </p>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Month Boundary</p>
            <h2>月初ルール</h2>
          </div>
          {errorMessage ? <p className="status error">{errorMessage}</p> : null}
          {statusMessage ? <p className="status">{statusMessage}</p> : null}
          <form
            className="account-form"
            onSubmit={(event) => {
              event.preventDefault()
              setSaving(true)
              setStatusMessage('')
              setErrorMessage('')

              void updateAppSetting({
                monthStartDay: Number(monthStartDay),
                monthStartAdjustmentRule,
              })
                .then((response) => {
                  setSetting(response)
                  setStatusMessage('設定を更新しました。')
                })
                .catch((error: unknown) => {
                  if (error instanceof ApiRequestError) {
                    setErrorMessage(error.message)
                    return
                  }
                  setErrorMessage('設定の更新に失敗しました。')
                })
                .finally(() => {
                  setSaving(false)
                })
            }}
          >
            <label>
              月の開始日
              <select
                value={monthStartDay}
                onChange={(event) => setMonthStartDay(event.target.value)}
                disabled={loading || saving}
              >
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}日
                  </option>
                ))}
              </select>
            </label>
            <label>
              土日祝の補正ルール
              <select
                value={monthStartAdjustmentRule}
                onChange={(event) =>
                  setMonthStartAdjustmentRule(
                    event.target.value as PaymentDateAdjustmentRule,
                  )
                }
                disabled={loading || saving}
              >
                {adjustmentRuleOptions.map((rule) => (
                  <option key={rule} value={rule}>
                    {paymentDateAdjustmentRuleLabels[rule]}
                  </option>
                ))}
              </select>
            </label>
            <div className="button-row">
              <button type="submit" disabled={loading || saving}>
                {saving ? '保存中...' : '設定を保存'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Current</p>
            <h2>現在の設定</h2>
          </div>
          <div className="detail-chip-list">
            <article className="detail-chip-card">
              <strong>開始日</strong>
              <span>{setting.monthStartDay}日</span>
            </article>
            <article className="detail-chip-card">
              <strong>補正ルール</strong>
              <span>
                {paymentDateAdjustmentRuleLabels[setting.monthStartAdjustmentRule]}
              </span>
            </article>
            <article className="detail-chip-card">
              <strong>更新日時</strong>
              <span>{setting.updatedAt || '未取得'}</span>
            </article>
          </div>
        </section>
      </section>
    </main>
  )
}
