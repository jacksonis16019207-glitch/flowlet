package com.example.flowlet.infrastructure.jpa.account.mapper;

import com.example.flowlet.account.domain.model.CreditCardProfile;
import com.example.flowlet.infrastructure.jpa.account.entity.CreditCardProfileEntity;

public final class CreditCardProfileEntityMapper {

    private CreditCardProfileEntityMapper() {
    }

    public static CreditCardProfile toDomain(CreditCardProfileEntity entity) {
        return new CreditCardProfile(
            entity.getAccountId(),
            entity.getPaymentAccountId(),
            entity.getClosingDay(),
            entity.getPaymentDay(),
            entity.getPaymentDateAdjustmentRule(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static CreditCardProfileEntity toEntity(CreditCardProfile creditCardProfile) {
        CreditCardProfileEntity entity = new CreditCardProfileEntity();
        entity.setAccountId(creditCardProfile.accountId());
        entity.setPaymentAccountId(creditCardProfile.paymentAccountId());
        entity.setClosingDay(creditCardProfile.closingDay());
        entity.setPaymentDay(creditCardProfile.paymentDay());
        entity.setPaymentDateAdjustmentRule(creditCardProfile.paymentDateAdjustmentRule());
        entity.setCreatedAt(creditCardProfile.createdAt());
        entity.setUpdatedAt(creditCardProfile.updatedAt());
        return entity;
    }
}
