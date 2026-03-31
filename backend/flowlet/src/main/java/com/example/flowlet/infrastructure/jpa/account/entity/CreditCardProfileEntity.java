package com.example.flowlet.infrastructure.jpa.account.entity;

import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "m_credit_card_profile", schema = "flowlet")
public class CreditCardProfileEntity {

    @Id
    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "payment_account_id", nullable = false)
    private Long paymentAccountId;

    @Column(name = "closing_day", nullable = false)
    private Integer closingDay;

    @Column(name = "payment_day", nullable = false)
    private Integer paymentDay;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_date_adjustment_rule", nullable = false, length = 50)
    private PaymentDateAdjustmentRule paymentDateAdjustmentRule;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
