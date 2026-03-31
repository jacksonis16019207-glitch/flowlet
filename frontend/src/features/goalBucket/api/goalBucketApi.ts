import { requestJson } from '../../../shared/lib/api/client'
import type {
  CreateGoalBucketInput,
  GoalBucket,
} from '../types/goalBucket'

export function fetchGoalBuckets(): Promise<GoalBucket[]> {
  return requestJson<GoalBucket[]>('/api/goal-buckets')
}

export function createGoalBucket(
  input: CreateGoalBucketInput,
): Promise<GoalBucket> {
  return requestJson<GoalBucket>('/api/goal-buckets', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
