package com.example.flowlet.infrastructure.jpa.account.repository;

import com.example.flowlet.account.domain.model.CreditCardProfile;
import com.example.flowlet.account.domain.repository.CreditCardProfileRepository;
import com.example.flowlet.infrastructure.jpa.account.entity.CreditCardProfileEntity;
import com.example.flowlet.infrastructure.jpa.account.mapper.CreditCardProfileEntityMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaCreditCardProfileRepository implements CreditCardProfileRepository {

    private final SpringDataCreditCardProfileRepository springDataCreditCardProfileRepository;

    public JpaCreditCardProfileRepository(SpringDataCreditCardProfileRepository springDataCreditCardProfileRepository) {
        this.springDataCreditCardProfileRepository = springDataCreditCardProfileRepository;
    }

    @Override
    public List<CreditCardProfile> findAll() {
        return springDataCreditCardProfileRepository.findAll().stream()
            .map(CreditCardProfileEntityMapper::toDomain)
            .toList();
    }

    @Override
    public Optional<CreditCardProfile> findByAccountId(Long accountId) {
        return springDataCreditCardProfileRepository.findById(accountId)
            .map(CreditCardProfileEntityMapper::toDomain);
    }

    @Override
    public CreditCardProfile save(CreditCardProfile creditCardProfile) {
        CreditCardProfileEntity savedEntity = springDataCreditCardProfileRepository.save(
            CreditCardProfileEntityMapper.toEntity(creditCardProfile)
        );
        return CreditCardProfileEntityMapper.toDomain(savedEntity);
    }

    @Override
    public void deleteAll() {
        springDataCreditCardProfileRepository.deleteAll();
    }
}
