package com.example.flowlet.transaction.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record GoalBucketAllocation(
    Long allocationId,
    Long accountId,
    Long fromGoalBucketId,
    Long toGoalBucketId,
    LocalDate allocationDate,
    BigDecimal amount,
    String description,
    String note,
    UUID linkedTransferGroupId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
