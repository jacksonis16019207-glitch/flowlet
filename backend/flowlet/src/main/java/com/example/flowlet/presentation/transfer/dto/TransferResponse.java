package com.example.flowlet.presentation.transfer.dto;

import com.example.flowlet.presentation.transaction.dto.TransactionResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransferResponse(
    UUID transferGroupId,
    LocalDate transactionDate,
    BigDecimal amount,
    TransactionResponse outgoingTransaction,
    TransactionResponse incomingTransaction
) {
}
