package com.example.flowlet.account.domain.repository;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;

import java.util.List;
import java.util.Optional;

public interface AccountRepository {

    List<Account> findAll();

    boolean existsById(Long accountId);

    Optional<Account> findById(Long accountId);

    boolean existsByProviderNameAndAccountNameAndAccountCategory(
        String providerName,
        String accountName,
        AccountCategory accountCategory
    );

    Account save(Account account);

    void deleteAll();
}
