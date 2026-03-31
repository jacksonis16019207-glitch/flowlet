export type GoalBucket = {
  goalBucketId: number
  accountId: number
  bucketName: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateGoalBucketInput = {
  accountId: number
  bucketName: string
  active: boolean
}
