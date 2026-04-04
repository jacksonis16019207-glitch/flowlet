package com.example.flowlet.presentation.dashboard.dto;

import java.util.List;

public record DashboardMonthlyCashflowResponse(
    String fromMonth,
    String toMonth,
    List<DashboardMonthlyCashflowMonthResponse> months,
    DashboardMonthlyCashflowTotalsResponse totals
) {
}
