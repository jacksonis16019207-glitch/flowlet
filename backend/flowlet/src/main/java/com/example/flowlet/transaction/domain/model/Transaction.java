package com.example.flowlet.transaction.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record Transaction(
    Long transactionId,
    Long accountId,
    Long goalBucketId,
    Long categoryId,
    Long subcategoryId,
    TransactionType transactionType,
    LocalDate transactionDate,
    BigDecimal amount,
    String description,
    String note,
    UUID transferGroupId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
