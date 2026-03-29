package com.example.flowlet.account.domain.model;

import java.time.LocalDateTime;

public record Account(
    Long accountId,
    String bankName,
    String accountName,
    AccountType accountType,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
