package com.example.flowlet.presentation.dashboard.controller;

import com.example.flowlet.application.service.DashboardBalanceSummaryService;
import com.example.flowlet.presentation.dashboard.dto.DashboardBalanceSummaryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardBalanceSummaryController {

    private final DashboardBalanceSummaryService dashboardBalanceSummaryService;

    public DashboardBalanceSummaryController(DashboardBalanceSummaryService dashboardBalanceSummaryService) {
        this.dashboardBalanceSummaryService = dashboardBalanceSummaryService;
    }

    @GetMapping("/balance-summary")
    public DashboardBalanceSummaryResponse getBalanceSummary() {
        return dashboardBalanceSummaryService.getSummary();
    }
}
