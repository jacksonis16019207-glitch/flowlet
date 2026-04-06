package com.example.flowlet.presentation.dashboard.dto;

import java.math.BigDecimal;

public record DashboardCategoryCashflowTotalsResponse(
    BigDecimal income,
    BigDecimal expense
) {
}
