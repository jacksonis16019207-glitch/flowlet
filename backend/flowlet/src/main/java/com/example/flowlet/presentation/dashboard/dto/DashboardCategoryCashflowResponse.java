package com.example.flowlet.presentation.dashboard.dto;

import java.util.List;

public record DashboardCategoryCashflowResponse(
    String fromMonth,
    String toMonth,
    List<DashboardCategoryCashflowCategoryResponse> incomeCategories,
    List<DashboardCategoryCashflowCategoryResponse> expenseCategories,
    DashboardCategoryCashflowTotalsResponse totals
) {
}
