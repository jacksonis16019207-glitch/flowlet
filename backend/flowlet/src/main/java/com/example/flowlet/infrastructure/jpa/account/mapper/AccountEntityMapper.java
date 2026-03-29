package com.example.flowlet.infrastructure.jpa.account.mapper;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.infrastructure.jpa.account.entity.AccountEntity;

public final class AccountEntityMapper {

    private AccountEntityMapper() {
    }

    public static Account toDomain(AccountEntity entity) {
        return new Account(
            entity.getAccountId(),
            entity.getBankName(),
            entity.getAccountName(),
            entity.getAccountType(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static AccountEntity toEntity(Account account) {
        AccountEntity entity = new AccountEntity();
        entity.setAccountId(account.accountId());
        entity.setBankName(account.bankName());
        entity.setAccountName(account.accountName());
        entity.setAccountType(account.accountType());
        entity.setActive(account.active());
        entity.setCreatedAt(account.createdAt());
        entity.setUpdatedAt(account.updatedAt());
        return entity;
    }
}
