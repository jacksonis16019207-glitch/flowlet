package com.example.flowlet.infrastructure.jpa.account.repository;

import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.infrastructure.jpa.account.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataAccountRepository extends JpaRepository<AccountEntity, Long> {

    boolean existsByProviderNameAndAccountNameAndAccountCategory(
        String providerName,
        String accountName,
        AccountCategory accountCategory
    );

    Optional<AccountEntity> findByProviderNameAndAccountNameAndAccountCategory(
        String providerName,
        String accountName,
        AccountCategory accountCategory
    );
}
