import { requestJson } from '../../../shared/lib/api/client'
import type {
  CreateGoalBucketInput,
  GoalBucket,
} from '../types/goalBucket'

type FetchGoalBucketsParams = {
  accountId?: number
  activeOnly?: boolean
}

export function fetchGoalBuckets(
  params?: FetchGoalBucketsParams,
): Promise<GoalBucket[]> {
  const searchParams = new URLSearchParams()

  if (params?.accountId) {
    searchParams.set('accountId', String(params.accountId))
  }

  if (params?.activeOnly) {
    searchParams.set('activeOnly', 'true')
  }

  const query = searchParams.toString()
  return requestJson<GoalBucket[]>(`/api/goal-buckets${query ? `?${query}` : ''}`)
}

export function createGoalBucket(
  input: CreateGoalBucketInput,
): Promise<GoalBucket> {
  return requestJson<GoalBucket>('/api/goal-buckets', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
