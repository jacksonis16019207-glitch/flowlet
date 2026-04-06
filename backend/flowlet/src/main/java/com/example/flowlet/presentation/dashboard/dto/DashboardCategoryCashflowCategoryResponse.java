package com.example.flowlet.presentation.dashboard.dto;

import java.math.BigDecimal;

public record DashboardCategoryCashflowCategoryResponse(
    Long categoryId,
    String categoryName,
    BigDecimal amount
) {
}
