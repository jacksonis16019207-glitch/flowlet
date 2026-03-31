package com.example.flowlet.presentation.goalbucket.dto;

import com.example.flowlet.goalbucket.domain.model.GoalBucket;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GoalBucketResponse(
    Long goalBucketId,
    Long accountId,
    String bucketName,
    boolean active,
    BigDecimal currentBalance,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static GoalBucketResponse from(GoalBucket goalBucket, BigDecimal currentBalance) {
        return new GoalBucketResponse(
            goalBucket.goalBucketId(),
            goalBucket.accountId(),
            goalBucket.bucketName(),
            goalBucket.active(),
            currentBalance,
            goalBucket.createdAt(),
            goalBucket.updatedAt()
        );
    }
}
