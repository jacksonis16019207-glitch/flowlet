package com.example.flowlet.infrastructure.jpa.account.mapper;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.infrastructure.jpa.account.entity.AccountEntity;

public final class AccountEntityMapper {

    private AccountEntityMapper() {
    }

    public static Account toDomain(AccountEntity entity) {
        return new Account(
            entity.getAccountId(),
            entity.getProviderName(),
            entity.getAccountName(),
            entity.getAccountCategory(),
            entity.getBalanceSide(),
            entity.getInitialBalance(),
            entity.isActive(),
            entity.getDisplayOrder(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static AccountEntity toEntity(Account account) {
        AccountEntity entity = new AccountEntity();
        entity.setAccountId(account.accountId());
        entity.setProviderName(account.providerName());
        entity.setAccountName(account.accountName());
        entity.setAccountCategory(account.accountCategory());
        entity.setBalanceSide(account.balanceSide());
        entity.setInitialBalance(account.initialBalance());
        entity.setActive(account.active());
        entity.setDisplayOrder(account.displayOrder());
        entity.setCreatedAt(account.createdAt());
        entity.setUpdatedAt(account.updatedAt());
        return entity;
    }
}
