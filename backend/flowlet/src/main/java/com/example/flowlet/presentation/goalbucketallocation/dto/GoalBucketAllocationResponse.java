package com.example.flowlet.presentation.goalbucketallocation.dto;

import com.example.flowlet.transaction.domain.model.GoalBucketAllocation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record GoalBucketAllocationResponse(
    Long allocationId,
    Long accountId,
    Long fromGoalBucketId,
    String fromGoalBucketName,
    Long toGoalBucketId,
    String toGoalBucketName,
    LocalDate allocationDate,
    BigDecimal amount,
    String description,
    String note,
    UUID linkedTransferGroupId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static GoalBucketAllocationResponse from(
        GoalBucketAllocation allocation,
        String fromGoalBucketName,
        String toGoalBucketName
    ) {
        return new GoalBucketAllocationResponse(
            allocation.allocationId(),
            allocation.accountId(),
            allocation.fromGoalBucketId(),
            fromGoalBucketName,
            allocation.toGoalBucketId(),
            toGoalBucketName,
            allocation.allocationDate(),
            allocation.amount(),
            allocation.description(),
            allocation.note(),
            allocation.linkedTransferGroupId(),
            allocation.createdAt(),
            allocation.updatedAt()
        );
    }
}
