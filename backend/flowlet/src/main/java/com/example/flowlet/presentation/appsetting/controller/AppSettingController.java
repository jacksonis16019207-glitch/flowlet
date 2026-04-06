package com.example.flowlet.presentation.appsetting.controller;

import com.example.flowlet.appsetting.service.AppSettingService;
import com.example.flowlet.presentation.appsetting.dto.AppSettingResponse;
import com.example.flowlet.presentation.appsetting.dto.UpdateAppSettingRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app-settings")
public class AppSettingController {

    private final AppSettingService appSettingService;

    public AppSettingController(AppSettingService appSettingService) {
        this.appSettingService = appSettingService;
    }

    @GetMapping
    public AppSettingResponse getCurrent() {
        return appSettingService.getCurrent();
    }

    @PutMapping
    public AppSettingResponse update(@Valid @RequestBody UpdateAppSettingRequest request) {
        return appSettingService.update(request);
    }
}
