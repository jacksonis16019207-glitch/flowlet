package com.example.flowlet.infrastructure.jpa.transaction.repository;

import com.example.flowlet.infrastructure.jpa.transaction.mapper.TransactionEntityMapper;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.repository.TransactionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class JpaTransactionRepository implements TransactionRepository {

    private final SpringDataTransactionRepository springDataTransactionRepository;

    public JpaTransactionRepository(SpringDataTransactionRepository springDataTransactionRepository) {
        this.springDataTransactionRepository = springDataTransactionRepository;
    }

    @Override
    public List<Transaction> findAll() {
        return springDataTransactionRepository.findAll().stream()
            .map(TransactionEntityMapper::toDomain)
            .toList();
    }

    @Override
    public Transaction save(Transaction transaction) {
        return TransactionEntityMapper.toDomain(
            springDataTransactionRepository.save(TransactionEntityMapper.toEntity(transaction))
        );
    }

    @Override
    public List<Transaction> saveAll(List<Transaction> transactions) {
        return springDataTransactionRepository.saveAll(transactions.stream().map(TransactionEntityMapper::toEntity).toList()).stream()
            .map(TransactionEntityMapper::toDomain)
            .toList();
    }

    @Override
    public void deleteAll() {
        springDataTransactionRepository.deleteAll();
    }
}
