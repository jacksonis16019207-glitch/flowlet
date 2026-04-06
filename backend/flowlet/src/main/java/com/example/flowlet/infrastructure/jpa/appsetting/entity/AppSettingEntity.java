package com.example.flowlet.infrastructure.jpa.appsetting.entity;

import com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "m_app_setting", schema = "flowlet")
public class AppSettingEntity {

    @Id
    @Column(name = "app_setting_id")
    private Long appSettingId;

    @Column(name = "month_start_day", nullable = false)
    private Integer monthStartDay;

    @Enumerated(EnumType.STRING)
    @Column(name = "month_start_adjustment_rule", nullable = false, length = 50)
    private PaymentDateAdjustmentRule monthStartAdjustmentRule;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getAppSettingId() {
        return appSettingId;
    }

    public void setAppSettingId(Long appSettingId) {
        this.appSettingId = appSettingId;
    }

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
