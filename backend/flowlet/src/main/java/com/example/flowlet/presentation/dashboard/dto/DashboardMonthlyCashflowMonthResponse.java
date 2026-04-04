package com.example.flowlet.presentation.dashboard.dto;

import java.math.BigDecimal;

public record DashboardMonthlyCashflowMonthResponse(
    String month,
    BigDecimal income,
    BigDecimal expense,
    BigDecimal net
) {
}
