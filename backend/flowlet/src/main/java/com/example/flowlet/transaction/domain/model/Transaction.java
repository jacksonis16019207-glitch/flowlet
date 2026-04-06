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
    CashflowTreatment cashflowTreatment,
    LocalDate transactionDate,
    BigDecimal amount,
    String description,
    String note,
    UUID transferGroupId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public CashflowTreatment resolvedCashflowTreatment() {
        if (cashflowTreatment != null && cashflowTreatment != CashflowTreatment.AUTO) {
            return cashflowTreatment;
        }

        return switch (transactionType) {
            case INCOME -> CashflowTreatment.INCOME;
            case EXPENSE -> CashflowTreatment.EXPENSE;
            case TRANSFER_OUT, TRANSFER_IN -> CashflowTreatment.IGNORE;
        };
    }
}
