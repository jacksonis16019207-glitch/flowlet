package com.example.flowlet.presentation.appsetting.dto;

import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;
import com.example.flowlet.appsetting.domain.model.AppSetting;

public record AppSettingResponse(
    Integer monthStartDay,
    PaymentDateAdjustmentRule monthStartAdjustmentRule,
    String updatedAt
) {

    public static AppSettingResponse from(AppSetting appSetting) {
        return new AppSettingResponse(
            appSetting.monthStartDay(),
            appSetting.monthStartAdjustmentRule(),
            appSetting.updatedAt().toString()
        );
    }
}
