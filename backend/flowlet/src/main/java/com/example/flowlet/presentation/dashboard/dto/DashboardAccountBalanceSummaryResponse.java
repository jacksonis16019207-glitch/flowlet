package com.example.flowlet.presentation.dashboard.dto;

import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;

import java.math.BigDecimal;

public record DashboardAccountBalanceSummaryResponse(
    Long accountId,
    String providerName,
    String accountName,
    AccountCategory accountCategory,
    BalanceSide balanceSide,
    BigDecimal currentBalance,
    BigDecimal unallocatedBalance
) {
}
