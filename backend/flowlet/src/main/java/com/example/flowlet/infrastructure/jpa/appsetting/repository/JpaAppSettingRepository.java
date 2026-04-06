package com.example.flowlet.infrastructure.jpa.appsetting.repository;

import com.example.flowlet.appsetting.domain.model.AppSetting;
import com.example.flowlet.appsetting.domain.repository.AppSettingRepository;
import com.example.flowlet.infrastructure.jpa.appsetting.mapper.AppSettingEntityMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class JpaAppSettingRepository implements AppSettingRepository {

    private static final long CURRENT_SETTING_ID = 1L;

    private final SpringDataAppSettingRepository springDataAppSettingRepository;

    public JpaAppSettingRepository(SpringDataAppSettingRepository springDataAppSettingRepository) {
        this.springDataAppSettingRepository = springDataAppSettingRepository;
    }

    @Override
    public Optional<AppSetting> findCurrent() {
        return springDataAppSettingRepository.findById(CURRENT_SETTING_ID)
            .map(AppSettingEntityMapper::toDomain);
    }

    @Override
    public AppSetting save(AppSetting appSetting) {
        return AppSettingEntityMapper.toDomain(
            springDataAppSettingRepository.save(AppSettingEntityMapper.toEntity(appSetting))
        );
    }
}
