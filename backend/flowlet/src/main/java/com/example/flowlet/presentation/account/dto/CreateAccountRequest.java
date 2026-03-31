package com.example.flowlet.presentation.account.dto;

import com.example.flowlet.account.domain.model.AccountCategory;
import com.example.flowlet.account.domain.model.BalanceSide;
import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateAccountRequest {

    @NotBlank(message = "{validation.account.providerName.notBlank}")
    @Size(max = 100, message = "{validation.account.providerName.size}")
    private String providerName;

    @NotBlank(message = "{validation.account.accountName.notBlank}")
    @Size(max = 100, message = "{validation.account.accountName.size}")
    private String accountName;

    @NotNull(message = "{validation.account.accountCategory.notNull}")
    private AccountCategory accountCategory;

    @NotNull(message = "{validation.account.balanceSide.notNull}")
    private BalanceSide balanceSide;

    private boolean active = true;

    private Integer displayOrder = 0;

    @Valid
    private CreditCardProfileRequest creditCardProfile;

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public AccountCategory getAccountCategory() {
        return accountCategory;
    }

    public void setAccountCategory(AccountCategory accountCategory) {
        this.accountCategory = accountCategory;
    }

    public BalanceSide getBalanceSide() {
        return balanceSide;
    }

    public void setBalanceSide(BalanceSide balanceSide) {
        this.balanceSide = balanceSide;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public CreditCardProfileRequest getCreditCardProfile() {
        return creditCardProfile;
    }

    public void setCreditCardProfile(CreditCardProfileRequest creditCardProfile) {
        this.creditCardProfile = creditCardProfile;
    }

    public static class CreditCardProfileRequest {

        @NotNull(message = "{validation.creditCard.paymentAccountId.notNull}")
        private Long paymentAccountId;

        @NotNull(message = "{validation.creditCard.closingDay.notNull}")
        @Min(value = 1, message = "{validation.creditCard.day.min}")
        @Max(value = 31, message = "{validation.creditCard.day.max}")
        private Integer closingDay;

        @NotNull(message = "{validation.creditCard.paymentDay.notNull}")
        @Min(value = 1, message = "{validation.creditCard.day.min}")
        @Max(value = 31, message = "{validation.creditCard.day.max}")
        private Integer paymentDay;

        @NotNull(message = "{validation.creditCard.paymentDateAdjustmentRule.notNull}")
        private PaymentDateAdjustmentRule paymentDateAdjustmentRule;

        public Long getPaymentAccountId() {
            return paymentAccountId;
        }

        public void setPaymentAccountId(Long paymentAccountId) {
            this.paymentAccountId = paymentAccountId;
        }

        public Integer getClosingDay() {
            return closingDay;
        }

        public void setClosingDay(Integer closingDay) {
            this.closingDay = closingDay;
        }

        public Integer getPaymentDay() {
            return paymentDay;
        }

        public void setPaymentDay(Integer paymentDay) {
            this.paymentDay = paymentDay;
        }

        public PaymentDateAdjustmentRule getPaymentDateAdjustmentRule() {
            return paymentDateAdjustmentRule;
        }

        public void setPaymentDateAdjustmentRule(PaymentDateAdjustmentRule paymentDateAdjustmentRule) {
            this.paymentDateAdjustmentRule = paymentDateAdjustmentRule;
        }
    }
}
