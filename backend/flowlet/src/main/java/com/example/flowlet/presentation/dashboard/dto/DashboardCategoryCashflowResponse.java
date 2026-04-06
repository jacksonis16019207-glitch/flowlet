package com.example.flowlet.presentation.dashboard.dto;

import java.util.List;

public record DashboardCategoryCashflowResponse(
    String targetMonth,
    String periodStartDate,
    String periodEndDate,
    List<DashboardCategoryCashflowCategoryResponse> incomeCategories,
    List<DashboardCategoryCashflowCategoryResponse> expenseCategories,
    DashboardCategoryCashflowTotalsResponse totals
) {
}
