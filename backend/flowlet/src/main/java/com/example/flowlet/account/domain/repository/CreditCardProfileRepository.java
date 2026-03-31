package com.example.flowlet.account.domain.repository;

import com.example.flowlet.account.domain.model.CreditCardProfile;

import java.util.List;
import java.util.Optional;

public interface CreditCardProfileRepository {

    List<CreditCardProfile> findAll();

    Optional<CreditCardProfile> findByAccountId(Long accountId);

    CreditCardProfile save(CreditCardProfile creditCardProfile);

    void deleteAll();
}
