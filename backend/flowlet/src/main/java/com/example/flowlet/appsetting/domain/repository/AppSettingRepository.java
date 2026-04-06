package com.example.flowlet.appsetting.domain.repository;

import com.example.flowlet.appsetting.domain.model.AppSetting;

import java.util.Optional;

public interface AppSettingRepository {

    Optional<AppSetting> findCurrent();

    AppSetting save(AppSetting appSetting);
}
