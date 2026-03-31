package com.example.flowlet.account.domain.model;

import java.time.LocalDateTime;

public record Account(
    Long accountId,
    String providerName,
    String accountName,
    AccountCategory accountCategory,
    BalanceSide balanceSide,
    boolean active,
    Integer displayOrder,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
