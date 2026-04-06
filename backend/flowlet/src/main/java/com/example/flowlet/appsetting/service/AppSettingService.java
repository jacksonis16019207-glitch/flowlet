package com.example.flowlet.appsetting.service;

import com.example.flowlet.appsetting.domain.model.AppSetting;
import com.example.flowlet.appsetting.domain.repository.AppSettingRepository;
import com.example.flowlet.presentation.appsetting.dto.AppSettingResponse;
import com.example.flowlet.presentation.appsetting.dto.UpdateAppSettingRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class AppSettingService {

    private static final long CURRENT_SETTING_ID = 1L;

    private final AppSettingRepository appSettingRepository;
    private final Clock clock;

    public AppSettingService(AppSettingRepository appSettingRepository, Clock clock) {
        this.appSettingRepository = appSettingRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AppSettingResponse getCurrent() {
        return AppSettingResponse.from(getCurrentSetting());
    }

    @Transactional
    public AppSettingResponse update(UpdateAppSettingRequest request) {
        AppSetting current = getCurrentSetting();
        AppSetting updated = appSettingRepository.save(new AppSetting(
            CURRENT_SETTING_ID,
            request.getMonthStartDay(),
            request.getMonthStartAdjustmentRule(),
            current.createdAt(),
            LocalDateTime.now(clock)
        ));
        return AppSettingResponse.from(updated);
    }

    @Transactional(readOnly = true)
    public AppSetting getCurrentSetting() {
        return appSettingRepository.findCurrent()
            .orElseGet(this::defaultSetting);
    }

    private AppSetting defaultSetting() {
        LocalDateTime now = LocalDateTime.now(clock);
        return new AppSetting(
            CURRENT_SETTING_ID,
            1,
            com.example.flowlet.account.domain.model.PaymentDateAdjustmentRule.NONE,
            now,
            now
        );
    }
}
