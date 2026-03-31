package com.example.flowlet.presentation.goalbucketallocation.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GoalBucketAllocationBatchResponse(
    Long accountId,
    Long fromGoalBucketId,
    LocalDate allocationDate,
    String description,
    String note,
    UUID linkedTransferGroupId,
    List<GoalBucketAllocationResponse> allocations
) {
}
