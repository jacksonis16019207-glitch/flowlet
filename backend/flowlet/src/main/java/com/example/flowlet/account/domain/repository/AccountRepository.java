package com.example.flowlet.account.domain.repository;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountType;

import java.util.List;

public interface AccountRepository {

    List<Account> findAll();

    boolean existsById(Long accountId);

    boolean existsByBankNameAndAccountNameAndAccountType(String bankName, String accountName, AccountType accountType);

    Account save(Account account);

    void deleteAll();
}
