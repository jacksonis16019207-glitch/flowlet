package com.example.flowlet.goalbucket.domain.model;

import java.time.LocalDateTime;

public record GoalBucket(
    Long goalBucketId,
    Long accountId,
    String bucketName,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
