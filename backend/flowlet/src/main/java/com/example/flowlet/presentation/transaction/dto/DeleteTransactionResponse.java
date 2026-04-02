package com.example.flowlet.presentation.transaction.dto;

import java.util.List;
import java.util.UUID;

public record DeleteTransactionResponse(
    Long transactionId,
    String action,
    UUID transferGroupId,
    List<Long> deletedTransactionIds,
    List<Long> deletedAllocationIds
) {
}
