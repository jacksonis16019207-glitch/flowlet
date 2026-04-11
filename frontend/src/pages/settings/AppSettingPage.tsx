import { useEffect, useState } from 'react'
import { fetchAppSetting, updateAppSetting } from '../../features/appSetting/api/appSettingApi'
import type { AppSetting } from '../../features/appSetting/types/appSetting'
import {
  paymentDateAdjustmentRuleLabels,
  type PaymentDateAdjustmentRule,
} from '../../features/account/types/account'
import { ApiRequestError } from '../../shared/lib/api/client'
import { Button } from '../../shared/components/ui/button'
import { Select } from '../../shared/components/ui/select'

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

        setErrorMessage('General 設定の読み込みに失敗しました。')
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

  async function handleSubmit() {
    setSaving(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      const response = await updateAppSetting({
        monthStartDay: Number(monthStartDay),
        monthStartAdjustmentRule,
      })

      setSetting(response)
      setStatusMessage('General 設定を更新しました。')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('General 設定の更新に失敗しました。')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / settings / general</p>
        <h1>月次表示の基準を整える</h1>
        <p className="lead">
          Dashboard と Ledger で使う月初日と、休日に当たった場合の調整ルールをここで管理します。
        </p>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">General</p>
            <h2>月初ルールを更新する</h2>
            <p className="lead dashboard-section-lead">
              家計簿の表示期間をどこから区切るかを設定します。ダッシュボードと台帳の集計に反映されます。
            </p>
          </div>
          {errorMessage ? <p className="status error">{errorMessage}</p> : null}
          {statusMessage ? <p className="status">{statusMessage}</p> : null}
          <form
            className="account-form"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSubmit()
            }}
          >
            <label>
              月初日
              <Select
                value={monthStartDay}
                onChange={(event) => setMonthStartDay(event.target.value)}
                disabled={loading || saving}
              >
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}日
                  </option>
                ))}
              </Select>
              <small>選択した日を基準に月次集計の開始日を決めます。</small>
            </label>
            <label>
              休日調整ルール
              <Select
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
              </Select>
              <small>月初日が休日に重なる場合の前倒し・後ろ倒しの扱いを設定します。</small>
            </label>
            <div className="button-row">
              <Button type="submit" disabled={loading || saving}>
                {saving ? '保存中...' : 'General 設定を保存'}
              </Button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Current</p>
            <h2>現在の設定</h2>
            <p className="lead dashboard-section-lead">
              現在アプリ全体に適用されている月次表示ルールです。
            </p>
          </div>
          <div className="detail-chip-list">
            <article className="detail-chip-card">
              <strong>月初日</strong>
              <span>{setting.monthStartDay}日</span>
            </article>
            <article className="detail-chip-card">
              <strong>休日調整ルール</strong>
              <span>{paymentDateAdjustmentRuleLabels[setting.monthStartAdjustmentRule]}</span>
            </article>
            <article className="detail-chip-card">
              <strong>最終更新日時</strong>
              <span>{setting.updatedAt || '未更新'}</span>
            </article>
          </div>

          <section className="nested-panel">
            <div className="section-heading">
              <div>
                <h3>影響範囲</h3>
                <p className="section-description">
                  保存後は Dashboard と Ledger の月次表示に新しい基準が反映されます。
                </p>
              </div>
            </div>
            <div className="detail-list">
              <article className="detail-list-item">
                <div>
                  <h4>Dashboard</h4>
                  <p>収支サマリーとカテゴリ別集計の対象期間に反映されます。</p>
                </div>
              </article>
              <article className="detail-list-item">
                <div>
                  <h4>Ledger</h4>
                  <p>月切り替え時に見る基準期間が新しい設定に合わせて変わります。</p>
                </div>
              </article>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}
