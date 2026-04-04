package com.example.flowlet.presentation.dashboard.controller;

import com.example.flowlet.application.service.DashboardBalanceSummaryService;
import com.example.flowlet.application.service.DashboardMonthlyCashflowService;
import com.example.flowlet.presentation.dashboard.dto.DashboardBalanceSummaryResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardMonthlyCashflowResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardBalanceSummaryController {

    private final DashboardBalanceSummaryService dashboardBalanceSummaryService;
    private final DashboardMonthlyCashflowService dashboardMonthlyCashflowService;

    public DashboardBalanceSummaryController(
        DashboardBalanceSummaryService dashboardBalanceSummaryService,
        DashboardMonthlyCashflowService dashboardMonthlyCashflowService
    ) {
        this.dashboardBalanceSummaryService = dashboardBalanceSummaryService;
        this.dashboardMonthlyCashflowService = dashboardMonthlyCashflowService;
    }

    @GetMapping("/balance-summary")
    public DashboardBalanceSummaryResponse getBalanceSummary() {
        return dashboardBalanceSummaryService.getSummary();
    }

    @GetMapping("/monthly-cashflow")
    public DashboardMonthlyCashflowResponse getMonthlyCashflow(
        @RequestParam String fromMonth,
        @RequestParam String toMonth
    ) {
        return dashboardMonthlyCashflowService.getMonthlyCashflow(fromMonth, toMonth);
    }
}
