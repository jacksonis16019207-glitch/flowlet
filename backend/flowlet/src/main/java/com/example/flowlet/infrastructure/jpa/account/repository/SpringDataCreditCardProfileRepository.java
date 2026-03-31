package com.example.flowlet.infrastructure.jpa.account.repository;

import com.example.flowlet.infrastructure.jpa.account.entity.CreditCardProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCreditCardProfileRepository extends JpaRepository<CreditCardProfileEntity, Long> {
}
