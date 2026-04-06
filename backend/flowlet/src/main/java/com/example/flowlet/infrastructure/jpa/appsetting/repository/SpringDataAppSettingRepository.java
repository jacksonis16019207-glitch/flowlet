package com.example.flowlet.infrastructure.jpa.appsetting.repository;

import com.example.flowlet.infrastructure.jpa.appsetting.entity.AppSettingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataAppSettingRepository extends JpaRepository<AppSettingEntity, Long> {
}
