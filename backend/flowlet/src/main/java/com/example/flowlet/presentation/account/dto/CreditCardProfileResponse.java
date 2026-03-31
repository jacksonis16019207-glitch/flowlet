package com.example.flowlet.presentation.account.dto;

import com.example.flowlet.account.domain.model.CreditCardProfile;
import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;

import java.time.LocalDateTime;

public record CreditCardProfileResponse(
    Long paymentAccountId,
    Integer closingDay,
    Integer paymentDay,
    PaymentDateAdjustmentRule paymentDateAdjustmentRule,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CreditCardProfileResponse from(CreditCardProfile creditCardProfile) {
        return new CreditCardProfileResponse(
            creditCardProfile.paymentAccountId(),
            creditCardProfile.closingDay(),
            creditCardProfile.paymentDay(),
            creditCardProfile.paymentDateAdjustmentRule(),
            creditCardProfile.createdAt(),
            creditCardProfile.updatedAt()
        );
    }
}
