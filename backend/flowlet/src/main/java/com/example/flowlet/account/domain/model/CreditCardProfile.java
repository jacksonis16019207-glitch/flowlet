package com.example.flowlet.account.domain.model;

import java.time.LocalDateTime;

public record CreditCardProfile(
    Long accountId,
    Long paymentAccountId,
    Integer closingDay,
    Integer paymentDay,
    PaymentDateAdjustmentRule paymentDateAdjustmentRule,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
