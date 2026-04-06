package com.example.flowlet.infrastructure.jpa.appsetting.mapper;

import com.example.flowlet.appsetting.domain.model.AppSetting;
import com.example.flowlet.infrastructure.jpa.appsetting.entity.AppSettingEntity;

public final class AppSettingEntityMapper {

    private AppSettingEntityMapper() {
    }

    public static AppSetting toDomain(AppSettingEntity entity) {
        return new AppSetting(
            entity.getAppSettingId(),
            entity.getMonthStartDay(),
            entity.getMonthStartAdjustmentRule(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    public static AppSettingEntity toEntity(AppSetting appSetting) {
        AppSettingEntity entity = new AppSettingEntity();
        entity.setAppSettingId(appSetting.appSettingId());
        entity.setMonthStartDay(appSetting.monthStartDay());
        entity.setMonthStartAdjustmentRule(appSetting.monthStartAdjustmentRule());
        entity.setCreatedAt(appSetting.createdAt());
        entity.setUpdatedAt(appSetting.updatedAt());
        return entity;
    }
}
