package com.example.flowlet.infrastructure.jpa.account.repository;

import com.example.flowlet.infrastructure.jpa.account.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataAccountRepository extends JpaRepository<AccountEntity, Long> {
}
