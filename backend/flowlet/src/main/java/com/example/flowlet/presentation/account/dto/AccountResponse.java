package com.example.flowlet.presentation.account.dto;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountType;

import java.time.LocalDateTime;

public record AccountResponse(
    Long accountId,
    String bankName,
    String accountName,
    AccountType accountType,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static AccountResponse from(Account account) {
        return new AccountResponse(
            account.accountId(),
            account.bankName(),
            account.accountName(),
            account.accountType(),
            account.active(),
            account.createdAt(),
            account.updatedAt()
        );
    }
}
