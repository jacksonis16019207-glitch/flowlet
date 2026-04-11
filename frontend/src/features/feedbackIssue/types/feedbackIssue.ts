export type FeedbackIssueKind = 'FEATURE_REQUEST' | 'BUG_REPORT'

export type CreateFeedbackIssueInput = {
  kind: FeedbackIssueKind
  title: string
  body: string
  pagePath: string
}

export type CreateFeedbackIssueResponse = {
  issueNumber: number
  issueUrl: string
}
