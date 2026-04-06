package com.example.flowlet.presentation.appsetting.dto;

import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateAppSettingRequest {

    @NotNull(message = "{validation.appSetting.monthStartDay.notNull}")
    @Min(value = 1, message = "{validation.appSetting.monthStartDay.min}")
    @Max(value = 31, message = "{validation.appSetting.monthStartDay.max}")
    private Integer monthStartDay;

    @NotNull(message = "{validation.appSetting.monthStartAdjustmentRule.notNull}")
    private PaymentDateAdjustmentRule monthStartAdjustmentRule;

    public Integer getMonthStartDay() {
        return monthStartDay;
    }

    public void setMonthStartDay(Integer monthStartDay) {
        this.monthStartDay = monthStartDay;
    }

    public PaymentDateAdjustmentRule getMonthStartAdjustmentRule() {
        return monthStartAdjustmentRule;
    }

    public void setMonthStartAdjustmentRule(PaymentDateAdjustmentRule monthStartAdjustmentRule) {
        this.monthStartAdjustmentRule = monthStartAdjustmentRule;
    }
}
