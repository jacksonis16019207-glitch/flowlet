package com.example.flowlet.account.domain.repository;

import com.example.flowlet.account.domain.model.Account;

import java.util.List;

public interface AccountRepository {

    List<Account> findAll();

    Account save(Account account);

    void deleteAll();
}
