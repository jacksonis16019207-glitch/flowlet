import { requestJson } from '../../../shared/lib/api/client'
import type {
  CreateFeedbackIssueInput,
  CreateFeedbackIssueResponse,
} from '../types/feedbackIssue'

export function createFeedbackIssue(
  input: CreateFeedbackIssueInput,
): Promise<CreateFeedbackIssueResponse> {
  return requestJson<CreateFeedbackIssueResponse>('/api/feedback-issues', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
