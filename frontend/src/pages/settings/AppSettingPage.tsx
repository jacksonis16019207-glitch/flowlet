import { useEffect, useState } from 'react'
import { fetchAppSetting, updateAppSetting } from '../../features/appSetting/api/appSettingApi'
import type { AppSetting } from '../../features/appSetting/types/appSetting'
import { createFeedbackIssue } from '../../features/feedbackIssue/api/feedbackIssueApi'
import type { FeedbackIssueKind } from '../../features/feedbackIssue/types/feedbackIssue'
import {
  paymentDateAdjustmentRuleLabels,
  type PaymentDateAdjustmentRule,
} from '../../features/account/types/account'
import { ApiRequestError } from '../../shared/lib/api/client'
import { Button } from '../../shared/components/ui/button'
import { Select } from '../../shared/components/ui/select'
import { Textarea } from '../../shared/components/ui/textarea'

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

const feedbackKindOptions: Array<{ value: FeedbackIssueKind; label: string }> = [
  { value: 'FEATURE_REQUEST', label: '要望' },
  { value: 'BUG_REPORT', label: '不具合' },
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
  const [feedbackKind, setFeedbackKind] =
    useState<FeedbackIssueKind>('FEATURE_REQUEST')
  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackBody, setFeedbackBody] = useState('')
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [feedbackStatusMessage, setFeedbackStatusMessage] = useState('')
  const [feedbackErrorMessage, setFeedbackErrorMessage] = useState('')
  const [feedbackIssueUrl, setFeedbackIssueUrl] = useState('')
  const [feedbackIssueNumber, setFeedbackIssueNumber] = useState<number | null>(null)

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

  async function handleFeedbackSubmit() {
    setFeedbackSaving(true)
    setFeedbackStatusMessage('')
    setFeedbackErrorMessage('')
    setFeedbackIssueUrl('')
    setFeedbackIssueNumber(null)

    try {
      const response = await createFeedbackIssue({
        kind: feedbackKind,
        title: feedbackTitle,
        body: feedbackBody,
        pagePath: 'settings/general',
      })

      setFeedbackStatusMessage('GitHub issue を作成しました。')
      setFeedbackIssueUrl(response.issueUrl)
      setFeedbackIssueNumber(response.issueNumber)
      setFeedbackKind('FEATURE_REQUEST')
      setFeedbackTitle('')
      setFeedbackBody('')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFeedbackErrorMessage(error.message)
      } else {
        setFeedbackErrorMessage('GitHub issue の作成に失敗しました。')
      }
    } finally {
      setFeedbackSaving(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">flowlet / settings / general</p>
        <h1>ルールと運用の基準を整える</h1>
        <p className="lead">
          月初の扱いと、運用中に見つけた要望や不具合の受付をここで管理します。
        </p>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">General</p>
            <h2>General 設定を更新する</h2>
            <p className="lead dashboard-section-lead">
              集計期間の基準日と、月末処理に近い日の扱いを設定します。
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
              <small>どの日を新しい集計月の開始日として扱うかを設定します。</small>
            </label>
            <label>
              月初日調整ルール
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
              <small>開始日が休日に当たる場合の前倒し・後ろ倒しを選びます。</small>
            </label>
            <div className="button-row">
              <Button type="submit" disabled={loading || saving}>
                {saving ? 'General 設定を保存中...' : 'General 設定を保存'}
              </Button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Current</p>
            <h2>現在の設定</h2>
            <p className="lead dashboard-section-lead">
              現在の運用ルールと、運用中に使う feedback 導線をまとめています。
            </p>
          </div>
          <div className="detail-chip-list">
            <article className="detail-chip-card">
              <strong>月初日</strong>
              <span>{setting.monthStartDay}日</span>
            </article>
            <article className="detail-chip-card">
              <strong>月初日調整ルール</strong>
              <span>{paymentDateAdjustmentRuleLabels[setting.monthStartAdjustmentRule]}</span>
            </article>
            <article className="detail-chip-card">
              <strong>最終更新</strong>
              <span>{setting.updatedAt || '未更新'}</span>
            </article>
          </div>

          <section className="nested-panel">
            <div className="section-heading">
              <div>
                <h3>影響範囲</h3>
                <p className="section-description">
                  保存した設定は Dashboard と Ledger の月次表示に反映されます。
                </p>
              </div>
            </div>
            <div className="detail-list">
              <article className="detail-list-item">
                <div>
                  <h4>Dashboard</h4>
                  <p>サマリーとカテゴリ集計の対象月を同じ基準で揃えます。</p>
                </div>
              </article>
              <article className="detail-list-item">
                <div>
                  <h4>Ledger</h4>
                  <p>一覧や入力時の表示月も、同じ設定に合わせて扱います。</p>
                </div>
              </article>
            </div>
          </section>

          <section className="nested-panel">
            <div className="section-heading">
              <div>
                <h3>Feedback</h3>
                <p className="section-description">
                  本番環境で見つけた要望や不具合を、そのまま GitHub Issues に追加できます。
                </p>
              </div>
            </div>
            {feedbackErrorMessage ? <p className="status error">{feedbackErrorMessage}</p> : null}
            {feedbackStatusMessage ? (
              <p className="status">
                {feedbackStatusMessage}
                {feedbackIssueUrl && feedbackIssueNumber ? (
                  <>
                    {' '}
                    <a href={feedbackIssueUrl} target="_blank" rel="noreferrer">
                      #{feedbackIssueNumber}
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
            <form
              className="account-form nested-form"
              onSubmit={(event) => {
                event.preventDefault()
                void handleFeedbackSubmit()
              }}
            >
              <label>
                種別
                <Select
                  value={feedbackKind}
                  onChange={(event) => setFeedbackKind(event.target.value as FeedbackIssueKind)}
                  disabled={feedbackSaving}
                >
                  {feedbackKindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                タイトル
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(event) => setFeedbackTitle(event.target.value)}
                  placeholder="何が起きたか、何を追加したいかを短く書く"
                  disabled={feedbackSaving}
                  maxLength={120}
                />
              </label>
              <label>
                内容
                <Textarea
                  value={feedbackBody}
                  onChange={(event) => setFeedbackBody(event.target.value)}
                  placeholder="再現手順、困っていること、欲しい動きなどを書いてください"
                  disabled={feedbackSaving}
                  maxLength={4000}
                />
              </label>
              <div className="button-row">
                <Button type="submit" disabled={feedbackSaving}>
                  {feedbackSaving ? 'Issue を作成中...' : 'GitHub Issue に追加'}
                </Button>
              </div>
            </form>
          </section>
        </section>
      </section>
    </main>
  )
}
