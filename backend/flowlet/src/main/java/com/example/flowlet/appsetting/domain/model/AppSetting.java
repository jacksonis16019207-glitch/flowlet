package com.example.flowlet.appsetting.domain.model;

import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;

import java.time.LocalDateTime;

public record AppSetting(
    Long appSettingId,
    Integer monthStartDay,
    PaymentDateAdjustmentRule monthStartAdjustmentRule,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
