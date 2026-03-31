package com.example.flowlet.presentation.account.dto;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(
    Long accountId,
    String providerName,
    String accountName,
    AccountCategory accountCategory,
    BalanceSide balanceSide,
    boolean active,
    Integer displayOrder,
    BigDecimal currentBalance,
    BigDecimal unallocatedBalance,
    CreditCardProfileResponse creditCardProfile,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static AccountResponse from(
        Account account,
        BigDecimal currentBalance,
        BigDecimal unallocatedBalance,
        CreditCardProfileResponse creditCardProfile
    ) {
        return new AccountResponse(
            account.accountId(),
            account.providerName(),
            account.accountName(),
            account.accountCategory(),
            account.balanceSide(),
            account.active(),
            account.displayOrder(),
            currentBalance,
            unallocatedBalance,
            creditCardProfile,
            account.createdAt(),
            account.updatedAt()
        );
    }
}
