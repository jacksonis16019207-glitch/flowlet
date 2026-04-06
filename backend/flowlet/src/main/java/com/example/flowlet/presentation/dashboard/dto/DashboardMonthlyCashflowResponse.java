package com.example.flowlet.presentation.dashboard.dto;

import java.math.BigDecimal;

public record DashboardMonthlyCashflowResponse(
    String targetMonth,
    String periodStartDate,
    String periodEndDate,
    BigDecimal income,
    BigDecimal expense,
    BigDecimal net
) {
}
