package com.example.flowlet.infrastructure.jpa.account.repository;

import com.example.flowlet.account.domain.model.AccountType;
import com.example.flowlet.infrastructure.jpa.account.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataAccountRepository extends JpaRepository<AccountEntity, Long> {

    boolean existsByBankNameAndAccountNameAndAccountType(String bankName, String accountName, AccountType accountType);
}
