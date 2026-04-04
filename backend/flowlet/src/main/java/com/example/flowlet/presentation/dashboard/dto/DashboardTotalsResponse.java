package com.example.flowlet.presentation.dashboard.dto;

import java.math.BigDecimal;

public record DashboardTotalsResponse(
    BigDecimal accountCurrentBalance,
    BigDecimal goalBucketCurrentBalance,
    BigDecimal unallocatedBalance
) {
}
