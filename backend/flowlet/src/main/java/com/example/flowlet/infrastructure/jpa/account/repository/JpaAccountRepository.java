package com.example.flowlet.infrastructure.jpa.account.repository;

import com.example.flowlet.account.domain.model.Account;
import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.repository.AccountRepository;
import com.example.flowlet.infrastructure.jpa.account.entity.AccountEntity;
import com.example.flowlet.infrastructure.jpa.account.mapper.AccountEntityMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaAccountRepository implements AccountRepository {

    private final SpringDataAccountRepository springDataAccountRepository;

    public JpaAccountRepository(SpringDataAccountRepository springDataAccountRepository) {
        this.springDataAccountRepository = springDataAccountRepository;
    }

    @Override
    public List<Account> findAll() {
        return springDataAccountRepository.findAll().stream()
            .map(AccountEntityMapper::toDomain)
            .toList();
    }

    @Override
    public boolean existsById(Long accountId) {
        return springDataAccountRepository.existsById(accountId);
    }

    @Override
    public Optional<Account> findById(Long accountId) {
        return springDataAccountRepository.findById(accountId)
            .map(AccountEntityMapper::toDomain);
    }

    @Override
    public boolean existsByProviderNameAndAccountNameAndAccountCategory(
        String providerName,
        String accountName,
        AccountCategory accountCategory
    ) {
        return springDataAccountRepository.existsByProviderNameAndAccountNameAndAccountCategory(
            providerName,
            accountName,
            accountCategory
        );
    }

    @Override
    public Account save(Account account) {
        AccountEntity savedEntity = springDataAccountRepository.save(AccountEntityMapper.toEntity(account));
        return AccountEntityMapper.toDomain(savedEntity);
    }

    @Override
    public void deleteAll() {
        springDataAccountRepository.deleteAll();
    }
}
