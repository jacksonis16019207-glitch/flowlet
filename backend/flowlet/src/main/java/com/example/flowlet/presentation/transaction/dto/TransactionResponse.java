package com.example.flowlet.presentation.transaction.dto;

import com.example.flowlet.transaction.domain.model.CashflowTreatment;
import com.example.flowlet.transaction.domain.model.Transaction;
import com.example.flowlet.transaction.domain.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionResponse(
    Long transactionId,
    Long accountId,
    String accountName,
    Long goalBucketId,
    String goalBucketName,
    Long categoryId,
    String categoryName,
    Long subcategoryId,
    String subcategoryName,
    TransactionType transactionType,
    CashflowTreatment cashflowTreatment,
    LocalDate transactionDate,
    BigDecimal amount,
    String description,
    String note,
    UUID transferGroupId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static TransactionResponse from(
        Transaction transaction,
        String accountName,
        String goalBucketName,
        String categoryName,
        String subcategoryName
    ) {
        return new TransactionResponse(
            transaction.transactionId(),
            transaction.accountId(),
            accountName,
            transaction.goalBucketId(),
            goalBucketName,
            transaction.categoryId(),
            categoryName,
            transaction.subcategoryId(),
            subcategoryName,
            transaction.transactionType(),
            transaction.cashflowTreatment(),
            transaction.transactionDate(),
            transaction.amount(),
            transaction.description(),
            transaction.note(),
            transaction.transferGroupId(),
            transaction.createdAt(),
            transaction.updatedAt()
        );
    }
}
