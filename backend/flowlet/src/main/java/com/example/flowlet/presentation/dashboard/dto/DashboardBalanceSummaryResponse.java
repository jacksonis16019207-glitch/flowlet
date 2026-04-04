package com.example.flowlet.presentation.dashboard.dto;

import java.util.List;

public record DashboardBalanceSummaryResponse(
    List<DashboardAccountBalanceSummaryResponse> accounts,
    List<DashboardGoalBucketBalanceSummaryResponse> goalBuckets,
    DashboardTotalsResponse totals
) {
}
