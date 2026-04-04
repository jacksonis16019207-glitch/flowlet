package com.example.flowlet.presentation.dashboard.dto;

import java.math.BigDecimal;

public record DashboardGoalBucketBalanceSummaryResponse(
    Long goalBucketId,
    Long accountId,
    String bucketName,
    BigDecimal currentBalance
) {
}
