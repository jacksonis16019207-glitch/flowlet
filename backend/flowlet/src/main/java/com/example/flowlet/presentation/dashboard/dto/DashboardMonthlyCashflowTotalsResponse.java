package com.example.flowlet.presentation.dashboard.dto;

import java.math.BigDecimal;

public record DashboardMonthlyCashflowTotalsResponse(
    BigDecimal income,
    BigDecimal expense,
    BigDecimal net
) {
}
