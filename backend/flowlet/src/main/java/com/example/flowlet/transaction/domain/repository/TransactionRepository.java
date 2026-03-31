package com.example.flowlet.transaction.domain.repository;

import com.example.flowlet.transaction.domain.model.Transaction;

import java.util.List;

public interface TransactionRepository {

    List<Transaction> findAll();

    Transaction save(Transaction transaction);

    List<Transaction> saveAll(List<Transaction> transactions);

    void deleteAll();
}
