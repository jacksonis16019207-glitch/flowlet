package com.example.flowlet.presentation.goalbucket.dto;

import com.example.flowlet.goalbucket.domain.model.GoalBucket;

import java.time.LocalDateTime;

public record GoalBucketResponse(
    Long goalBucketId,
    Long accountId,
    String bucketName,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static GoalBucketResponse from(GoalBucket goalBucket) {
        return new GoalBucketResponse(
            goalBucket.goalBucketId(),
            goalBucket.accountId(),
            goalBucket.bucketName(),
            goalBucket.active(),
            goalBucket.createdAt(),
            goalBucket.updatedAt()
        );
    }
}
