package com.example.flowlet.infrastructure.jpa.transaction.mapper;

import com.example.flowlet.infrastructure.jpa.transaction.entity.TransactionEntity;
import com.example.flowlet.transaction.domain.model.Transaction;

public final class TransactionEntityMapper {

    private TransactionEntityMapper() {
    }

    public static Transaction toDomain(TransactionEntity entity) {
        return new Transaction(
            entity.getTransactionId(),
            entity.getAccountId(),
            entity.getGoalBucketId(),
            entity.getCategoryId(),
            entity.getSubcategoryId(),
            entity.getTransactionType(),
            entity.getCashflowTreatment(),
            entity.getTransactionDate(),
            entity.getAmount(),
            entity.getDescription(),
            entity.getNote(),
            entity.getTransferGroupId(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static TransactionEntity toEntity(Transaction transaction) {
        TransactionEntity entity = new TransactionEntity();
        entity.setTransactionId(transaction.transactionId());
        entity.setAccountId(transaction.accountId());
        entity.setGoalBucketId(transaction.goalBucketId());
        entity.setCategoryId(transaction.categoryId());
        entity.setSubcategoryId(transaction.subcategoryId());
        entity.setTransactionType(transaction.transactionType());
        entity.setCashflowTreatment(transaction.cashflowTreatment());
        entity.setTransactionDate(transaction.transactionDate());
        entity.setAmount(transaction.amount());
        entity.setDescription(transaction.description());
        entity.setNote(transaction.note());
        entity.setTransferGroupId(transaction.transferGroupId());
        entity.setCreatedAt(transaction.createdAt());
        entity.setUpdatedAt(transaction.updatedAt());
        return entity;
    }
}
